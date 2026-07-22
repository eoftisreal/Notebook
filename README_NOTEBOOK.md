# 🐍 Python Notebook v3.0

A beautiful, modern, **fully-functional Python notebook** web application with a Jupyter-like interface. Execute Python code directly in your browser with support for package management, real-time output, and error handling.

![Python Notebook](https://img.shields.io/badge/Python-3.7+-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### Core Functionality
- **🚀 Execute Python Code** — Write and run Python code cells instantly
- **📦 Install Packages On-The-Fly** — Use `!pip install package-name` or pass packages via API
- **⏱️ Execution Timing** — See how long each cell takes to execute
- **🎨 Beautiful UI** — Modern, dark-themed interface inspired by Jupyter
- **📋 Code Cells** — Support for code and markdown cells
- **🔄 Run All** — Execute all code cells with one click
- **💾 Live State** — Notebook state persists during your session

### Code Editor
- **Syntax Highlighting** — Python syntax highlighting with CodeMirror
- **Line Numbers** — Easy code reference
- **Auto-Indentation** — Automatic code formatting
- **Bracket Matching** — Automatic bracket/parenthesis matching
- **Line Wrapping** — Long lines wrap automatically

### Output & Debugging
- **Real-Time Output** — Capture stdout and stderr
- **Error Tracebacks** — Full error messages when code fails
- **Execution Counter** — Track how many times each cell has run
- **Timeout Protection** — Configurable timeout for long-running code (default 30s, max 300s)
- **Maximum Output** — Output capped at 100KB to prevent browser freeze

### Magic Commands
- **`!pip install package`** — Automatically install packages
- **`!pip install package1 package2`** — Install multiple packages
- **`!pip install package==1.0.0`** — Install specific versions

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python notebook_server.py
```

Server starts on `http://localhost:5000` by default.

### 3. Open in Browser

Navigate to **http://localhost:5000** and start coding!

---

## 📝 Configuration

### Environment Variables

```bash
# Custom port
PORT=8080 python notebook_server.py

# Debug mode (auto-reload on file changes)
FLASK_DEBUG=1 python notebook_server.py

# Both
PORT=8080 FLASK_DEBUG=1 python notebook_server.py
```

### Code Execution Limits

Edit `notebook_server.py` to adjust:

```python
_DEFAULT_RUN_TIMEOUT = 30          # Default timeout in seconds
_MAX_RUN_TIMEOUT = 300             # Maximum timeout allowed
_MAX_OUTPUT_BYTES = 100000         # Max output size (bytes)
```

---

## 📚 Usage Guide

### Writing Code

1. Click **+ Code** to add a new code cell
2. Write your Python code in the editor
3. Click **▶ Run** or press `Ctrl+Enter` to execute
4. See output below the cell

### Installing Packages

**Option 1: Magic Command** (inside code cell)
```python
!pip install requests numpy pandas
print("Packages installed!")
```

**Option 2: API Parameter** (advanced)
```json
{
  "code": "import requests\nprint(requests.__version__)",
  "packages": ["requests==2.31.0"]
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run current cell |
| `Ctrl+Shift+Enter` | Run all cells |

### Example Code

```python
# Basic Python
import math
print(f"π = {math.pi}")

# Data processing
import json
data = {"name": "Python", "version": 3.11}
print(json.dumps(data, indent=2))

# Web requests
import requests
response = requests.get("https://api.github.com")
print(f"Status: {response.status_code}")

# NumPy & Pandas
!pip install numpy pandas
import numpy as np
import pandas as pd

arr = np.array([1, 2, 3, 4, 5])
print(f"Mean: {np.mean(arr)}")
```

---

## 🔗 API Reference

### `/api/health` (GET)

Check server status.

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "ok",
  "version": "3.0"
}
```

### `/api/run` (POST)

Execute Python code.

**Request:**
```bash
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "timeout": 30,
    "packages": ["requests"]
  }'
```

**Response:**
```json
{
  "stdout": "Hello, World!\n",
  "stderr": "",
  "returncode": 0,
  "execution_time": 0.123
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | — | **Required.** Python code to execute |
| `timeout` | integer | 30 | Execution timeout in seconds (5–300) |
| `stdin` | string | "" | Input for `input()` calls |
| `packages` | array | [] | Packages to install before running |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Success (check `returncode` for exit status) |
| 400 | Bad request (missing code, invalid packages) |
| 408 | Timeout or package installation timeout |
| 500 | Server error during execution |

---

## 🛠️ Advanced Usage

### Handling stdin

```bash
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "name = input(\"Enter your name: \")\nprint(f\"Hello, {name}!\")",
    "stdin": "Alice\n"
  }'
