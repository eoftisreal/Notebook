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
import threading
import time
import uuid
import signal
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
_MAX_RUN_TIMEOUT = 1800
_MAX_OUTPUT_BYTES = 100000
_VALID_PKG_RE = re.compile(r"^[a-zA-Z0-9._\-\[\]<>=!~;]+$")

# ─────────────────────────────────────────────────────────────────────────────
# Interactive ("blocking input") execution sessions
# ─────────────────────────────────────────────────────────────────────────────
#
# A normal HTTP request/response can't pause mid-execution to ask the user a
# question. To support real `input()` prompts (like Jupyter/Colab), we run the
# script in a *persistent* subprocess and talk to it over stdin/stdout in the
# background, exposing the conversation through a small polling API:
#
#   POST /api/run/start   -> spawns the subprocess, returns a session_id
#   GET  /api/run/poll/<id> -> returns accumulated output + status so far
#   POST /api/run/input   -> writes the user's reply to the subprocess's stdin
#   POST /api/run/stop/<id> -> kills the subprocess
#
# We detect "the script is waiting on input()" by monkey-patching `input()`
# inside the executed script to emit an invisible marker right after writing
# the prompt text, then blocking on stdin.readline(). The reader thread splits
# on that marker to know when to flip the session into "waiting_input" state.

_INPUT_MARKER = "\x00__NOTEBOOK_INPUT_REQUEST__\x00"
_SESSION_IDLE_TIMEOUT = 30 * 60  # purge finished sessions after 30 minutes

SESSIONS: dict[str, dict[str, Any]] = {}
SESSIONS_LOCK = threading.Lock()


def _build_wrapped_code(code: str) -> str:
    """Prepend a shim that makes input() emit a marker before blocking."""
    prelude = (
        "import sys as _nb_sys\n"
        "def _nb_input(prompt=''):\n"
        "    _nb_sys.stdout.write(str(prompt))\n"
        f"    _nb_sys.stdout.write({_INPUT_MARKER!r})\n"
        "    _nb_sys.stdout.flush()\n"
        "    _nb_line = _nb_sys.stdin.readline()\n"
        "    if _nb_line == '':\n"
        "        raise EOFError('EOF when reading a line')\n"
        "    if _nb_line.endswith('\\n'):\n"
        "        _nb_line = _nb_line[:-1]\n"
        "    return _nb_line\n"
        "import builtins as _nb_builtins\n"
        "_nb_builtins.input = _nb_input\n"
        "del _nb_builtins\n"
        "\n"
    )
    return prelude + code


def _strip_magics(code: str) -> tuple[str, list[str]]:
    """Reuse the same !pip install / ! shell handling as /api/run."""
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
    return "\n".join(cleaned_lines), magic_packages


def _purge_old_sessions() -> None:
    now = time.time()
    with SESSIONS_LOCK:
        stale = [
            sid for sid, s in SESSIONS.items()
            if s.get("status") in ("finished", "error", "timeout", "stopped")
            and now - s.get("finished_at", now) > _SESSION_IDLE_TIMEOUT
        ]
        for sid in stale:
            SESSIONS.pop(sid, None)


def _reader_thread(session_id: str) -> None:
    """Reads the child's stdout char-by-char, splitting on the input marker."""
    with SESSIONS_LOCK:
        session = SESSIONS.get(session_id)
    if session is None:
        return
    proc: subprocess.Popen = session["proc"]

    buf = ""
    try:
        while True:
            ch = proc.stdout.read(1)
            if ch == "":
                break
            buf += ch
            if _INPUT_MARKER in buf:
                pre, _, buf = buf.partition(_INPUT_MARKER)
                with SESSIONS_LOCK:
                    session["stdout"] += pre
                    session["stdout"] = session["stdout"][-_MAX_OUTPUT_BYTES:]
                    session["status"] = "waiting_input"
                continue
            # Flush eagerly on newlines so output streams in near real time
            if ch == "\n":
                with SESSIONS_LOCK:
                    session["stdout"] += buf
                    session["stdout"] = session["stdout"][-_MAX_OUTPUT_BYTES:]
                buf = ""
    except (ValueError, OSError):
        pass
    finally:
        if buf:
            with SESSIONS_LOCK:
                session["stdout"] += buf
                session["stdout"] = session["stdout"][-_MAX_OUTPUT_BYTES:]

        returncode = proc.wait()

        with SESSIONS_LOCK:
            if session.get("status") != "stopped":
                if session.get("timed_out"):
                    session["status"] = "timeout"
                else:
                    session["status"] = "finished"
            session["returncode"] = returncode
            session["execution_time"] = round(time.time() - session["start_time"], 3)
            session["finished_at"] = time.time()

        # Cleanup temp files now that the process has fully exited
        tmp_script = session.get("tmp_script")
        tmp_pkg_dir = session.get("tmp_pkg_dir")
        if tmp_script:
            try:
                os.unlink(tmp_script)
            except OSError:
                pass
        if tmp_pkg_dir:
            shutil.rmtree(tmp_pkg_dir, ignore_errors=True)


