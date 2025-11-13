# backend/app/routes/payments.py

from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from supabase import Client
from app.database import get_db
from app.models.schemas import (
    PaymentInitialize, PaymentResponse, PaymentVerify,
    SuccessResponse, UserResponse, PaymentStatus
)
from app.services.payment_service import PaymentService
from app.services.order_service import OrderService
from app.services.email_service import EmailService
from app.services.user_service import UserService
from app.middleware.auth import get_current_user
from app.config import settings
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/initialize", response_model=PaymentResponse)
async def initialize_payment(
    payment_data: PaymentInitialize,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Initialize payment with Paystack.
    
    Args:
        payment_data: Payment initialization data (order_id, payment_method)
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        PaymentResponse: Payment authorization URL and reference
        
    Raises:
        HTTPException: If order not found or initialization fails
    """
    logger.info(f"Initializing payment for order: {payment_data.order_id}, user: {current_user.email}")
    
    # Get order and verify it belongs to user
    order = await OrderService.get_order_by_id(db, payment_data.order_id, current_user.id)
    
    # Check if order is already paid
    if order.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already paid"
        )
    
    # Callback URL (frontend URL where user returns after payment)
    callback_url = f"{settings.FRONTEND_URL}/orders/{payment_data.order_id}/payment-callback"
    
    # Initialize payment with Paystack
    payment_response = await PaymentService.initialize_payment(
        order_id=order.id,
        email=current_user.email,
        amount=float(order.total_amount),
        payment_method=payment_data.payment_method,
        callback_url=callback_url
    )
    
    logger.info(f"Payment initialized successfully: {payment_response.reference}")
    
    return payment_response


@router.post("/verify", response_model=dict)
async def verify_payment(
    payment_data: PaymentVerify,
    current_user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Verify payment with Paystack.
    
    Args:
        payment_data: Payment verification data (reference)
        current_user: Current authenticated user
        db: Database client
        
    Returns:
        dict: Payment verification result
        
    Raises:
        HTTPException: If verification fails
    """
    logger.info(f"Verifying payment: {payment_data.reference}, user: {current_user.email}")
    
    # Verify payment with Paystack
    payment_info = await PaymentService.verify_payment(payment_data.reference)
    
    # Extract order ID from reference
    order_id = payment_info["metadata"]["order_id"]
    
    # Verify order belongs to user
    order = await OrderService.get_order_by_id(db, order_id, current_user.id)
    
    # Update payment status based on Paystack response
    if payment_info["status"] == "success":
        await OrderService.update_payment_status(
            db,
            order_id,
            PaymentStatus.COMPLETED,
            payment_data.reference
        )
        
        # Send order confirmation email
        await EmailService.send_order_confirmation(current_user.email, order)
        await EmailService.send_admin_order_notification(order, current_user.email)
        
        logger.info(f"Payment verified and completed: {payment_data.reference}")
        
        return {
            "status": "success",
            "message": "Payment verified successfully",
            "order_id": order_id
        }
    else:
        await OrderService.update_payment_status(
            db,
            order_id,
            PaymentStatus.FAILED
        )
        
        logger.warning(f"Payment failed: {payment_data.reference}")
        
        return {
            "status": "failed",
            "message": "Payment verification failed",
            "order_id": order_id
        }


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    x_paystack_signature: str = Header(None),
    db: Client = Depends(get_db)
):
    """
    Handle Paystack webhook events.
    
    Args:
        request: FastAPI request object
        x_paystack_signature: Paystack webhook signature
        db: Database client
        
    Returns:
        dict: Acknowledgment response
        
    Raises:
        HTTPException: If signature verification fails
    """
    logger.info("Received Paystack webhook")
    
    # Get raw body
    body = await request.body()
    
    # Verify webhook signature
    if not PaymentService.verify_webhook_signature(body, x_paystack_signature):
        logger.warning("Invalid webhook signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Parse webhook data
    try:
        webhook_data = json.loads(body)
        event = webhook_data.get("event")
        data = webhook_data.get("data", {})
        
        logger.info(f"Webhook event: {event}")
        
        # Handle charge.success event
        if event == "charge.success":
            reference = data.get("reference")
            order_id = data.get("metadata", {}).get("order_id")
            
            if order_id:
                # Update payment status
                await OrderService.update_payment_status(
                    db,
                    order_id,
                    PaymentStatus.COMPLETED,
                    reference
                )
                
                # Get order and user details
                order = await OrderService.get_order_by_id(db, order_id)
                user = await UserService.get_user_by_id(db, order.user_id)
                
                # Send confirmation emails
                await EmailService.send_order_confirmation(user.email, order)
                await EmailService.send_admin_order_notification(order, user.email)
                
                logger.info(f"Webhook processed: Payment completed for order {order_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        # Return success to prevent Paystack from retrying
        return {"status": "success"}