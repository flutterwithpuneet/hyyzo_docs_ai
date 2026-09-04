"""
Hyyzo Docs AI — Streamlit Cloud Entry Point
"""
import runpy
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if __name__ == "__main__" or "streamlit" in sys.modules:
    runpy.run_module("app", run_name="__main__")
