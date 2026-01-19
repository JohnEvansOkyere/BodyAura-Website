# backend/app/services/recommendation_service.py

from typing import List, Dict, Optional, Tuple
from supabase import Client
from decimal import Decimal
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for intelligent product recommendations"""

    @staticmethod
    async def get_personalized_recommendations(
        db: Client,
        user_id: Optional[str] = None,
        limit: int = 12,
        exclude_product_ids: List[str] = []
    ) -> List[Dict]:
        """
        Get personalized product recommendations using multiple strategies.
        
        Strategies used (in order of priority):
        1. User's purchase history categories
        2. User's cart categories (multiple, not just first)
        3. User's browsing history
        4. Collaborative filtering (users who bought X also bought Y)
        5. Trending products
        6. Popular products
        
        Args:
            db: Database client
            user_id: Optional user ID for personalized recommendations
            limit: Maximum number of products to return
            exclude_product_ids: Product IDs to exclude from recommendations
            
        Returns:
            List of product dictionaries
        """
        recommendations = []
        
        if user_id:
            # Strategy 1: Purchase history based recommendations
            purchase_recs = await RecommendationService._get_purchase_history_recommendations(
                db, user_id, limit, exclude_product_ids
            )
            recommendations.extend(purchase_recs)
            
            # Strategy 2: Cart-based recommendations (multiple categories)
            if len(recommendations) < limit:
                cart_recs = await RecommendationService._get_cart_based_recommendations(
                    db, user_id, limit - len(recommendations), exclude_product_ids + [p['id'] for p in recommendations]
                )
                recommendations.extend(cart_recs)
            
            # Strategy 3: Browsing history recommendations
            if len(recommendations) < limit:
                browse_recs = await RecommendationService._get_browsing_history_recommendations(
                    db, user_id, limit - len(recommendations), exclude_product_ids + [p['id'] for p in recommendations]
                )
                recommendations.extend(browse_recs)
            
            # Strategy 4: Collaborative filtering
            if len(recommendations) < limit:
                collab_recs = await RecommendationService._get_collaborative_recommendations(
                    db, user_id, limit - len(recommendations), exclude_product_ids + [p['id'] for p in recommendations]
                )
                recommendations.extend(collab_recs)
        
        # Strategy 5 & 6: Fill with trending/popular products
        if len(recommendations) < limit:
            popular_recs = await RecommendationService._get_trending_products(
                db, limit - len(recommendations), exclude_product_ids + [p['id'] for p in recommendations]
            )
            recommendations.extend(popular_recs)
        
        return recommendations[:limit]

    @staticmethod
    async def _get_purchase_history_recommendations(
        db: Client,
        user_id: str,
        limit: int,
        exclude_product_ids: List[str]
    ) -> List[Dict]:
        """Get recommendations based on user's purchase history categories"""
        try:
            # Get categories from user's past orders
            query = db.table('order_items').select(
                'product_id, products!inner(category)'
            ).eq('orders.user_id', user_id).eq('orders.payment_status', 'completed')
            
            # This is a simplified approach - ideally we'd join through orders table
            # For now, let's get products from categories the user has purchased from
            
            # Get user's order IDs first
            orders_query = db.table('orders').select('id').eq('user_id', user_id).eq('payment_status', 'completed')
            orders_result = orders_query.execute()
            
            if not orders_result.data:
                return []
            
            order_ids = [order['id'] for order in orders_result.data]
            
            # Get product IDs from those orders
            order_items_query = db.table('order_items').select('product_id').in_('order_id', order_ids)
            order_items_result = order_items_query.execute()
            
            if not order_items_result.data:
                return []
            
            purchased_product_ids = list(set([item['product_id'] for item in order_items_result.data]))
            
            # Get categories of purchased products
            products_query = db.table('products').select('category').in_('id', purchased_product_ids).neq('category', None)
            products_result = products_query.execute()
            
            if not products_result.data:
                return []
            
            categories = list(set([p['category'] for p in products_result.data if p['category']]))
            
            if not categories:
                return []
            
            # Find products in those categories (excluding already purchased)
            exclude_list = list(set(exclude_product_ids + purchased_product_ids))
            
            recs_query = db.table('products').select('*').in_('category', categories).eq('is_active', True).gt('stock_quantity', 0)
            
            # Apply exclusion filter using correct Supabase syntax
            if exclude_list:
                # Use .not_.is_('id', 'in', f'({...})') for Supabase
                # Or fetch all and filter in Python
                recs_query = recs_query.limit(limit * 3)  # Fetch more to filter
                result = recs_query.execute()
                
                # Filter out excluded products in Python
                filtered_products = [
                    p for p in result.data 
                    if p['id'] not in exclude_list
                ]
                
                # Sort by purchase count and limit
                filtered_products.sort(key=lambda x: x.get('purchase_count', 0), reverse=True)
                filtered_products = filtered_products[:limit]
                
                logger.info(f"Purchase history recommendations: {len(filtered_products)} products from {len(categories)} categories")
                return filtered_products
            else:
                recs_query = recs_query.order('purchase_count', desc=True).limit(limit)
                result = recs_query.execute()
                logger.info(f"Purchase history recommendations: {len(result.data)} products")
                return result.data
            
        except Exception as e:
            logger.error(f"Error getting purchase history recommendations: {e}")
            return []

    @staticmethod
    async def _get_cart_based_recommendations(
        db: Client,
        user_id: str,
        limit: int,
        exclude_product_ids: List[str]
    ) -> List[Dict]:
        """Get recommendations based on ALL cart item categories"""
        try:
            # Get all cart items with product details
            cart_query = db.table('cart_items').select(
                'product_id, products!inner(category)'
            ).eq('user_id', user_id)
            
            cart_result = cart_query.execute()
            
            if not cart_result.data:
                return []
            
            # Extract unique categories
            categories = list(set([
                item['products']['category'] 
                for item in cart_result.data 
                if item.get('products') and item['products'].get('category')
            ]))
            
            if not categories:
                return []
            
            # Get cart product IDs to exclude
            cart_product_ids = [item['product_id'] for item in cart_result.data]
            exclude_list = list(set(exclude_product_ids + cart_product_ids))
            
            # Find products in those categories
            recs_query = db.table('products').select('*').in_('category', categories).eq('is_active', True).gt('stock_quantity', 0)
            
            # Apply exclusion filter
            if exclude_list:
                recs_query = recs_query.limit(limit * 3)  # Fetch more to filter
                result = recs_query.execute()
                
                # Filter out excluded products in Python
                filtered_products = [
                    p for p in result.data 
                    if p['id'] not in exclude_list
                ]
                
                # Sort and limit
                filtered_products.sort(key=lambda x: x.get('purchase_count', 0), reverse=True)
                filtered_products = filtered_products[:limit]
                
                logger.info(f"Cart-based recommendations: {len(filtered_products)} products from {len(categories)} categories")
                return filtered_products
            else:
                recs_query = recs_query.order('purchase_count', desc=True).limit(limit)
                result = recs_query.execute()
                logger.info(f"Cart-based recommendations: {len(result.data)} products from {len(categories)} categories")
                return result.data
            
        except Exception as e:
            logger.error(f"Error getting cart-based recommendations: {e}")
            return []

    @staticmethod
    async def _get_browsing_history_recommendations(
        db: Client,
        user_id: str,
        limit: int,
        exclude_product_ids: List[str]
    ) -> List[Dict]:
        """Get recommendations based on browsing history"""
        try:
            # Get recently viewed products (last 30 days)
            thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
            
            views_query = db.table('product_views').select(
                'product_id, products!inner(category)'
            ).eq('user_id', user_id).gte('viewed_at', thirty_days_ago)
            
            views_result = views_query.execute()
            
            if not views_result.data:
                return []
            
            # Extract categories from viewed products
            categories = list(set([
                item['products']['category']
                for item in views_result.data
                if item.get('products') and item['products'].get('category')
            ]))
            
            viewed_product_ids = [item['product_id'] for item in views_result.data]
            exclude_list = list(set(exclude_product_ids + viewed_product_ids))
            
            if not categories:
                return []
            
            # Find products in those categories
            recs_query = db.table('products').select('*').in_('category', categories).eq('is_active', True).gt('stock_quantity', 0)
            
            # Apply exclusion filter
            if exclude_list:
                recs_query = recs_query.limit(limit * 3)  # Fetch more to filter
                result = recs_query.execute()
                
                # Filter out excluded products in Python
                filtered_products = [
                    p for p in result.data 
                    if p['id'] not in exclude_list
                ]
                
                # Sort and limit
                filtered_products.sort(key=lambda x: x.get('view_count', 0), reverse=True)
                filtered_products = filtered_products[:limit]
                
                logger.info(f"Browsing history recommendations: {len(filtered_products)} products")
                return filtered_products
            else:
                recs_query = recs_query.order('view_count', desc=True).limit(limit)
                result = recs_query.execute()
                logger.info(f"Browsing history recommendations: {len(result.data)} products")
                return result.data
            
        except Exception as e:
            logger.error(f"Error getting browsing history recommendations: {e}")
            return []

    @staticmethod
    async def _get_collaborative_recommendations(
        db: Client,
        user_id: str,
        limit: int,
        exclude_product_ids: List[str]
    ) -> List[Dict]:
        """
        Get recommendations based on what other users with similar purchases bought.
        "People who bought X also bought Y"
        """
        try:
            # Get user's purchased products
            orders_query = db.table('orders').select('id').eq('user_id', user_id).eq('payment_status', 'completed')
            orders_result = orders_query.execute()
            
            if not orders_result.data:
                return []
            
            order_ids = [order['id'] for order in orders_result.data]
            
            # Get product IDs from those orders
            order_items_query = db.table('order_items').select('product_id').in_('order_id', order_ids)
            order_items_result = order_items_query.execute()
            
            if not order_items_result.data:
                return []
            
            user_product_ids = [item['product_id'] for item in order_items_result.data]
            
            # Find products frequently bought with user's products
            assoc_query = db.table('product_associations').select(
                'product_b_id, association_count'
            ).in_('product_a_id', user_product_ids).order('association_count', desc=True).limit(limit * 2)
            
            assoc_result = assoc_query.execute()
            
            if not assoc_result.data:
                # Try reverse direction
                assoc_query = db.table('product_associations').select(
                    'product_a_id, association_count'
                ).in_('product_b_id', user_product_ids).order('association_count', desc=True).limit(limit * 2)
                
                assoc_result = assoc_query.execute()
                
                if not assoc_result.data:
                    return []
                
                recommended_product_ids = [item['product_a_id'] for item in assoc_result.data]
            else:
                recommended_product_ids = [item['product_b_id'] for item in assoc_result.data]
            
            # Filter out excluded products
            exclude_list = exclude_product_ids + user_product_ids
            recommended_product_ids = [pid for pid in recommended_product_ids if pid not in exclude_list]
            
            if not recommended_product_ids:
                return []
            
            # Get actual product details
            products_query = db.table('products').select('*').in_('id', recommended_product_ids).eq('is_active', True).gt('stock_quantity', 0)
            
            # Limit to requested amount
            products_query = products_query.limit(limit)
            
            result = products_query.execute()
            
            logger.info(f"Collaborative filtering recommendations: {len(result.data)} products")
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting collaborative recommendations: {e}")
            return []

    @staticmethod
    async def _get_trending_products(
        db: Client,
        limit: int,
        exclude_product_ids: List[str]
    ) -> List[Dict]:
        """Get trending/popular products"""
        try:
            query = db.table('products').select('*').eq('is_active', True).gt('stock_quantity', 0)
            
            # Fetch more than needed to filter and sort in Python
            fetch_limit = limit * 5 if exclude_product_ids else limit * 2
            query = query.limit(fetch_limit)
            
            result = query.execute()
            
            if not result.data:
                return []
            
            # Filter out excluded products
            products = result.data
            if exclude_product_ids:
                exclude_set = set(exclude_product_ids)
                products = [p for p in products if p['id'] not in exclude_set]
            
            # Calculate popularity score and sort
            for product in products:
                popularity = (
                    (product.get('trending_score', 0) * 1.0) +
                    (product.get('purchase_count', 0) * 10.0) +
                    (product.get('view_count', 0) * 0.1)
                )
                product['_popularity_score'] = popularity
            
            # Sort by popularity score
            products.sort(key=lambda x: x.get('_popularity_score', 0), reverse=True)
            
            # Remove the temporary score field and limit
            final_products = []
            for product in products[:limit]:
                if '_popularity_score' in product:
                    del product['_popularity_score']
                final_products.append(product)
            
            logger.info(f"Trending products recommendations: {len(final_products)} products (excluded {len(exclude_product_ids)} products)")
            return final_products
            
        except Exception as e:
            logger.error(f"Error getting trending products: {e}")
            return []

    @staticmethod
    async def get_similar_products(
        db: Client,
        product_id: str,
        limit: int = 8
    ) -> List[Dict]:
        """
        Get products similar to the given product.
        Based on same category and price range.
        """
        try:
            # Get the source product
            product_query = db.table('products').select('*').eq('id', product_id).single()
            product_result = product_query.execute()
            
            if not product_result.data:
                return []
            
            source_product = product_result.data
            category = source_product.get('category')
            price = float(source_product.get('price', 0))
            
            if not category:
                return []
            
            # Find similar products in same category with similar price range (+/- 30%)
            price_min = price * 0.7
            price_max = price * 1.3
            
            similar_query = db.table('products').select('*').eq('category', category).eq('is_active', True).gt('stock_quantity', 0).neq('id', product_id).gte('price', price_min).lte('price', price_max).order('purchase_count', desc=True).limit(limit)
            
            result = similar_query.execute()
            
            logger.info(f"Similar products for {product_id}: {len(result.data)} products")
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting similar products: {e}")
            return []

    @staticmethod
    async def get_frequently_bought_together(
        db: Client,
        product_id: str,
        limit: int = 4
    ) -> List[Dict]:
        """Get products frequently bought together with the given product"""
        try:
            # Query product associations
            assoc_query = db.table('product_associations').select(
                'product_b_id, association_count'
            ).eq('product_a_id', product_id).order('association_count', desc=True).limit(limit)
            
            assoc_result = assoc_query.execute()
            
            product_ids = [item['product_b_id'] for item in assoc_result.data]
            
            # Also check reverse direction
            assoc_query_reverse = db.table('product_associations').select(
                'product_a_id, association_count'
            ).eq('product_b_id', product_id).order('association_count', desc=True).limit(limit)
            
            assoc_result_reverse = assoc_query_reverse.execute()
            
            product_ids.extend([item['product_a_id'] for item in assoc_result_reverse.data])
            
            # Remove duplicates
            product_ids = list(set(product_ids))[:limit]
            
            if not product_ids:
                return []
            
            # Get product details
            products_query = db.table('products').select('*').in_('id', product_ids).eq('is_active', True).gt('stock_quantity', 0)
            
            result = products_query.execute()
            
            logger.info(f"Frequently bought together for {product_id}: {len(result.data)} products")
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting frequently bought together: {e}")
            return []

    @staticmethod
    async def track_product_view(
        db: Client,
        product_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        source: Optional[str] = None
    ) -> bool:
        """Track a product view for recommendation purposes"""
        try:
            # Insert product view
            view_data = {
                'product_id': product_id,
                'viewed_at': datetime.now().isoformat(),
                'source': source or 'unknown'
            }
            
            if user_id:
                view_data['user_id'] = user_id
            if session_id:
                view_data['session_id'] = session_id
            
            db.table('product_views').insert(view_data).execute()
            
            # Increment product view count using RPC if available, or fetch and update
            try:
                # Try to use PostgreSQL function to increment atomically
                # This is more efficient than fetch + update
                db.rpc('increment_view_count', {'product_uuid': product_id}).execute()
            except:
                # Fallback: fetch current count and increment
                product = db.table('products').select('view_count').eq('id', product_id).single().execute()
                if product.data:
                    current_count = product.data.get('view_count', 0)
                    db.table('products').update({
                        'view_count': current_count + 1
                    }).eq('id', product_id).execute()
            
            logger.info(f"Tracked view for product {product_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking product view: {e}")
            return False
