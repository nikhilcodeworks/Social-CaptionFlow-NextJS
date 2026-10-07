import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
key = os.getenv("GROQ_API_KEY") or os.getenv("groqapikey") or ""
key = key.strip() if key else ""

print(f"Key loaded: {key[:8]}... (length: {len(key)})")

url = "https://api.groq.com/openai/v1/audio/transcriptions"
headers = {"Authorization": f"Bearer {key}"}

test_wav = BASE_DIR / "temp" / "test.wav"
with open(test_wav, "rb") as f:
    files = {"file": ("audio.wav", f, "audio/wav")}
    data = {
        "model": "whisper-large-v3-turbo",
        "response_format": "verbose_json",
        "timestamp_granularities[]": "word",
        "prompt": "Yeh video Hindi, Hinglish aur English me hai. Transcribe spoken words verbatim."
    }
    resp = requests.post(url, headers=headers, files=files, data=data, timeout=60)

print(f"HTTP Status: {resp.status_code}")
if resp.status_code == 200:
    res = resp.json()
    words = res.get("words", [])
    print(f"Total transcribed words: {len(words)}")
    if words:
        print("First 3 words:")
        for w in words[:3]:
            print(f"  {w.get('start')}s -> {w.get('end')}s : {repr(w.get('word'))}")
else:
    print(resp.text)
