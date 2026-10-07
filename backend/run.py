import os
import uvicorn
from app.config import HOST, PORT

if __name__ == "__main__":
    is_render = os.getenv("RENDER", "").lower() in ("true", "1")
    is_dev = not is_render and os.getenv("ENV", "development").lower() == "development"
    print(f"Starting API Server on http://{HOST}:{PORT} (reload={is_dev})...")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=is_dev)
