#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install --upgrade pip
# Install lightweight CPU-only PyTorch first to save disk space and accelerate cloud build
pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Download static Linux FFmpeg binary if ffmpeg is not already installed on the system
if ! command -v ffmpeg &> /dev/null; then
  echo "FFmpeg not detected in system PATH. Downloading static Linux FFmpeg..."
  mkdir -p bin
  if [ ! -f "bin/ffmpeg" ]; then
    curl -L https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-linux-x64 -o bin/ffmpeg
    chmod +x bin/ffmpeg
  fi
  echo "FFmpeg installed successfully in $(pwd)/bin/ffmpeg"
fi

# Pre-build fontconfig cache so FFmpeg libass starts immediately without runtime delays
if command -v fc-cache &> /dev/null; then
  echo "Warming fontconfig cache..."
  fc-cache -fv || true
fi
