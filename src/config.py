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

# Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Model names
LLM_MODEL = os.getenv("LLM_MODEL", "models/gemini-2.0-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")

# Document settings
DOCS_DIR = PROJECT_ROOT / os.getenv("DOCS_DIR", "docs")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "64"))

# Index storage
INDEX_DIR = PROJECT_ROOT / os.getenv("INDEX_DIR", "storage")
