# Frequently Asked Questions

## General

### What is Hyyzo Docs AI?

Hyyzo Docs AI is a document-based AI assistant that reads your knowledge files (Markdown, text, PDF) and answers questions using Retrieval Augmented Generation (RAG). It only answers based on the documents you provide — no internet search, no hallucinations.

### Do I need an OpenAI API key?

An OpenAI API key is required only if you want to use OpenAI models (e.g., GPT-4o-mini) for answer generation. Embeddings run locally using HuggingFace sentence-transformers and do **not** require any API key.

### What file formats are supported?

Currently supported: `.md` (Markdown) and `.txt` (plain text). PDF support (`.pdf`) is planned for a future release.

## Technical

### How are documents processed?

1. Files are loaded from the `docs/` directory.
2. Each file is split into chunks (default 512 tokens, 64 token overlap).
3. Chunks are embedded using a local sentence-transformer model.
4. Embeddings are stored in a vector index on disk.
5. At query time, the most relevant chunks are retrieved and passed to the LLM.

### Can I add new documents without re-indexing everything?

Yes. The system supports incremental index updates. Add new files to `docs/` and re-run the ingestion pipeline — only new documents are processed.

### Where is the index stored?

By default, the index is persisted to `data/processed/embeddings/`. You can change this via the `INDEX_PERSIST_DIR` environment variable.

## Troubleshooting

### The assistant says "I don't have enough information to answer."

This means the retrieved document chunks did not contain information relevant to your question. Try:

- Adding more detailed documents to the `docs/` folder.
- Rephrasing your question.
- Lowering the similarity threshold (advanced).

### I get an "OPENAI_API_KEY not set" error.

Set the key in your `.env` file:

```
OPENAI_API_KEY=sk-...
```

If you don't have an OpenAI key, you can use a local LLM instead (future feature).
