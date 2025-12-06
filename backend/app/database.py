# backend/app/database.py

from supabase import create_client, Client, ClientOptions
from app.config import settings
import logging
from fastapi import Request
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Database:
    """Database wrapper for Supabase client (Singleton pattern)."""
    _client: Client = None

    @classmethod
    def get_client(cls, access_token: Optional[str] = None) -> Client:
        """
        Get Supabase client, optionally with user access token.

        Args:
            access_token: Optional JWT token for authenticated requests

        Returns:
            Supabase client instance
        """
        if access_token:
            # Create a new client with the user's access token for authenticated requests
            try:
                options = ClientOptions(
                    headers={
                        "Authorization": f"Bearer {access_token}"
                    }
                )
                client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_KEY,
                    options=options
                )
                logger.info("Supabase client created with user token.")
                return client
            except Exception as e:
                logger.error(f"Failed to create Supabase client with token: {e}")
                raise

        # Return singleton client for non-authenticated requests
        if cls._client is None:
            try:
                options = ClientOptions()
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


def get_db_with_token(request: Request) -> Client:
    """
    Dependency function to get database client with user's access token.
    Extracts the token from the Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.replace("Bearer ", "")
        return Database.get_client(access_token=access_token)
    return Database.get_client()
