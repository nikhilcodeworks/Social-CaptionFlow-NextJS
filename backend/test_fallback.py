import re
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

def clean_itrans_to_hinglish(itrans_text: str) -> str:
    text = itrans_text
    
    # Replace standard vowel representations
    # A -> aa
    text = text.replace("A", "aa")
    # I -> ee
    text = text.replace("I", "ee")
    # U -> oo
    text = text.replace("U", "oo")
    
    # Replace nasalization: dostoM -> doston, haiM -> hain, hU~ -> hoon
    text = re.sub(r'([aeiouAEIOU]+)M\b', r'\1n', text)
    text = text.replace("M", "n")
    text = text.replace("~", "")
    
    # Replace hard consonants to soft ones for easier reading
    text = text.replace("T", "t")
    text = text.replace("D", "d")
    text = text.replace("N", "n")
    text = text.replace("Sh", "sh")
    text = text.replace("shh", "sh")
    text = text.replace("S", "s")
    text = text.replace("R", "r")
    
    # Basic schwa deletion rules:
    # 1. Trailing 'a' in a word is usually deleted (except for single-letter words or words ending in a vowel sound like 'aa')
    # e.g., 'hama' -> 'ham', 'kara' -> 'kar', 'Aja' -> 'aaj', but keep 'ka' as 'ka' or 'na' as 'na'
    words = text.split()
    cleaned_words = []
    for w in words:
        # Strip punctuation
        punc_suffix = ""
        punc_prefix = ""
        m_suff = re.search(r'([.,!?;:|]+)$', w)
        if m_suff:
            punc_suffix = m_suff.group(1)
            w = w[:-len(punc_suffix)]
        m_pref = re.match(r'^([.,!?;:|]+)', w)
        if m_pref:
            punc_prefix = m_pref.group(1)
            w = w[len(punc_prefix):]
            
        # Do schwa deletion on the word
        if len(w) > 2 and w.endswith("a") and not w.endswith("aa") and not w.endswith("ia") and not w.endswith("ua") and not w.endswith("ea"):
            w = w[:-1]
            
        # Mid-word schwa deletion (e.g. 'karate' -> 'karte', 'janareta' -> 'janreta')
        # If there's an 'a' between two single consonants, we can often delete it
        # E.g., 'kara-te' -> 'karte'
        w = re.sub(r'([bcdfghjklmnpqrstvwxyz])a([r])([atei])', r'\1\2\3', w)
        w = re.sub(r'([bcdfghjklmnpqrstvwxyz])a([lmnpst])([aeiou])', r'\1\2\3', w)
        
        # Specific word mapping fixes
        w_lower = w.lower()
        if w_lower in ["hama", "ham"]:
            w = "hum"
        elif w_lower in ["kara", "kar"]:
            w = "kar"
        elif w_lower in ["thA", "tha"]:
            w = "tha"
        elif w_lower in ["thI", "thi"]:
            w = "thi"
        elif w_lower in ["the"]:
            w = "the"
        elif w_lower in ["hai", "ha"]:
            w = "hai"
        elif w_lower in ["kI", "ki"]:
            w = "ki"
        elif w_lower in ["hU", "hu", "hoon"]:
            w = "hoon"
        elif w_lower == "haiN":
            w = "hain"
        elif w_lower == "ho":
            w = "ho"
            
        cleaned_words.append(punc_prefix + w + punc_suffix)
        
    return " ".join(cleaned_words)

def transliterate_hindi_to_hinglish(devanagari_text: str) -> str:
    # 1. Transliterate to ITRANS
    itrans_text = transliterate(devanagari_text, sanscript.DEVANAGARI, sanscript.ITRANS)
    # 2. Clean to Hinglish
    return clean_itrans_to_hinglish(itrans_text)

# Test cases
test_sentences = [
    "नमस्ते दोस्तों, आज हम AI कैप्शन जनरेटर का परीक्षण कर रहे हैं।",
    "मेरा नाम निखिल है और मैं एक सॉफ्टवेयर डेवलपर हूँ।",
    "क्या आप कल बाजार जा रहे हैं?",
    "यह काम बहुत आसान है।"
]

with open("fallback_results.txt", "w", encoding="utf-8") as f:
    for s in test_sentences:
        f.write(f"Orig: {s}\n")
        f.write(f"Hing: {transliterate_hindi_to_hinglish(s)}\n")
        f.write("-" * 50 + "\n")

print("Done writing fallback_results.txt")
