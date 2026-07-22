@echo off
REM 🐍 Python Notebook Startup Script for Windows
REM ===============================================

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════╗
echo ║  🐍 Python Notebook Startup       ║
echo ║  v3.0                             ║
echo ╚════════════════════════════════════╝
echo.

REM Configuration
set PORT=5000
set HOST=0.0.0.0
set DEBUG=0

echo Configuration:
echo   Port: %PORT%
echo   Host: %HOST%
echo   Debug: %DEBUG%
echo.

REM Check Python
echo Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found!
    echo Please install Python 3.7+ and add it to PATH
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION%
echo.

REM Check pip
echo Checking pip...
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip not found!
    pause
    exit /b 1
)
echo ✓ pip found
echo.

REM Install dependencies
echo Checking dependencies...
if not exist "requirements.txt" (
    echo ❌ requirements.txt not found!
    pause
    exit /b 1
)

echo Installing required packages...
python -m pip install -q -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Check for notebook server
echo Checking notebook server...
if not exist "notebook_server.py" (
    echo ❌ notebook_server.py not found!
    pause
    exit /b 1
)
echo ✓ notebook_server.py found
echo.

REM Check for notebook.html
echo Checking notebook frontend...
if not exist "notebook.html" (
    echo ❌ notebook.html not found!
    pause
    exit /b 1
)
echo ✓ notebook.html found
echo.

REM Start server
echo 🚀 Starting Python Notebook Server...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✓ Server is ready!
echo.
echo Access the notebook at:
echo   👉 http://localhost:%PORT%
echo.
echo API Health Check:
echo   curl http://localhost:%PORT%/api/health
echo.
echo Press Ctrl+C to stop the server
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

setlocal
set FLASK_DEBUG=%DEBUG%
set PORT=%PORT%

python notebook_server.py

pause