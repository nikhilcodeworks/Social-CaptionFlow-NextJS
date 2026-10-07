import os
import gc
import json
import logging
import re
import base64
import requests
from typing import List, Dict, Any, Optional

from app.config import GROQ_API_KEY, GROQ_WHISPER_MODEL
from app.services.translate import get_available_gemini_models, distribute_timings_proportionally

logger = logging.getLogger(__name__)

# Cache loaded models in memory
_model_cache = {}

def get_whisper_model(model_name: str):
    """
    Loads and caches the Whisper model to avoid reloading on every request.
    Lazy loads whisper and limits PyTorch threads to reduce cloud memory/CPU consumption.
    """
    if model_name not in _model_cache:
        try:
            import torch
            torch.set_num_threads(1)
        except Exception:
            pass
        import whisper
        logger.info(f"Loading Whisper model: {model_name}...")
        _model_cache[model_name] = whisper.load_model(model_name)
        logger.info(f"Whisper model {model_name} loaded successfully.")
    return _model_cache[model_name]

def distribute_segment_words(text: str, start_time: float, end_time: float) -> List[Dict[str, Any]]:
    """
    Fallback word interpolation if Whisper word-level timestamps are missing for a segment.
    """
    raw_words = [w.strip() for w in text.split() if w.strip()]
    if not raw_words:
        return []
        
    duration = max(0.15, end_time - start_time)
    weights = [max(1, len(w)) + 1.2 for w in raw_words]
    total_weight = sum(weights)
    
    words = []
    current_start = start_time
    for i, w in enumerate(raw_words):
        w_dur = (weights[i] / total_weight) * duration
        w_end = current_start + w_dur if i < len(raw_words) - 1 else end_time
        words.append({
            "word": w,
            "start": round(current_start, 3),
            "end": round(w_end, 3)
        })
        current_start = w_end
    return words

def transcribe_audio_with_gemini(audio_path: str, api_key: str) -> List[Dict[str, Any]]:
    """
    Transcribes audio using Gemini Multimodal AI with verbatim word-level accuracy for Hindi/Hinglish/English.
    """
    if not os.path.exists(audio_path) or not api_key:
        return []
        
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    if file_size_mb > 20:
        logger.warning(f"Audio file is too large for inline Gemini audio ({file_size_mb:.1f}MB), falling back to Whisper.")
        return []

    logger.info(f"Transcribing audio with Gemini Multimodal AI ({file_size_mb:.2f}MB)...")
    
    with open(audio_path, "rb") as f:
        audio_b64 = base64.b64encode(f.read()).decode("utf-8")
        
    prompt = """You are an expert audio transcription and subtitle timing synchronization AI.
Listen to this audio carefully and transcribe every spoken word VERBATIM with start and end timestamps in seconds.

CRITICAL RULES:
1. Spoken Language Integrity (NO UNWANTED TRANSLATION):
   - Transcribe in the EXACT spoken language of the speaker.
   - If the speaker speaks Hindi/Hinglish (e.g. "Namaste dosto aaj hum naya video laye hain"), write in natural conversational Hinglish (Roman English letters) or Hindi.
   - Do NOT translate Hindi/Hinglish into pure English (e.g. do NOT change "hum ja rahe hain" to "we are going").
   - If the speaker speaks English, transcribe in English.
2. Word-by-word Timestamps:
   - Output each individual word with accurate 'start' and 'end' float timestamps in seconds.
   - Timestamps must start at the beginning of the audio and increase monotonically.
3. Completeness:
   - Do not omit, skip, or summarize any words, filler words, or sentences.
4. Output Format:
   - Return ONLY a valid JSON array of objects with keys "word", "start", "end".

Example output:
[
  {"word": "Namaste", "start": 0.12, "end": 0.65},
  {"word": "dosto", "start": 0.65, "end": 1.15}
]
"""

    models_to_try = get_available_gemini_models(api_key)
    headers = {"Content-Type": "application/json"}
    
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "audio/wav",
                            "data": audio_b64
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }
        
        try:
            logger.info(f"Attempting Gemini audio transcription with model {model}...")
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if resp.status_code != 200:
                logger.warning(f"Gemini transcription with {model} failed: HTTP {resp.status_code} - {resp.text[:200]}")
                continue
                
            res_json = resp.json()
            candidates = res_json.get("candidates", [])
            if not candidates:
                continue
                
            content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
            if content_text.startswith("```"):
                content_text = re.sub(r"^```(?:json)?\s*", "", content_text)
                content_text = re.sub(r"\s*```$", "", content_text)
                
            parsed = json.loads(content_text)
            if isinstance(parsed, list) and len(parsed) > 0:
                words = []
                for item in parsed:
                    w = str(item.get("word", "")).strip()
                    if not w:
                        continue
                    s = float(item.get("start", 0.0))
                    e = float(item.get("end", s + 0.3))
                    words.append({
                        "word": w,
                        "start": round(max(0.0, s), 3),
                        "end": round(max(s + 0.05, e), 3)
                    })
                    
                if words:
                    logger.info(f"Gemini audio transcription successful! Transcribed {len(words)} words in native spoken language.")
                    return words
        except Exception as e:
            logger.warning(f"Gemini audio transcription error with {model}: {e}")
            
    return []

