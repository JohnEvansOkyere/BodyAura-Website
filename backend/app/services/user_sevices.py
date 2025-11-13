# backend/app/services/user_service.py

from supabase import Client
from app.models.schemas import UserCreate, UserResponse, UserUpdate
from app.utils.auth import get_password_hash, verify_password
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service class for user-related business logic"""
    
    @staticmethod
    async def create_user(db: Client, user_data: UserCreate) -> UserResponse:
        """
        Create a new user account.
        
        Args:
            db: Supabase database client
            user_data: User registration data
            
        Returns:
            UserResponse: Created user data
            
        Raises:
            HTTPException: If email already exists or creation fails
        """
        try:
            # Check if email already exists
            existing = db.table("users").select("id").eq("email", user_data.email).execute()
            
            if existing.data and len(existing.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Hash password
            hashed_password = get_password_hash(user_data.password)
            
            # Prepare user data for insertion
            new_user = {
                "email": user_data.email,
                "password_hash": hashed_password,
                "full_name": user_data.full_name,
                "phone": user_data.phone,
                "is_admin": False  # Default to non-admin
            }
            
            # Insert user into database
            response = db.table("users").insert(new_user).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
            
            user = response.data[0]
            return UserResponse(**user)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
    
    @staticmethod
    async def authenticate_user(db: Client, email: str, password: str) -> UserResponse:
        """
        Authenticate a user with email and password.
        
        Args:
            db: Supabase database client
            email: User email
            password: Plain text password
            
        Returns:
            UserResponse: Authenticated user data
            
        Raises:
            HTTPException: If credentials are invalid
        """
        try:
            # Get user by email
            response = db.table("users").select("*").eq("email", email).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
            
            user_data = response.data[0]
            
            # Verify password
            if not verify_password(password, user_data["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
            
            return UserResponse(**user_data)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication failed"
            )
    
    @staticmethod
    async def get_user_by_id(db: Client, user_id: str) -> UserResponse:
        """
        Get user by ID.
        
        Args:
            db: Supabase database client
            user_id: User ID
            
        Returns:
            UserResponse: User data
            
        Raises:
            HTTPException: If user not found
        """
        try:
            response = db.table("users").select("*").eq("id", user_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            user_data = response.data[0]
            return UserResponse(**user_data)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user"
            )
    
    @staticmethod
    async def update_user(db: Client, user_id: str, user_update: UserUpdate) -> UserResponse:
        """
        Update user profile information.
        
        Args:
            db: Supabase database client
            user_id: User ID
            user_update: Updated user data
            
        Returns:
            UserResponse: Updated user data
            
        Raises:
            HTTPException: If update fails
        """
        try:
            # Build update dict with only provided fields
            update_data = {}
            if user_update.full_name is not None:
                update_data["full_name"] = user_update.full_name
            if user_update.phone is not None:
                update_data["phone"] = user_update.phone
            
            if not update_data:
                # No fields to update
                return await UserService.get_user_by_id(db, user_id)
            
            # Add updated_at timestamp
            update_data["updated_at"] = "now()"
            
            # Update user
            response = db.table("users").update(update_data).eq("id", user_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            user_data = response.data[0]
            return UserResponse(**user_data)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )