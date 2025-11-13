# backend/app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from app.database import get_db
from app.models.schemas import (
    OrderResponse, UserResponse, SalesAnalytics, OrderStatus
)
from app.services.order_service import OrderService
from app.middleware.auth import get_current_admin_user
from typing import Optional
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/orders", response_model=dict)
async def get_all_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records"),
    status_filter: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    current_admin: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Get all orders (admin only).
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        status_filter: Optional status filter
        current_admin: Current authenticated admin user
        db: Database client
        
    Returns:
        dict: Orders list with pagination info
        
    Raises:
        HTTPException: If user is not admin
    """
    logger.info(f"Admin fetching all orders: {current_admin.email}")
    
    orders, total_count = await OrderService.get_all_orders(
        db, skip, limit, status_filter
    )
    
    return {
        "orders": orders,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total_count
    }


@router.get("/analytics", response_model=SalesAnalytics)
async def get_sales_analytics(
    current_admin: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Get sales analytics and statistics (admin only).
    
    Args:
        current_admin: Current authenticated admin user
        db: Database client
        
    Returns:
        SalesAnalytics: Sales statistics
        
    Raises:
        HTTPException: If user is not admin
    """
    logger.info(f"Admin fetching analytics: {current_admin.email}")
    
    try:
        # Get total revenue from completed orders
        completed_orders_response = db.table("orders").select(
            "total_amount"
        ).eq("payment_status", "completed").execute()
        
        total_revenue = sum(
            Decimal(str(order["total_amount"])) 
            for order in completed_orders_response.data
        )
        
        # Get order counts by status
        all_orders_response = db.table("orders").select("status").execute()
        
        total_orders = len(all_orders_response.data)
        pending_orders = sum(1 for o in all_orders_response.data if o["status"] == "pending")
        completed_orders = sum(
            1 for o in all_orders_response.data 
            if o["status"] == "delivered"
        )
        
        # Get product statistics
        products_response = db.table("products").select(
            "id, stock_quantity"
        ).eq("is_active", True).execute()
        
        total_products = len(products_response.data)
        low_stock_products = sum(
            1 for p in products_response.data 
            if p["stock_quantity"] < 10
        )
        
        # Get recent orders
        recent_orders_response = db.table("orders").select(
            "*, order_items(*, products(*)), users(email, full_name)"
        ).order("created_at", desc=True).limit(10).execute()
        
        recent_orders = []
        for order_data in recent_orders_response.data:
            order = await OrderService._format_order(order_data)
            recent_orders.append(order)
        
        analytics = SalesAnalytics(
            total_revenue=total_revenue,
            total_orders=total_orders,
            pending_orders=pending_orders,
            completed_orders=completed_orders,
            total_products=total_products,
            low_stock_products=low_stock_products,
            recent_orders=recent_orders
        )
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics"
        )