def transcribe_audio_with_whisper(audio_path: str, model_name: str = "base") -> List[Dict[str, Any]]:
    """
    Transcribes a WAV audio file using local Whisper with verbatim Hindi/Hinglish prompt and segment recovery.
    """
    model = get_whisper_model(model_name)
    logger.info(f"Starting Whisper transcription for: {audio_path}")
    
    # Using explicit Hindi/Hinglish verbatim prompt to prevent Whisper from translating Hindi into English
    hindi_hinglish_prompt = (
        "Yeh video Hindi, Hinglish aur English me hai. "
        "Aapko spoken words ko bina translate kiye verbatim Hinglish ya Hindi me likhna hai. "
        "Do not translate Hindi speech into English words. "
        "Example: Namaste dosto, aaj hum is video me seekhenge."
    )
    
    result = model.transcribe(
        audio_path, 
        task="transcribe", # MUST NOT BE translate
        word_timestamps=True,
        condition_on_previous_text=False,
        initial_prompt=hindi_hinglish_prompt,
        temperature=(0.0, 0.2, 0.4),
        verbose=False
    )
    
    words = []
    segments = result.get("segments", [])
    
    for segment in segments:
        seg_start = float(segment.get("start", 0.0))
        seg_end = float(segment.get("end", seg_start + 1.0))
        seg_words = segment.get("words", [])
        
        if seg_words:
            for word_info in seg_words:
                word_text = word_info.get("word", "").strip()
                if word_text:
                    w_start = round(float(word_info.get("start", seg_start)), 3)
                    w_end = round(float(word_info.get("end", w_start + 0.2)), 3)
                    if w_end <= w_start:
                        w_end = round(w_start + 0.15, 3)
                    words.append({
                        "word": word_text,
                        "start": w_start,
                        "end": w_end
                    })
        else:
            seg_text = segment.get("text", "").strip()
            if seg_text:
                logger.info(f"Interpolating missing word timestamps for segment: '{seg_text}' ({seg_start:.2f}s - {seg_end:.2f}s)")
                fallback_words = distribute_segment_words(seg_text, seg_start, seg_end)
                words.extend(fallback_words)
                
    logger.info(f"Whisper transcription complete. Transcribed {len(words)} total words.")
    return words

