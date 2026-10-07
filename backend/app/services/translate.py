import os
import json
import logging
import re
import requests
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Fallback model list if dynamic model discovery is unavailable
STATIC_FALLBACK_MODELS = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-pro"
]

def get_available_gemini_models(api_key: str) -> List[str]:
    """
    Dynamically queries Google Generative AI API for available models supporting generateContent.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            available = []
            for m in data.get("models", []):
                methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in methods:
                    name = m.get("name", "").replace("models/", "")
                    name_lower = name.lower()
                    # Skip audio/TTS-only, image-only, embedding, robotics models
                    if any(bad in name_lower for bad in ["tts", "image", "embedding", "robotics", "aqa", "realtime"]):
                        continue
                    if name:
                        available.append(name)
            
            if available:
                # Rank fastest text models first
                def rank_model(name: str) -> int:
                    nl = name.lower()
                    if "3.1-flash-lite" in nl:
                        return 0
                    elif "3.6-flash" in nl:
                        return 1
                    elif "3.7-flash" in nl:
                        return 2
                    elif "2.5-flash" in nl and not "lite" in nl:
                        return 3
                    elif "flash" in nl and "3." in nl:
                        return 4
                    elif "flash" in nl:
                        return 5
                    elif "pro" in nl and "3." in nl:
                        return 6
                    elif "pro" in nl:
                        return 7
                    return 8

                available.sort(key=rank_model)
                logger.info(f"Discovered active text Gemini models for API key: {available[:5]}")
                return available
    except Exception as e:
        logger.warning(f"Could not list dynamic Gemini models: {e}")
        
    return STATIC_FALLBACK_MODELS

def verify_gemini_api_key(api_key: str) -> Dict[str, Any]:
    """
    Validates a Gemini API Key by making a lightweight model-listing call.
    """
    if not api_key or not api_key.strip():
        return {"valid": False, "message": "API key is empty."}
        
    cleaned_key = api_key.strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={cleaned_key}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return {"valid": True, "message": "API Key is valid and active!"}
        else:
            error_data = response.json() if response.content else {}
            error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            return {"valid": False, "message": f"Validation failed: {error_msg}"}
    except Exception as e:
        return {"valid": False, "message": f"Connection error: {str(e)}"}

def distribute_timings_proportionally(
    translated_words: List[str],
    start_time: float,
    end_time: float
) -> List[Dict[str, Any]]:
    """
    Proportionally distributes a list of translated words across a given time interval.
    Word duration is weighted by word length for natural pacing.
    """
    if not translated_words:
        return []
        
    total_duration = max(0.15, end_time - start_time)
    
    # Weight duration by character length + base constant
    weights = [max(1, len(w)) + 1.5 for w in translated_words]
    total_weight = sum(weights)
    
    result = []
    current_start = start_time
    
    for i, word in enumerate(translated_words):
        word_duration = (weights[i] / total_weight) * total_duration
        word_end = current_start + word_duration
        if i == len(translated_words) - 1:
            word_end = end_time  # clamp last word to exact end_time
            
        result.append({
            "word": word,
            "start": round(current_start, 3),
            "end": round(max(current_start + 0.08, word_end), 3)
        })
        current_start = word_end
        
    return result

def group_words_into_phrases(words: List[Dict[str, Any]], pause_threshold: float = 0.45, max_words: int = 10) -> List[Dict[str, Any]]:
    """
    Groups words into natural sentence/phrase segments based on audio pauses and punctuation.
    """
    if not words:
        return []
        
    segments = []
    current_words = []
    
    for w in words:
        if not current_words:
            current_words.append(w)
            continue
            
        prev_w = current_words[-1]
        pause = w["start"] - prev_w["end"]
        has_punctuation = bool(re.search(r'[.!?,\n।]$', prev_w["word"]))
        
        if pause >= pause_threshold or (has_punctuation and len(current_words) >= 4) or len(current_words) >= max_words:
            segments.append({
                "id": len(segments),
                "start": current_words[0]["start"],
                "end": current_words[-1]["end"],
                "text": " ".join([item["word"] for item in current_words]),
                "original_words": current_words
            })
            current_words = [w]
        else:
            current_words.append(w)
            
    if current_words:
        segments.append({
            "id": len(segments),
            "start": current_words[0]["start"],
            "end": current_words[-1]["end"],
            "text": " ".join([item["word"] for item in current_words]),
            "original_words": current_words
        })
        
    return segments

def translate_words_with_gemini(
    words: List[Dict[str, Any]],
    target_language: str,
    api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Translates subtitle words into target_language (Hinglish, Hindi, English) with phrase-level alignment.
    Preserves exact audio timestamps so words never drift or get lost.
    """
    if not words:
        return []
        
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key or not key.strip():
        raise ValueError("Gemini API key is required. Please enter your Gemini API key in the Timeline settings.")

    cleaned_key = key.strip()
    
    # 1. Group words into natural spoken phrases
    phrases = group_words_into_phrases(words, pause_threshold=0.45, max_words=10)
    logger.info(f"Grouped {len(words)} words into {len(phrases)} speech phrases for aligned translation.")
    
    # Language descriptions for Gemini
    lang_instructions = {
        "hinglish": (
            "Translate each phrase into natural, conversational Hinglish (Hindi written in Roman/Latin script, e.g. "
            "'Namaste dosto', 'Yeh bohot useful trick hai', 'Video ko like karein'). Do NOT output Devanagari Hindi characters."
        ),
        "hindi": (
            "Translate each phrase into natural Hindi using clean Devanagari script (e.g. 'नमस्ते दोस्तों', 'यह बहुत उपयोगी ट्रिक है')."
        ),
        "english": (
            "Translate each phrase into natural, fluent English (e.g. 'Hello friends', 'This is a very useful trick')."
        )
    }
    
    target_desc = lang_instructions.get(
        target_language.lower(), 
        f"Translate each phrase into {target_language}."
    )

    phrase_payload = [
        {
            "id": p["id"],
            "start": round(p["start"], 2),
            "end": round(p["end"], 2),
            "text": p["text"]
        }
        for p in phrases
    ]

    prompt = f"""You are an expert video subtitle localization and timing synchronization engine.
Your task is to translate each timestamped speech segment into {target_language.upper()}.

Target Language Specification:
{target_desc}

RULES:
1. Translate EVERY single segment without skipping any segment or summarizing.
2. For each segment, output the translated text and the individual words.
3. The translated words for segment [id] must stay within that segment's [start, end] time range.
4. Output a JSON array with one object per segment:
[
  {{
    "id": 0,
    "translated_text": "...",
    "words": [
      {{"word": "Hamare", "start": 0.0, "end": 0.5}},
      {{"word": "dosto", "start": 0.5, "end": 1.1}}
    ]
  }}
]

Speech Segments to Translate:
{json.dumps(phrase_payload, ensure_ascii=False, indent=2)}
"""

    headers = {"Content-Type": "application/json"}
    models_to_try = get_available_gemini_models(cleaned_key)
    last_error = None
    
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={cleaned_key}"
        
        configs = [
            {"temperature": 0.15, "responseMimeType": "application/json"},
            {"temperature": 0.15}
        ]
        
        for config in configs:
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": config
            }

            try:
                logger.info(f"Translating phrases using model {model} (config: {config})...")
                resp = requests.post(url, headers=headers, json=payload, timeout=35)
                
                if resp.status_code != 200:
                    err_text = resp.text
                    logger.warning(f"Model {model} returned status {resp.status_code}: {err_text}")
                    last_error = f"HTTP {resp.status_code}: {err_text}"
                    continue
                    
                res_json = resp.json()
                candidates = res_json.get("candidates", [])
                if not candidates:
                    last_error = "No response candidates returned by Gemini."
                    continue
                    
                content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                
                if content_text.startswith("```"):
                    content_text = re.sub(r"^```(?:json)?\s*", "", content_text)
                    content_text = re.sub(r"\s*```$", "", content_text)
                    
                parsed_segments = None
                try:
                    parsed_segments = json.loads(content_text)
                except Exception:
                    m = re.search(r'\[\s*\{.*?\}\s*\]', content_text, re.DOTALL)
                    if m:
                        try:
                            parsed_segments = json.loads(m.group(0))
                        except Exception:
                            pass
                
                if isinstance(parsed_segments, list) and len(parsed_segments) > 0:
                    final_words = []
                    
                    # Create lookup map for fast segment matching
                    seg_map = {p["id"]: p for p in phrases}
                    
                    for seg_result in parsed_segments:
                        seg_id = seg_result.get("id", len(final_words))
                        orig_phrase = seg_map.get(seg_id, phrases[min(seg_id, len(phrases) - 1)] if phrases else None)
                        if not orig_phrase:
                            continue
                            
                        p_start = orig_phrase["start"]
                        p_end = orig_phrase["end"]
                        
                        seg_words_data = seg_result.get("words", [])
                        
                        if isinstance(seg_words_data, list) and len(seg_words_data) > 0 and isinstance(seg_words_data[0], dict):
                            # Segment words provided with timestamps
                            w_list = []
                            for w_obj in seg_words_data:
                                w_str = str(w_obj.get("word", "")).strip()
                                if w_str:
                                    s = float(w_obj.get("start", p_start))
                                    e = float(w_obj.get("end", s + 0.25))
                                    w_list.append({
                                        "word": w_str,
                                        "start": max(p_start, s),
                                        "end": min(p_end + 0.5, max(s + 0.05, e))
                                    })
                            if w_list:
                                final_words.extend(w_list)
                            else:
                                raw_text = seg_result.get("translated_text", "") or orig_phrase["text"]
                                raw_words = [w.strip() for w in raw_text.split() if w.strip()]
                                final_words.extend(distribute_timings_proportionally(raw_words, p_start, p_end))
                        else:
                            # Fallback: extract text from translated_text or words string
                            raw_text = seg_result.get("translated_text", "")
                            if not raw_text and isinstance(seg_words_data, list):
                                raw_text = " ".join([str(w) for w in seg_words_data])
                            if not raw_text:
                                raw_text = orig_phrase["text"]
                                
                            raw_words = [w.strip() for w in raw_text.split() if w.strip()]
                            final_words.extend(distribute_timings_proportionally(raw_words, p_start, p_end))
                            
                    if final_words:
                        logger.info(f"Segment-aligned translation successful: {len(final_words)} words generated.")
                        return final_words
                        
            except Exception as e:
                logger.error(f"Error requesting Gemini API with {model}: {e}")
                last_error = str(e)

    # If phrase-level translation failed, fallback to global word proportional distribution
    raise RuntimeError(f"Translation failed: {last_error or 'Unknown error occurred while calling Gemini API.'}")


