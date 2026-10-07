from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

text = "नमस्ते दोस्तों, आज हम AI कैप्शन जनरेटर का परीक्षण कर रहे हैं।"

print("ITRANS:", transliterate(text, sanscript.DEVANAGARI, sanscript.ITRANS))
print("IAST:", transliterate(text, sanscript.DEVANAGARI, sanscript.IAST))
print("HK:", transliterate(text, sanscript.DEVANAGARI, sanscript.HK))
print("SLP1:", transliterate(text, sanscript.DEVANAGARI, sanscript.SLP1))
print("VELTHUIS:", transliterate(text, sanscript.DEVANAGARI, sanscript.VELTHUIS))
