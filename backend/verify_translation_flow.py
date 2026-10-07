import json
from app.services.translate import distribute_timings_proportionally

def test_full_pipeline():
    original_words = [
        {"word": "Welcome", "start": 0.0, "end": 0.6},
        {"word": "to", "start": 0.6, "end": 0.8},
        {"word": "our", "start": 0.8, "end": 1.0},
        {"word": "new", "start": 1.0, "end": 1.4},
        {"word": "video", "start": 1.4, "end": 2.0},
        {"word": "about", "start": 2.0, "end": 2.3},
        {"word": "captions", "start": 2.3, "end": 3.0}
    ]
    
    # 1. Test Hinglish proportion
    hinglish_translated = ["Hamare", "captions", "ke", "naye", "video", "me", "aapka", "swagat", "hai"]
    aligned_hinglish = distribute_timings_proportionally(hinglish_translated, original_words[0]["start"], original_words[-1]["end"])
    
    print("Original word count:", len(original_words), "Time bounds:", original_words[0]["start"], "->", original_words[-1]["end"])
    print("Aligned Hinglish words:", len(aligned_hinglish))
    for w in aligned_hinglish:
        print(f"  {w['start']:.2f}s - {w['end']:.2f}s : {w['word']}")
        
    assert aligned_hinglish[0]["start"] == 0.0
    assert aligned_hinglish[-1]["end"] == 3.0
    
    # 2. Test Hindi proportion
    hindi_translated = ["हमारे", "कैप्शन", "के", "नए", "वीडियो", "में", "आपका", "स्वागत", "है"]
    aligned_hindi = distribute_timings_proportionally(hindi_translated, original_words[0]["start"], original_words[-1]["end"])
    print("Aligned Hindi words:", len(aligned_hindi))
    assert aligned_hindi[0]["start"] == 0.0
    assert aligned_hindi[-1]["end"] == 3.0
    
    print("\nAll translation simulation tests passed successfully!")

if __name__ == "__main__":
    test_full_pipeline()
