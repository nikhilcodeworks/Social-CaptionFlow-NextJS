import json
import re

def group_words_into_phrases(words, pause_threshold=0.45, max_words=10):
    if not words:
        return []
        
    segments = []
    current_words = []
    
    for i, w in enumerate(words):
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

# Test
sample_words = [
    {"word": "Hello", "start": 0.0, "end": 0.4},
    {"word": "friends,", "start": 0.4, "end": 0.9},
    {"word": "welcome", "start": 1.0, "end": 1.5},
    {"word": "to", "start": 1.5, "end": 1.7},
    {"word": "my", "start": 1.7, "end": 1.9},
    {"word": "channel.", "start": 1.9, "end": 2.5},
    {"word": "Today", "start": 3.2, "end": 3.6},
    {"word": "we", "start": 3.6, "end": 3.8},
    {"word": "will", "start": 3.8, "end": 4.0},
    {"word": "learn", "start": 4.0, "end": 4.3},
    {"word": "coding.", "start": 4.3, "end": 5.0}
]

segs = group_words_into_phrases(sample_words)
print(f"Generated {len(segs)} segments:")
for s in segs:
    print(f"Segment {s['id']} [{s['start']:.2f}s - {s['end']:.2f}s]: '{s['text']}'")
