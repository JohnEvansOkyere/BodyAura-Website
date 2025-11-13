# backend/app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.database import get_db
from app.models.schemas import (
    UserCreate, UserLogin, UserResponse, Token, 
    SuccessResponse, UserUpdate
)
from app.services.user_service import UserService
from app.utils.auth import create_access_token
from app.middleware.auth import get_current_user
from datetime import timedelta
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: Client = Depends(get_db)
):
    """
    Register a new user account.
    
    Args:
        user_data: User registration information
        db: Database client
        
    Returns:
        Token: JWT access token and user data
        
    Raises:
        HTTPException: If email already exists or validation fails
    """
    logger.info(f"New user signup attempt: {user_data.email}")
    
    # Create user
    user = await UserService.create_user(db, user_data)
    
    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User created successfully: {user.email}")
    
    return Token(access_token=access_token, user=user)


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Client = Depends(get_db)
):
    """
    Login with email and password.
    
    Args:
        credentials: User login credentials
        db: Database client
        
    Returns:
        Token: JWT access token and user data
        
    Raises:
        HTTPException: If credentials are invalid
    """
    logger.info(f"Login attempt: {credentials.email}")
    
    # Authenticate user
    user = await UserService.authenticate_user(db, credentials.email, credentials.password)
    
    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User logged in successfully: {user.email}")
    
    return Token(access_token=access_token, user=user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user from JWT token
        
    Returns:
        UserResponse: Current user data
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Update current user's profile information.
    
    Args:
        user_update: Updated user data
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        UserResponse: Updated user data
    """
    logger.info(f"User update: {current_user.email}")
    
    updated_user = await UserService.update_user(db, current_user.id, user_update)
    
    logger.info(f"User updated successfully: {current_user.email}")
    
    return updated_user


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Logout current user.
    
    Note: Since we're using stateless JWT tokens, logout is handled client-side
    by removing the token. This endpoint is mainly for consistency and potential
    future token blacklisting implementation.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        SuccessResponse: Success message
    """
    logger.info(f"User logout: {current_user.email}")
    
    return SuccessResponse(
        message="Logged out successfully. Please remove the token from client storage."
    )