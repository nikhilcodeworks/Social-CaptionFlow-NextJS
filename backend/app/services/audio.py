import subprocess
import os
import shutil
import logging
from app.config import BIN_DIR

logger = logging.getLogger(__name__)

def get_ffmpeg_cmd() -> str:
    """
    Locates ffmpeg executable from system PATH, local backend/bin directory, or imageio_ffmpeg.
    """
    system_path = shutil.which("ffmpeg")
    if system_path:
        return system_path
        
    binary_name = "ffmpeg.exe" if os.name == "nt" else "ffmpeg"
    local_bin = BIN_DIR / binary_name
    if local_bin.exists():
        return str(local_bin)

    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
        
    return "ffmpeg"

def extract_audio(video_path: str, audio_path: str) -> bool:
    """
    Extracts audio from a video file and saves it as a 16kHz mono WAV file.
    """
    if not os.path.exists(video_path):
        logger.error(f"Input video file does not exist: {video_path}")
        return False
        
    ffmpeg_bin = get_ffmpeg_cmd()
    try:
        # ffmpeg -y -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            audio_path
        ]
        
        logger.info(f"Running FFmpeg audio extraction: {' '.join(cmd)}")
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg audio extraction failed: {result.stderr}")
            return False
            
        logger.info(f"Audio extracted successfully: {audio_path}")
        return True
    except Exception as e:
        logger.error(f"Error during audio extraction: {str(e)}")
        return False
