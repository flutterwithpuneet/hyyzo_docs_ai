# Hyyzo Flutter App

## Overview

The Hyyzo mobile app is built with Flutter for cross-platform support (Android & iOS) from a single codebase.

## Tech Stack

- **Framework**: Flutter 3.x (Dart)
- **State Management**: Riverpod
- **Navigation**: GoRouter
- **HTTP Client**: Dio
- **Local Storage**: Hive, SharedPreferences
- **UI Components**: Material 3 Design

## Project Structure

```
lib/
├── main.dart
├── app/
│   ├── router.dart
│   └── theme.dart
├── features/
│   ├── auth/
│   ├── chat/
│   ├── documents/
│   ├── rewards/           # Rewards, Coins, Scratch Cards & Cashback
│   └── settings/
├── core/
│   ├── api/
│   ├── models/
│   └── utils/
└── shared/
    └── widgets/
```

## Key Features

- **AI Chat Interface** — Ask questions to Hyyzo AI with real-time streaming responses.
- **Document Upload** — Upload .md, .txt, .pdf files directly from mobile.
- **Offline Mode** — Cached responses available without internet.
- **Push Notifications** — Alerts for document processing completion.
- **Dark/Light Theme** — Full Material 3 theming support.

## API Integration

The Flutter app communicates with the backend via REST APIs:

- `POST /api/auth/login` — User authentication
- `POST /api/documents/upload` — Upload documents
- `POST /api/chat/query` — Send a question to the AI
- `GET /api/chat/history` — Fetch chat history

## Build & Release

- Android: `flutter build apk --release`
- iOS: `flutter build ipa --release`
- CI/CD: GitHub Actions for automated builds
