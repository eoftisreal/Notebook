#!/bin/bash

# 🐍 Python Notebook Startup Script
# ==================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════╗"
echo "║  🐍 Python Notebook Startup       ║"
echo "║  v3.0                             ║"
echo "╚════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
PORT=${PORT:-5000}
HOST=${HOST:-0.0.0.0}
DEBUG=${DEBUG:-0}

echo -e "${YELLOW}Configuration:${NC}"
echo "  Port: $PORT"
echo "  Host: $HOST"
echo "  Debug: $DEBUG"
echo ""

# Check Python
echo -e "${YELLOW}Checking Python version...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found!${NC}"
    echo "Please install Python 3.7+ and try again."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✓ Python $PYTHON_VERSION${NC}"
echo ""

# Check pip
echo -e "${YELLOW}Checking pip...${NC}"
if ! python3 -m pip --version &> /dev/null; then
    echo -e "${RED}❌ pip not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip found${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ requirements.txt not found!${NC}"
    exit 1
fi

echo "Installing required packages..."
python3 -m pip install -q -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check for notebook server
echo -e "${YELLOW}Checking notebook server...${NC}"
if [ ! -f "notebook_server.py" ]; then
    echo -e "${RED}❌ notebook_server.py not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ notebook_server.py found${NC}"
echo ""

# Check for notebook.html
echo -e "${YELLOW}Checking notebook frontend...${NC}"
if [ ! -f "notebook.html" ]; then
    echo -e "${RED}❌ notebook.html not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ notebook.html found${NC}"
echo ""

# Start server
echo -e "${GREEN}🚀 Starting Python Notebook Server...${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓ Server is ready!${NC}"
echo ""
echo -e "${YELLOW}Access the notebook at:${NC}"
echo -e "${BLUE}  👉 http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}API Health Check:${NC}"
echo -e "${BLUE}  curl http://localhost:$PORT/api/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Export environment and run
export FLASK_DEBUG=$DEBUG
export PORT=$PORT

python3 notebook_server.py