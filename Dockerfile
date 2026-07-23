FROM python:3.11-slim

LABEL maintainer="Python Notebook Team"
LABEL description="Python Notebook - Execute Python Code in Browser"

WORKDIR /app

# Install system dependencies
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    unzip \
    libnss3 libgconf-2-4 libxi6 libxcursor1 \
    libxdamage1 libxrandr2 libxcomposite1 libasound2t64 libatk1.0-0 \
    libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libpango-1.0-0 \
    libpangocairo-1.0-0 libgtk-3-0 fonts-liberation \
    && wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y /tmp/chrome.deb \
    && rm /tmp/chrome.deb \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY notebook_server.py .
COPY notebook.html .

# Create non-root user
RUN useradd -m -u 1000 notebook && chown -R notebook:notebook /app
USER notebook

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run application
CMD ["python", "notebook_server.py"]