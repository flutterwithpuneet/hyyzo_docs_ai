# Hyyzo Database Schema & Setup

## Overview

Hyyzo utilizes both relational (PostgreSQL) and vector databases (ChromaDB/pgvector) to manage user data, documents, and embeddings.

## Relational Schema (PostgreSQL)

### `users` Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `hashed_password` (VARCHAR)
- `created_at` (TIMESTAMP)

### `documents` Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `file_name` (VARCHAR)
- `file_type` (VARCHAR)
- `storage_path` (VARCHAR)
- `created_at` (TIMESTAMP)

## Vector Database (Embeddings)

- **Embeddings Model**: `models/gemini-embedding-001`
- **Collection Name**: `hyyzo_knowledge_base`
- **Metadata Fields**: `file_name`, `file_type`, `user_id`, `chunk_id`
