import requests

def get_available_gemini_models(api_key: str):
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            models = [
                m["name"].replace("models/", "")
                for m in data.get("models", [])
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]
            return models
        else:
            print("Error listing models:", r.status_code, r.text)
            return []
    except Exception as e:
        print("Exception:", e)
        return []

print("Helper ready")
