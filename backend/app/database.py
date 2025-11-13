# backend/app/database.py

from supabase import create_client, Client
from app.config import settings
import logging

# Configure logging
from supabase import create_client, Client, ClientOptions
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Database:
    """Database wrapper for Supabase client (Singleton pattern)."""
    _client: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            try:
                options = ClientOptions()  # Optional: customize if needed
                cls._client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY,
                    options=options
                )
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise
        return cls._client


def get_db() -> Client:
    """Dependency function to get the database client."""
    return Database.get_client()
