"""Configuration management using Pydantic Settings."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: Optional[str] = None
    openai_api_key: str  # Using same env var name for Gemini API key
    openai_model: str = "gemini-2.5-flash"
    cors_origin: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