# ============================================================================
# GROQ CLOUD INTEGRATION (ULTRA-FAST WHISPER & LLM TRANSLATION)
# ============================================================================

STATIC_FALLBACK_GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "allam-2-7b"
]

def get_available_groq_models(api_key: str) -> List[str]:
    """
    Dynamically queries Groq API for available chat/completion models.
    """
    if not api_key or not api_key.strip():
        return STATIC_FALLBACK_GROQ_MODELS
    url = "https://api.groq.com/openai/v1/models"
    headers = {"Authorization": f"Bearer {api_key.strip()}"}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            candidate_ids = [m.get("id", "") for m in data if m.get("id")]
            filtered = [
                m for m in candidate_ids
                if not any(bad in m.lower() for bad in ["whisper", "guard", "orpheus", "embed", "safeguard", "vision"])
            ]
            if filtered:
                def rank_groq(m: str) -> int:
                    ml = m.lower()
                    if "gpt-oss-120b" in ml:
                        return 0
                    elif "70b" in ml or "3.3" in ml:
                        return 1
                    elif "gpt-oss-20b" in ml:
                        return 2
                    elif "qwen" in ml:
                        return 3
                    elif "8b" in ml:
                        return 4
                    return 5
                filtered.sort(key=rank_groq)
                logger.info(f"Discovered active Groq chat models: {filtered[:5]}")
                return filtered
    except Exception as e:
        logger.warning(f"Could not fetch dynamic Groq models: {e}")
    return STATIC_FALLBACK_GROQ_MODELS

