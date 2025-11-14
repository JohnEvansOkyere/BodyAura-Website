# backend/app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.routes.auth import get_current_user
from typing import Dict, Any
import logging

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


def require_admin(current_user = Depends(get_current_user)):
    """Verify user is admin."""
    # Access as attribute, not dict
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/dashboard")
async def get_dashboard_stats(
    db=Depends(get_db),
    current_user = Depends(require_admin)
) -> Dict[str, Any]:
    """Get dashboard statistics for admin."""
    try:
        # Get total orders
        orders_response = db.table("orders").select("*", count="exact").execute()
        total_orders = orders_response.count if orders_response.count else 0
        
        # Get total revenue
        revenue_response = db.table("orders").select("total_amount").execute()
        total_revenue = sum(float(order.get("total_amount", 0)) for order in revenue_response.data)
        
        # Get pending orders
        pending_response = db.table("orders").select("*", count="exact").eq("status", "pending").execute()
        pending_orders = pending_response.count if pending_response.count else 0
        
        # Get total products
        products_response = db.table("products").select("*", count="exact").eq("is_active", True).execute()
        total_products = products_response.count if products_response.count else 0
        
        # Get low stock products (less than 10)
        low_stock_response = db.table("products").select("*", count="exact").eq("is_active", True).lt("stock_quantity", 10).execute()
        low_stock_products = low_stock_response.count if low_stock_response.count else 0
        
        return {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "total_products": total_products,
            "low_stock_products": low_stock_products,
        }
    
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard statistics"
        )


@router.get("/orders")
async def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get all orders for admin."""
    try:
        # Get orders with count
        response = db.table("orders").select(
            "*",
            count="exact"
        ).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        total = response.count if response.count else 0
        orders = response.data
        
        return {
            "orders": orders,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": total > (skip + limit)
        }
    
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch orders"
        )


@router.put("/orders/{order_id}")
async def update_order_status(
    order_id: str,
    status: str = None,
    payment_status: str = None,
    db=Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update order status (admin only)."""
    try:
        update_data = {}
        if status:
            update_data["status"] = status
        if payment_status:
            update_data["payment_status"] = payment_status
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
        
        # Update order
        response = db.table("orders").update(update_data).eq("id", order_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order"
        )