# 🤖 Hyyzo Docs AI

Document-based AI assistant powered by **LlamaIndex + Gemini RAG**.

Reads your Markdown/text knowledge files, creates embeddings, and answers questions based only on your documents.

---

## 📂 Structure

```
hyyzo_docs_ai/
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
├── docs/              ← Your knowledge documents
│   ├── about_hyyzo.md
│   ├── products.md
│   ├── features.md
│   ├── faq.md
│   ├── support.md
│   └── glossary.md
└── src/
    └── config.py      ← Configuration
```

---

## 🚀 Setup

```bash
# 1. Create venv
py -m venv venv
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure
copy .env.example .env
# Edit .env → add your GOOGLE_API_KEY

# 4. Run (coming in next phases)
py main.py
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `llama-index-core` | RAG engine, index, query |
| `llama-index-readers-file` | Read .md/.txt files |
| `llama-index-llms-gemini` | Gemini LLM for answers |
| `llama-index-embeddings-gemini` | Document → vector embeddings |
| `python-dotenv` | Load API key from .env |

---

## ⚙️ Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | — | Gemini API key (required) |
| `LLM_MODEL` | `models/gemini-2.0-flash` | Gemini model |
| `EMBEDDING_MODEL` | `models/text-embedding-004` | Embedding model |
| `DOCS_DIR` | `docs` | Knowledge documents path |
| `CHUNK_SIZE` | `512` | Tokens per chunk |
| `INDEX_DIR` | `storage` | Vector index storage |
