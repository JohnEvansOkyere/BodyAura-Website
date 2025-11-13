# backend/app/routes/cart.py

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.database import get_db
from app.models.schemas import (
    CartItemCreate, CartItemUpdate, CartItemResponse, 
    CartResponse, SuccessResponse, UserResponse
)
from app.services.cart_service import CartService
from app.middleware.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get current user's shopping cart.
    
    Args:
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        CartResponse: User's cart with items and totals
    """
    logger.info(f"Fetching cart for user: {current_user.email}")
    
    cart = await CartService.get_user_cart(db, current_user.id)
    return cart


@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    cart_item: CartItemCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Add item to cart or update quantity if already exists.
    
    Args:
        cart_item: Item to add (product_id and quantity)
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        CartItemResponse: Added/updated cart item
        
    Raises:
        HTTPException: If product not found or out of stock
    """
    logger.info(f"Adding to cart: product {cart_item.product_id}, quantity {cart_item.quantity}, user: {current_user.email}")
    
    item = await CartService.add_to_cart(db, current_user.id, cart_item)
    return item


@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: str,
    update_data: CartItemUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Update cart item quantity.
    
    Args:
        item_id: Cart item ID
        update_data: New quantity
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        CartItemResponse: Updated cart item
        
    Raises:
        HTTPException: If item not found or insufficient stock
    """
    logger.info(f"Updating cart item: {item_id}, new quantity: {update_data.quantity}, user: {current_user.email}")
    
    item = await CartService.update_cart_item(db, current_user.id, item_id, update_data)
    return item


@router.delete("/items/{item_id}", response_model=SuccessResponse)
async def remove_from_cart(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Remove item from cart.
    
    Args:
        item_id: Cart item ID
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        SuccessResponse: Success message
        
    Raises:
        HTTPException: If item not found
    """
    logger.info(f"Removing cart item: {item_id}, user: {current_user.email}")
    
    result = await CartService.remove_from_cart(db, current_user.id, item_id)
    return SuccessResponse(**result)


@router.delete("", response_model=SuccessResponse)
async def clear_cart(
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Clear all items from cart.
    
    Args:
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        SuccessResponse: Success message
    """
    logger.info(f"Clearing cart for user: {current_user.email}")
    
    result = await CartService.clear_cart(db, current_user.id)
    return SuccessResponse(**result)