def _stderr_thread(session_id: str) -> None:
    with SESSIONS_LOCK:
        session = SESSIONS.get(session_id)
    if session is None:
        return
    proc: subprocess.Popen = session["proc"]
    try:
        for chunk in iter(lambda: proc.stderr.read(256), ""):
            if chunk == "":
                break
            with SESSIONS_LOCK:
                session["stderr"] += chunk
                session["stderr"] = session["stderr"][-_MAX_OUTPUT_BYTES:]
    except (ValueError, OSError):
        pass


def _watchdog_thread(session_id: str, timeout: int) -> None:
    """Kills the process if it runs (not counting time spent waiting on
    input(), which is allowed to block indefinitely) for longer than
    `timeout` seconds."""
    while True:
        time.sleep(1)
        with SESSIONS_LOCK:
            session = SESSIONS.get(session_id)
            if session is None:
                return
            status = session["status"]
            if status in ("finished", "error", "timeout", "stopped"):
                return
            if status == "waiting_input":
                # Paused on input(): don't count this time against the budget,
                # push the deadline forward instead.
                session["deadline"] = time.time() + timeout
                continue
            deadline = session["deadline"]
            proc = session["proc"]
        if time.time() > deadline:
            with SESSIONS_LOCK:
                session["timed_out"] = True
            try:
                if os.name == "posix":
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                else:
                    proc.kill()
            except OSError:
                pass
            return


