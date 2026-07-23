import subprocess
import os

kwargs = {}
if os.name == "posix":
    kwargs["start_new_session"] = True

proc = subprocess.Popen(["python3", "-c", "import time; time.sleep(10)"], **kwargs)
if os.name == "posix":
    import signal
    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
