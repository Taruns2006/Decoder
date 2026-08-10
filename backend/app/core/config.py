import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ATLANTIS"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET", "atlantis-deep-blue-ocean-secret-key-109283")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for demo persistence

    # Supabase (Optional, fallback to SQLite if not provided)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Database
    # If using Supabase directly, DATABASE_URL should be set. Otherwise, fallback to SQLite.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'atlantis.db').replace('\\\\', '/')}"
    )

    # AI Layer
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Mode
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

    class Config:
        case_sensitive = True

settings = Settings()
