# Hyyzo Architecture

## Overview

Hyyzo follows a modern, scalable microservices architecture designed for high availability and performance.

## System Design

```
Client (Flutter App / Web)
        |
    API Gateway
        |
  ┌─────┼─────┐
  │     │     │
Auth  Docs   AI
Svc   Svc   Svc
  │     │     │
  └─────┼─────┘
        |
   PostgreSQL + Vector DB
```

## Key Components

- **API Gateway** — Routes requests, handles rate limiting, authentication.
- **Auth Service** — User authentication, JWT tokens, OAuth2 support.
- **Docs Service** — Document upload, storage, metadata management.
- **AI Service** — RAG pipeline, embedding generation, query processing.
- **Database** — PostgreSQL for structured data, vector DB for embeddings.

## Tech Stack

| Layer       | Technology                  |
|-------------|----------------------------|
| Frontend    | Flutter (mobile), React (web) |
| API Gateway | FastAPI                     |
| Backend     | Python, FastAPI             |
| AI/ML       | LlamaIndex, Gemini          |
| Database    | PostgreSQL, ChromaDB        |
| Cache       | Redis                       |
| Queue       | Celery + RabbitMQ           |
| Deployment  | Docker, Kubernetes          |

## Design Principles

- **Separation of Concerns** — Each service has a single responsibility.
- **Stateless Services** — All services are stateless; state lives in the database.
- **API-First** — All communication happens through REST/gRPC APIs.
- **Horizontal Scaling** — Any service can be scaled independently.
