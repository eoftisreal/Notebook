"""
🐍 Python Notebook Server v3.0
================================
A complete web-based Python notebook with code execution, package management,
and beautiful Jupyter-like interface.

Features:
  - Execute arbitrary Python code
  - Install packages on-the-fly
  - Capture stdout/stderr
  - Handle timeouts gracefully
  - Support for !pip install magic commands
  - Input/Output streaming
  - Error handling with tracebacks

Usage:
  python notebook_server.py              # runs on port 5000
  PORT=8080 python notebook_server.py    # custom port
  FLASK_DEBUG=1 python notebook_server.py # debug mode
"""

from __future__ import annotations

import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any

from flask import Flask, jsonify, request, send_from_directory, render_template_string
from flask_cors import CORS

# ─────────────────────────────────────────────────────────────────────────────
# Logging Setup
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Flask App Setup
# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Configuration
_DEFAULT_RUN_TIMEOUT = 30
_MAX_RUN_TIMEOUT = 300
_MAX_OUTPUT_BYTES = 100000
_VALID_PKG_RE = re.compile(r"^[a-zA-Z0-9._\-\[\]<>=!~;]+$")


# ─────────────────────────────────────────────────────────────────────────────
# API: Health Check
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health_check() -> tuple[dict, int]:
    """Check server health."""
    return jsonify({"status": "ok", "version": "3.0"}), 200


# ─────────────────────────────────────────────────────────────────────────────
# API: Execute Python Code
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/run", methods=["POST"])
def api_run_code() -> tuple[dict, int]:
    """
    Execute arbitrary Python code in a subprocess.

    Request body:
    {
      "code": "print('hello')",
      "timeout": 30,  # optional, 5–300 seconds (default: 30)
      "stdin": "some input",  # optional, fed to input() calls
      "packages": ["requests", "numpy"]  # optional, installed first
    }

    Response:
    {
      "stdout": "output\\n",
      "stderr": "errors (if any)\\n",
      "returncode": 0,
      "execution_time": 1.234
    }
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    code: str = data.get("code", "").strip()

    if not code:
        return jsonify({"error": "No code provided."}), 400

    # Parse timeout
    try:
        timeout = int(data.get("timeout", _DEFAULT_RUN_TIMEOUT))
        timeout = max(5, min(_MAX_RUN_TIMEOUT, timeout))
    except (TypeError, ValueError):
        timeout = _DEFAULT_RUN_TIMEOUT

    stdin_text: str = data.get("stdin", "") or ""
    if stdin_text and not stdin_text.endswith("\n"):
        stdin_text += "\n"

    # ─── Process magic commands (e.g., !pip install) ────────────────────────
    magic_packages: list[str] = []
    cleaned_lines: list[str] = []

    for raw_line in code.splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("!pip install") or stripped.startswith("! pip install"):
            tokens = re.split(r"\s+", stripped)
            pkg_start = False
            for tok in tokens:
                if tok.lower() == "install":
                    pkg_start = True
                    continue
                if pkg_start and tok and not tok.startswith("-"):
                    magic_packages.append(tok)
            cleaned_lines.append(f"# (magic) {raw_line.strip()}")
        elif stripped.startswith("!"):
            cleaned_lines.append(f"# (shell) {raw_line.strip()}")
        else:
            cleaned_lines.append(raw_line)

    code = "\n".join(cleaned_lines)

    # ─── Validate & merge packages ──────────────────────────────────────────
    raw_packages = data.get("packages", []) or []
    if isinstance(raw_packages, str):
        raw_packages = [p for p in re.split(r"[,\s]+", raw_packages) if p]

    packages = list(raw_packages) + magic_packages

    # Validate package names
    validated_packages = []
    for pkg in packages:
        if not _VALID_PKG_RE.match(pkg):
            return jsonify({"error": f"Invalid package name: {pkg!r}"}), 400
        validated_packages.append(pkg)

    if len(validated_packages) > 20:
        return jsonify({"error": "Too many packages (max 20)."}), 400

    # ─── Execute Code ──────────────────────────────────────────────────────
    tmp_pkg_dir: str | None = None
    tmp_script: str | None = None
    start_time = time.time()

    try:
        # Install packages if needed
        if validated_packages:
            tmp_pkg_dir = tempfile.mkdtemp(prefix="pyrunner_pkgs_")
            logger.info(f"Installing packages: {', '.join(validated_packages)}")
            try:
                pip_proc = subprocess.run(
                    [
                        sys.executable, "-m", "pip", "install",
                        "--quiet", "--target", tmp_pkg_dir,
                        "--disable-pip-version-check",
                        "--no-warn-script-location",
                        *validated_packages
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                if pip_proc.returncode != 0:
                    shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
                    return jsonify({
                        "error": "Package installation failed.",
                        "stdout": pip_proc.stdout[:_MAX_OUTPUT_BYTES],
                        "stderr": pip_proc.stderr[:_MAX_OUTPUT_BYTES],
                        "returncode": pip_proc.returncode,
                    }), 500
            except subprocess.TimeoutExpired:
                shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
                return jsonify({"error": "Package installation timed out."}), 408

            # Inject package directory into sys.path
            path_injection = (
                f"import sys as _sys\n"
                f"_sys.path.insert(0, {tmp_pkg_dir!r})\n"
                f"del _sys\n"
            )
            code = path_injection + code

        # Write code to temporary file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", prefix="notebook_", delete=False
        ) as tmp_f:
            tmp_f.write(code)
            tmp_script = tmp_f.name

        # Execute in subprocess
        logger.info(f"Executing code ({len(code)} bytes, timeout={timeout}s)")
        with subprocess.Popen(
            [sys.executable, "-u", tmp_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True,
        ) as proc:
            try:
                stdout, stderr = proc.communicate(input=stdin_text or None, timeout=timeout)
            except subprocess.TimeoutExpired:
                proc.kill()
                try:
                    stdout, stderr = proc.communicate(timeout=5)
                except subprocess.TimeoutExpired:
                    stdout, stderr = "", ""
                execution_time = time.time() - start_time
                return jsonify({
                    "error": f"Code execution timed out after {timeout} seconds.",
                    "stdout": stdout[:_MAX_OUTPUT_BYTES],
                    "stderr": stderr[:_MAX_OUTPUT_BYTES],
                    "execution_time": round(execution_time, 3),
                }), 408

        execution_time = time.time() - start_time
        return jsonify({
            "stdout": stdout[:_MAX_OUTPUT_BYTES],
            "stderr": stderr[:_MAX_OUTPUT_BYTES],
            "returncode": proc.returncode,
            "execution_time": round(execution_time, 3),
        })

    except Exception as exc:
        logger.exception("Error during code execution")
        return jsonify({"error": str(exc)}), 500

    finally:
        if tmp_script:
            try:
                os.unlink(tmp_script)
            except OSError:
                pass
        if tmp_pkg_dir:
            shutil.rmtree(tmp_pkg_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Serve Static Files & Frontend
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    """Serve the notebook frontend."""
    return send_from_directory(".", "notebook.html")


@app.route("/static/<path:path>")
def serve_static(path):
    """Serve static files."""
    return send_from_directory("static", path)


# ─────────────────────────────────────────────────────────────────────────────
# Error Handlers
# ─────────────────────────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    logger.exception("Unhandled server error")
    return jsonify({"error": "Internal server error"}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Startup
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}

    logger.info(f"🚀 Python Notebook Server v3.0 starting on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)