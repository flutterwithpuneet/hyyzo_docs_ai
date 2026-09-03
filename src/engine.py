"""
Engine — Build vector index and query engine using Gemini.
"""

from pathlib import Path

from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.core import Settings
from llama_index.llms.gemini import Gemini
from llama_index.embeddings.gemini import GeminiEmbedding

from src.config import GOOGLE_API_KEY, LLM_MODEL, EMBEDDING_MODEL, INDEX_DIR, CHUNK_SIZE, CHUNK_OVERLAP


import time

def setup_models():
    """Configure Gemini LLM and embedding model globally."""
    Settings.llm = Gemini(api_key=GOOGLE_API_KEY, model=LLM_MODEL)
    Settings.embed_model = GeminiEmbedding(
        api_key=GOOGLE_API_KEY,
        model_name=EMBEDDING_MODEL,
        embed_batch_size=5
    )
    Settings.chunk_size = CHUNK_SIZE
    Settings.chunk_overlap = CHUNK_OVERLAP
    print(f"[OK] Models configured: LLM={LLM_MODEL}, Embed={EMBEDDING_MODEL}")


def set_active_llm(model_name: str):
    """Update active LLM model dynamically."""
    if not model_name:
        return
    # Ensure correct Gemini prefix if needed (e.g. models/gemini-2.0-flash)
    formatted_name = model_name if model_name.startswith("models/") else f"models/{model_name}"
    Settings.llm = Gemini(api_key=GOOGLE_API_KEY, model=formatted_name)
    print(f"[OK] LLM updated to: {formatted_name}")


def build_index(documents, max_retries=3):
    """Create a vector index from documents and save to disk with rate-limit retries."""
    for attempt in range(1, max_retries + 1):
        try:
            index = VectorStoreIndex.from_documents(documents, show_progress=True)
            INDEX_DIR.mkdir(parents=True, exist_ok=True)
            index.storage_context.persist(persist_dir=str(INDEX_DIR))
            print(f"[OK] Index saved to {INDEX_DIR}")
            return index
        except Exception as e:
            if ("ResourceExhausted" in str(e) or "429" in str(e) or "Quota" in str(e)) and attempt < max_retries:
                wait_time = attempt * 20
                print(f"[WARN] Gemini Rate limit hit. Waiting {wait_time}s before retry ({attempt}/{max_retries})...")
                time.sleep(wait_time)
            else:
                raise e


def load_index():
    """Load a previously saved index from disk."""
    if not INDEX_DIR.exists():
        return None

    storage_context = StorageContext.from_defaults(persist_dir=str(INDEX_DIR))
    index = load_index_from_storage(storage_context)
    print(f"[OK] Index loaded from {INDEX_DIR}")
    return index


def get_query_engine(index):
    """Create a query engine from the index."""
    return index.as_query_engine(
        similarity_top_k=3,
        response_mode="compact",
    )
