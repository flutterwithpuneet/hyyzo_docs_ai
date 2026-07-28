# Hyyzo Web App

## Overview

The Hyyzo web dashboard is a responsive single-page application for managing documents, chatting with the AI, and viewing analytics.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Build Tool**: Vite

## Key Pages

| Page         | Route            | Description                          |
|-------------|------------------|--------------------------------------|
| Login        | `/login`         | User authentication                  |
| Dashboard    | `/dashboard`     | Overview, stats, recent activity     |
| Chat         | `/chat`          | AI chat interface                    |
| Documents    | `/documents`     | Upload, list, manage documents       |
| Settings     | `/settings`      | Account and preferences              |

## Features

- **Real-time Chat** — WebSocket-based streaming AI responses.
- **Document Manager** — Drag-and-drop file upload with progress.
- **Analytics Dashboard** — Charts showing query patterns, document usage.
- **Responsive Design** — Works on desktop, tablet, and mobile browsers.
- **Keyboard Shortcuts** — Power user shortcuts for quick navigation.

## API Integration

Same REST API as the Flutter app:

- `POST /api/auth/login`
- `POST /api/documents/upload`
- `POST /api/chat/query`
- `GET /api/analytics/overview`

## Deployment

- Static hosting on Vercel or Netlify
- CDN for global performance
- Environment-based config (`.env.local`, `.env.production`)