def transcribe_audio_with_groq(
    audio_path: str,
    api_key: str,
    model_name: str = "whisper-large-v3"
) -> List[Dict[str, Any]]:
    """
    Transcribes audio using Groq Cloud's ultra-fast Whisper Large (whisper-large-v3).
    whisper-large-v3 has 32 decoder layers (vs 4 in turbo), dramatically boosting accuracy
    for Hindi, Hinglish, and Indian accents while still transcribing in ~1-2 seconds on Groq.
    """
    if not os.path.exists(audio_path) or not api_key:
        return []

    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    if file_size_mb > 25:
        logger.warning(f"Audio file ({file_size_mb:.1f}MB) exceeds Groq 25MB limit. Falling back to local Whisper.")
        return []

    logger.info(f"Transcribing audio with Groq Cloud Whisper ({model_name}, {file_size_mb:.2f}MB)...")
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {api_key.strip()}"}
    
    hindi_hinglish_prompt = (
        "Namaste dosto, aaj ke video me hum baat karenge tech, AI, market, life aur ideas ke baare me. "
        "Yeh audio Hindi, Hinglish aur English me verbatim spoken dialogue hai bina kisi translation ke."
    )
    
    try:
        with open(audio_path, "rb") as f:
            files = {"file": (os.path.basename(audio_path), f, "audio/wav")}
            data = {
                "model": model_name,
                "response_format": "verbose_json",
                "timestamp_granularities[]": "word",
                "prompt": hindi_hinglish_prompt,
                "temperature": 0.0
            }
            resp = requests.post(url, headers=headers, files=files, data=data, timeout=90)
            
        if resp.status_code != 200:
            logger.warning(f"Groq Whisper transcription failed: HTTP {resp.status_code} - {resp.text[:200]}")
            return []
            
        res = resp.json()
        words = []
        raw_words = res.get("words", [])
        
        if raw_words:
            for item in raw_words:
                w = str(item.get("word", "")).strip()
                if not w:
                    continue
                s = float(item.get("start", 0.0))
                e = float(item.get("end", s + 0.2))
                words.append({
                    "word": w,
                    "start": round(max(0.0, s), 3),
                    "end": round(max(s + 0.05, e), 3)
                })
        else:
            # Fallback to segment interpolation if word array is missing
            segments = res.get("segments", [])
            for seg in segments:
                s = float(seg.get("start", 0.0))
                e = float(seg.get("end", s + 1.0))
                text = seg.get("text", "").strip()
                if text:
                    words.extend(distribute_segment_words(text, s, e))
                    
        if words:
            logger.info(f"Groq Whisper transcription successful! Transcribed {len(words)} words in native spoken language.")
            return words
    except Exception as e:
        logger.warning(f"Error during Groq Whisper transcription: {e}")
        
    return []

def transcribe_audio(
    audio_path: str, 
    model_name: str = "base", 
    api_key: Optional[str] = None,
    engine: Optional[str] = None,
    groq_api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Unified transcription pipeline:
    - 1. Priority: Groq Cloud Whisper Large (whisper-large-v3-turbo) if GROQ_API_KEY is available.
         Instant 1-3s transcription, word-level timestamps, zero local CPU/RAM load.
    - 2. If engine == "gemini": Uses Gemini Multimodal AI.
    - 3. Local Whisper model fallback with acoustic DTW alignment.
    - 4. Graceful fallbacks across all engines.
    """
    if not os.path.exists(audio_path):
        logger.error(f"Audio file does not exist: {audio_path}")
        return []
        
    try:
        resolved_engine = (engine or "").lower().strip()
        gemini_key = api_key or os.getenv("GEMINI_API_KEY")
        groq_key = (groq_api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY") or os.getenv("groqapikey") or "").strip()
        
        # If user explicitly requested Gemini
        if resolved_engine == "gemini" and gemini_key and gemini_key.strip():
            logger.info("Explicit Gemini engine selected for audio transcription.")
            gemini_words = transcribe_audio_with_gemini(audio_path, gemini_key.strip())
            if gemini_words:
                return gemini_words

        # If Groq API key is present and not explicitly forced to local/gemini, use Groq Whisper Large
        if groq_key and resolved_engine not in ["local", "gemini"]:
            logger.info("Using Groq Cloud Whisper Large for zero system load & high-speed transcription...")
            groq_model = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")
            groq_words = transcribe_audio_with_groq(audio_path, api_key=groq_key, model_name=groq_model)
            if groq_words:
                return groq_words
            logger.warning("Groq Whisper failed or returned empty. Falling back to local Whisper...")
                
        # Fallback/Default: Local Whisper model
        try:
            logger.info(f"Transcribing audio with local Whisper model '{model_name}'...")
            whisper_words = transcribe_audio_with_whisper(audio_path, model_name=model_name)
            if whisper_words:
                return whisper_words
        except Exception as e:
            logger.warning(f"Local Whisper transcription failed: {e}. Attempting fallback...")
            
        # Fallback to Gemini if Whisper failed and key is available
        if gemini_key and gemini_key.strip():
            logger.info("Falling back to Gemini audio transcription...")
            gemini_words = transcribe_audio_with_gemini(audio_path, gemini_key.strip())
            if gemini_words:
                return gemini_words
                
        return []
    finally:
        # Explicit garbage collection to release audio buffers & model tensors
        gc.collect()
