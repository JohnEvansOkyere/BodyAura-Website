# backend/app/models/schemas.py

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum


# ============================================
# ENUMS
# ============================================

class OrderStatus(str, Enum):
    """Possible order statuses"""
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    """Possible payment statuses"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class PaymentMethod(str, Enum):
    """Supported payment methods in Ghana"""
    MOMO_MTN = "momo_mtn"
    MOMO_VODAFONE = "momo_vodafone"
    MOMO_AIRTELTIGO = "momo_airteltigo"
    CARD = "card"


# ============================================
# USER MODELS
# ============================================

class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        """Ensure password meets security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response (without sensitive data)"""
    id: str
    is_admin: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


# ============================================
# PRODUCT MODELS
# ============================================

class ProductBase(BaseModel):
    """Base product model"""
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    category: Optional[str] = Field(None, max_length=100)
    stock_quantity: int = Field(..., ge=0)
    is_active: bool = True


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    image_urls: Optional[List[str]] = []


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = Field(None, max_length=100)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    image_urls: Optional[List[str]] = None


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: str
    image_urls: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# CART MODELS
# ============================================

class CartItemBase(BaseModel):
    """Base cart item model"""
    product_id: str
    quantity: int = Field(..., gt=0)


class CartItemCreate(CartItemBase):
    """Schema for adding item to cart"""
    pass


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity"""
    quantity: int = Field(..., gt=0)


class CartItemResponse(BaseModel):
    """Schema for cart item response with product details"""
    id: str
    product_id: str
    quantity: int
    product: ProductResponse
    created_at: datetime
    
    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Schema for full cart response"""
    items: List[CartItemResponse]
    total_items: int
    total_price: Decimal


# ============================================
# ORDER MODELS
# ============================================

class ShippingAddress(BaseModel):
    """Shipping address structure"""
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    region: str
    postal_code: Optional[str] = None


class OrderItemBase(BaseModel):
    """Base order item model"""
    product_id: str
    quantity: int = Field(..., gt=0)
    price_at_time: Decimal = Field(..., gt=0)


class OrderItemResponse(OrderItemBase):
    """Schema for order item response"""
    id: str
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating a new order"""
    shipping_address: ShippingAddress
    payment_method: PaymentMethod


class OrderResponse(BaseModel):
    """Schema for order response"""
    id: str
    user_id: str
    total_amount: Decimal
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    shipping_address: dict
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status (admin only)"""
    status: OrderStatus


# ============================================
# PAYMENT MODELS
# ============================================

class PaymentInitialize(BaseModel):
    """Schema for initializing payment"""
    order_id: str
    payment_method: PaymentMethod


class PaymentResponse(BaseModel):
    """Schema for payment initialization response"""
    authorization_url: str
    access_code: str
    reference: str


class PaymentVerify(BaseModel):
    """Schema for verifying payment"""
    reference: str


# ============================================
# AUTHENTICATION MODELS
# ============================================

class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for decoded JWT token data"""
    user_id: Optional[str] = None
    email: Optional[str] = None


# ============================================
# ANALYTICS MODELS
# ============================================

class SalesAnalytics(BaseModel):
    """Schema for sales analytics response"""
    total_revenue: Decimal
    total_orders: int
    pending_orders: int
    completed_orders: int
    total_products: int
    low_stock_products: int
    recent_orders: List[OrderResponse]


# ============================================
# GENERIC RESPONSE MODELS
# ============================================

class SuccessResponse(BaseModel):
    """Generic success response"""
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Generic error response"""
    detail: str