def verify_groq_api_key(api_key: str) -> Dict[str, Any]:
    """
    Validates a Groq API Key by making a lightweight model-listing call.
    """
    if not api_key or not api_key.strip():
        return {"valid": False, "message": "Groq API key is empty."}
        
    cleaned_key = api_key.strip()
    url = "https://api.groq.com/openai/v1/models"
    headers = {"Authorization": f"Bearer {cleaned_key}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            models = [m.get("id") for m in data.get("data", []) if "whisper" in m.get("id", "").lower()]
            whisper_avail = ", ".join(models) if models else "Whisper Large"
            return {
                "valid": True,
                "message": f"Groq API Key is active! ({whisper_avail} ready)"
            }
        else:
            error_data = response.json() if response.content else {}
            error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            return {"valid": False, "message": f"Groq validation failed: {error_msg}"}
    except Exception as e:
        return {"valid": False, "message": f"Connection error: {str(e)}"}

def translate_words_with_groq(
    words: List[Dict[str, Any]],
    target_language: str,
    api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Translates subtitle words into target_language (Hinglish, Hindi, English) using Groq Cloud LLM.
    Preserves exact audio timestamps so words never drift or desync.
    """
    if not words:
        return []

    key = (api_key or os.getenv("GROQ_API_KEY") or os.getenv("groqapikey") or "").strip()
    if not key:
        raise ValueError("Groq API key is required. Please enter your Groq API key in the settings.")

    # 1. Group words into natural spoken phrases
    phrases = group_words_into_phrases(words, pause_threshold=0.45, max_words=10)
    logger.info(f"Grouped {len(words)} words into {len(phrases)} speech phrases for Groq translation.")

    lang_instructions = {
        "hinglish": (
            "Translate each phrase into natural, conversational Hinglish (Hindi written in Roman/Latin script, e.g. "
            "'Namaste dosto', 'Yeh bohot useful trick hai', 'Video ko like karein'). Do NOT output Devanagari Hindi characters."
        ),
        "hindi": (
            "Translate each phrase into natural Hindi using clean Devanagari script (e.g. 'नमस्ते दोस्तों', 'यह बहुत उपयोगी ट्रिक है')."
        ),
        "english": (
            "Translate each phrase into natural, fluent English (e.g. 'Hello friends', 'This is a very useful trick')."
        )
    }

    target_desc = lang_instructions.get(
        target_language.lower(), 
        f"Translate each phrase into {target_language}."
    )

    phrase_payload = [
        {
            "id": p["id"],
            "start": round(p["start"], 2),
            "end": round(p["end"], 2),
            "text": p["text"]
        }
        for p in phrases
    ]

    prompt = f"""You are an expert video subtitle localization and timing synchronization engine.
Your task is to translate each timestamped speech segment into {target_language.upper()}.

Target Language Specification:
{target_desc}

RULES:
1. Translate EVERY single segment without skipping any segment or summarizing.
2. Return ONLY a valid JSON list of objects, one for each segment:
[
  {{
    "id": 0,
    "translated_text": "..."
  }}
]
3. Segment IDs must match the input segments. Do not include markdown code block formatting or backticks. Return strictly the raw JSON array.

Speech Segments to Translate:
{json.dumps(phrase_payload, ensure_ascii=False, indent=2)}
"""

    models_to_try = get_available_groq_models(key)
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    last_error = None
    for model in models_to_try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional video subtitle localization engine. Output strictly a valid JSON array of objects."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1
        }

        try:
            logger.info(f"Translating phrases with Groq model '{model}'...")
            resp = requests.post(url, headers=headers, json=payload, timeout=25)

            if resp.status_code != 200:
                err_text = resp.text
                logger.warning(f"Groq model {model} returned HTTP {resp.status_code}: {err_text[:200]}")
                last_error = f"HTTP {resp.status_code}: {err_text[:200]}"
                continue

            res_json = resp.json()
            choices = res_json.get("choices", [])
            if not choices:
                continue

            content_text = choices[0].get("message", {}).get("content", "").strip()
            if content_text.startswith("```"):
                content_text = re.sub(r"^```(?:json)?\s*", "", content_text)
                content_text = re.sub(r"\s*```$", "", content_text)

            parsed_segments = None
            try:
                parsed_segments = json.loads(content_text)
            except Exception:
                m = re.search(r'\[\s*\{.*?\}\s*\]', content_text, re.DOTALL)
                if m:
                    try:
                        parsed_segments = json.loads(m.group(0))
                    except Exception:
                        pass

            if isinstance(parsed_segments, list) and len(parsed_segments) > 0:
                final_words = []
                seg_map = {p["id"]: p for p in phrases}

                for seg_result in parsed_segments:
                    seg_id = seg_result.get("id", len(final_words))
                    orig_phrase = seg_map.get(seg_id, phrases[min(seg_id, len(phrases) - 1)] if phrases else None)
                    if not orig_phrase:
                        continue

                    p_start = orig_phrase["start"]
                    p_end = orig_phrase["end"]

                    raw_text = seg_result.get("translated_text", "")
                    if not raw_text and "text" in seg_result:
                        raw_text = seg_result["text"]
                    if not raw_text:
                        raw_text = orig_phrase["text"]

                    raw_words = [w.strip() for w in raw_text.split() if w.strip()]
                    final_words.extend(distribute_timings_proportionally(raw_words, p_start, p_end))

                if final_words:
                    logger.info(f"Groq subtitle translation successful: {len(final_words)} words generated.")
                    return final_words
        except Exception as e:
            logger.error(f"Error requesting Groq API with {model}: {e}")
            last_error = str(e)

    raise RuntimeError(f"Groq translation failed: {last_error or 'Unknown Groq API error.'}")
