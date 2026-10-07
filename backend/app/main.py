import os
import gc
import uuid
import time
import asyncio
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.config import UPLOAD_DIR, OUTPUT_DIR, WHISPER_MODEL, GEMINI_API_KEY, CORS_ORIGINS
from app.services.audio import extract_audio
from app.services.transcribe import transcribe_audio
from app.services.subtitle import generate_ass_file
from app.services.video import burn_subtitles
from app.services.translate import (
    translate_words_with_gemini, 
    verify_gemini_api_key,
    translate_words_with_groq,
    verify_groq_api_key
)
from app.templates import SubtitleStyle

from fastapi.requests import Request

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Caption Generator API")

# Enable CORS for Next.js frontend (configurable via CORS_ORIGINS env var)
# allow_credentials=False ensures wildcard "*" or specific origins work without browser CORS rejection
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if "*" not in CORS_ORIGINS else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AI Caption Generator API",
        "endpoints": ["/api/transcribe", "/api/export", "/api/translate", "/api/verify-key", "/api/verify-groq-key", "/health"]
    }

class WordTiming(BaseModel):
    word: str
    start: float
    end: float

class ExportRequest(BaseModel):
    id: str
    words: List[WordTiming]
    style: SubtitleStyle
    maxWords: int = 3
    quality: Optional[str] = "fast"

class TranslateRequest(BaseModel):
    words: List[WordTiming]
    targetLanguage: Optional[str] = None
    target_language: Optional[str] = None
    geminiApiKey: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groqApiKey: Optional[str] = None
    groq_api_key: Optional[str] = None
    provider: Optional[str] = None

    @property
    def resolved_target_language(self) -> str:
        return self.targetLanguage or self.target_language or "hinglish"

    @property
    def resolved_gemini_api_key(self) -> Optional[str]:
        return self.geminiApiKey or self.gemini_api_key

    @property
    def resolved_groq_api_key(self) -> Optional[str]:
        return self.groqApiKey or self.groq_api_key

class VerifyKeyRequest(BaseModel):
    geminiApiKey: Optional[str] = None
    key: Optional[str] = None

    @property
    def resolved_key(self) -> str:
        return self.geminiApiKey or self.key or ""

class VerifyGroqKeyRequest(BaseModel):
    groqApiKey: Optional[str] = None
    key: Optional[str] = None

    @property
    def resolved_key(self) -> str:
        return self.groqApiKey or self.key or ""

# Active jobs tracking (simple in-memory status)
jobs = {}

# Concurrency control: Strictly serialize parallel FFmpeg exports (Semaphore 1) to prevent cloud memory & CPU exhaustion
export_semaphore = asyncio.Semaphore(1)

def cleanup_job_files(job_id: str):
    """
    Deletes all temporary upload, subtitle, and output files associated with a specific job_id.
    Prevents storage buildup when a user re-uploads or clicks 'Upload New Video'.
    """
    if not job_id or not str(job_id).strip():
        return
    clean_id = str(job_id).strip()
    if ".." in clean_id or "/" in clean_id or "\\" in clean_id:
        return

    for directory in [UPLOAD_DIR, OUTPUT_DIR]:
        try:
            for file_path in directory.glob(f"{clean_id}*"):
                if file_path.is_file():
                    try:
                        file_path.unlink()
                        logger.info(f"Cleaned up session file: {file_path.name}")
                    except Exception as e:
                        logger.warning(f"Failed to delete {file_path.name}: {e}")
        except Exception as e:
            logger.warning(f"Error in cleanup_job_files for {clean_id}: {e}")

def cleanup_old_files(max_age_seconds: int = 1200):
    """
    Deletes temporary upload, subtitle, and output files older than 20 minutes (1200s).
    Protects cloud storage from filling up if users abandon the page without downloading,
    while giving users plenty of time to edit and re-edit subtitles.
    """
    now = time.time()
    for directory in [UPLOAD_DIR, OUTPUT_DIR]:
        try:
            for file_path in directory.glob("*"):
                if file_path.is_file():
                    try:
                        file_age = now - file_path.stat().st_mtime
                        if file_age > max_age_seconds:
                            file_path.unlink()
                            logger.info(f"Auto-cleaned expired file (>20m old): {file_path.name}")
                    except Exception as e:
                        logger.warning(f"Failed to delete {file_path.name}: {e}")
        except Exception as e:
            logger.warning(f"Error reading directory {directory} for cleanup: {e}")

@app.delete("/api/cleanup/{job_id}")
@app.post("/api/cleanup/{job_id}")
def cleanup_job_endpoint(job_id: str, background_tasks: BackgroundTasks):
    """
    Endpoint called when user clicks 'Upload New Video' or switches projects.
    Immediately cleans up previous video and artifacts in the background.
    """
    background_tasks.add_task(cleanup_job_files, job_id)
    return {"status": "ok", "message": f"Cleanup queued for {job_id}"}

