"""
Hyyzo Docs AI — FastAPI REST API Server for Next.js Frontend
Run: python server.py
"""

import os
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.config import DOCS_DIR
from src.loader import load_documents
from src.engine import setup_models, build_index, load_index, get_query_engine, set_active_llm

app = FastAPI(title="Hyyzo Docs AI API", version="1.0.0")

# CORS middleware for Next.js cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Query Engine instance
global_query_engine = None
current_model_name = "gemini-2.0-flash"

def init_engine():
    global global_query_engine
    try:
        setup_models()
        index = load_index()
        if index is None:
            print("[INFO] Index not found. Building index from docs directory...")
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
        global_query_engine = get_query_engine(index)
        print("[OK] RAG Query Engine initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize engine: {e}")

@app.on_event("startup")
def on_startup():
    init_engine()

class QueryRequest(BaseModel):
    question: str
    model: Optional[str] = "gemini-2.0-flash"

class SourceItem(BaseModel):
    file: str
    score: str
    snippet: Optional[str] = ""

class ModelRequest(BaseModel):
    model: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceItem]

@app.post("/api/set-model")
def set_model(req: ModelRequest):
    try:
        set_active_llm(req.model)
        return {"status": "success", "model": req.model}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@app.get("/")
def root():
    return {
        "message": "Welcome to Hyyzo Docs AI Backend API",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "engine_ready": global_query_engine is not None,
        "message": "Hyyzo Docs AI RAG Server is active"
    }

@app.post("/api/query", response_model=QueryResponse)
def query_rag(req: QueryRequest):
    global global_query_engine, current_model_name
    if global_query_engine is None:
        init_engine()
        if global_query_engine is None:
            raise HTTPException(status_code=500, detail="RAG Engine is not initialized. Please verify GOOGLE_API_KEY in .env.")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        if req.model and req.model != current_model_name:
            set_active_llm(req.model)
            current_model_name = req.model

        response = global_query_engine.query(req.question)
        answer_text = str(response)

        sources = []
        if hasattr(response, "source_nodes") and response.source_nodes:
            for node in response.source_nodes:
                file_name = node.metadata.get("file_name", "Unknown document")
                score_val = f"{node.score:.2f}" if node.score is not None else "N/A"
                text_snippet = node.get_text()[:200] if hasattr(node, "get_text") else ""
                sources.append(SourceItem(file=file_name, score=score_val, snippet=text_snippet))

        return QueryResponse(answer=answer_text, sources=sources)
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@app.post("/api/reindex")
def reindex_docs():
    global global_query_engine
    try:
        documents = load_documents(DOCS_DIR)
        index = build_index(documents)
        global_query_engine = get_query_engine(index)
        return {"status": "success", "message": f"Successfully re-indexed {len(documents)} documents."}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Re-indexing failed: {str(ex)}")

@app.get("/api/docs-list")
def list_docs():
    docs_path = Path(DOCS_DIR)
    if not docs_path.exists():
        return {"files": []}

    files = []
    for file_path in docs_path.rglob("*"):
        if file_path.is_file() and file_path.suffix in [".md", ".txt"]:
            rel_path = str(file_path.relative_to(docs_path)).replace("\\", "/")
            files.append({
                "name": file_path.name,
                "path": rel_path,
                "size_bytes": file_path.stat().st_size
            })

    return {"files": files}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
