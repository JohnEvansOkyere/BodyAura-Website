# backend/app/routes/orders.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from app.database import get_db
from app.models.schemas import (
    OrderCreate, OrderResponse, OrderStatusUpdate, 
    SuccessResponse, UserResponse, OrderStatus
)
from app.services.order_service import OrderService
from app.middleware.auth import get_current_user, get_current_admin_user
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Create order from cart items.
    
    Args:
        order_data: Order data (shipping address, payment method)
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        OrderResponse: Created order with items
        
    Raises:
        HTTPException: If cart is empty or stock insufficient
    """
    logger.info(f"Creating order for user: {current_user.email}")
    
    order = await OrderService.create_order(db, current_user.id, order_data)
    
    logger.info(f"Order created successfully: {order.id}")
    
    return order


@router.get("", response_model=dict)
async def get_user_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records"),
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get current user's orders.
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        dict: Orders list with pagination info
    """
    logger.info(f"Fetching orders for user: {current_user.email}")
    
    orders, total_count = await OrderService.get_user_orders(
        db, current_user.id, skip, limit
    )
    
    return {
        "orders": orders,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total_count
    }


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get order details by ID.
    
    Args:
        order_id: Order ID
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        OrderResponse: Order details with items
        
    Raises:
        HTTPException: If order not found or unauthorized
    """
    logger.info(f"Fetching order: {order_id} for user: {current_user.email}")
    
    order = await OrderService.get_order_by_id(db, order_id, current_user.id)
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_admin: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Update order status (admin only).
    
    Args:
        order_id: Order ID
        status_update: New status
        current_admin: Current authenticated admin user
        db: Database client
        
    Returns:
        OrderResponse: Updated order
        
    Raises:
        HTTPException: If not admin, order not found, or update fails
    """
    logger.info(f"Updating order status: {order_id} to {status_update.status.value} by admin: {current_admin.email}")
    
    order = await OrderService.update_order_status(db, order_id, status_update.status)
    
    logger.info(f"Order status updated successfully: {order_id}")
    
    return order