@app.post("/api/transcribe")
async def transcribe_video(
    file: UploadFile = File(...),
    geminiApiKey: Optional[str] = Form(None),
    groqApiKey: Optional[str] = Form(None),
    engine: Optional[str] = Form(None),
    previousJobId: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Endpoint to upload a video, extract its audio, and transcribe it verbatim in its spoken language.
    """
    # Trigger background cleanup of expired abandoned files (>20 mins)
    background_tasks.add_task(cleanup_old_files)
    
    # If the user is re-uploading, immediately delete the previous video & session artifacts
    if previousJobId:
        background_tasks.add_task(cleanup_job_files, previousJobId)

    # Verify file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["mp4", "mov", "avi", "mkv"]:
        raise HTTPException(status_code=400, detail="Invalid video format. Supported: mp4, mov, avi, mkv")
        
    job_id = str(uuid.uuid4())
    video_filename = f"{job_id}.{ext}"
    video_path = os.path.join(UPLOAD_DIR, video_filename)
    audio_path = os.path.join(UPLOAD_DIR, f"{job_id}.wav")
    
    try:
        # Save video locally in chunks to conserve RAM on cloud instances
        logger.info(f"Saving uploaded video to: {video_path}")
        with open(video_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)
            
        # Extract audio
        logger.info(f"Extracting audio from video: {video_path}")
        audio_ok = extract_audio(video_path, audio_path)
        if not audio_ok:
            raise HTTPException(status_code=500, detail="Failed to extract audio from video.")
            
        # Run speech-to-text (AI transcription with native language integrity)
        logger.info(f"Transcribing audio: {audio_path} (engine={engine or 'default'}, model={WHISPER_MODEL})")
        words = transcribe_audio(
            audio_path, 
            model_name=WHISPER_MODEL, 
            api_key=geminiApiKey, 
            engine=engine,
            groq_api_key=groqApiKey
        )

        # Clean up temporary audio file to save disk space
        if os.path.exists(audio_path):
            os.remove(audio_path)
            
        # Free unused memory immediately
        gc.collect()
            
        return {
            "id": job_id,
            "filename": file.filename,
            "words": words
        }
    except Exception as e:
        logger.error(f"Error during transcription workflow: {str(e)}")
        # Cleanup on failure
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        gc.collect()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/api/export")
async def export_video(request: ExportRequest, background_tasks: BackgroundTasks):
    """
    Endpoint to take customized subtitles and burn them into the original video.
    """
    # Trigger background cleanup of expired files (>20 mins)
    background_tasks.add_task(cleanup_old_files)
    
    job_id = request.id
    
    # Locate original video
    video_path = None
    for ext in ["mp4", "mov", "avi", "mkv"]:
        path = os.path.join(UPLOAD_DIR, f"{job_id}.{ext}")
        if os.path.exists(path):
            video_path = path
            break
            
    if not video_path:
        raise HTTPException(status_code=404, detail="Original video upload not found or session expired.")
        
    # Touch original video to refresh its 20m inactivity timer during re-edits & export
    try:
        os.utime(video_path, None)
    except Exception:
        pass

    ass_path = os.path.join(OUTPUT_DIR, f"{job_id}.ass")
    output_filename = f"{job_id}_export.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # 1. Generate ASS subtitle file
    words_dict_list = [w.model_dump() for w in request.words]
    ass_ok = generate_ass_file(words_dict_list, request.style, ass_path, max_words=request.maxWords)
    if not ass_ok:
        raise HTTPException(status_code=500, detail="Failed to generate subtitle configuration file.")
        
    # 2. Burn subtitles using FFmpeg (managed via semaphore and offloaded to worker thread)
    quality = (request.quality or "fast").lower().strip()
    async with export_semaphore:
        burn_ok = await asyncio.to_thread(burn_subtitles, video_path, ass_path, output_path, quality)
        
    if not burn_ok:
        raise HTTPException(status_code=500, detail="Video subtitle burning failed. Try again with a shorter video or simpler style.")
        
    # Free memory after heavy FFmpeg processing
    gc.collect()
        
    return {
        "id": job_id,
        "download_url": f"/api/download/{job_id}",
        "success": True
    }

@app.get("/api/download/{job_id}")
async def download_video(job_id: str):
    """
    Endpoint to download the exported video file.
    Does NOT delete original video so user can re-edit anytime in current session.
    """
    output_path = os.path.join(OUTPUT_DIR, f"{job_id}_export.mp4")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Exported video file not found or expired.")
    return FileResponse(output_path, media_type="video/mp4", filename="captions_video.mp4")

@app.get("/api/preview/{job_id}")
async def preview_video(job_id: str, request: Request):
    """
    Endpoint to fetch the original uploaded video for UI player previews.
    Supports HTTP 206 Partial Content (Range requests) so seeking and buffering
    are ultra-smooth without stuttering or re-downloading entire video.
    """
    video_path = None
    for ext in ["mp4", "mov", "avi", "mkv"]:
        path = os.path.join(UPLOAD_DIR, f"{job_id}.{ext}")
        if os.path.exists(path):
            video_path = path
            break
            
    if not video_path:
        raise HTTPException(status_code=404, detail="Video file not found or expired.")

    # Refresh file timestamp to keep session alive while previewing
    try:
        os.utime(video_path, None)
    except Exception:
        pass

    file_size = os.path.getsize(video_path)
    range_header = request.headers.get("range")
    
    if range_header:
        try:
            h = range_header.replace("bytes=", "").strip()
            parts = h.split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1
            start = max(0, min(start, file_size - 1))
            end = max(start, min(end, file_size - 1))
            content_length = (end - start) + 1
            
            def iter_file():
                with open(video_path, "rb") as f:
                    f.seek(start)
                    bytes_remaining = content_length
                    while bytes_remaining > 0:
                        chunk_size = min(bytes_remaining, 1024 * 512)
                        data = f.read(chunk_size)
                        if not data:
                            break
                        bytes_remaining -= len(data)
                        yield data
                        
            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Type": "video/mp4",
            }
            return StreamingResponse(iter_file(), status_code=206, headers=headers)
        except Exception as e:
            logger.warning(f"Error handling range request for video preview: {e}")

    return FileResponse(
        video_path, 
        media_type="video/mp4",
        headers={"Accept-Ranges": "bytes"}
    )

@app.post("/api/translate")
async def translate_subtitles(request: TranslateRequest):
    """
    Endpoint to translate timestamped words to Hinglish, Hindi, or English using Groq Cloud LLM or Gemini AI.
    Shifts the entire flow to Groq when groqApiKey is provided or provider == 'groq'.
    """
    if not request.words:
        raise HTTPException(status_code=400, detail="No words provided for translation.")
        
    target_lang = request.resolved_target_language
    groq_key = (request.resolved_groq_api_key or os.getenv("GROQ_API_KEY") or os.getenv("groqapikey") or "").strip()
    gemini_key = (request.resolved_gemini_api_key or os.getenv("GEMINI_API_KEY") or "").strip()
    provider = (request.provider or "").lower().strip()

    # Determine whether to use Groq:
    # 1. Explicitly requested provider == "groq"
    # 2. groqApiKey was provided in request
    # 3. Environment has GROQ_API_KEY and provider != "gemini" and not gemini_key
    use_groq = False
    if provider == "groq":
        use_groq = True
    elif provider == "gemini":
        use_groq = False
    elif request.resolved_groq_api_key:
        use_groq = True
    elif groq_key and not gemini_key:
        use_groq = True

    words_dict_list = [w.model_dump() for w in request.words]

    try:
        active_provider = "gemini"
        if use_groq:
            if not groq_key:
                raise ValueError("Groq API key is missing. Please enter your Groq API key in the settings.")
            logger.info(f"Translating subtitles with Groq Cloud LLM to '{target_lang}'...")
            translated_words = translate_words_with_groq(
                words=words_dict_list,
                target_language=target_lang,
                api_key=groq_key
            )
            active_provider = "groq"
        else:
            if not gemini_key:
                raise ValueError("Gemini API key is required. Please enter your Gemini or Groq API key in the settings.")
            logger.info(f"Translating subtitles with Gemini AI to '{target_lang}'...")
            translated_words = translate_words_with_gemini(
                words=words_dict_list,
                target_language=target_lang,
                api_key=gemini_key
            )
            active_provider = "gemini"

        gc.collect()
        return {
            "success": True,
            "targetLanguage": target_lang,
            "target_language": target_lang,
            "language": target_lang,
            "provider": active_provider,
            "words": translated_words
        }
    except ValueError as ve:
        logger.warning(f"Translation configuration error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Translation execution error: {str(e)}")
        # If Groq failed but user has gemini_key, attempt fallback
        if use_groq and gemini_key:
            logger.info("Groq translation failed, attempting fallback to Gemini...")
            try:
                translated_words = translate_words_with_gemini(
                    words=words_dict_list,
                    target_language=target_lang,
                    api_key=gemini_key
                )
                gc.collect()
                return {
                    "success": True,
                    "targetLanguage": target_lang,
                    "target_language": target_lang,
                    "language": target_lang,
                    "provider": "gemini (fallback)",
                    "words": translated_words
                }
            except Exception as fb_err:
                logger.error(f"Gemini fallback translation also failed: {fb_err}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.post("/api/verify-groq-key")
@app.post("/api/test-groq-key")
async def verify_groq_key_endpoint(request: VerifyGroqKeyRequest):
    """
    Endpoint to check if a provided Groq API Key is valid and active.
    """
    res = verify_groq_api_key(request.resolved_key)
    return res

@app.post("/api/verify-key")
@app.post("/api/test-key")
async def verify_key(request: VerifyKeyRequest):
    """
    Endpoint to check if a provided Gemini API Key is valid and working.
    """
    res = verify_gemini_api_key(request.resolved_key)
    return res

@app.get("/health")
def health_check():
    return {"status": "ok"}

