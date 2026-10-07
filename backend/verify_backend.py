import os
import sys
import subprocess
from pathlib import Path

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("=== STARTING GLOBAL BACKEND COMPONENT VERIFICATION ===")

# 1. Test imports
try:
    from app.config import UPLOAD_DIR, OUTPUT_DIR, WHISPER_MODEL
    from app.templates import SubtitleStyle, TEMPLATES
    from app.services.audio import extract_audio
    from app.services.transcribe import transcribe_audio
    from app.services.subtitle import generate_ass_file
    from app.services.video import burn_subtitles
    print("[OK] All backend service modules and templates imported successfully.")
except Exception as e:
    print(f"[FAIL] Import failed: {str(e)}")
    sys.exit(1)

# 2. Verify directories
print(f"Upload directory exists: {UPLOAD_DIR.exists()} ({UPLOAD_DIR})")
print(f"Output directory exists: {OUTPUT_DIR.exists()} ({OUTPUT_DIR})")
if UPLOAD_DIR.exists() and OUTPUT_DIR.exists():
    print("[OK] Local file storage folders verified.")
else:
    print("[FAIL] Failed directory setup.")
    sys.exit(1)

# 3. Verify FFmpeg availability
try:
    res = subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0:
        first_line = res.stdout.split('\n')[0]
        print(f"[OK] FFmpeg is available on path: {first_line}")
    else:
        print("[FAIL] FFmpeg executed but returned non-zero code.")
        sys.exit(1)
except Exception as e:
    print(f"[FAIL] FFmpeg check failed: {str(e)}")
    sys.exit(1)

# 4. Verify Whisper library is accessible
try:
    import whisper
    print("[OK] OpenAI Whisper library is successfully installed and importable.")
except Exception as e:
    print(f"[FAIL] OpenAI Whisper import failed: {str(e)}")
    sys.exit(1)

# 5. Mock subtitle ASS file generation
try:
    mock_words = [
        {"word": "Welcome", "start": 0.5, "end": 1.2},
        {"word": "to", "start": 1.2, "end": 1.5},
        {"word": "Captions", "start": 1.5, "end": 2.2},
        {"word": "AI", "start": 2.2, "end": 2.6},
        {"word": "Studio!", "start": 2.6, "end": 3.5}
    ]
    test_ass_path = os.path.join(OUTPUT_DIR, "test_verification.ass")
    # Generate subtitles using AI Highlight template
    ok = generate_ass_file(mock_words, TEMPLATES["highlight"], test_ass_path)
    if ok and os.path.exists(test_ass_path):
        print(f"[OK] ASS subtitle compiler test passed. Generated file at: {test_ass_path}")
        # Cleanup
        os.remove(test_ass_path)
    else:
        print("[FAIL] Failed subtitle file generation.")
        sys.exit(1)
except Exception as e:
    print(f"[FAIL] Subtitle compiler crashed: {str(e)}")
    sys.exit(1)

print("\n=== ALL BACKEND SANITY TESTS COMPLETED SUCCESSFULLY ===")
sys.exit(0)
