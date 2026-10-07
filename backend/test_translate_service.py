import sys
from app.services.translate import distribute_timings_proportionally, verify_gemini_api_key

def test_timing_distribution():
    sample_words = ["Namaste", "dosto", "aaj", "hum", "video", "dekh", "rahe", "hain"]
    res = distribute_timings_proportionally(sample_words, 1.0, 5.0)
    print("Distributed Timings:", res)
    assert len(res) == len(sample_words)
    assert res[0]["start"] == 1.0
    assert res[-1]["end"] == 5.0
    for i in range(1, len(res)):
        assert res[i]["start"] >= res[i-1]["start"]
        assert res[i]["end"] > res[i]["start"]
    print("Timing distribution test passed!")

def test_empty_key_verification():
    res = verify_gemini_api_key("")
    print("Empty key test:", res)
    assert res["valid"] is False
    print("Key validation test passed!")

if __name__ == "__main__":
    test_timing_distribution()
    test_empty_key_verification()
