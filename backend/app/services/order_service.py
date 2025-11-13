# backend/app/services/order_service.py

from supabase import Client
from app.models.schemas import (
    OrderCreate, OrderResponse, OrderItemResponse, 
    OrderStatus, PaymentStatus, ProductResponse
)
from fastapi import HTTPException, status
from typing import List, Optional
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class OrderService:
    """Service class for order management"""
    
    @staticmethod
    async def create_order(
        db: Client,
        user_id: str,
        order_data: OrderCreate
    ) -> OrderResponse:
        """
        Create order from user's cart.
        
        Args:
            db: Supabase database client
            user_id: User ID
            order_data: Order creation data (shipping address, payment method)
            
        Returns:
            OrderResponse: Created order
            
        Raises:
            HTTPException: If cart is empty, stock insufficient, or creation fails
        """
        try:
            # Get cart items
            cart_response = db.table("cart_items").select(
                "*, products(*)"
            ).eq("user_id", user_id).execute()
            
            if not cart_response.data or len(cart_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty. Cannot create order."
                )
            
            # Validate cart items and calculate total
            order_items = []
            total_amount = Decimal("0.00")
            
            for cart_item in cart_response.data:
                product = cart_item["products"]
                
                # Check if product is active
                if not product.get("is_active"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product '{product['name']}' is no longer available."
                    )
                
                # Check stock availability
                if product["stock_quantity"] < cart_item["quantity"]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for '{product['name']}'. Only {product['stock_quantity']} available."
                    )
                
                item_total = Decimal(str(product["price"])) * cart_item["quantity"]
                total_amount += item_total
                
                order_items.append({
                    "product_id": product["id"],
                    "quantity": cart_item["quantity"],
                    "price_at_time": float(product["price"]),
                    "product": product
                })
            
            # Create order
            new_order = {
                "user_id": user_id,
                "total_amount": float(total_amount),
                "status": OrderStatus.PENDING.value,
                "payment_status": PaymentStatus.PENDING.value,
                "payment_method": order_data.payment_method.value,
                "shipping_address": order_data.shipping_address.dict()
            }
            
            order_response = db.table("orders").insert(new_order).execute()
            
            if not order_response.data or len(order_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create order"
                )
            
            order = order_response.data[0]
            order_id = order["id"]
            
            # Create order items and update stock
            for item in order_items:
                # Insert order item
                order_item_data = {
                    "order_id": order_id,
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "price_at_time": item["price_at_time"]
                }
                
                db.table("order_items").insert(order_item_data).execute()
                
                # Reduce product stock
                new_stock = item["product"]["stock_quantity"] - item["quantity"]
                db.table("products").update({
                    "stock_quantity": new_stock,
                    "updated_at": "now()"
                }).eq("id", item["product_id"]).execute()
            
            # Clear user's cart
            db.table("cart_items").delete().eq("user_id", user_id).execute()
            
            logger.info(f"Order created: {order_id} for user: {user_id}, total: {total_amount}")
            
            # Fetch complete order with items
            return await OrderService.get_order_by_id(db, order_id, user_id)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order"
            )
    
    @staticmethod
    async def get_user_orders(
        db: Client,
        user_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[OrderResponse], int]:
        """
        Get user's orders with pagination.
        
        Args:
            db: Supabase database client
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            tuple: (list of orders, total count)
        """
        try:
            # Get orders
            response = db.table("orders").select(
                "*, order_items(*, products(*))",
                count="exact"
            ).eq("user_id", user_id).order(
                "created_at", desc=True
            ).range(skip, skip + limit - 1).execute()
            
            orders = []
            for order_data in response.data:
                order = await OrderService._format_order(order_data)
                orders.append(order)
            
            total_count = response.count if response.count else 0
            
            return orders, total_count
            
        except Exception as e:
            logger.error(f"Error fetching user orders: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch orders"
            )
    
    @staticmethod
    async def get_order_by_id(
        db: Client,
        order_id: str,
        user_id: Optional[str] = None
    ) -> OrderResponse:
        """
        Get order by ID with full details.
        
        Args:
            db: Supabase database client
            order_id: Order ID
            user_id: Optional user ID for authorization check
            
        Returns:
            OrderResponse: Order with items
            
        Raises:
            HTTPException: If order not found or unauthorized
        """
        try:
            # Build query
            query = db.table("orders").select(
                "*, order_items(*, products(*))"
            ).eq("id", order_id)
            
            # Add user filter if provided
            if user_id:
                query = query.eq("user_id", user_id)
            
            response = query.execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
            
            order_data = response.data[0]
            order = await OrderService._format_order(order_data)
            
            return order
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching order: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch order"
            )
    
    @staticmethod
    async def update_order_status(
        db: Client,
        order_id: str,
        new_status: OrderStatus
    ) -> OrderResponse:
        """
        Update order status (admin only).
        
        Args:
            db: Supabase database client
            order_id: Order ID
            new_status: New order status
            
        Returns:
            OrderResponse: Updated order
            
        Raises:
            HTTPException: If order not found or update fails
        """
        try:
            # Update status
            response = db.table("orders").update({
                "status": new_status.value,
                "updated_at": "now()"
            }).eq("id", order_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
            
            logger.info(f"Order status updated: {order_id} -> {new_status.value}")
            
            # Return updated order
            return await OrderService.get_order_by_id(db, order_id)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update order status"
            )
    
    @staticmethod
    async def update_payment_status(
        db: Client,
        order_id: str,
        payment_status: PaymentStatus,
        payment_reference: Optional[str] = None
    ) -> OrderResponse:
        """
        Update payment status (used by payment webhook).
        
        Args:
            db: Supabase database client
            order_id: Order ID
            payment_status: New payment status
            payment_reference: Payment reference from payment provider
            
        Returns:
            OrderResponse: Updated order
            
        Raises:
            HTTPException: If order not found or update fails
        """
        try:
            update_data = {
                "payment_status": payment_status.value,
                "updated_at": "now()"
            }
            
            if payment_reference:
                update_data["payment_reference"] = payment_reference
            
            # If payment completed, update order status to processing
            if payment_status == PaymentStatus.COMPLETED:
                update_data["status"] = OrderStatus.PROCESSING.value
            
            response = db.table("orders").update(update_data).eq("id", order_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
            
            logger.info(f"Payment status updated: {order_id} -> {payment_status.value}")
            
            return await OrderService.get_order_by_id(db, order_id)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating payment status: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update payment status"
            )
    
    @staticmethod
    async def get_all_orders(
        db: Client,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[OrderStatus] = None
    ) -> tuple[List[OrderResponse], int]:
        """
        Get all orders (admin only).
        
        Args:
            db: Supabase database client
            skip: Number of records to skip
            limit: Maximum number of records to return
            status_filter: Optional status filter
            
        Returns:
            tuple: (list of orders, total count)
        """
        try:
            query = db.table("orders").select(
                "*, order_items(*, products(*)), users(email, full_name)",
                count="exact"
            )
            
            if status_filter:
                query = query.eq("status", status_filter.value)
            
            response = query.order(
                "created_at", desc=True
            ).range(skip, skip + limit - 1).execute()
            
            orders = []
            for order_data in response.data:
                order = await OrderService._format_order(order_data)
                orders.append(order)
            
            total_count = response.count if response.count else 0
            
            return orders, total_count
            
        except Exception as e:
            logger.error(f"Error fetching all orders: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch orders"
            )
    
    @staticmethod
    async def _format_order(order_data: dict) -> OrderResponse:
        """
        Format order data into OrderResponse.
        
        Args:
            order_data: Raw order data from database
            
        Returns:
            OrderResponse: Formatted order
        """
        # Format order items
        items = []
        if order_data.get("order_items"):
            for item in order_data["order_items"]:
                product = None
                if item.get("products"):
                    product = ProductResponse(**item["products"])
                
                order_item = OrderItemResponse(
                    id=item["id"],
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    price_at_time=Decimal(str(item["price_at_time"])),
                    product=product
                )
                items.append(order_item)
        
        # Create order response
        return OrderResponse(
            id=order_data["id"],
            user_id=order_data["user_id"],
            total_amount=Decimal(str(order_data["total_amount"])),
            status=OrderStatus(order_data["status"]),
            payment_status=PaymentStatus(order_data["payment_status"]),
            payment_method=order_data["payment_method"],
            payment_reference=order_data.get("payment_reference"),
            shipping_address=order_data["shipping_address"],
            items=items,
            created_at=order_data["created_at"],
            updated_at=order_data["updated_at"]
        )