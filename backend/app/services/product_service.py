# backend/app/services/product_service.py

from supabase import Client
from app.models.schemas import ProductCreate, ProductUpdate, ProductResponse
from fastapi import HTTPException, status, UploadFile
from typing import List, Optional
from decimal import Decimal
import logging
import uuid

logger = logging.getLogger(__name__)


class ProductService:
    """Service class for product-related business logic"""
    
    @staticmethod
    async def get_products(
        db: Client,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[ProductResponse], int]:
        """
        Get list of products with filtering, pagination, and search.
        
        Args:
            db: Supabase database client
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            category: Filter by category
            search: Search in product name and description
            min_price: Minimum price filter
            max_price: Maximum price filter
            sort_by: Field to sort by
            sort_order: Sort order (asc/desc)
            
        Returns:
            tuple: (list of products, total count)
            
        Raises:
            HTTPException: If query fails
        """
        try:
            # Start building query - only active products for non-admin users
            query = db.table("products").select("*", count="exact").eq("is_active", True)
            
            # Apply category filter
            if category:
                query = query.eq("category", category)
            
            # Apply price filters
            if min_price is not None:
                query = query.gte("price", float(min_price))
            if max_price is not None:
                query = query.lte("price", float(max_price))
            
            # Apply search (search in name and description)
            if search:
                # Supabase uses ilike for case-insensitive pattern matching
                query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
            
            # Apply sorting
            ascending = sort_order.lower() == "asc"
            query = query.order(sort_by, desc=not ascending)
            
            # Apply pagination
            query = query.range(skip, skip + limit - 1)
            
            # Execute query
            response = query.execute()
            
            products = [ProductResponse(**product) for product in response.data]
            total_count = response.count if response.count else 0
            
            return products, total_count
            
        except Exception as e:
            logger.error(f"Error fetching products: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch products"
            )
    
    @staticmethod
    async def get_product_by_id(db: Client, product_id: str) -> ProductResponse:
        """
        Get a single product by ID.
        
        Args:
            db: Supabase database client
            product_id: Product ID
            
        Returns:
            ProductResponse: Product data
            
        Raises:
            HTTPException: If product not found
        """
        try:
            response = db.table("products").select("*").eq("id", product_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            product_data = response.data[0]
            return ProductResponse(**product_data)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching product: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch product"
            )
    
    @staticmethod
    async def create_product(db: Client, product_data: ProductCreate) -> ProductResponse:
        """
        Create a new product (admin only).
        
        Args:
            db: Supabase database client
            product_data: Product creation data
            
        Returns:
            ProductResponse: Created product data
            
        Raises:
            HTTPException: If creation fails
        """
        try:
            # Prepare product data
            new_product = {
                "name": product_data.name,
                "description": product_data.description,
                "price": float(product_data.price),
                "category": product_data.category,
                "stock_quantity": product_data.stock_quantity,
                "image_urls": product_data.image_urls or [],
                "is_active": product_data.is_active
            }
            
            # Insert product
            response = db.table("products").insert(new_product).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create product"
                )
            
            product = response.data[0]
            logger.info(f"Product created: {product['name']} (ID: {product['id']})")
            
            return ProductResponse(**product)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating product: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create product"
            )
    
    @staticmethod
    async def update_product(
        db: Client,
        product_id: str,
        product_update: ProductUpdate
    ) -> ProductResponse:
        """
        Update a product (admin only).
        
        Args:
            db: Supabase database client
            product_id: Product ID
            product_update: Updated product data
            
        Returns:
            ProductResponse: Updated product data
            
        Raises:
            HTTPException: If update fails or product not found
        """
        try:
            # Build update dict with only provided fields
            update_data = {}
            
            if product_update.name is not None:
                update_data["name"] = product_update.name
            if product_update.description is not None:
                update_data["description"] = product_update.description
            if product_update.price is not None:
                update_data["price"] = float(product_update.price)
            if product_update.category is not None:
                update_data["category"] = product_update.category
            if product_update.stock_quantity is not None:
                update_data["stock_quantity"] = product_update.stock_quantity
            if product_update.is_active is not None:
                update_data["is_active"] = product_update.is_active
            if product_update.image_urls is not None:
                update_data["image_urls"] = product_update.image_urls
            
            if not update_data:
                # No fields to update
                return await ProductService.get_product_by_id(db, product_id)
            
            # Add updated_at timestamp
            update_data["updated_at"] = "now()"
            
            # Update product
            response = db.table("products").update(update_data).eq("id", product_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            product = response.data[0]
            logger.info(f"Product updated: {product['name']} (ID: {product['id']})")
            
            return ProductResponse(**product)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating product: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update product"
            )
    
    @staticmethod
    async def delete_product(db: Client, product_id: str) -> dict:
        """
        Delete a product (admin only).
        Actually performs soft delete by setting is_active to False.
        
        Args:
            db: Supabase database client
            product_id: Product ID
            
        Returns:
            dict: Success message
            
        Raises:
            HTTPException: If deletion fails or product not found
        """
        try:
            # Soft delete - set is_active to False
            response = db.table("products").update({
                "is_active": False,
                "updated_at": "now()"
            }).eq("id", product_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            logger.info(f"Product deleted (soft): ID {product_id}")
            
            return {"message": "Product deleted successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting product: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete product"
            )
    
    @staticmethod
    async def upload_product_image(
        db: Client,
        file: UploadFile,
        bucket_name: str = "product-images"
    ) -> str:
        """
        Upload a product image to Supabase Storage.
        
        Args:
            db: Supabase database client
            file: Uploaded file
            bucket_name: Supabase storage bucket name
            
        Returns:
            str: Public URL of uploaded image
            
        Raises:
            HTTPException: If upload fails
        """
        try:
            # Validate file type
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file type. Only JPEG, PNG, and WebP are allowed."
                )
            
            # Generate unique filename
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            
            # Read file content
            file_content = await file.read()
            
            # Upload to Supabase Storage
            response = db.storage.from_(bucket_name).upload(
                unique_filename,
                file_content,
                {"content-type": file.content_type}
            )
            
            # Get public URL
            public_url = db.storage.from_(bucket_name).get_public_url(unique_filename)
            
            logger.info(f"Image uploaded successfully: {unique_filename}")
            
            return public_url
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading image: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )
    
    @staticmethod
    async def get_categories(db: Client) -> List[str]:
        """
        Get all unique product categories.
        
        Args:
            db: Supabase database client
            
        Returns:
            List[str]: List of unique categories
        """
        try:
            response = db.table("products").select("category").eq("is_active", True).execute()
            
            # Extract unique categories
            categories = list(set([p["category"] for p in response.data if p.get("category")]))
            categories.sort()
            
            return categories
            
        except Exception as e:
            logger.error(f"Error fetching categories: {str(e)}")
            return []