"""
Enhanced Link Resolver & By-passer — v2.0
==========================================
A more user-friendly, feature-rich backend for the link resolver tool.

Key improvements over v1 (server.py):
  - Configuration management  : dataclass-backed config with JSON save/load
  - Comprehensive logging      : rotating file log + colour-coded console output
  - Type hints & docstrings    : throughout the codebase
  - Dynamic domain detection   : no hard-coded pepe-domain URLs
  - Retry mechanisms           : configurable retries for flaky network ops
  - Multiple verification paths: handles all known bypass step variants
  - Batch URL processing       : /api/batch accepts a list of URLs at once
  - Result export              : /api/export returns JSON, CSV, or TXT
  - Session history            : in-memory log of every resolved result
  - URL validation             : rejects obviously malformed inputs early
  - Progress streaming         : /api/progress/<job_id> (Server-Sent Events)
  - Resource cleanup           : drivers always quit, even on partial failures

Usage
-----
  python server_v2.py                    # runs on port 3000 (default)
  PORT=5000 python server_v2.py          # custom port
  FLASK_DEBUG=1 python server_v2.py      # debug mode
  HEADLESS=0 python server_v2.py         # headed browser (for local debugging)

API Endpoints (new / changed)
------------------------------
  POST /api/scan             — unchanged interface, improved internals
  POST /api/resolve          — unchanged interface, improved internals
  POST /api/batch            — NEW: {urls: [...], indices: [...]}
  GET  /api/config           — NEW: get current runtime config
  POST /api/config           — NEW: update runtime config
  GET  /api/history          — NEW: list resolved results from this session
  POST /api/export           — NEW: {format: "json"|"csv"|"txt", results: [...]}
  GET  /api/health           — NEW: health/readiness check
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from multiprocessing import Pool
from typing import Any
from urllib.parse import urlparse

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "resolver_v2.log")

_COLOUR = {
    "DEBUG": "\033[37m",    # white
    "INFO": "\033[36m",     # cyan
    "WARNING": "\033[33m",  # yellow
    "ERROR": "\033[31m",    # red
    "CRITICAL": "\033[35m", # magenta
    "RESET": "\033[0m",
}


class _ColourFormatter(logging.Formatter):
    """Console formatter that colour-codes log levels."""

    _FMT = "%(asctime)s [%(levelname)s] %(message)s"
    _DATEFMT = "%H:%M:%S"

    def format(self, record: logging.LogRecord) -> str:  # noqa: D102
        colour = _COLOUR.get(record.levelname, _COLOUR["RESET"])
        reset = _COLOUR["RESET"]
        record.levelname = f"{colour}{record.levelname:<8}{reset}"
        return logging.Formatter(self._FMT, datefmt=self._DATEFMT).format(record)


def _build_logger(name: str = "resolver_v2") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        # Console handler (colour)
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        ch.setFormatter(_ColourFormatter())
        logger.addHandler(ch)

        # File handler (plain text, up to 5 MB, 3 backups)
        fh = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)-8s] %(name)s: %(message)s"))
        logger.addHandler(fh)

    return logger


log = _build_logger()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "resolver_config.json")


@dataclass
class Config:
    """Runtime configuration for the resolver.

    All values can be updated at runtime via ``POST /api/config`` and are
    persisted to ``resolver_config.json`` so they survive server restarts.
    """

    # Browser
    headless: bool = True
    window_width: int = 1920
    window_height: int = 1080

    # Timeouts (seconds)
    page_load_timeout: int = 30
    element_wait_timeout: int = 25
    post_click_delay: float = 5.0
    verification_delay: float = 2.0
    final_resolve_delay: float = 5.0

    # Retry
    max_retries: int = 3
    retry_delay: float = 3.0

    # Limits
    max_parallel_workers: int = 2
    max_batch_urls: int = 10

    # Verification step labels (in order — all lower-cased for matching)
    verification_steps: list[str] = field(
        default_factory=lambda: [
            "start verification",
            "verify to continue",
            "click here to continue",
            "go to download",
            "i'm not a robot",
            "continue",
        ]
    )

    # Button labels to scan for
    button_labels: list[str] = field(
        default_factory=lambda: ["Download Links", "Episode Links", "Batch/Zip File"]
    )

    # Export
    default_export_format: str = "json"  # "json" | "csv" | "txt"

    # Logging
    log_level: str = "INFO"  # DEBUG | INFO | WARNING | ERROR

    @classmethod
    def load(cls) -> "Config":
        """Load config from ``resolver_config.json``, falling back to defaults."""
        if os.path.exists(_CONFIG_FILE):
            try:
                with open(_CONFIG_FILE, encoding="utf-8") as fh:
                    data = json.load(fh)
                obj = cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
                log.info("📂 Config loaded from %s", _CONFIG_FILE)
                return obj
            except Exception as exc:  # noqa: BLE001
                log.warning("⚠️  Could not parse config file (%s); using defaults.", exc)
        return cls()

    def save(self) -> None:
        """Persist current config to ``resolver_config.json``."""
        try:
            with open(_CONFIG_FILE, "w", encoding="utf-8") as fh:
                json.dump(asdict(self), fh, indent=2)
            log.info("💾 Config saved to %s", _CONFIG_FILE)
        except Exception as exc:  # noqa: BLE001
            log.error("❌ Could not save config: %s", exc)

    def update(self, updates: dict[str, Any]) -> list[str]:
        """Apply a dict of updates, returning a list of validation errors."""
        errors: list[str] = []
        for key, value in updates.items():
            if key not in self.__dataclass_fields__:
                errors.append(f"Unknown config key: {key!r}")
                continue
            try:
                setattr(self, key, value)
            except Exception as exc:  # noqa: BLE001
                log.debug("Config update error for %r: %s", key, exc)
                errors.append(f"Invalid value for {key!r}: value could not be applied.")
        if not errors:
            self.save()
        return errors


# Singleton config used by the whole application
_cfg = Config.load()

# ---------------------------------------------------------------------------
# In-memory session history
# ---------------------------------------------------------------------------

_history: list[dict[str, Any]] = []
_MAX_HISTORY = 200


def _record_history(entry: dict[str, Any]) -> None:
    """Append *entry* to the in-memory session history (capped at _MAX_HISTORY)."""
    entry.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
    _history.append(entry)
    if len(_history) > _MAX_HISTORY:
        _history.pop(0)


# ---------------------------------------------------------------------------
# In-memory progress store  (job_id → list[str])
# ---------------------------------------------------------------------------

_progress: dict[str, list[str]] = {}


def _push_progress(job_id: str, message: str) -> None:
    if job_id:
        _progress.setdefault(job_id, []).append(message)


# ---------------------------------------------------------------------------
# URL validation helpers
# ---------------------------------------------------------------------------

_URL_RE = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)


def validate_url(url: str) -> str | None:
    """Return an error string if *url* is invalid, else ``None``."""
    if not url:
        return "URL must not be empty."
    if not _URL_RE.match(url):
        return f"URL does not look valid: {url!r}. It must start with http:// or https://."
    parsed = urlparse(url)
    if not parsed.netloc:
        return "URL has no host/domain."
    return None


# ---------------------------------------------------------------------------
# Chrome driver factory
# ---------------------------------------------------------------------------


def _build_chrome_options(headless: bool | None = None) -> Options:
    """Return Chrome ``Options`` based on the active :class:`Config`."""
    options = Options()
    use_headless = _cfg.headless if headless is None else headless
    if use_headless:
        options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={_cfg.window_width},{_cfg.window_height}")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_bin = os.environ.get("CHROME_BIN")
    if chrome_bin:
        options.binary_location = chrome_bin
    return options


def _get_driver(headless: bool | None = None) -> webdriver.Chrome:
    """Instantiate and return a Chrome WebDriver, installing chromedriver if needed."""
    chromedriver_path = os.environ.get("CHROMEDRIVER_PATH")
    service = (
        ChromeService(chromedriver_path)
        if chromedriver_path
        else ChromeService(ChromeDriverManager().install())
    )
    driver = webdriver.Chrome(service=service, options=_build_chrome_options(headless))
    driver.set_page_load_timeout(_cfg.page_load_timeout)
    return driver


# ---------------------------------------------------------------------------
# Retry decorator
# ---------------------------------------------------------------------------


def _with_retry(fn, *args, max_retries: int | None = None, delay: float | None = None, **kwargs):
    """Call *fn* up to *max_retries* times, sleeping *delay* seconds between attempts.

    Returns the first successful result or re-raises the last exception.
    """
    tries = max(1, (max_retries if max_retries is not None else _cfg.max_retries))
    wait = (delay if delay is not None else _cfg.retry_delay)
    last_exc: Exception | None = None
    for attempt in range(1, tries + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt < tries:
                log.warning("⟳ Attempt %d/%d failed (%s). Retrying in %.1fs…", attempt, tries, exc, wait)
                time.sleep(wait)
    if last_exc is not None:
        raise last_exc
    raise RuntimeError("_with_retry: no attempts were made (tries must be >= 1)")


# ---------------------------------------------------------------------------
# Page scanner
# ---------------------------------------------------------------------------


def scan_page_for_buttons(url: str, job_id: str = "") -> list[dict[str, Any]]:
    """Navigate to *url* and return a list of clickable download/episode buttons.

    Each item in the returned list is a dict with keys:
      ``id``        — zero-based index (sorted top-to-bottom by Y position)
      ``text``      — visible button text
      ``y``         — Y pixel position on page
      ``url_hint``  — href attribute (may be ``None``)

    Parameters
    ----------
    url:
        The page URL to scan.
    job_id:
        Optional job identifier for progress tracking.
    """
    log.info("🔍 Scanning: %s", url)
    _push_progress(job_id, f"🔍 Scanning page: {url}")
    driver = _get_driver()
    found_buttons: list[dict[str, Any]] = []

    try:
        driver.get(url)
        time.sleep(4)  # allow JS to render

        raw_buttons = []
        for label in _cfg.button_labels:
            elems = driver.find_elements(
                By.XPATH,
                f"//a[normalize-space()='{label}'] | //button[normalize-space()='{label}']",
            )
            raw_buttons.extend(elems)

        # De-duplicate while preserving order by Y coordinate
        seen_ids: set[str] = set()
        unique: list[Any] = []
        for btn in raw_buttons:
            try:
                eid = btn.id
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    unique.append(btn)
            except Exception:  # noqa: BLE001
                unique.append(btn)

        unique.sort(key=lambda b: b.location.get("y", 0))
        log.info("✅ Found %d button(s).", len(unique))
        _push_progress(job_id, f"✅ Found {len(unique)} button(s).")

        for index, btn in enumerate(unique):
            try:
                found_buttons.append(
                    {
                        "id": index,
                        "text": btn.text.strip(),
                        "y": btn.location.get("y", 0),
                        "url_hint": btn.get_attribute("href"),
                    }
                )
            except Exception as exc:  # noqa: BLE001
                log.debug("  Skipping button %d: %s", index, exc)

    except Exception as exc:
        log.error("❌ Scan error: %s", exc)
        _push_progress(job_id, f"❌ Scan error: {exc}")
    finally:
        driver.quit()

    return found_buttons


# ---------------------------------------------------------------------------
# Dynamic pepe-domain extractor
# ---------------------------------------------------------------------------


def _extract_pepe_domain(driver: webdriver.Chrome) -> str | None:
    """Scan all ``<a>`` tags on the current page for ``?go=pepe-`` links and
    return the base domain (``scheme://host``) if found, else ``None``.

    Using dynamic detection avoids hard-coding the CDN/shortener domain, which
    may change over time.
    """
    try:
        links = driver.find_elements(By.TAG_NAME, "a")
        for link in links:
            href = link.get_attribute("href") or ""
            if "?go=pepe-" in href:
                parsed = urlparse(href)
                return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:  # noqa: BLE001
        pass
    return None


# ---------------------------------------------------------------------------
# Verification helper
# ---------------------------------------------------------------------------


def _click_verify(driver: webdriver.Chrome, wait: WebDriverWait, label: str) -> bool:
    """Attempt to click the first element whose text *contains* ``label`` (case-insensitive).

    Returns ``True`` on success, ``False`` if the element was not found.
    """
    try:
        lower = label.lower()
        xpath = (
            f"//*[contains("
            f"translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
            f"'{lower}')]"
        )
        el = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
        driver.execute_script("arguments[0].click();", el)
        log.debug("    ✔ Clicked verification step: %r", label)
        return True
    except Exception:  # noqa: BLE001
        return False


# ---------------------------------------------------------------------------
# Worker — resolves a single button on a target page
# ---------------------------------------------------------------------------


def worker(task: tuple[str, int, str]) -> dict[str, Any]:
    """Resolve one button click on a page.

    Parameters
    ----------
    task:
        ``(target_url, button_index, job_id)``

    Returns
    -------
    dict
        Keys: ``index``, ``text``, ``status`` (``"success"``/``"error"``),
        ``url`` (on success) or ``message`` (on error).
    """
    target_url, button_index_to_click, job_id = task

    def push(msg: str) -> None:
        _push_progress(job_id, msg)
        log.info(msg)

    push(f"🚀 Worker starting — button #{button_index_to_click + 1} on {target_url}")

    driver: webdriver.Chrome | None = None
    btn_text_log = f"button_{button_index_to_click}"

    def _try_worker() -> dict[str, Any]:
        nonlocal driver, btn_text_log
        driver = _get_driver()
        wait = WebDriverWait(driver, _cfg.element_wait_timeout)

        # ── PART A: Navigate & locate target button ──────────────────────────
        push("  ▸ Loading target page…")
        driver.get(target_url)
        WebDriverWait(driver, _cfg.page_load_timeout).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(3)

        raw_buttons: list[Any] = []
        for label in _cfg.button_labels:
            elems = driver.find_elements(
                By.XPATH,
                f"//a[normalize-space()='{label}'] | //button[normalize-space()='{label}']",
            )
            raw_buttons.extend(elems)

        seen_ids: set[str] = set()
        unique: list[Any] = []
        for btn in raw_buttons:
            try:
                eid = btn.id
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    unique.append(btn)
            except Exception:  # noqa: BLE001
                unique.append(btn)
        unique.sort(key=lambda b: b.location.get("y", 0))

        if button_index_to_click >= len(unique):
            return {
                "index": button_index_to_click,
                "status": "error",
                "message": f"Button index {button_index_to_click} no longer exists (found {len(unique)} buttons).",
            }

        target_btn = unique[button_index_to_click]
        btn_text_log = target_btn.text.strip()

        # Scroll & click
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", target_btn)
        time.sleep(1)

        current_handles = set(driver.window_handles)
        target_btn.click()
        push(f"  ✅ Clicked: {btn_text_log!r}")
        time.sleep(_cfg.post_click_delay)

        # Switch to newly opened tab (if any)
        new_handles = set(driver.window_handles) - current_handles
        if new_handles:
            driver.switch_to.window(new_handles.pop())
            push("  ▸ Switched to new tab.")

        # ── PART B: Handle intermediate "Fast Server" selection ──────────────
        try:
            server_btn = WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((
                    By.XPATH,
                    "//*[contains(text(),'Fast Server') or contains(text(),'All Episodes Batch')]",
                ))
            )
            driver.execute_script("arguments[0].click();", server_btn)
            push("  ▸ Clicked 'Fast Server' / 'All Episodes Batch'.")
            time.sleep(3)
            all_handles = set(driver.window_handles)
            newer = all_handles - current_handles - new_handles
            if newer:
                driver.switch_to.window(newer.pop())
        except Exception:  # noqa: BLE001
            pass  # Not present on this page — that's fine.

        # ── PART C: Verification bypass steps ────────────────────────────────
        push("  ▸ Running verification steps…")
        for step in _cfg.verification_steps:
            clicked = _click_verify(driver, wait, step)
            if clicked:
                push(f"    ✔ {step}")
                time.sleep(_cfg.verification_delay)

        # Extra wait after 'verify to continue' — some pages need longer
        time.sleep(5)

        # ── PART D: Find & follow the final pepe/redirect link ───────────────
        push("  ▸ Searching for final redirect link…")
        time.sleep(_cfg.final_resolve_delay)

        pepe_domain = _extract_pepe_domain(driver)
        if not pepe_domain:
            push("  ⚠️  Could not detect pepe domain — trying fallback link search.")
        else:
            push(f"  ▸ Detected pepe domain: {pepe_domain}")

        found_link: str | None = None
        links = driver.find_elements(By.TAG_NAME, "a")

        if pepe_domain:
            target_pattern = f"{pepe_domain}/?go=pepe-"
            for link_el in links:
                href = link_el.get_attribute("href") or ""
                if href.startswith(target_pattern):
                    found_link = href
                    break

        if not found_link:
            # Fallback: any link with a query-string that looks like a redirect
            for link_el in links:
                href = link_el.get_attribute("href") or ""
                if href.startswith("http") and "?" in href and "go=" in href:
                    found_link = href
                    break

        if not found_link:
            return {
                "index": button_index_to_click,
                "text": btn_text_log,
                "status": "error",
                "message": "No suitable redirect link found on the page.",
            }

        push(f"  ▸ Following link: {found_link[:80]}…")
        driver.get(found_link)
        time.sleep(3)
        final_url = driver.current_url
        push(f"  🎯 Final URL: {final_url}")

        return {
            "index": button_index_to_click,
            "text": btn_text_log,
            "status": "success",
            "url": final_url,
        }

    try:
        return _with_retry(_try_worker, max_retries=_cfg.max_retries, delay=_cfg.retry_delay)
    except Exception as exc:
        log.error("❌ Worker failed for button %d: %s", button_index_to_click, exc)
        return {
            "index": button_index_to_click,
            "text": btn_text_log,
            "status": "error",
            "message": str(exc),
        }
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:  # noqa: BLE001
                pass


# ---------------------------------------------------------------------------
# Export helpers
# ---------------------------------------------------------------------------


def export_results(results: list[dict[str, Any]], fmt: str) -> tuple[str, str]:
    """Serialise *results* into the chosen format.

    Parameters
    ----------
    results:
        List of result dicts as returned by ``worker()``.
    fmt:
        One of ``"json"``, ``"csv"``, ``"txt"``.

    Returns
    -------
    tuple[str, str]
        ``(content_string, mime_type)``
    """
    fmt = fmt.lower()

    if fmt == "json":
        return json.dumps(results, indent=2, ensure_ascii=False), "application/json"

    if fmt == "csv":
        buf = io.StringIO()
        writer = csv.DictWriter(
            buf,
            fieldnames=["index", "text", "status", "url", "message", "timestamp"],
            extrasaction="ignore",
        )
        writer.writeheader()
        writer.writerows(results)
        return buf.getvalue(), "text/csv"

    # txt fallback
    lines: list[str] = [
        "=== Link Resolver v2 — Results ===",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
    ]
    for i, r in enumerate(results, 1):
        lines.append(f"[{i}] Button: {r.get('text', 'N/A')} (index {r.get('index', '?')})")
        if r.get("status") == "success":
            lines.append(f"    ✅ {r.get('url', '')}")
        else:
            lines.append(f"    ❌ {r.get('message', 'Unknown error')}")
        lines.append("")
    return "\n".join(lines), "text/plain"


# ---------------------------------------------------------------------------
# Flask application
# ---------------------------------------------------------------------------

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)


# ── Static / index ────────────────────────────────────────────────────────

@app.route("/")
def index() -> Response:
    """Serve the front-end entry point."""
    return send_from_directory(".", "index.html")


# ── Health check ─────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def api_health() -> Response:
    """Return a simple health/readiness response."""
    return jsonify({"status": "ok", "version": "2.0", "timestamp": datetime.now(timezone.utc).isoformat()})


# ── Config ───────────────────────────────────────────────────────────────

@app.route("/api/config", methods=["GET"])
def api_config_get() -> Response:
    """Return the current runtime configuration."""
    return jsonify(asdict(_cfg))


@app.route("/api/config", methods=["POST"])
def api_config_post() -> Response:
    """Update one or more config fields.

    Request body (JSON)::

        { "headless": false, "max_retries": 5 }

    Response::

        { "config": { ... }, "errors": [] }
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    errors = _cfg.update(data)
    status = 400 if errors else 200
    return jsonify({"config": asdict(_cfg), "errors": errors}), status


# ── Scan ─────────────────────────────────────────────────────────────────

@app.route("/api/scan", methods=["POST"])
def api_scan() -> Response:
    """Scan a page and return the list of resolvable buttons.

    Request body::

        { "url": "https://example.com/..." }

    Response::

        { "buttons": [ { "id": 0, "text": "...", "y": 120, "url_hint": null }, ... ] }
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    url: str = (data.get("url") or "").strip()

    err = validate_url(url)
    if err:
        return jsonify({"error": err}), 400

    job_id = data.get("job_id", "")
    buttons = scan_page_for_buttons(url, job_id=job_id)
    return jsonify({"buttons": buttons})


# ── Resolve (single URL) ──────────────────────────────────────────────────

@app.route("/api/resolve", methods=["POST"])
def api_resolve() -> Response:
    """Resolve selected buttons on a single URL.

    Request body::

        { "url": "https://example.com/...", "indices": [0, 2] }

    Response::

        { "results": [ { "index": 0, "text": "...", "status": "success", "url": "..." }, ... ] }
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    url: str = (data.get("url") or "").strip()
    indices: list[int] = data.get("indices") or []
    job_id: str = data.get("job_id", str(uuid.uuid4()))

    url_err = validate_url(url)
    if url_err:
        return jsonify({"error": url_err}), 400
    if not indices:
        return jsonify({"error": "No button indices provided."}), 400

    tasks = [(url, idx, job_id) for idx in indices]
    results: list[dict[str, Any]] = []

    try:
        pool_size = min(len(tasks), _cfg.max_parallel_workers)
        with Pool(processes=pool_size) as pool:
            results = pool.map(worker, tasks)
    except Exception as exc:
        log.error("❌ Pool error: %s", exc)
        return jsonify({"error": "An internal error occurred while processing the request."}), 500

    # Record in session history
    for r in results:
        _record_history({"url": url, **r})

    return jsonify({"results": results, "job_id": job_id})


# ── Batch (multiple URLs) ─────────────────────────────────────────────────

@app.route("/api/batch", methods=["POST"])
def api_batch() -> Response:
    """Resolve selected buttons across multiple URLs.

    Request body::

        {
          "urls": ["https://example.com/ep1", "https://example.com/ep2"],
          "indices": [0]
        }

    Each URL is processed sequentially; button indices are the same for every URL.

    Response::

        {
          "batch_results": [
            { "url": "...", "results": [ ... ] },
            ...
          ]
        }
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    urls: list[str] = data.get("urls") or []
    indices: list[int] = data.get("indices") or []

    if not urls:
        return jsonify({"error": "No URLs provided."}), 400
    if not indices:
        return jsonify({"error": "No button indices provided."}), 400
    if len(urls) > _cfg.max_batch_urls:
        return jsonify({"error": f"Too many URLs. Maximum batch size is {_cfg.max_batch_urls}."}), 400

    # Validate all URLs upfront
    for u in urls:
        err = validate_url(u)
        if err:
            return jsonify({"error": f"Invalid URL {u!r}: {err}"}), 400

    batch_results: list[dict[str, Any]] = []
    for url in urls:
        job_id = str(uuid.uuid4())
        tasks = [(url, idx, job_id) for idx in indices]
        try:
            pool_size = min(len(tasks), _cfg.max_parallel_workers)
            with Pool(processes=pool_size) as pool:
                url_results = pool.map(worker, tasks)
        except Exception as exc:
            log.error("❌ Pool error for %r: %s", url, exc)
            url_results = [{"index": idx, "status": "error", "message": "An internal error occurred."} for idx in indices]

        for r in url_results:
            _record_history({"url": url, **r})
        batch_results.append({"url": url, "results": url_results})

    return jsonify({"batch_results": batch_results})


# ── History ───────────────────────────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
def api_history() -> Response:
    """Return the in-memory session history (most recent entries first).

    Query parameters:
      ``limit`` — maximum number of entries to return (default: 50)
    """
    try:
        limit = int(request.args.get("limit", 50))
    except ValueError:
        limit = 50
    limit = max(1, min(limit, _MAX_HISTORY))
    return jsonify({"history": list(reversed(_history))[:limit]})


# ── Export ────────────────────────────────────────────────────────────────

@app.route("/api/export", methods=["POST"])
def api_export() -> Response:
    """Export a list of results in the requested format.

    Request body::

        {
          "format": "json",          // "json" | "csv" | "txt"
          "results": [ ... ]         // array of result objects
        }

    Response:
      The serialised data with an appropriate ``Content-Type`` header.
      For ``json``, returns a JSON response; for ``csv`` and ``txt``, returns
      a file download (``Content-Disposition: attachment``).
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    fmt: str = (data.get("format") or _cfg.default_export_format).lower()
    results: list[dict[str, Any]] = data.get("results") or []

    if fmt not in {"json", "csv", "txt"}:
        return jsonify({"error": f"Unsupported format {fmt!r}. Use 'json', 'csv', or 'txt'."}), 400
    if not results:
        return jsonify({"error": "No results provided."}), 400

    content, mime = export_results(results, fmt)

    if fmt == "json":
        return Response(content, mimetype=mime)

    filename = f"resolver_results_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.{fmt}"
    return Response(
        content,
        mimetype=mime,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── Progress (Server-Sent Events) ─────────────────────────────────────────

@app.route("/api/progress/<job_id>", methods=["GET"])
def api_progress(job_id: str) -> Response:
    """Stream progress messages for *job_id* as Server-Sent Events.

    The client should listen with ``EventSource``.  The stream closes
    automatically after 60 seconds of inactivity.

    Example JavaScript::

        const es = new EventSource('/api/progress/my-job-id');
        es.onmessage = (e) => console.log(e.data);
    """
    def generate():  # noqa: ANN202
        deadline = time.time() + 60
        sent = 0
        while time.time() < deadline:
            messages = _progress.get(job_id, [])
            while sent < len(messages):
                yield f"data: {messages[sent]}\n\n"
                sent += 1
            time.sleep(0.5)
        yield "data: [done]\n\n"

    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ── Python Code Runner ────────────────────────────────────────────────────

_MAX_OUTPUT_BYTES = 50_000  # cap stdout/stderr at 50,000 bytes each
_DEFAULT_RUN_TIMEOUT = 30   # seconds
_MAX_RUN_TIMEOUT = 120      # hard ceiling (Selenium tests can be slow)


_VALID_PKG_RE = re.compile(
    r"^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?"  # package name
    r"(\s*[><=!~^]{1,3}\s*[A-Za-z0-9.*+!-]+)?$"    # optional version specifier
)
_MAX_PACKAGES = 20


def _validate_packages(raw: list[Any]) -> tuple[list[str], str]:
    """Return (validated_list, error_message).  error_message is '' when OK."""
    if len(raw) > _MAX_PACKAGES:
        return [], f"Too many packages requested (max {_MAX_PACKAGES})."
    pkgs: list[str] = []
    for item in raw:
        name = str(item).strip()
        if not name:
            continue
        if not _VALID_PKG_RE.match(name):
            return [], f"Invalid package name: {name!r}"
        pkgs.append(name)
    return pkgs, ""


@app.route("/api/run", methods=["POST"])
def api_run_code() -> Response:
    """Execute arbitrary Python code in a subprocess and return its output.

    Request body::

        {
          "code": "print('hello')",
          "timeout": 30,          // optional, 5–120 seconds
          "stdin": "some input",  // optional, fed to input() calls line-by-line
          "packages": ["requests", "numpy==1.26.4"]  // optional, installed to a
                                                     // temporary directory before
                                                     // the code runs and cleaned
                                                     // up afterwards
        }

    Response::

        {
          "stdout": "hello\\n",
          "stderr": "",
          "returncode": 0
        }
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    code: str = data.get("code") or ""
    if not code.strip():
        return jsonify({"error": "No code provided."}), 400

    try:
        timeout = int(data.get("timeout", _DEFAULT_RUN_TIMEOUT))
        timeout = max(5, min(_MAX_RUN_TIMEOUT, timeout))
    except (TypeError, ValueError):
        timeout = _DEFAULT_RUN_TIMEOUT

    stdin_text: str = data.get("stdin") or ""
    # Ensure stdin ends with a newline so the last input() call gets a full line
    if stdin_text and not stdin_text.endswith("\n"):
        stdin_text += "\n"

    # ── Strip Jupyter/IPython magic "!" lines from code ───────────────────────
    # Lines starting with "!" are IPython shell escapes (e.g. "!pip install x").
    # They are not valid Python syntax and would cause an immediate SyntaxError.
    # We handle "!pip install ..." by extracting the packages and adding them to
    # the install list; all other "!" lines are replaced with a comment so the
    # rest of the code can still run.
    magic_packages: list[str] = []
    cleaned_lines: list[str] = []
    for raw_line in code.splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("!pip install") or stripped.startswith("! pip install"):
            # e.g.  !pip install -q selenium requests
            # Extract tokens that are not flags (don't start with -)
            tokens = re.split(r"\s+", stripped)
            # skip "!", "pip", "install" and any flag tokens
            pkg_start = False
            for tok in tokens:
                if tok.lower() == "install":
                    pkg_start = True
                    continue
                if pkg_start and tok and not tok.startswith("-"):
                    magic_packages.append(tok)
            # Replace the line with a comment so line numbers stay meaningful
            cleaned_lines.append(f"# (magic) {raw_line.strip()}")
        elif stripped.startswith("!"):
            # Other shell-escape lines: comment them out
            cleaned_lines.append(f"# (shell) {raw_line.strip()}")
        else:
            cleaned_lines.append(raw_line)
    code = "\n".join(cleaned_lines)

    # ── Optional package installation ────────────────────────────────────────
    raw_packages = data.get("packages") or []
    if isinstance(raw_packages, str):
        # Accept a comma/space-separated string as a convenience
        raw_packages = [p for p in re.split(r"[,\s]+", raw_packages) if p]
    # Merge any packages extracted from "!pip install" magic lines
    raw_packages = list(raw_packages) + magic_packages
    packages, pkg_err = _validate_packages(raw_packages)
    if pkg_err:
        return jsonify({"error": pkg_err}), 400

    tmp_pkg_dir: str | None = None
    tmp_script: str | None = None
    install_stdout = ""
    install_stderr = ""

    if packages:
        tmp_pkg_dir = tempfile.mkdtemp(prefix="pyrunner_pkgs_")
        try:
            pip_proc = subprocess.run(
                [sys.executable, "-m", "pip", "install", "--quiet",
                 "--target", tmp_pkg_dir, "--disable-pip-version-check",
                 "--no-warn-script-location", *packages],
                capture_output=True,
                text=True,
                timeout=120,
                env=os.environ.copy(),
            )
            install_stdout = pip_proc.stdout[:_MAX_OUTPUT_BYTES]
            install_stderr = pip_proc.stderr[:_MAX_OUTPUT_BYTES]
            if pip_proc.returncode != 0:
                shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
                return jsonify({
                    "error": "Package installation failed.",
                    "stdout": install_stdout,
                    "stderr": install_stderr,
                    "returncode": pip_proc.returncode,
                }), 500
        except subprocess.TimeoutExpired:
            shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
            return jsonify({"error": "Package installation timed out."}), 408

        # Prepend path injection so the temp packages are importable
        path_injection = (
            f"import sys as _sys\n"
            f"_sys.path.insert(0, {tmp_pkg_dir!r})\n"
            f"del _sys\n"
        )
        code = path_injection + code

    try:
        # Write code to a temporary .py file instead of passing via "-c".
        # This is required for multiprocessing.Pool (and other modules that
        # need to re-import __main__) to work correctly: when Python is
        # started with "-c <code>" the worker processes have no file to
        # re-import, but a named temp file works fine.
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", prefix="pyrunner_script_", delete=False
        ) as tmp_f:
            tmp_f.write(code)
            tmp_script = tmp_f.name

        # Inherit the full server environment so the subprocess can find
        # CHROME_BIN, CHROMEDRIVER_PATH, etc. for Selenium code.
        with subprocess.Popen(
            [sys.executable, "-u", tmp_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True,
            env=os.environ.copy(),
        ) as proc:
            try:
                stdout, stderr = proc.communicate(input=stdin_text or None, timeout=timeout)
            except subprocess.TimeoutExpired:
                proc.kill()
                try:
                    stdout, stderr = proc.communicate(timeout=5)
                except subprocess.TimeoutExpired:
                    stdout, stderr = "", ""
                return jsonify({
                    "error": f"Code execution timed out after {timeout} seconds.",
                    "stdout": stdout[:_MAX_OUTPUT_BYTES],
                    "stderr": stderr[:_MAX_OUTPUT_BYTES],
                }), 408
        stdout = stdout[:_MAX_OUTPUT_BYTES]
        stderr = stderr[:_MAX_OUTPUT_BYTES]
        return jsonify({"stdout": stdout, "stderr": stderr, "returncode": proc.returncode})
    except (OSError, ValueError) as exc:
        log.error("❌ /api/run error: %s", exc)
        return jsonify({"error": "An internal error occurred during code execution."}), 500
    finally:
        if tmp_script:
            try:
                os.unlink(tmp_script)
            except OSError:
                pass
        if tmp_pkg_dir:
            shutil.rmtree(tmp_pkg_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}

    # Override headless from environment so developers can run headed locally
    if os.environ.get("HEADLESS", "").lower() in {"0", "false", "no"}:
        _cfg.headless = False
        log.info("🖥️  Headless mode disabled via HEADLESS env var.")

    log.info("🚀 Enhanced Link Resolver v2.0 starting on port %d (debug=%s, headless=%s)", port, debug, _cfg.headless)
    app.run(host="0.0.0.0", port=port, debug=debug)
