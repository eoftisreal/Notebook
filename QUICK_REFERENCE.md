# ⚡ Python Notebook - Quick Reference

## 🚀 Get Started (30 seconds)

### Linux/macOS
```bash
chmod +x start.sh && ./start.sh
```

### Windows
```cmd
start.bat
```

### Docker
```bash
docker-compose up
```

Then open: **http://localhost:5000**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run current cell |
| `Ctrl+Shift+Enter` | Run all cells |
| `Ctrl+L` | Clear cell output |

---

## 🎯 Common Tasks

### Print Output
```python
print("Hello, World!")
```

### Install Package
```python
!pip install requests
```

### Import and Use
```python
import numpy as np
print(np.array([1, 2, 3]))
```

### Read File
```python
with open('file.txt', 'r') as f:
    content = f.read()
print(content)
```

### Make Web Request
```python
!pip install requests
import requests
r = requests.get('https://api.github.com')
print(r.status_code)
```

### Process Data
```python
!pip install pandas
import pandas as pd
df = pd.read_csv('data.csv')
print(df.head())
```

---

## 🔑 Magic Commands

| Command | Example |
|---------|---------|
| Install package | `!pip install numpy` |
| Install multiple | `!pip install numpy pandas` |
| Specific version | `!pip install numpy==1.21.0` |

---

## 📊 API Endpoints

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Execute Code
```bash
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"hello\")",
    "timeout": 30
  }'
```

---

## 🐛 Troubleshooting

### Port In Use?
```bash
PORT=8080 python notebook_server.py
```

### Python Not Found?
```bash
python3 notebook_server.py
```

### Module Not Found?
```bash
pip install -r requirements.txt
```

### Permission Denied (Linux/Mac)?
```bash
chmod +x start.sh
./start.sh
```

---

## 📚 File Structure

```
notebook/
├── notebook.html          ← Frontend (open in browser)
├── notebook_server.py     ← Backend (python runner)
├── requirements.txt       ← Dependencies
├── start.sh              ← Startup (Linux/Mac)
├── start.bat             ← Startup (Windows)
├── Dockerfile            ← Docker config
└── docker-compose.yml    ← Docker Compose
```

---

## 🔧 Configuration

### Custom Port
```bash
PORT=8080 python notebook_server.py
```

### Debug Mode
```bash
FLASK_DEBUG=1 python notebook_server.py
```

### Timeout Setting
In API call:
```json
{"code": "...", "timeout": 120}
```

---

## 💻 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📖 Full Documentation

- **README_NOTEBOOK.md** — Complete feature guide
- **INSTALLATION.md** — Detailed setup instructions
- **EXAMPLES.md** — 50+ code examples
- **IMPROVEMENTS_SUMMARY.md** — What's new

---

## 🎓 Example Code

### Hello World
```python
print("Hello from Python Notebook! 🐍")
```

### Data Analysis
```python
!pip install pandas
import pandas as pd
df = pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]})
print(df.sum())
```

### Math
```python
import math
radius = 5
area = math.pi * radius ** 2
print(f"Circle area: {area:.2f}")
```

---

## ⚠️ Important Notes

- **Local only:** Don't expose to internet without authentication
- **Process isolation:** Each run shares same Python process
- **Resource cleanup:** Automatic temp file cleanup
- **Output size:** Max 100KB per execution
- **Timeout:** Default 30s, max 1800s

---

## 📝 Environment Variables

```bash
PORT=5000              # Server port
FLASK_DEBUG=0          # Debug mode
```

Example:
```bash
PORT=8080 FLASK_DEBUG=1 python notebook_server.py
```

---

## 🔗 Useful Links

- Python Docs: https://docs.python.org/3/
- Pandas: https://pandas.pydata.org/
- NumPy: https://numpy.org/
- Requests: https://requests.readthedocs.io/

---

## 💡 Pro Tips

1. **Multiple packages:** `!pip install pkg1 pkg2 pkg3`
2. **Quiet output:** Add `-q` flag → `!pip install -q requests`
3. **Check versions:** `import package; print(package.__version__)`
4. **Measure time:** Use `import time` and track execution
5. **Debug prints:** Use `print(f"var={var}")` for debugging
6. **Read docs:** Use `help(object)` in code
7. **Run all:** Click "▶ Run All" button for batch execution

---

## 🆘 Quick Help

| Issue | Solution |
|-------|----------|
| Server won't start | Check port in use, use `PORT=8080` |
| Module not found | Run `pip install -r requirements.txt` |
| Slow execution | Check timeout, increase with `"timeout": 60` |
| Output truncated | Output capped at 100KB for safety |
| Browser error | Check browser console (F12), check server logs |

---

## 📧 Getting Help

1. Check **INSTALLATION.md** for setup issues
2. Check **README_NOTEBOOK.md** for feature questions
3. Check **EXAMPLES.md** for code samples
4. Check browser console (F12) for errors
5. Check server output for Python errors

---

**Ready to code? Start with ./start.sh or start.bat! 🚀**