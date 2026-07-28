# Hyyzo Features

## Document Ingestion

- Supports Markdown (`.md`), plain text (`.txt`), and PDF (`.pdf`) files.
- Automatic chunking with configurable chunk size and overlap.
- Metadata extraction (filename, creation date, file type).

## Semantic Search

- Powered by sentence-transformer embeddings (runs locally, no API needed).
- Vector similarity search using LlamaIndex.
- Returns the most relevant document chunks for any query.

## AI-Powered Answers

- Uses a large language model to synthesise answers from retrieved chunks.
- Every answer includes source references so users can verify.
- Configurable temperature and token limits for response control.

## Persistent Index

- Vector index is saved to disk after initial creation.
- Subsequent queries load the pre-built index instantly — no re-embedding.
- Supports incremental updates when new documents are added.

## Logging & Observability

- Structured logging to console and rotating log files.
- Query latency tracking.
- Error tracing for debugging ingestion and retrieval issues.

## Security

- API keys stored in environment variables, never hard-coded.
- No user data leaves the local environment unless an external LLM is configured.
- Supports air-gapped deployments with local-only models.
