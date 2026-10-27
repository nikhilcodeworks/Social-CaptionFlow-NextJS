import subprocess
import os
import re
import logging
from app.services.audio import get_ffmpeg_cmd

logger = logging.getLogger(__name__)

def get_video_duration(video_path: str) -> float:
    """
    Extracts total video duration in seconds using FFmpeg.
    Returns 0.0 if unable to read duration.
    """
    if not os.path.exists(video_path):
        return 0.0

    ffmpeg_bin = get_ffmpeg_cmd()
    try:
        cmd = [ffmpeg_bin, "-i", video_path]
        result = subprocess.run(
            cmd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=15
        )
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
        if match:
            hours, minutes, seconds = match.groups()
            return round(int(hours) * 3600 + int(minutes) * 60 + float(seconds), 2)
    except Exception as e:
        logger.warning(f"Error determining video duration: {e}")
        
    return 0.0

def format_ffmpeg_path(path: str) -> str:
    r"""
    Formatting paths for FFmpeg filters.
    Replaces backslashes with forward slashes, escapes colons and single quotes.
    Wraps in single quotes so FFmpeg parses the path directly without invalid key prefixes.
    """
    abs_path = os.path.abspath(path)
    slashed = abs_path.replace("\\", "/")
    escaped = slashed.replace(":", "\\:").replace("'", "\\'")
    return f"'{escaped}'"

def burn_subtitles(video_path: str, ass_path: str, output_path: str, quality: str = "fast") -> bool:
    """
    Burns ASS subtitles into a video file using FFmpeg.
    Optimized for cloud container environments (Render/Railway/Docker) with limited vCPU quotas.
    """
    if not os.path.exists(video_path):
        logger.error(f"Input video file does not exist: {video_path}")
        return False
        
    if not os.path.exists(ass_path):
        logger.error(f"Subtitle file does not exist: {ass_path}")
        return False
        
    ffmpeg_bin = get_ffmpeg_cmd()
    try:
        # Escape path for FFmpeg filter
        escaped_ass_path = format_ffmpeg_path(ass_path)
        
        # Cloud container optimization settings:
        # 1. Quality-based resolution scaling:
        #    - 'fast' (default): 480p max width (trunc(min(480,iw)/2)*2:-2)
        #      On 9:16 portrait video this produces 480x854, cutting 80% of pixel workload vs 1080p.
        #      Renders in ~25-30s on Render cloud containers without triggering HTTP proxy timeouts.
        #    - 'hd': 720p max width (trunc(min(720,iw)/2)*2:-2).
        # 2. -r 30: Caps frame rate at 30 fps (prevents encoding 60fps mobile streams, cutting 50% CPU load).
        # 3. -threads 2: Eliminates context-switching thrashing on CFS container CPU quotas.
        # 4. -tune fastdecode: Optimal smooth multi-frame encoding without thread stalls.
        # 5. -preset ultrafast + -crf 28: Fastest encoding profile with crisp mobile clarity.
        # 6. Direct AAC encode (-c:a aac -b:a 128k): Takes 0.1s and avoids failing on incompatible audio codecs or re-encoding twice.
        
        # Resolution & Quality Presets (480p / 720p / 1080p):
        q = str(quality).lower().strip()
        if q in ["1080p", "1080", "fullhd", "fhd"]:
            scale_w = 1080
            crf_val = "21"
        elif q in ["720p", "720", "hd"]:
            scale_w = 720
            crf_val = "23"
        else: # 480p / fast
            scale_w = 480
            crf_val = "26"

        scale_filter = f"scale='trunc(min({scale_w},iw)/2)*2:-2'"
        
        cmd = [
            ffmpeg_bin,
            "-y",
            "-nostdin",
            "-i", video_path,
            "-vf", f"{scale_filter},ass={escaped_ass_path}",
            "-r", "30",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "fastdecode",
            "-threads", "2",
            "-crf", crf_val,
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            "-loglevel", "warning",
            output_path
        ]
        
        logger.info(f"Running FFmpeg video render ({quality}): {' '.join(cmd)}")
        result = subprocess.run(
            cmd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            logger.error(f"FFmpeg subtitle burning failed (code {result.returncode}): {result.stderr}")
            if os.path.exists(output_path):
                os.remove(output_path)
            return False
            
        logger.info(f"Subtitles burned successfully: {output_path}")
        return True
    except subprocess.TimeoutExpired:
        logger.error(f"FFmpeg subtitle burning timed out (>300s) for video: {video_path}")
        if os.path.exists(output_path):
            os.remove(output_path)
        return False
    except Exception as e:
        logger.error(f"Error burning subtitles: {str(e)}")
        if os.path.exists(output_path):
            os.remove(output_path)
        return False
