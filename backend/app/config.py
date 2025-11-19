# backend/app/config.py

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses pydantic-settings for automatic loading from .env file.
    """
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Paystack Configuration
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_PUBLIC_KEY: str

    # Email Configuration
    EMAIL_API_KEY: str
    EMAIL_FROM: str

    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file


# Create a global settings instance
settings = Settings()