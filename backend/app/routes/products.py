# backend/app/routes/products.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from supabase import Client
from app.database import get_db
from app.models.schemas import ProductCreate, ProductUpdate, ProductResponse, SuccessResponse
from app.services.product_service import ProductService
from app.middleware.auth import get_current_admin_user, optional_current_user, get_current_user
from app.models.schemas import UserResponse
from typing import List, Optional
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=dict)
async def list_products(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in product name and description"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Client = Depends(get_db)
):
    """
    Get list of products with pagination, filtering, and search.
    
    Query Parameters:
        - skip: Number of records to skip (for pagination)
        - limit: Maximum number of records to return (1-100)
        - category: Filter by product category
        - search: Search term for product name and description
        - min_price: Minimum price filter
        - max_price: Maximum price filter
        - sort_by: Field to sort by (default: created_at)
        - sort_order: Sort order - asc or desc (default: desc)
        
    Returns:
        dict: Products list with pagination info
    """
    logger.info(f"Fetching products - skip: {skip}, limit: {limit}, category: {category}")
    
    products, total_count = await ProductService.get_products(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "products": products,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total_count
    }


@router.get("/categories", response_model=List[str])
async def get_categories(db: Client = Depends(get_db)):
    """
    Get all unique product categories.
    
    Returns:
        List[str]: List of unique categories
    """
    categories = await ProductService.get_categories(db)
    return categories


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: Client = Depends(get_db)
):
    """
    Get a single product by ID.
    
    Args:
        product_id: Product ID
        
    Returns:
        ProductResponse: Product details
        
    Raises:
        HTTPException: If product not found
    """
    logger.info(f"Fetching product: {product_id}")
    
    product = await ProductService.get_product_by_id(db, product_id)
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Create a new product (admin only).
    
    Args:
        product_data: Product creation data
        current_user: Current authenticated admin user
        db: Database client
        
    Returns:
        ProductResponse: Created product
        
    Raises:
        HTTPException: If user is not admin or creation fails
    """
    logger.info(f"Creating product: {product_data.name} by admin: {current_user.email}")
    
    product = await ProductService.create_product(db, product_data)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Update a product (admin only).
    
    Args:
        product_id: Product ID
        product_update: Updated product data
        current_user: Current authenticated admin user
        db: Database client
        
    Returns:
        ProductResponse: Updated product
        
    Raises:
        HTTPException: If user is not admin, product not found, or update fails
    """
    logger.info(f"Updating product: {product_id} by admin: {current_user.email}")
    
    product = await ProductService.update_product(db, product_id, product_update)
    return product


@router.delete("/{product_id}", response_model=SuccessResponse)
async def delete_product(
    product_id: str,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Delete a product (admin only).
    Performs soft delete by setting is_active to False.
    
    Args:
        product_id: Product ID
        current_user: Current authenticated admin user
        db: Database client
        
    Returns:
        SuccessResponse: Success message
        
    Raises:
        HTTPException: If user is not admin, product not found, or deletion fails
    """
    logger.info(f"Deleting product: {product_id} by admin: {current_user.email}")
    
    result = await ProductService.delete_product(db, product_id)
    return SuccessResponse(**result)


@router.post("/{product_id}/images", response_model=dict)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Client = Depends(get_db)
):
    """
    Upload a product image (admin only).
    
    Args:
        product_id: Product ID to associate image with
        file: Image file to upload
        current_user: Current authenticated admin user
        db: Database client
        
    Returns:
        dict: Upload result with image URL
        
    Raises:
        HTTPException: If user is not admin, product not found, or upload fails
    """
    logger.info(f"Uploading image for product: {product_id} by admin: {current_user.email}")
    
    # Verify product exists
    product = await ProductService.get_product_by_id(db, product_id)
    
    # Upload image
    image_url = await ProductService.upload_product_image(db, file)
    
    # Add image URL to product
    current_images = product.image_urls or []
    updated_images = current_images + [image_url]
    
    # Update product with new image URL
    await ProductService.update_product(
        db,
        product_id,
        ProductUpdate(image_urls=updated_images)
    )
    
    return {
        "message": "Image uploaded successfully",
        "image_url": image_url
    }