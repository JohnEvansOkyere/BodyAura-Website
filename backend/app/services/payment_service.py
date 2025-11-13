# backend/app/services/payment_service.py

import httpx
from app.config import settings
from app.models.schemas import PaymentMethod, PaymentResponse
from fastapi import HTTPException, status
import logging
import hmac
import hashlib

logger = logging.getLogger(__name__)


class PaymentService:
    """Service class for Paystack payment integration"""
    
    PAYSTACK_BASE_URL = "https://api.paystack.co"
    
    @staticmethod
    def _get_headers() -> dict:
        """Get headers for Paystack API requests"""
        return {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
    
    @staticmethod
    def _get_channel_for_payment_method(payment_method: PaymentMethod) -> str:
        """
        Map payment method to Paystack channel.
        
        Args:
            payment_method: Payment method enum
            
        Returns:
            str: Paystack channel name
        """
        channel_map = {
            PaymentMethod.MOMO_MTN: "mobile_money",
            PaymentMethod.MOMO_VODAFONE: "mobile_money",
            PaymentMethod.MOMO_AIRTELTIGO: "mobile_money",
            PaymentMethod.CARD: "card"
        }
        return channel_map.get(payment_method, "card")
    
    @staticmethod
    def _get_mobile_money_provider(payment_method: PaymentMethod) -> str:
        """
        Get mobile money provider code for Paystack.
        
        Args:
            payment_method: Payment method enum
            
        Returns:
            str: Provider code (mtn, vod, tgo)
        """
        provider_map = {
            PaymentMethod.MOMO_MTN: "mtn",
            PaymentMethod.MOMO_VODAFONE: "vod",
            PaymentMethod.MOMO_AIRTELTIGO: "tgo"
        }
        return provider_map.get(payment_method, "")
    
    @staticmethod
    async def initialize_payment(
        order_id: str,
        email: str,
        amount: float,
        payment_method: PaymentMethod,
        callback_url: str
    ) -> PaymentResponse:
        """
        Initialize payment with Paystack.
        
        Args:
            order_id: Order ID (used as reference)
            email: Customer email
            amount: Amount in GHS
            payment_method: Payment method
            callback_url: URL to redirect after payment
            
        Returns:
            PaymentResponse: Payment initialization data
            
        Raises:
            HTTPException: If initialization fails
        """
        try:
            # Convert amount to pesewas (Paystack uses smallest currency unit)
            amount_in_pesewas = int(amount * 100)
            
            # Build payload
            payload = {
                "email": email,
                "amount": amount_in_pesewas,
                "currency": "GHS",
                "reference": f"ORD-{order_id}",
                "callback_url": callback_url,
                "metadata": {
                    "order_id": order_id,
                    "payment_method": payment_method.value
                }
            }
            
            # Add channel restrictions
            channel = PaymentService._get_channel_for_payment_method(payment_method)
            payload["channels"] = [channel]
            
            # Add mobile money specific fields
            if payment_method in [
                PaymentMethod.MOMO_MTN, 
                PaymentMethod.MOMO_VODAFONE, 
                PaymentMethod.MOMO_AIRTELTIGO
            ]:
                provider = PaymentService._get_mobile_money_provider(payment_method)
                payload["mobile_money"] = {
                    "phone": "",  # Customer will enter on Paystack page
                    "provider": provider
                }
            
            # Make API request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{PaymentService.PAYSTACK_BASE_URL}/transaction/initialize",
                    json=payload,
                    headers=PaymentService._get_headers(),
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                if not data.get("status"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=data.get("message", "Payment initialization failed")
                    )
                
                payment_data = data["data"]
                
                logger.info(f"Payment initialized: Order {order_id}, Reference: {payment_data['reference']}")
                
                return PaymentResponse(
                    authorization_url=payment_data["authorization_url"],
                    access_code=payment_data["access_code"],
                    reference=payment_data["reference"]
                )
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Paystack API error: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment service unavailable. Please try again."
            )
        except Exception as e:
            logger.error(f"Payment initialization error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize payment"
            )
    
    @staticmethod
    async def verify_payment(reference: str) -> dict:
        """
        Verify payment with Paystack.
        
        Args:
            reference: Payment reference
            
        Returns:
            dict: Payment verification data
            
        Raises:
            HTTPException: If verification fails
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{PaymentService.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                    headers=PaymentService._get_headers(),
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                if not data.get("status"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=data.get("message", "Payment verification failed")
                    )
                
                payment_data = data["data"]
                
                logger.info(f"Payment verified: Reference {reference}, Status: {payment_data['status']}")
                
                return payment_data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Paystack API error: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment verification failed"
            )
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify payment"
            )
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> bool:
        """
        Verify Paystack webhook signature.
        
        Args:
            payload: Raw request body
            signature: X-Paystack-Signature header value
            
        Returns:
            bool: True if signature is valid
        """
        try:
            # Compute HMAC SHA512 hash
            computed_signature = hmac.new(
                settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
                payload,
                hashlib.sha512
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(computed_signature, signature)
            
        except Exception as e:
            logger.error(f"Webhook signature verification error: {str(e)}")
            return False