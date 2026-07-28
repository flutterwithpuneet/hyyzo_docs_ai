"""
Hyyzo Docs AI — Main entry point.
Run: py main.py
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == "win32":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from src.config import DOCS_DIR, INDEX_DIR
from src.loader import load_documents
from src.engine import setup_models, build_index, load_index, get_query_engine


def main():
    print("\n[Hyyzo Docs AI]")
    print("=" * 40)

    # 1. Setup Gemini models
    setup_models()

    # 2. Load or build index
    index = load_index()

    if index is None:
        print("\nBuilding index from documents...")
        documents = load_documents(DOCS_DIR)
        index = build_index(documents)
    else:
        print("\nUsing existing index.")

    # 3. Create query engine
    engine = get_query_engine(index)

    # 4. Chat loop
    print("\nAsk anything about Hyyzo (type 'quit' to exit)\n")

    while True:
        question = input("You: ").strip()

        if not question:
            continue
        if question.lower() in ("quit", "exit", "q"):
            print("Bye!")
            break

        response = engine.query(question)

        print(f"\nBot: {response}\n")

        # Show sources
        if response.source_nodes:
            print("Sources:")
            for node in response.source_nodes:
                filename = node.metadata.get("file_name", "unknown")
                score = f"{node.score:.2f}" if node.score else "N/A"
                print(f"   - {filename} (score: {score})")
            print()


if __name__ == "__main__":
    main()
