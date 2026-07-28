# 🤖 Hyyzo Docs AI

> A production-ready, document-based AI knowledge assistant powered by **LlamaIndex** and **Retrieval Augmented Generation (RAG)**.

Hyyzo Docs AI reads your knowledge base (Markdown, text, and PDF files), creates semantic embeddings, builds a persistent vector index, and answers user questions **grounded exclusively in your documents** — with source references.

---

## ✨ Features

- **Multi-format ingestion** — `.md`, `.txt` (`.pdf` coming soon).
- **Local embeddings** — runs offline using HuggingFace sentence-transformers.
- **Persistent vector index** — build once, query instantly.
- **Source-referenced answers** — every response cites the originating document.
- **Configurable** — environment variables for all tunables.
- **Production logging** — structured console + file logging.
- **Modular architecture** — loader → embedder → index → chat engine.

---

## 📂 Project Structure

```
hyyzo_docs_ai/
│
├── README.md
├── .gitignore
├── requirements.txt
├── .env.example
│
├── data/
│   ├── raw/                    # Uploaded raw files
│   │   ├── documents/
│   │   ├── markdown/
│   │   └── text/
│   └── processed/
│       └── embeddings/         # Persisted vector index
│
├── docs/                       # Knowledge documents (your content)
│   ├── about_hyyzo.md
│   ├── products.md
│   ├── features.md
│   ├── faq.md
│   ├── support.md
│   └── glossary.md
│
├── src/
│   ├── config.py               # Settings & logging
│   ├── loaders/
│   │   └── document_loader.py  # File ingestion
│   ├── embeddings/
│   │   └── embedding_model.py  # Embedding pipeline
│   ├── index/
│   │   └── vector_index.py     # Vector store management
│   └── chatbot/
│       └── chat_engine.py      # Query & chat interface
│
├── tests/
│   └── test_index.py
│
└── logs/                       # Application logs
```

---

## 🚀 Quick Start

### Prerequisites

- Python **3.13+**
- (Optional) OpenAI API key — only needed for LLM-powered answers

### 1. Clone & enter the project

```bash
git clone <repo-url>
cd hyyzo_docs_ai
```

### 2. Create a virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY (if using OpenAI)
```

### 5. Add your documents

Place `.md` and `.txt` files in the `docs/` directory. Sample documents are included.

### 6. Run the assistant

```bash
python -m src.chatbot.chat_engine
```

---

## ⚙️ Configuration

All settings are managed via environment variables (`.env` file). See [`.env.example`](.env.example) for the full list.

| Variable               | Default                                      | Description                         |
|------------------------|----------------------------------------------|-------------------------------------|
| `OPENAI_API_KEY`       | —                                            | OpenAI API key (optional)           |
| `EMBEDDING_MODEL_NAME` | `sentence-transformers/all-MiniLM-L6-v2`     | HuggingFace embedding model         |
| `EMBEDDING_DIMENSION`  | `384`                                        | Vector dimension                    |
| `LLM_MODEL_NAME`       | `gpt-4o-mini`                                | LLM for answer generation           |
| `LLM_TEMPERATURE`      | `0.1`                                        | Sampling temperature                |
| `LLM_MAX_TOKENS`       | `1024`                                       | Max response tokens                 |
| `DOCS_DIRECTORY`       | `docs`                                       | Path to knowledge documents         |
| `CHUNK_SIZE`           | `512`                                        | Tokens per chunk                    |
| `CHUNK_OVERLAP`        | `64`                                         | Overlap between chunks              |
| `INDEX_PERSIST_DIR`    | `data/processed/embeddings`                  | Vector index storage path           |
| `LOG_LEVEL`            | `INFO`                                       | Logging verbosity                   |

---

## 🧪 Testing

```bash
pytest tests/ -v --tb=short
```

---

## 🗺️ Roadmap

- [x] Phase 1 — Project structure, config, environment setup
- [ ] Phase 2 — Document loader & ingestion pipeline
- [ ] Phase 3 — Embedding pipeline & vector index
- [ ] Phase 4 — Chat engine & Q&A flow
- [ ] Phase 5 — Testing, hardening, deployment prep

---

## 📄 License

MIT

---

Built with ❤️ by the Hyyzo team.