```

### Long-Running Code

```bash
# Increase timeout to 120 seconds
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import time\ntime.sleep(10)\nprint(\"Done!\")",
    "timeout": 120
  }'
```

### Batch Operations

```bash
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "for i in range(1, 6):\n  print(f\"Item {i}\")",
    "timeout": 30
  }'
```

---

## 📂 Project Structure

```
.
├── notebook_server.py       # Main Flask server (Python backend)
├── notebook.html            # Frontend (HTML/CSS/JavaScript)
├── requirements.txt         # Python dependencies
├── README_NOTEBOOK.md       # This file
└── README.md               # Original portfolio README
```

---

## 🐛 Troubleshooting

### "Server unavailable" error

1. Ensure server is running: `python notebook_server.py`
2. Check port isn't in use: `lsof -i :5000`
3. Try different port: `PORT=8080 python notebook_server.py`

### Package installation fails

- Check package name spelling
- Verify package exists on PyPI: `pip search package-name`
- Some packages require system dependencies (e.g., `psycopg2`)
- Try specific version: `!pip install package==1.0.0`

### Code execution timeout

- Increase timeout in code: `POST` with `"timeout": 120`
- Break code into smaller cells
- Optimize code performance
- Max timeout is 300 seconds

### Output truncated

- Large outputs are capped at 100KB
- Redirect to file: `with open('output.txt', 'w') as f: ...`
- Process data in chunks
- Edit `_MAX_OUTPUT_BYTES` in `notebook_server.py` (use caution)

### Memory usage high

- Notebook reuses Python processes
- Each code cell runs in same process (not isolated)
- Clear variables: `del variable_name`
- Restart browser to clear session

---

## 💻 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🔒 Security

⚠️ **Warning:** This notebook executes arbitrary Python code. Use only in **trusted environments** (local machine, private network, authentication-protected servers).

**Never expose to the internet without authentication.**

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 2.3.3+ | Web framework |
| Flask-CORS | 4.0.0+ | Cross-origin requests |
| CodeMirror | 5.65.2 | Code editor (CDN) |

---

## 📈 Performance

- **Code Execution:** <100ms for simple code
- **Package Install:** 5-30s depending on package size
- **Output Rendering:** Real-time streaming
- **Memory:** ~100MB base, scales with packages installed

---

## 🚀 Deployment

### Local Development
```bash
python notebook_server.py
```

### Production (with Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 notebook_server:app
```

### Docker
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "notebook_server.py"]
```

```bash
docker build -t python-notebook .
docker run -p 5000:5000 python-notebook
```

### Environment Variables for Production
```bash
FLASK_DEBUG=0
PORT=5000
# Optional: if behind reverse proxy
FLASK_ENV=production
```

---

## 📝 License

This project is open source. Feel free to fork, modify, and distribute.

---

## 🙏 Acknowledgments

- **CodeMirror** — JavaScript code editor
- **Flask** — Python web framework
- **Jupyter** — Inspiration for notebook interface

---

## 📬 Support

For issues or feature requests:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review API documentation above
3. Check browser console for JavaScript errors (F12)

---

**Made with ❤️ for Python developers**