# 📦 Installation & Setup Guide

Complete guide to get **Python Notebook v3.0** up and running on any system.

---

## 🖥️ System Requirements

- **Python:** 3.7 or higher
- **RAM:** 512MB minimum (1GB+ recommended)
- **Disk Space:** 200MB (for dependencies)
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **OS:** Windows, macOS, Linux

---

## ⚡ Quick Start (5 minutes)

### Option 1: Linux/macOS (Recommended)

```bash
# 1. Clone or download the notebook
git clone https://github.com/yourusername/python-notebook.git
cd python-notebook

# 2. Run the startup script
chmod +x start.sh
./start.sh

# 3. Open in browser
# http://localhost:5000
```

### Option 2: Windows

```cmd
# 1. Navigate to directory
cd python-notebook

# 2. Run the startup script
start.bat

# 3. Open in browser
# http://localhost:5000
```

### Option 3: Manual Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python notebook_server.py

# 3. Open http://localhost:5000 in your browser
```

---

## 📥 Installation Methods

### Method 1: From GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/python-notebook.git
cd python-notebook

# Install dependencies
pip install -r requirements.txt

# Run the server
python notebook_server.py
```

### Method 2: From ZIP Download

```bash
# Download ZIP and extract
unzip python-notebook-main.zip
cd python-notebook-main

# Install dependencies
pip install -r requirements.txt

# Run the server
python notebook_server.py
```

### Method 3: Using Virtual Environment (Best Practice)

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python notebook_server.py

# Deactivate when done
deactivate
```

### Method 4: Docker (Easiest for Linux/Mac)

```bash
# Build Docker image
docker build -t python-notebook .

# Run container
docker run -p 5000:5000 python-notebook

# Or use docker-compose
docker-compose up

# Access at http://localhost:5000
```

---

## 🔧 Advanced Setup

### Custom Port

```bash
# Linux/macOS
PORT=8080 python notebook_server.py

# Windows (Command Prompt)
set PORT=8080
python notebook_server.py

# Windows (PowerShell)
$env:PORT=8080
python notebook_server.py
```

### Debug Mode

```bash
# Enable auto-reload and verbose logging
FLASK_DEBUG=1 python notebook_server.py
```

### Production Deployment

```bash
# Install Gunicorn (production server)
pip install gunicorn

# Run with 4 worker processes
gunicorn -w 4 -b 0.0.0.0:5000 notebook_server:app

# With custom settings
gunicorn -w 8 -b 0.0.0.0:5000 --timeout 120 notebook_server:app
```

### Behind Reverse Proxy (Nginx/Apache)

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name notebook.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📋 Dependency Installation

### Automatic (Recommended)

```bash
pip install -r requirements.txt
```

### Manual Installation

```bash
# Core dependencies
pip install Flask==2.3.3
pip install Flask-CORS==4.0.0
pip install Werkzeug==2.3.7

# Optional: for Selenium automation
pip install selenium==4.15.2
pip install webdriver-manager==4.0.1

# Optional: for production
pip install gunicorn==21.2.0
```

### Verify Installation

```bash
python -c "import flask; print(f'Flask {flask.__version__}')"
python -c "import flask_cors; print('Flask-CORS OK')"
```

---

## 🐛 Troubleshooting Installation

### Issue: Python not found

**Solution:**
```bash
# Verify Python installation
python3 --version

# If using Python 3, use python3 instead of python:
python3 notebook_server.py
```

### Issue: pip command not found

**Solution:**
```bash
# Try using pip3
pip3 install -r requirements.txt

# Or using Python module
python3 -m pip install -r requirements.txt
```

### Issue: Permission denied (Linux/macOS)

**Solution:**
```bash
# Make script executable
chmod +x start.sh

# Or run with python directly
python3 notebook_server.py
```

### Issue: Port already in use

**Solution:**
```bash
# Use a different port
PORT=8080 python notebook_server.py

# Or find and kill process using port 5000
# On Linux/macOS:
lsof -i :5000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: SSL certificate error

**Solution:**
```bash
# Update pip and certificates
python -m pip install --upgrade pip
pip install --upgrade certifi

# Try again
pip install -r requirements.txt
```

### Issue: Module not found

**Solution:**
```bash
# Make sure you installed dependencies
pip install -r requirements.txt

# Verify with
python -c "import flask; import flask_cors"
```

---

## ✅ Verification

After installation, verify everything works:

```bash
# 1. Check server is running
curl http://localhost:5000/api/health

# Expected response:
# {"status": "ok", "version": "3.0"}

# 2. Open in browser
# http://localhost:5000

# 3. Try executing code
# Click "+ Code" button and run: print("Hello, World!")
```

---

## 🐳 Docker Installation

### Prerequisites
- Docker installed (download from https://www.docker.com/)

### Quick Start

```bash
# Build image
docker build -t python-notebook .

# Run container
docker run -p 5000:5000 python-notebook

# Or with docker-compose
docker-compose up

# Access at http://localhost:5000
```

### Advanced Docker Usage

```bash
# Run with custom port
docker run -p 8080:5000 python-notebook

# Run in background
docker run -d -p 5000:5000 --name notebook python-notebook

# View logs
docker logs notebook

# Stop container
docker stop notebook

# Remove container
docker rm notebook
```

---

## 🚀 Next Steps

1. **Run the notebook:** `python notebook_server.py`
2. **Open in browser:** http://localhost:5000
3. **Write code:** Click "+ Code" and start coding
4. **Execute:** Click "▶ Run" or press Ctrl+Enter
5. **Read docs:** Check [README_NOTEBOOK.md](README_NOTEBOOK.md) for detailed usage

---

## 📚 Additional Resources

- **Flask Documentation:** https://flask.palletsprojects.com/
- **CodeMirror Documentation:** https://codemirror.net/
- **Python Documentation:** https://docs.python.org/3/
- **Jupyter Notebook:** https://jupyter.org/

---

## 🆘 Getting Help

1. **Check [README_NOTEBOOK.md](README_NOTEBOOK.md)** for usage guide
2. **Check [Troubleshooting section](README_NOTEBOOK.md#-troubleshooting)** for common issues
3. **Check browser console** for JavaScript errors (F12)
4. **Check server logs** for Python errors
5. **Try debug mode:** `FLASK_DEBUG=1 python notebook_server.py`

---

## 📝 License

This project is open source and free to use.

---

**Happy coding! 🐍**