def _start_session(code: str, timeout: int, packages: list[str]) -> tuple[str | None, dict | None]:
    """Installs packages (if any) then spawns the interactive subprocess.
    Returns (session_id, None) on success or (None, error_response_dict)."""
    code, magic_packages = _strip_magics(code)
    packages = list(packages) + magic_packages

    for pkg in packages:
        if not _VALID_PKG_RE.match(pkg):
            return None, {"error": f"Invalid package name: {pkg!r}"}
    if len(packages) > 20:
        return None, {"error": "Too many packages (max 20)."}

    tmp_pkg_dir: str | None = None
    pip_stdout = ""
    pip_stderr = ""

    if packages:
        tmp_pkg_dir = tempfile.mkdtemp(prefix="pyrunner_pkgs_")
        try:
            pip_proc = subprocess.run(
                [
                    sys.executable, "-m", "pip", "install",
                    "--target", tmp_pkg_dir,
                    "--disable-pip-version-check",
                    "--no-warn-script-location",
                    *packages,
                ],
                capture_output=True, text=True, timeout=120,
            )
            pip_stdout = pip_proc.stdout
            pip_stderr = pip_proc.stderr

            if pip_proc.returncode != 0:
                shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
                return None, {
                    "error": "Package installation failed.",
                    "stdout": pip_proc.stdout[:_MAX_OUTPUT_BYTES],
                    "stderr": pip_proc.stderr[:_MAX_OUTPUT_BYTES],
                }
        except subprocess.TimeoutExpired:
            shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
            return None, {"error": "Package installation timed out."}

        code = (
            f"import sys as _sys\n"
            f"_sys.path.insert(0, {tmp_pkg_dir!r})\n"
            f"del _sys\n"
        ) + code

    wrapped = _build_wrapped_code(code)

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", prefix="notebook_", delete=False
    ) as tmp_f:
        tmp_f.write(wrapped)
        tmp_script = tmp_f.name

    kwargs = {}
    if os.name == "posix":
        kwargs["start_new_session"] = True

    try:
        proc = subprocess.Popen(
            [sys.executable, "-u", tmp_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True,
            bufsize=1,
            **kwargs
        )
    except OSError as exc:
        os.unlink(tmp_script)
        if tmp_pkg_dir:
            shutil.rmtree(tmp_pkg_dir, ignore_errors=True)
        return None, {"error": f"Failed to start process: {exc}"}

    session_id = uuid.uuid4().hex
    now = time.time()
    session = {
        "proc": proc,
        "status": "running",
        "stdout": pip_stdout[:_MAX_OUTPUT_BYTES],
        "stderr": pip_stderr[:_MAX_OUTPUT_BYTES],
        "returncode": None,
        "start_time": now,
        "deadline": now + timeout,
        "timed_out": False,
        "tmp_script": tmp_script,
        "tmp_pkg_dir": tmp_pkg_dir,
        "finished_at": None,
    }
    with SESSIONS_LOCK:
        SESSIONS[session_id] = session

    threading.Thread(target=_reader_thread, args=(session_id,), daemon=True).start()
    threading.Thread(target=_stderr_thread, args=(session_id,), daemon=True).start()
    threading.Thread(target=_watchdog_thread, args=(session_id, timeout), daemon=True).start()

    return session_id, None


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

    pip_stdout = ""
    pip_stderr = ""

    try:
        # Install packages if needed
        if validated_packages:
            tmp_pkg_dir = tempfile.mkdtemp(prefix="pyrunner_pkgs_")
            logger.info(f"Installing packages: {', '.join(validated_packages)}")
            try:
                # Remove --quiet to ensure pip outputs the logs.
                pip_proc = subprocess.run(
                    [
                        sys.executable, "-m", "pip", "install",
                        "--target", tmp_pkg_dir,
                        "--disable-pip-version-check",
                        "--no-warn-script-location",
                        *validated_packages
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                pip_stdout = pip_proc.stdout
                pip_stderr = pip_proc.stderr

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

        kwargs = {}
        if os.name == "posix":
            kwargs["start_new_session"] = True

        with subprocess.Popen(
            [sys.executable, "-u", tmp_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True,
            **kwargs
        ) as proc:
            try:
                stdout, stderr = proc.communicate(input=stdin_text or None, timeout=timeout)
            except subprocess.TimeoutExpired:
                if os.name == "posix":
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                else:
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

        # Prepend pip output if it exists
        final_stdout = pip_stdout + stdout if pip_stdout else stdout
        final_stderr = pip_stderr + stderr if pip_stderr else stderr

        return jsonify({
            "stdout": final_stdout[:_MAX_OUTPUT_BYTES],
            "stderr": final_stderr[:_MAX_OUTPUT_BYTES],
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
# API: Interactive Execution (supports blocking input())
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/run/start", methods=["POST"])
def api_run_start() -> tuple[dict, int]:
    """
    Start an interactive execution session.

    Request body:
    {
      "code": "name = input('Name? ')\\nprint('Hi', name)",
      "timeout": 60,        # optional, seconds of *running* time (input() waits don't count)
      "packages": ["numpy"] # optional
    }

    Response: {"session_id": "..."}
    """
    _purge_old_sessions()

    data: dict[str, Any] = request.get_json(force=True) or {}
    code: str = data.get("code", "").strip()
    if not code:
        return jsonify({"error": "No code provided."}), 400

    try:
        timeout = int(data.get("timeout", _DEFAULT_RUN_TIMEOUT))
        timeout = max(5, min(_MAX_RUN_TIMEOUT, timeout))
    except (TypeError, ValueError):
        timeout = _DEFAULT_RUN_TIMEOUT

    raw_packages = data.get("packages", []) or []
    if isinstance(raw_packages, str):
        raw_packages = [p for p in re.split(r"[,\s]+", raw_packages) if p]

    session_id, error = _start_session(code, timeout, list(raw_packages))
    if error:
        status = 408 if "timed out" in error.get("error", "") else 500
        return jsonify(error), status

    return jsonify({"session_id": session_id}), 200


@app.route("/api/run/poll/<session_id>", methods=["GET"])
def api_run_poll(session_id: str) -> tuple[dict, int]:
    """
    Poll a session for accumulated output and status.

    Response:
    {
      "status": "running" | "waiting_input" | "finished" | "error" | "timeout" | "stopped",
      "stdout": "...",     # full accumulated stdout so far
      "stderr": "...",     # full accumulated stderr so far
      "returncode": null,  # set once finished
      "execution_time": null
    }
    """
    with SESSIONS_LOCK:
        session = SESSIONS.get(session_id)
        if session is None:
            return jsonify({"error": "Unknown session_id."}), 404
        return jsonify({
            "status": session["status"],
            "stdout": session["stdout"],
            "stderr": session["stderr"],
            "returncode": session["returncode"],
            "execution_time": session.get("execution_time"),
        }), 200


@app.route("/api/run/input", methods=["POST"])
def api_run_input() -> tuple[dict, int]:
    """
    Reply to a session's pending input() prompt.

    Request body: {"session_id": "...", "value": "some text"}
    """
    data: dict[str, Any] = request.get_json(force=True) or {}
    session_id = data.get("session_id", "")
    value = data.get("value", "")

    with SESSIONS_LOCK:
        session = SESSIONS.get(session_id)
        if session is None:
            return jsonify({"error": "Unknown session_id."}), 404
        if session["status"] != "waiting_input":
            return jsonify({"error": "Session is not waiting for input."}), 409
        proc = session["proc"]
        session["status"] = "running"
        session["deadline"] = time.time() + _DEFAULT_RUN_TIMEOUT

    try:
        proc.stdin.write(value + "\n")
        proc.stdin.flush()
    except (BrokenPipeError, ValueError, OSError) as exc:
        return jsonify({"error": f"Failed to send input: {exc}"}), 500

    return jsonify({"ok": True}), 200


@app.route("/api/run/stop/<session_id>", methods=["POST"])
def api_run_stop(session_id: str) -> tuple[dict, int]:
    """Kill a running/waiting session."""
    with SESSIONS_LOCK:
        session = SESSIONS.get(session_id)
        if session is None:
            return jsonify({"error": "Unknown session_id."}), 404
        session["status"] = "stopped"
        proc = session["proc"]
    try:
        if os.name == "posix":
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        else:
            proc.kill()
    except OSError:
        pass
    return jsonify({"ok": True}), 200


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
