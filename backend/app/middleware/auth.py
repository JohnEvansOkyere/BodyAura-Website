# backend/app/middleware/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.auth import decode_access_token
from app.database import get_db
from app.models.schemas import UserResponse
from supabase import Client
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
) -> UserResponse:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        db: Supabase database client
        
    Returns:
        UserResponse: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token
    token = credentials.credentials
    
    # Decode token
    token_data = decode_access_token(token)
    if token_data is None or token_data.user_id is None:
        raise credentials_exception
    
    # Get user from database
    try:
        response = db.table("users").select("*").eq("id", token_data.user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise credentials_exception
        
        user_data = response.data[0]
        return UserResponse(**user_data)
        
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise credentials_exception


async def get_current_admin_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    """
    Dependency to verify the current user is an admin.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserResponse: Current admin user
        
    Raises:
        HTTPException: If user is not an admin
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    return current_user


def optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Client = Depends(get_db)
) -> Optional[UserResponse]:
    """
    Optional authentication - returns user if token is provided and valid, None otherwise.
    Useful for endpoints that work for both authenticated and non-authenticated users.
    
    Args:
        credentials: Optional HTTP Bearer token
        db: Supabase database client
        
    Returns:
        Optional[UserResponse]: User if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        token_data = decode_access_token(token)
        
        if token_data is None or token_data.user_id is None:
            return None
        
        response = db.table("users").select("*").eq("id", token_data.user_id).execute()
        
        if not response.data or len(response.data) == 0:
            return None
        
        user_data = response.data[0]
        return UserResponse(**user_data)
        
    except Exception as e:
        logger.error(f"Optional auth error: {str(e)}")
        return None