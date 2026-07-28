# 🤖 Hyyzo Docs AI — Beginner-Friendly Project Documentation

Welcome to **Hyyzo Docs AI**! This complete step-by-step guide is written for new developers who have never seen this project before. It will help you understand what the project is, how it works, how to install it, and how to run both the CLI and Streamlit Web interfaces.

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Project Architecture](#2-project-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Technologies Used](#4-technologies-used)
5. [Required Dependencies](#5-required-dependencies)
6. [Environment Setup](#6-environment-setup)
7. [Installation](#7-installation)
8. [Running the Project](#8-running-the-project)
9. [Plugins / Models / Services](#9-plugins--models--services)
10. [Storage](#10-storage)
11. [Adding New Documentation](#11-adding-new-documentation)
12. [Troubleshooting](#12-troubleshooting)
13. [Useful Commands](#13-useful-commands)
14. [Project Summary & 5-Minute Quick Start](#14-project-summary--5-minute-quick-start)

---

## 1. Project Overview

### What is Hyyzo Docs AI?
**Hyyzo Docs AI** is an intelligent, document-grounded AI Assistant built using **Retrieval-Augmented Generation (RAG)**. It ingests local Markdown (`.md`) and plain text (`.txt`) documentation from the project and answers user questions strictly based on those files.

### What problem does it solve?
As codebases and technical documentation grow, searching manually for specific features, architecture rules, API endpoints, or user guides becomes time-consuming. Hyyzo Docs AI allows developers and team members to ask questions in natural language and receive instant, accurate answers backed by direct citations/source file references.

### How does it work at a high level?
1. **Reads Documents**: Reads all `.md` and `.txt` files inside the `docs/` folder.
2. **Generates Vector Embeddings**: Converts text blocks into numerical representations (vector embeddings) using Google's Gemini Embedding model (`text-embedding-004`).
3. **Stores Vector Index**: Saves vector data locally inside the `storage/` directory.
4. **Retrieves & Answers**: When a user asks a question, it finds the most relevant document sections, passes them to Google's Gemini LLM (`gemini-2.0-flash` or `gemini-1.5-flash`), and returns a grounded answer alongside document citations.

---

## 2. Project Architecture

### Workflow from User Query to AI Response
```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│   User Input    │ ────> │  Vector Search       │ ────> │ Relevant Chunks        │
│ ("How to redeem │       │  (Compares query with│       │ (Docs from storage/)   │
│  cashback?")    │       │   embeddings)        │       │                        │
└─────────────────┘       └──────────────────────┘       └───────────┬────────────┘
                                                                     │
                                                                     ▼
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│ Formatted Answer│ <──── │ Google Gemini LLM    │ <──── │ Prompt Context + Query │
│ + File Sources  │       │ (Generates response) │       │ (Combined by LlamaIndex│
└─────────────────┘       └──────────────────────┘       └────────────────────────┘
```

### Major Components & Interactions
1. **Document Loader (`src/loader.py`)**: Uses `SimpleDirectoryReader` from LlamaIndex to parse files inside `docs/`.
2. **AI Model Config (`src/config.py` & `src/engine.py`)**: Configures the LLM (`gemini-2.0-flash`) and Embedding Model (`text-embedding-004`) using `GOOGLE_API_KEY`.
3. **Vector Index Engine (`src/engine.py`)**: Builds a `VectorStoreIndex` from loaded documents and handles persistent storage inside `storage/`.
4. **User Interfaces**:
   - **CLI Mode (`main.py`)**: A command-line chat loop.
   - **Streamlit Web UI (`app.py`)**: A web interface featuring custom CSS glassmorphism, multi-chat session history in the sidebar, and quick starter prompts.

---

## 3. Folder Structure

```text
hyyzo_docs_ai/
│
├── .env                  # Environment configuration (API Keys & Settings) [DO NOT COMMIT]
├── .env.example          # Template for required environment variables
├── .gitignore            # Git ignore rules (excludes venv, storage, .env)
├── README.md             # Project README documentation
├── requirements.txt      # Python dependencies list
│
├── app.py                # Streamlit Web Application entry point
├── main.py               # CLI Terminal Chat entry point
│
├── docs/                 # Knowledge Base Folder (Markdown & Text documents)
│   ├── about_hyyzo.md
│   ├── faq.md
│   ├── features.md
│   ├── products.md
│   └── frontend/
│       └── flutter/
│           ├── rewards_architecture.md
│           ├── rewards_feature.md
│           └── rewards_gamification.md
│
├── src/                  # Core Python Source Package
│   ├── __init__.py       # Package initialization
│   ├── config.py         # App configuration & environment loader
│   ├── engine.py         # LlamaIndex setup, indexing & RAG query engine
│   └── loader.py         # Document reader utility
│
├── storage/              # Generated Vector Index Storage (Auto-created)
│   ├── docstore.json
│   ├── index_store.json
│   └── vector_store.json
│
└── venv/                 # Python Virtual Environment (Local isolated packages)
```

### Purpose of Key Folders & Files
- **`app.py`**: Web interface powered by Streamlit. Contains session history, sidebar controls, CSS styling, and user chat UI.
- **`main.py`**: Command-line application. Allows querying the AI directly inside a terminal.
- **`docs/`**: The knowledge base directory. Drop any `.md` or `.txt` file here for the AI to read.
- **`src/config.py`**: Reads `.env` variables (e.g., API keys, model names, chunk sizes).
- **`src/engine.py`**: Initializes Gemini models, creates or loads vector indexes from `storage/`, and returns the RAG query engine.
- **`src/loader.py`**: Recursively scans and loads files from `docs/`.
- **`storage/`**: Stores indexed vector embeddings on disk so the system doesn't re-index files on every start.

---

## 4. Technologies Used

- **Python Version**: Python 3.10+ (Python 3.11/3.12 recommended).
- **LlamaIndex (`llama-index-core`)**: The RAG orchestration framework connecting documents, embeddings, vector storage, and Gemini.
- **Google Gemini API**:
  - **LLM**: `models/gemini-2.0-flash` (Generates natural language answers based on retrieved context).
  - **Embedding Model**: `models/text-embedding-004` (Converts text into 768-dimensional numerical vector representations).
- **Vector Storage**: LlamaIndex's built-in local JSON Vector Store (`SimpleVectorStore`).
- **Streamlit**: Web application framework used for building the browser UI (`app.py`).

---

## 5. Required Dependencies

| Package | Purpose |
| :--- | :--- |
| `llama-index-core` | Core framework for document loading, indexing, and RAG query generation. |
| `llama-index-readers-file` | File readers for parsing `.md`, `.txt`, `.pdf`, `.docx` files into LlamaIndex documents. |
| `llama-index-llms-gemini` | Integration plugin for Google Gemini Large Language Models. |
| `llama-index-embeddings-gemini` | Integration plugin for Google Gemini text embedding models (`text-embedding-004`). |
| `python-dotenv` | Loads environment variables from the local `.env` file into system memory. |
| `streamlit` | Modern Python web application framework for rendering the UI. |

---

## 6. Environment Setup

### Prerequisites
1. Install **Python 3.10 or higher**: Download from [python.org](https://www.python.org/downloads/).
2. Obtain a **Google Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click **Get API Key** -> **Create API Key**.
   - Copy the key.

### Configuring `.env` File
1. In the project root directory, copy `.env.example` to create `.env`:
   - **Windows (PowerShell)**: `copy .env.example .env`
   - **Linux/Mac**: `cp .env.example .env`
2. Open `.env` in a text editor and paste your key:

```env
GOOGLE_API_KEY=your_actual_gemini_api_key_here
LLM_MODEL=models/gemini-2.0-flash
EMBEDDING_MODEL=models/text-embedding-004
DOCS_DIR=docs
CHUNK_SIZE=512
INDEX_DIR=storage
```

---

## 7. Installation

Follow these step-by-step terminal commands from the project root directory:

### Step 1: Open Terminal in Project Directory
Ensure your terminal prompt is inside `hyyzo_docs_ai`.

### Step 2: Create a Virtual Environment
```bash
# Windows
py -m venv venv

# macOS / Linux
python3 -m venv venv
```
*Why?* Creates an isolated Python workspace so packages don't conflict with other projects.

### Step 3: Activate Virtual Environment
```bash
# Windows (PowerShell)
.\venv\Scripts\activate

# Windows (Command Prompt)
venv\Scripts\activate.bat

# macOS / Linux
source venv/bin/activate
```
*(You should now see `(venv)` at the beginning of your terminal command line).*

### Step 4: Upgrade Pip & Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
*Why?* Downloads and installs LlamaIndex, Gemini plugins, Streamlit, and dotenv.

---

## 8. Running the Project

### Option A: Run Streamlit Web Application (Recommended)
Launch the interactive web UI:

```bash
py -m streamlit run app.py
```
*or on macOS/Linux:*
```bash
streamlit run app.py
```
- **What it does**: Starts a local web server at `http://localhost:8501`, loads/builds the index, and opens the browser interface.

### Option B: Run CLI Terminal Chat Mode
Query the assistant directly inside your command line:

```bash
py main.py
```
- **What it does**: Initializes models, loads the index, and opens an interactive chat prompt `You: ` inside your terminal.

---

## 9. Plugins / Models / Services

| Service / Model | Role | Configuration |
| :--- | :--- | :--- |
| **Gemini 2.0 Flash** (`models/gemini-2.0-flash`) | Generates answer text from retrieved chunks. | Configured via `LLM_MODEL` in `.env`. |
| **Gemini Embedding** (`models/text-embedding-004`) | Converts document chunks & queries into vectors. | Configured via `EMBEDDING_MODEL` in `.env`. |
| **Google AI Studio Service** | Cloud API serving model inference. | Configured via `GOOGLE_API_KEY` in `.env`. |

---

## 10. Storage

The `storage/` directory is automatically generated when the application runs for the first time. It contains:
- `docstore.json`: Serialized document nodes.
- `index_store.json`: Index structure metadata.
- `vector_store.json`: Numerical vector embeddings of all document chunks.

### When should `storage/` be deleted or regenerated?
- **Delete `storage/` if**:
  - You added, edited, or removed files inside `docs/` and want a clean re-indexing.
  - You changed `CHUNK_SIZE` or `EMBEDDING_MODEL` in `.env`.
- **How to regenerate**:
  - Simply delete the `storage/` folder manually or click **"🔄 Re-index Documents"** in the Streamlit sidebar. The app will automatically rebuild it on the next run.

---

## 11. Adding New Documentation

To add new documents for the AI to read:

1. **Place Files**: Add any `.md` or `.txt` file into the `docs/` folder (or subdirectories like `docs/frontend/`, `docs/backend/`).
2. **Re-index**:
   - **Streamlit**: Click **"🔄 Re-index Documents"** in the sidebar.
   - **CLI**: Delete the `storage/` directory and run `py main.py`.
3. **Ask**: The AI will immediately start utilizing knowledge from the new files.

---

## 12. Troubleshooting

| Error / Issue | Probable Cause | Solution |
| :--- | :--- | :--- |
| `ValueError: GOOGLE_API_KEY environment variable not set` | Missing `.env` file or API key is blank. | Create `.env` from `.env.example` and set `GOOGLE_API_KEY`. |
| `ModuleNotFoundError: No module named 'llama_index'` | Virtual environment not activated or packages not installed. | Run `.\venv\Scripts\activate` followed by `pip install -r requirements.txt`. |
| `Rate Limit Exceeded (429)` | Gemini free tier API quota exceeded (15 RPM). | Wait 60 seconds before submitting a new query, or upgrade API quota. |
| AI gives incorrect/outdated answers | `storage/` index is stale after modifying files in `docs/`. | Delete `storage/` folder or click **Re-index Documents** in Streamlit. |

---

## 13. Useful Commands

| Task | Command (Windows) | Command (macOS/Linux) |
| :--- | :--- | :--- |
| **Check Python version** | `py --version` | `python3 --version` |
| **Create Virtual Env** | `py -m venv venv` | `python3 -m venv venv` |
| **Activate Virtual Env** | `.\venv\Scripts\activate` | `source venv/bin/activate` |
| **Install Dependencies** | `pip install -r requirements.txt` | `pip install -r requirements.txt` |
| **Run Streamlit Web UI** | `py -m streamlit run app.py` | `streamlit run app.py` |
| **Run CLI Chat** | `py main.py` | `python3 main.py` |
| **Re-index Knowledge Base** | `Remove-Item -Recurse -Force storage` | `rm -rf storage` |

---

## 14. Project Summary & 5-Minute Quick Start

### Simple Summary for New Developers
**Hyyzo Docs AI** is an offline-first knowledge retrieval bot. You put markdown documentation into `docs/`, it indexes them into vectors using Google Gemini, and allows you to chat with your documentation via a command line or a Streamlit web interface.

### ⚡ 5-Minute Quick Start Guide
```bash
# 1. Clone repository & enter directory
git clone https://github.com/flutterwithpuneet/hyyzo_docs_ai-.git
cd hyyzo_docs_ai-

# 2. Create and activate virtual environment
py -m venv venv
.\venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Set your API Key
copy .env.example .env
# Edit .env and set GOOGLE_API_KEY=your_gemini_api_key

# 5. Run the Streamlit Web Application!
py -m streamlit run app.py
```

