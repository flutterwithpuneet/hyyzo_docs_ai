"""
Engine — Build vector index and query engine using Gemini.
"""

from pathlib import Path

from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.core import Settings
from llama_index.llms.gemini import Gemini
from llama_index.embeddings.gemini import GeminiEmbedding

from src.config import GOOGLE_API_KEY, LLM_MODEL, EMBEDDING_MODEL, INDEX_DIR, CHUNK_SIZE, CHUNK_OVERLAP


def setup_models():
    """Configure Gemini LLM and embedding model globally."""
    Settings.llm = Gemini(api_key=GOOGLE_API_KEY, model=LLM_MODEL)
    Settings.embed_model = GeminiEmbedding(api_key=GOOGLE_API_KEY, model_name=EMBEDDING_MODEL)
    Settings.chunk_size = CHUNK_SIZE
    Settings.chunk_overlap = CHUNK_OVERLAP
    print(f"[OK] Models configured: LLM={LLM_MODEL}, Embed={EMBEDDING_MODEL}")


def build_index(documents):
    """Create a vector index from documents and save to disk."""
    index = VectorStoreIndex.from_documents(documents)

    # Save to disk
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    index.storage_context.persist(persist_dir=str(INDEX_DIR))
    print(f"[OK] Index saved to {INDEX_DIR}")

    return index


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
