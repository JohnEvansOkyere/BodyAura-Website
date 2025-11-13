# backend/app/services/email_service.py

import httpx
from app.config import settings
from app.models.schemas import OrderResponse
from typing import List
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service class for sending emails using Resend API"""
    
    RESEND_API_URL = "https://api.resend.com/emails"
    
    @staticmethod
    def _get_headers() -> dict:
        """Get headers for Resend API requests"""
        return {
            "Authorization": f"Bearer {settings.EMAIL_API_KEY}",
            "Content-Type": "application/json"
        }
    
    @staticmethod
    def _format_order_email_html(order: OrderResponse) -> str:
        """
        Generate HTML email template for order confirmation.
        
        Args:
            order: Order data
            
        Returns:
            str: HTML email content
        """
        items_html = ""
        for item in order.items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    {item.product.name if item.product else 'Product'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    {item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    GHS {float(item.price_at_time):.2f}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    GHS {float(item.price_at_time * item.quantity):.2f}
                </td>
            </tr>
            """
        
        shipping_address = order.shipping_address
        address_html = f"""
            {shipping_address.get('full_name', '')}<br>
            {shipping_address.get('phone', '')}<br>
            {shipping_address.get('address_line1', '')}<br>
            {shipping_address.get('address_line2', '') if shipping_address.get('address_line2') else ''}<br>
            {shipping_address.get('city', '')}, {shipping_address.get('region', '')}
        """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="margin: 0;">Order Confirmation</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                <p>Thank you for your order!</p>
                
                <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd;">
                    <h2 style="margin-top: 0; color: #4CAF50;">Order Details</h2>
                    <p><strong>Order ID:</strong> {order.id[:8]}...</p>
                    <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y')}</p>
                    <p><strong>Status:</strong> {order.status.value.title()}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method.replace('_', ' ').title()}</p>
                </div>
                
                <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd;">
                    <h2 style="margin-top: 0; color: #4CAF50;">Shipping Address</h2>
                    <p style="margin: 5px 0;">{address_html}</p>
                </div>
                
                <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd;">
                    <h2 style="margin-top: 0; color: #4CAF50;">Order Items</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 1.2em;">
                                    Total Amount:
                                </td>
                                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 1.2em; color: #4CAF50;">
                                    GHS {float(order.total_amount):.2f}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
                    <p>If you have any questions about your order, please contact us.</p>
                    <p style="font-size: 0.9em;">Thank you for shopping with Grejoy Health Products!</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @staticmethod
    async def send_order_confirmation(
        to_email: str,
        order: OrderResponse
    ) -> bool:
        """
        Send order confirmation email to customer.
        
        Args:
            to_email: Customer email address
            order: Order data
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            html_content = EmailService._format_order_email_html(order)
            
            payload = {
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": f"Order Confirmation - Order #{order.id[:8]}",
                "html": html_content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    EmailService.RESEND_API_URL,
                    json=payload,
                    headers=EmailService._get_headers(),
                    timeout=30.0
                )
                
                response.raise_for_status()
                
                logger.info(f"Order confirmation email sent to: {to_email}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to send order confirmation email: {str(e)}")
            # Don't raise exception - email failure shouldn't break order flow
            return False
    
    @staticmethod
    async def send_admin_order_notification(
        order: OrderResponse,
        customer_email: str
    ) -> bool:
        """
        Send order notification to admin.
        
        Args:
            order: Order data
            customer_email: Customer email
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            items_list = "\n".join([
                f"- {item.product.name if item.product else 'Product'}: {item.quantity} x GHS {float(item.price_at_time):.2f}"
                for item in order.items
            ])
            
            shipping_address = order.shipping_address
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>New Order Received</h2>
                <p><strong>Order ID:</strong> {order.id}</p>
                <p><strong>Customer Email:</strong> {customer_email}</p>
                <p><strong>Total Amount:</strong> GHS {float(order.total_amount):.2f}</p>
                <p><strong>Payment Method:</strong> {order.payment_method.replace('_', ' ').title()}</p>
                
                <h3>Shipping Address:</h3>
                <p>
                    {shipping_address.get('full_name', '')}<br>
                    {shipping_address.get('phone', '')}<br>
                    {shipping_address.get('address_line1', '')}<br>
                    {shipping_address.get('city', '')}, {shipping_address.get('region', '')}
                </p>
                
                <h3>Order Items:</h3>
                <pre>{items_list}</pre>
                
                <p style="margin-top: 30px;">Login to the admin dashboard to manage this order.</p>
            </body>
            </html>
            """
            
            payload = {
                "from": settings.EMAIL_FROM,
                "to": [settings.EMAIL_FROM],  # Send to same email (admin)
                "subject": f"New Order #{order.id[:8]} - GHS {float(order.total_amount):.2f}",
                "html": html_content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    EmailService.RESEND_API_URL,
                    json=payload,
                    headers=EmailService._get_headers(),
                    timeout=30.0
                )
                
                response.raise_for_status()
                
                logger.info(f"Admin order notification sent for order: {order.id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to send admin notification: {str(e)}")
            return False