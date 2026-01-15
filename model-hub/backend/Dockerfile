# Backend Dockerfile for AI Model Bazaar
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install system dependencies including OpenCV requirements
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    curl \
    unzip \
    git \
    ca-certificates \
    openssl \
    # OpenCV dependencies (headless-compatible)
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgstreamer1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    # Video/image processing support
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    # Python virtual environment support for demos
    python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create demo environments directory
RUN mkdir -p /tmp/model-hub-demos

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
