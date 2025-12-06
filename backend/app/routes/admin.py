# backend/app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.middleware.auth import get_current_user
from typing import Dict, Any, Optional
import logging

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


class UpdateOrderStatusRequest:
    """Request model for updating order status"""
    def __init__(self, order_status: Optional[str] = None, payment_status: Optional[str] = None):
        self.order_status = order_status
        self.payment_status = payment_status


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
        from datetime import datetime, timedelta

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

        # Get total users
        users_response = db.table("users").select("*", count="exact").execute()
        total_users = users_response.count if users_response.count else 0

        # Get new users this month
        now = datetime.now()
        first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_response = db.table("users").select("*", count="exact").gte("created_at", first_day_of_month.isoformat()).execute()
        new_users_this_month = new_users_response.count if new_users_response.count else 0

        # Get sales trend (last 7 days)
        sales_trend = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)

            day_orders = db.table("orders").select("total_amount").gte("created_at", day_start.isoformat()).lte("created_at", day_end.isoformat()).execute()
            daily_revenue = sum(float(order.get("total_amount", 0)) for order in day_orders.data)

            sales_trend.append({
                "date": day.strftime("%Y-%m-%d"),
                "day": day.strftime("%a"),
                "revenue": daily_revenue,
                "orders": len(day_orders.data)
            })

        # Get top performing products (by order count)
        all_orders = db.table("orders").select("*").execute()
        product_sales = {}

        for order in all_orders.data:
            items = order.get("items", [])
            for item in items:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 0)
                price = float(item.get("price", 0))

                if product_id not in product_sales:
                    product_sales[product_id] = {
                        "product_id": product_id,
                        "total_quantity": 0,
                        "total_revenue": 0
                    }

                product_sales[product_id]["total_quantity"] += quantity
                product_sales[product_id]["total_revenue"] += quantity * price

        # Get product details for top sellers
        top_products = sorted(product_sales.values(), key=lambda x: x["total_revenue"], reverse=True)[:5]

        for product in top_products:
            product_data = db.table("products").select("name, image_urls, category").eq("id", product["product_id"]).execute()
            if product_data.data:
                product["name"] = product_data.data[0].get("name", "Unknown")
                product["image_url"] = product_data.data[0].get("image_urls", [""])[0] if product_data.data[0].get("image_urls") else ""
                product["category"] = product_data.data[0].get("category", "")

        # Get low stock products details
        low_stock_details = db.table("products").select("id, name, stock_quantity, image_urls, category").eq("is_active", True).lt("stock_quantity", 10).order("stock_quantity").limit(5).execute()

        # Get recent orders
        recent_orders = db.table("orders").select("*").order("created_at", desc=True).limit(5).execute()

        return {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "total_products": total_products,
            "low_stock_products": low_stock_products,
            "total_users": total_users,
            "new_users_this_month": new_users_this_month,
            "sales_trend": sales_trend,
            "top_products": top_products,
            "low_stock_details": low_stock_details.data,
            "recent_orders": recent_orders.data,
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
    request_body: Dict[str, Any],
    db=Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update order status (admin only)."""
    try:
        update_data = {}

        # Extract order_status and payment_status from request body
        order_status = request_body.get("order_status")
        payment_status = request_body.get("payment_status")

        if order_status:
            update_data["status"] = order_status
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