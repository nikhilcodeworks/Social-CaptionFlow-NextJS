import os
import base64
import json
import requests

def test_gemini_audio_prompt():
    prompt = """You are a professional video captioner and audio transcriber.
Transcribe this audio VERBATIM word-by-word with exact timestamps in seconds.

CRITICAL INSTRUCTIONS:
1. Keep the EXACT language spoken in the audio:
   - If the speaker speaks Hindi/Hinglish (e.g. "Namaste dosto aaj hum..."), transcribe in conversational Hinglish (Roman Hindi) or Hindi as spoken.
   - Do NOT translate Hindi/Hinglish into English.
   - If the speaker speaks English, transcribe in English.
2. Do not omit or skip any words, filler words, or sentences.
3. Return ONLY a valid JSON array of objects with keys "word", "start", "end".

Example output format:
[
  {"word": "Namaste", "start": 0.0, "end": 0.5},
  {"word": "dosto", "start": 0.5, "end": 1.1}
]
"""
    print("Prompt defined successfully.")

if __name__ == "__main__":
    test_gemini_audio_prompt()
