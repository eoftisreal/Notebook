FROM python:3.11-slim

LABEL maintainer="Python Notebook Team"
LABEL description="Python Notebook - Execute Python Code in Browser"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
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