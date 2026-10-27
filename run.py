import os
import sys
from pathlib import Path

# When executed from the repository root, resolve backend directory
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

if backend_dir.exists():
    sys.path.insert(0, str(backend_dir))
    os.chdir(str(backend_dir))

import uvicorn
from app.config import HOST, PORT

if __name__ == "__main__":
    is_render = os.getenv("RENDER", "").lower() in ("true", "1")
    is_dev = not is_render and os.getenv("ENV", "development").lower() == "development"
    print(f"Starting API Server on http://{HOST}:{PORT} (reload={is_dev})...", flush=True)
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=is_dev)
