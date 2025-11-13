# backend/app/services/cart_service.py

from supabase import Client
from app.models.schemas import CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse, ProductResponse
from fastapi import HTTPException, status
from typing import List
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class CartService:
    """Service class for shopping cart operations"""
    
    @staticmethod
    async def get_user_cart(db: Client, user_id: str) -> CartResponse:
        """
        Get user's shopping cart with product details.
        
        Args:
            db: Supabase database client
            user_id: User ID
            
        Returns:
            CartResponse: Cart with items and total
            
        Raises:
            HTTPException: If query fails
        """
        try:
            # Get cart items with product details
            response = db.table("cart_items").select(
                "*, products(*)"
            ).eq("user_id", user_id).execute()
            
            cart_items = []
            total_items = 0
            total_price = Decimal("0.00")
            
            for item in response.data:
                # Check if product still exists and is active
                if not item.get("products") or not item["products"].get("is_active"):
                    # Product is inactive or deleted, skip it
                    continue
                
                product_data = item["products"]
                product = ProductResponse(**product_data)
                
                cart_item = CartItemResponse(
                    id=item["id"],
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    product=product,
                    created_at=item["created_at"]
                )
                
                cart_items.append(cart_item)
                total_items += item["quantity"]
                total_price += Decimal(str(product.price)) * item["quantity"]
            
            return CartResponse(
                items=cart_items,
                total_items=total_items,
                total_price=total_price
            )
            
        except Exception as e:
            logger.error(f"Error fetching cart: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch cart"
            )
    
    @staticmethod
    async def add_to_cart(
        db: Client,
        user_id: str,
        cart_item: CartItemCreate
    ) -> CartItemResponse:
        """
        Add item to cart or update quantity if already exists.
        
        Args:
            db: Supabase database client
            user_id: User ID
            cart_item: Cart item data
            
        Returns:
            CartItemResponse: Added/updated cart item
            
        Raises:
            HTTPException: If product not found, out of stock, or operation fails
        """
        try:
            # Check if product exists and is active
            product_response = db.table("products").select("*").eq(
                "id", cart_item.product_id
            ).eq("is_active", True).execute()
            
            if not product_response.data or len(product_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found or unavailable"
                )
            
            product = product_response.data[0]
            
            # Check stock availability
            if product["stock_quantity"] < cart_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Only {product['stock_quantity']} items available."
                )
            
            # Check if item already in cart
            existing_response = db.table("cart_items").select("*").eq(
                "user_id", user_id
            ).eq("product_id", cart_item.product_id).execute()
            
            if existing_response.data and len(existing_response.data) > 0:
                # Item exists, update quantity
                existing_item = existing_response.data[0]
                new_quantity = existing_item["quantity"] + cart_item.quantity
                
                # Check if new quantity exceeds stock
                if new_quantity > product["stock_quantity"]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot add {cart_item.quantity} more. Only {product['stock_quantity'] - existing_item['quantity']} items available."
                    )
                
                # Update quantity
                update_response = db.table("cart_items").update({
                    "quantity": new_quantity,
                    "updated_at": "now()"
                }).eq("id", existing_item["id"]).execute()
                
                updated_item = update_response.data[0]
                
                logger.info(f"Cart item updated: {updated_item['id']} - quantity: {new_quantity}")
            else:
                # New item, add to cart
                new_cart_item = {
                    "user_id": user_id,
                    "product_id": cart_item.product_id,
                    "quantity": cart_item.quantity
                }
                
                insert_response = db.table("cart_items").insert(new_cart_item).execute()
                
                if not insert_response.data or len(insert_response.data) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to add item to cart"
                    )
                
                updated_item = insert_response.data[0]
                
                logger.info(f"Item added to cart: {updated_item['id']}")
            
            # Fetch updated cart item with product details
            final_response = db.table("cart_items").select(
                "*, products(*)"
            ).eq("id", updated_item["id"]).execute()
            
            item_data = final_response.data[0]
            product_obj = ProductResponse(**item_data["products"])
            
            return CartItemResponse(
                id=item_data["id"],
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                product=product_obj,
                created_at=item_data["created_at"]
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error adding to cart: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add item to cart"
            )
    
    @staticmethod
    async def update_cart_item(
        db: Client,
        user_id: str,
        item_id: str,
        update_data: CartItemUpdate
    ) -> CartItemResponse:
        """
        Update cart item quantity.
        
        Args:
            db: Supabase database client
            user_id: User ID
            item_id: Cart item ID
            update_data: Updated quantity
            
        Returns:
            CartItemResponse: Updated cart item
            
        Raises:
            HTTPException: If item not found, unauthorized, or update fails
        """
        try:
            # Verify item belongs to user
            item_response = db.table("cart_items").select(
                "*, products(*)"
            ).eq("id", item_id).eq("user_id", user_id).execute()
            
            if not item_response.data or len(item_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cart item not found"
                )
            
            item = item_response.data[0]
            product = item["products"]
            
            # Check stock availability
            if update_data.quantity > product["stock_quantity"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Only {product['stock_quantity']} items available."
                )
            
            # Update quantity
            update_response = db.table("cart_items").update({
                "quantity": update_data.quantity,
                "updated_at": "now()"
            }).eq("id", item_id).execute()
            
            if not update_response.data or len(update_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update cart item"
                )
            
            updated_item = update_response.data[0]
            
            logger.info(f"Cart item updated: {item_id} - new quantity: {update_data.quantity}")
            
            # Fetch with product details
            final_response = db.table("cart_items").select(
                "*, products(*)"
            ).eq("id", item_id).execute()
            
            item_data = final_response.data[0]
            product_obj = ProductResponse(**item_data["products"])
            
            return CartItemResponse(
                id=item_data["id"],
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                product=product_obj,
                created_at=item_data["created_at"]
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating cart item: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update cart item"
            )
    
    @staticmethod
    async def remove_from_cart(db: Client, user_id: str, item_id: str) -> dict:
        """
        Remove item from cart.
        
        Args:
            db: Supabase database client
            user_id: User ID
            item_id: Cart item ID
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If item not found, unauthorized, or removal fails
        """
        try:
            # Verify item belongs to user
            item_response = db.table("cart_items").select("*").eq(
                "id", item_id
            ).eq("user_id", user_id).execute()
            
            if not item_response.data or len(item_response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cart item not found"
                )
            
            # Delete item
            db.table("cart_items").delete().eq("id", item_id).execute()
            
            logger.info(f"Cart item removed: {item_id}")
            
            return {"message": "Item removed from cart"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error removing cart item: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove item from cart"
            )
    
    @staticmethod
    async def clear_cart(db: Client, user_id: str) -> dict:
        """
        Clear all items from user's cart.
        
        Args:
            db: Supabase database client
            user_id: User ID
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If operation fails
        """
        try:
            # Delete all cart items for user
            db.table("cart_items").delete().eq("user_id", user_id).execute()
            
            logger.info(f"Cart cleared for user: {user_id}")
            
            return {"message": "Cart cleared successfully"}
            
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear cart"
            )