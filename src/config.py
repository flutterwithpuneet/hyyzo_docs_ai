"""
hyyzo_docs_ai - Configuration
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent

def get_api_key() -> str:
    """Retrieve Gemini API key from session state, env, or Streamlit secrets."""
    try:
        import streamlit as _st
        if hasattr(_st, "session_state") and "user_api_key" in _st.session_state and _st.session_state.user_api_key:
            return _st.session_state.user_api_key.strip()
    except Exception:
        pass

    key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    if key:
        return key.strip()

    try:
        import streamlit as _st
        if hasattr(_st, "secrets"):
            key = _st.secrets.get("GOOGLE_API_KEY", "") or _st.secrets.get("GEMINI_API_KEY", "")
            if key:
                return str(key).strip()
    except Exception:
        pass

    return ""

GOOGLE_API_KEY = get_api_key()

# Model names
LLM_MODEL = os.getenv("LLM_MODEL", "models/gemini-2.0-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")

# Document settings
DOCS_DIR = PROJECT_ROOT / os.getenv("DOCS_DIR", "docs")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "64"))

# Index storage
INDEX_DIR = PROJECT_ROOT / os.getenv("INDEX_DIR", "storage")
