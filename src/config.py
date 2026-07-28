"""
hyyzo_docs_ai - Configuration Module
=====================================

Centralised configuration using pydantic-settings.
All values are loaded from environment variables / .env file
with sensible defaults for local development.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# ------------------------------------------------------------------ #
# Project Root (two levels up from src/config.py)
# ------------------------------------------------------------------ #
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application-wide settings populated from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- OpenAI ----------------------------------------------------- #
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API key. Required only when using OpenAI LLM/embeddings.",
    )

    # --- Embedding Model ------------------------------------------- #
    embedding_model_name: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="HuggingFace model ID for local embeddings.",
    )
    embedding_dimension: int = Field(
        default=384,
        description="Embedding vector dimension (must match chosen model).",
    )

    # --- LLM ------------------------------------------------------- #
    llm_model_name: str = Field(
        default="gpt-4o-mini",
        description="LLM model name used for answer generation.",
    )
    llm_temperature: float = Field(
        default=0.1,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for LLM responses.",
    )
    llm_max_tokens: int = Field(
        default=1024,
        gt=0,
        description="Maximum tokens in LLM response.",
    )

    # --- Document Settings ----------------------------------------- #
    docs_directory: str = Field(
        default="docs",
        description="Relative path (from project root) to knowledge documents.",
    )
    chunk_size: int = Field(
        default=512,
        gt=0,
        description="Number of tokens per document chunk.",
    )
    chunk_overlap: int = Field(
        default=64,
        ge=0,
        description="Token overlap between consecutive chunks.",
    )

    # --- Index Storage --------------------------------------------- #
    index_persist_dir: str = Field(
        default="data/processed/embeddings",
        description="Directory where the vector index is persisted.",
    )

    # --- Logging --------------------------------------------------- #
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL).",
    )
    log_dir: str = Field(
        default="logs",
        description="Directory for log files.",
    )

    # --- Computed / helper properties ------------------------------ #

    @property
    def docs_path(self) -> Path:
        """Absolute path to the knowledge-documents directory."""
        return PROJECT_ROOT / self.docs_directory

    @property
    def index_path(self) -> Path:
        """Absolute path to the persisted vector-index directory."""
        return PROJECT_ROOT / self.index_persist_dir

    @property
    def log_path(self) -> Path:
        """Absolute path to the log directory."""
        return PROJECT_ROOT / self.log_dir

    # --- Validators ------------------------------------------------ #

    @field_validator("log_level")
    @classmethod
    def _validate_log_level(cls, value: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = value.upper()
        if upper not in allowed:
            raise ValueError(f"log_level must be one of {allowed}, got '{value}'")
        return upper


# ------------------------------------------------------------------ #
# Singleton instance
# ------------------------------------------------------------------ #
settings = Settings()


# ------------------------------------------------------------------ #
# Logging bootstrap
# ------------------------------------------------------------------ #

def setup_logging() -> logging.Logger:
    """
    Configure the application-wide logger.

    Returns:
        Root logger configured with console + file handlers.
    """
    log_dir = settings.log_path
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("hyyzo_docs_ai")
    logger.setLevel(settings.log_level)

    # Prevent duplicate handlers on repeated calls
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(settings.log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler
    file_handler = logging.FileHandler(
        log_dir / "hyyzo_docs_ai.log",
        encoding="utf-8",
    )
    file_handler.setLevel(settings.log_level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    logger.info("Logger initialised  [level=%s]", settings.log_level)
    return logger
