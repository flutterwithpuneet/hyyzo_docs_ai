"""
Document Loader — Load all .md and .txt files from docs/ folder.
"""

from pathlib import Path
from llama_index.core import SimpleDirectoryReader


def load_documents(docs_dir: str | Path):
    """Load all markdown and text files from the given directory."""
    docs_path = Path(docs_dir)

    if not docs_path.exists():
        raise FileNotFoundError(f"Docs directory not found: {docs_path}")

    reader = SimpleDirectoryReader(
        input_dir=str(docs_path),
        required_exts=[".md", ".txt"],
        recursive=True,
    )

    documents = reader.load_data()
    print(f"[OK] Loaded {len(documents)} documents from {docs_path}")
    return documents
