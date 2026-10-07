import os
from pathlib import Path
from dotenv import load_dotenv

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from backend directory if present
load_dotenv(BASE_DIR / ".env")

TEMP_DIR = BASE_DIR / "temp"
UPLOAD_DIR = TEMP_DIR / "uploads"
OUTPUT_DIR = TEMP_DIR / "outputs"
BIN_DIR = BASE_DIR / "bin"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
BIN_DIR.mkdir(parents=True, exist_ok=True)

# Add local bin directory to system PATH (for local/cloud static FFmpeg binary)
if str(BIN_DIR) not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{BIN_DIR}{os.pathsep}{os.environ.get('PATH', '')}"

# Whisper Configurations (tiny uses ~150-200MB RAM, safe for free cloud tiers; base uses ~500MB)
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "tiny")

# Server configurations (Render sets dynamic PORT and requires 0.0.0.0)
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# CORS Origins (comma-separated list, e.g. "https://frontend-nu-three-62.vercel.app,http://localhost:3000")
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [orig.strip() for orig in CORS_ORIGINS_RAW.split(",") if orig.strip()]
if not CORS_ORIGINS:
    CORS_ORIGINS = ["*"]

# Gemini API Configuration (Default fallback if not passed by user in request)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Groq API Configuration (Fast cloud Whisper Large - reduces local system load to zero)
GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or os.getenv("groqapikey") or "").strip()
GROQ_WHISPER_MODEL = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")


