from hinglishswd import HinglishNLP

nlp = HinglishNLP()
text = "kal mai khaana khane gaya"
devanagari_text = nlp.transliterate(text)
print("Devanagari:", devanagari_text.encode('utf-8'))
