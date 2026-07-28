# Hyyzo Backend

## Overview

The Hyyzo backend is a Python-based REST API built with FastAPI. It handles authentication, document management, AI processing, and data storage.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.13
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL
- **Vector DB**: ChromaDB
- **AI Framework**: LlamaIndex + Gemini
- **Task Queue**: Celery + RabbitMQ
- **Cache**: Redis
- **Auth**: JWT + OAuth2

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create new account
- `POST /api/auth/login` — Login, returns JWT token
- `POST /api/auth/refresh` — Refresh expired token

### Documents
- `POST /api/documents/upload` — Upload one or more files
- `GET /api/documents` — List all user documents
- `DELETE /api/documents/{id}` — Delete a document
- `GET /api/documents/{id}/status` — Check processing status

### Chat
- `POST /api/chat/query` — Ask a question (returns AI answer + sources)
- `GET /api/chat/history` — Get past conversations
- `DELETE /api/chat/history` — Clear chat history

### Analytics
- `GET /api/analytics/overview` — Usage stats
- `GET /api/analytics/queries` — Popular queries

## Document Processing Pipeline

1. User uploads file via API.
2. File is validated (type, size, content).
3. File is stored in object storage (S3 / local).
4. Celery task is created for async processing.
5. Document is chunked and embedded via LlamaIndex + Gemini.
6. Vectors are stored in ChromaDB.
7. User is notified processing is complete.

## Environment Variables

| Variable          | Description                    |
|-------------------|--------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string   |
| `REDIS_URL`       | Redis connection string        |
| `GOOGLE_API_KEY`  | Gemini API key                 |
| `JWT_SECRET`      | Secret for JWT tokens          |
| `CELERY_BROKER`   | RabbitMQ broker URL            |

## Running Locally

```bash
# Start dependencies
docker-compose up -d postgres redis rabbitmq

# Run API server
uvicorn app.main:app --reload --port 8000

# Run Celery worker
celery -A app.worker worker --loglevel=info
```
