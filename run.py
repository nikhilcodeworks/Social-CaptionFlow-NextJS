import os
import sys
from pathlib import Path

# When executed from the repository root, resolve backend directory
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

if backend_dir.exists():
    sys.path.insert(0, str(backend_dir))
    os.chdir(str(backend_dir))

# Import and execute the backend runner
if __name__ == "__main__":
    import run
