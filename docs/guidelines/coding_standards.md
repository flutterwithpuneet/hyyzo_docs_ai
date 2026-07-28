# Hyyzo Development Guidelines

## Code Style & Standards

- **Python**: Follow PEP 8 guidelines. Use type hints for function arguments and return values.
- **Dart/Flutter**: Follow official Effective Dart recommendations.
- **TypeScript/React**: Use strict TypeScript definitions. Prefer functional components and hooks.

## Git Workflow

- **Branch Naming**:
  - `feat/feature-name` for new features
  - `fix/bug-name` for bug fixes
  - `docs/doc-update` for documentation changes
- **Commit Messages**: Follow Conventional Commits format (`feat: ...`, `fix: ...`, `chore: ...`).

## Security Guidelines

- Never commit API keys, secrets, or passwords.
- Store sensitive values in environment variables (`.env`).
- Always validate and sanitize user input before passing it to AI/database services.
