"""
Smoke and unit tests for Hyyzo Docs AI Python pipeline.
"""

import sys
from pathlib import Path
import pytest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def test_config_defaults():
    """Verify configuration loads properly with default settings."""
    from src.config import PROJECT_ROOT, LLM_MODEL, EMBEDDING_MODEL, CHUNK_SIZE, CHUNK_OVERLAP, DOCS_DIR
    assert PROJECT_ROOT.exists()
    assert LLM_MODEL is not None
    assert EMBEDDING_MODEL is not None
    assert CHUNK_SIZE > 0
    assert CHUNK_OVERLAP >= 0
    assert DOCS_DIR.exists()


def test_docs_loader_structure(tmp_path):
    """Verify document loader properly scans and parses documents."""
    from src.loader import load_documents
    
    # Create sample dummy doc in temp directory
    test_doc = tmp_path / "sample.md"
    test_doc.write_text("# Test Document\n\nThis is a sample markdown test document for CI.")
    
    docs = load_documents(tmp_path)
    assert len(docs) == 1
    assert "Test Document" in docs[0].text


def test_fastapi_server_routes():
    """Verify FastAPI server initializes with expected API routes."""
    from server import app
    
    route_paths = [route.path for route in app.routes]
    assert "/" in route_paths
    assert "/api/health" in route_paths
    assert "/api/query" in route_paths
    assert "/api/set-model" in route_paths
    assert "/api/reindex" in route_paths
    assert "/api/docs-list" in route_paths
    assert "/api/doc-content" in route_paths


def test_docs_directory_integrity():
    """Verify the docs directory contains markdown files."""
    from src.config import DOCS_DIR
    md_files = list(DOCS_DIR.rglob("*.md"))
    assert len(md_files) > 0, "No markdown documentation files found in docs/"
