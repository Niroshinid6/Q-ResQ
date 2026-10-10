import sys
from pathlib import Path

# Ensure 'backend' directory is on sys.path so 'import app...' works whether
# invoked from inside backend/ or from repository root.
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
