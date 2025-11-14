# backend/app/routes/payments.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.routes.auth import get_current_user
from app.config import settings
import httpx
import logging
from typing import Dict, Any

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger(__name__)


@router.post("/initialize/{order_id}")
async def initialize_payment(
    order_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Initialize Paystack payment for an order."""
    try:
        # Get order
        order_response = db.table("orders").select("*").eq("id", order_id).eq("user_id", current_user.id).execute()
        
        if not order_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        order = order_response.data[0]
        
        # Check if already paid
        if order.get("payment_status") == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order already paid"
            )
        
        # Generate unique reference
        import uuid
        reference = f"ORD-{order_id[:8]}-{uuid.uuid4().hex[:8]}".upper()
        
        # Convert amount to kobo/pesewas (multiply by 100)
        amount = float(order.get("total_amount", 0))
        amount_in_pesewas = int(amount * 100)
        
        # Initialize payment with Paystack
        paystack_data = {
            "email": current_user.email,
            "amount": amount_in_pesewas,
            "reference": reference,
            "callback_url": f"{settings.FRONTEND_URL}/payment/verify/{reference}",
            "metadata": {
                "order_id": order_id,
                "user_id": current_user.id,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.paystack.co/transaction/initialize",
                json=paystack_data,
                headers={
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
        
        if response.status_code != 200:
            logger.error(f"Paystack initialization failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize payment"
            )
        
        paystack_response = response.json()
        
        if not paystack_response.get("status"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment initialization failed"
            )
        
        # Update order with payment reference
        db.table("orders").update({
            "payment_reference": reference
        }).eq("id", order_id).execute()
        
        return {
            "authorization_url": paystack_response["data"]["authorization_url"],
            "access_code": paystack_response["data"]["access_code"],
            "reference": reference
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment initialization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize payment"
        )


@router.get("/verify/{reference}")
async def verify_payment(
    reference: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Verify payment status with Paystack."""
    try:
        # Verify with Paystack
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                },
                timeout=30.0
            )
        
        if response.status_code != 200:
            logger.error(f"Paystack verification failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed"
            )
        
        paystack_data = response.json()
        
        if not paystack_data.get("status"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed"
            )
        
        transaction = paystack_data["data"]
        
        # Check if payment was successful
        if transaction["status"] != "success":
            return {
                "status": "failed",
                "message": "Payment was not successful",
                "reference": reference
            }
        
        # Get order from metadata
        order_id = transaction["metadata"].get("order_id")
        
        if not order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment reference"
            )
        
        # Update order payment status
        update_response = db.table("orders").update({
            "payment_status": "completed",
            "status": "processing"
        }).eq("id", order_id).eq("payment_reference", reference).execute()
        
        if not update_response.data:
            logger.error(f"Failed to update order {order_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        return {
            "status": "success",
            "message": "Payment verified successfully",
            "reference": reference,
            "amount": transaction["amount"] / 100,  # Convert back to GHS
            "order_id": order_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )


@router.post("/webhook")
async def paystack_webhook(
    payload: Dict[Any, Any],
    db=Depends(get_db)
):
    """Handle Paystack webhook events."""
    try:
        event = payload.get("event")
        data = payload.get("data", {})
        
        if event == "charge.success":
            reference = data.get("reference")
            order_id = data.get("metadata", {}).get("order_id")
            
            if order_id and reference:
                # Update order
                db.table("orders").update({
                    "payment_status": "completed",
                    "status": "processing"
                }).eq("id", order_id).eq("payment_reference", reference).execute()
                
                logger.info(f"Webhook: Payment successful for order {order_id}")
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error"}