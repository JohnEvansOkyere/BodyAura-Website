# backend/app/database.py

from supabase import create_client, Client
from app.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Database:
    """
    Database wrapper for Supabase client.
    Provides a singleton instance of the Supabase client.
    """
    
    _client: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """
        Get or create Supabase client instance.
        
        Returns:
            Client: Supabase client instance
        """
        if cls._client is None:
            try:
                cls._client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY
                )
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {str(e)}")
                raise
        
        return cls._client


# Export a function to get the database client
def get_db() -> Client:
    """
    Dependency function to get database client.
    Can be used with FastAPI's Depends() for route injection.
    
    Returns:
        Client: Supabase client instance
    """
    return Database.get_client()