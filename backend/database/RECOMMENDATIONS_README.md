# Enhanced Product Recommendation System

## Overview

This document describes the enhanced recommendation system that has been implemented for the BodyAura e-commerce platform. The system uses multiple data sources and strategies to provide intelligent, personalized product recommendations.

---

## Features

### 1. **Multi-Strategy Recommendations**
The system combines multiple recommendation strategies to provide the best suggestions:

- **Purchase History**: Recommends products from categories the user has previously purchased
- **Cart-Based**: Analyzes ALL items in the user's cart (not just the first one)
- **Browsing History**: Tracks what products users view and recommends similar items
- **Collaborative Filtering**: "People who bought X also bought Y" recommendations
- **Trending Products**: Falls back to popular/trending products when personalized data is limited

### 2. **Product View Tracking**
- Tracks when users view product details
- Records the source of the view (search, category, recommendations, etc.)
- Supports both logged-in users and anonymous sessions
- Used to improve future recommendations

### 3. **Similar Products**
- Finds products in the same category with similar price range
- Great for product detail pages

### 4. **Frequently Bought Together**
- Identifies products commonly purchased together
- Automatically updated when orders are completed
- Perfect for cross-selling

---

## Database Schema

### New Tables

#### 1. `product_views`
Tracks user browsing behavior for recommendations.

```sql
- id: UUID (primary key)
- user_id: UUID (nullable, references users)
- product_id: UUID (references products)
- session_id: TEXT (for anonymous users)
- viewed_at: TIMESTAMP
- duration_seconds: INTEGER
- source: TEXT (search, category, recommendation, etc.)
```

#### 2. `user_preferences`
Stores calculated user category preferences based on behavior.

```sql
- id: UUID (primary key)
- user_id: UUID (references users)
- category: TEXT
- preference_score: DECIMAL(3,2) (0.00 to 1.00)
- last_updated: TIMESTAMP
```

#### 3. `wishlist_items`
Tracks products users are interested in.

```sql
- id: UUID (primary key)
- user_id: UUID (references users)
- product_id: UUID (references products)
- created_at: TIMESTAMP
```

#### 4. `product_associations`
Tracks which products are frequently bought together.

```sql
- id: UUID (primary key)
- product_a_id: UUID (references products)
- product_b_id: UUID (references products)
- association_count: INTEGER
- confidence_score: DECIMAL(3,2)
- last_updated: TIMESTAMP
```

### Materialized View

#### `product_popularity`
Pre-computed product popularity scores for fast recommendations.

**Columns:**
- All product fields
- `recent_views_7d`: Views in last 7 days
- `recent_purchases_30d`: Purchases in last 30 days
- `popularity_score`: Calculated score for ranking

**Refresh:** Call `SELECT refresh_product_popularity();` periodically (e.g., daily cron job)

---

## API Endpoints

### 1. Get Personalized Recommendations
```
GET /api/products/recommendations/personalized?limit=12
```

**Parameters:**
- `limit` (optional): Number of recommendations (1-50, default: 12)

**Authentication:** Optional (better recommendations when logged in)

**Response:** Array of Product objects

**Example:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "price": 45.00,
    "category": "Skincare",
    ...
  }
]
```

### 2. Get Similar Products
```
GET /api/products/{product_id}/similar?limit=8
```

**Parameters:**
- `product_id` (path): Product ID
- `limit` (optional): Number of similar products (1-20, default: 8)

**Response:** Array of Product objects

### 3. Get Frequently Bought Together
```
GET /api/products/{product_id}/frequently-bought-together?limit=4
```

**Parameters:**
- `product_id` (path): Product ID
- `limit` (optional): Number of products (1-10, default: 4)

**Response:** Array of Product objects

### 4. Track Product View
```
POST /api/products/{product_id}/track-view?source=modal
```

**Parameters:**
- `product_id` (path): Product ID
- `source` (optional): Source of view (e.g., "search", "category", "modal")

**Authentication:** Optional

**Response:**
```json
{
  "message": "Product view tracked successfully"
}
```

---

## Frontend Integration

### Services

**`productService.ts`** has been updated with new methods:

```typescript
// Get personalized recommendations
productService.getPersonalizedRecommendations(limit?: number)

// Get similar products
productService.getSimilarProducts(productId: string, limit?: number)

// Get frequently bought together
productService.getFrequentlyBoughtTogether(productId: string, limit?: number)

// Track product view
productService.trackProductView(productId: string, source?: string)
```

### Components

**RecommendedProducts Component:**
- Now uses the new personalized recommendations API
- Automatically shows only for logged-in users
- Displays smart recommendations based on user behavior

**ProductDetailsModal Component:**
- Automatically tracks product views when opened
- Can be enhanced to show "Similar Products" or "Frequently Bought Together"

---

## Installation

### 1. Run Database Migration

Execute the SQL migration file:

```bash
# Connect to your database
psql -U your_username -d your_database -f backend/database/enhanced_recommendations.sql
```

Or if using Supabase:

```sql
-- Copy the contents of enhanced_recommendations.sql
-- and run it in the Supabase SQL editor
```

### 2. Verify Tables Created

Check that all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'product_views', 
  'user_preferences', 
  'wishlist_items', 
  'product_associations'
);
```

### 3. Test the Recommendation Service

The recommendation service will work immediately, but will improve as users:
- Browse products
- Add items to cart
- Make purchases

---

## Maintenance

### Refresh Product Popularity (Daily Recommended)

Set up a cron job or scheduled task to refresh the materialized view:

```sql
SELECT refresh_product_popularity();
```

**Example Cron Job:**
```bash
# Run daily at 2 AM
0 2 * * * psql -U your_user -d your_db -c "SELECT refresh_product_popularity();"
```

### Calculate User Preferences

For a specific user:

```sql
SELECT calculate_user_preferences('user-uuid-here');
```

This is automatically calculated as users interact with products.

---

## Performance Optimization

### Indexes

All critical queries are indexed:
- Product views by user, product, and date
- User preferences by user and score
- Product associations by both product IDs

### Materialized View

The `product_popularity` view is materialized for fast access. Refresh it periodically to keep it up-to-date.

### Query Optimization

- Recommendations are limited to reduce database load
- Excluded product lists prevent duplicate recommendations
- Stock quantity checks ensure only available products are recommended

---

## Future Enhancements

### Phase 1 (Current Implementation) ✅
- [x] Multi-strategy recommendations
- [x] Product view tracking
- [x] Similar products
- [x] Frequently bought together

### Phase 2 (Potential Additions)
- [ ] User preference scoring with machine learning
- [ ] A/B testing framework for recommendation strategies
- [ ] Real-time recommendation updates
- [ ] Category-specific trending products
- [ ] Seasonal recommendations
- [ ] Price-based filtering in recommendations
- [ ] Product ratings and reviews integration
- [ ] Email recommendations based on browsing history

### Phase 3 (Advanced)
- [ ] Deep learning recommendation models
- [ ] Image-based similarity matching
- [ ] Natural language search integration
- [ ] Recommendation explanation (why this product?)
- [ ] Multi-language support for recommendations

---

## Troubleshooting

### No Recommendations Showing

**Problem:** Empty recommendation list

**Solutions:**
1. Check if products exist in database and are active
2. Verify user has some activity (cart items, views, purchases)
3. Check console logs for errors
4. Verify API endpoints are accessible

### Slow Recommendations

**Problem:** Recommendations take too long to load

**Solutions:**
1. Refresh the `product_popularity` materialized view
2. Check database indexes are created
3. Review slow query logs
4. Consider caching recommendations in Redis

### Product Views Not Tracking

**Problem:** Views not being recorded

**Solutions:**
1. Check API endpoint is accessible: `/api/products/{id}/track-view`
2. Verify database permissions for `product_views` table
3. Check browser console for JavaScript errors
4. Ensure `productService.trackProductView()` is called

---

## Analytics

### Useful Queries

**Most Viewed Products (Last 7 Days):**
```sql
SELECT p.name, COUNT(*) as views
FROM product_views pv
JOIN products p ON pv.product_id = p.id
WHERE pv.viewed_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.name
ORDER BY views DESC
LIMIT 10;
```

**User's Top Categories:**
```sql
SELECT category, preference_score
FROM user_preferences
WHERE user_id = 'user-uuid-here'
ORDER BY preference_score DESC;
```

**Product Association Strength:**
```sql
SELECT 
  pa.name as product_a,
  pb.name as product_b,
  assoc.association_count
FROM product_associations assoc
JOIN products pa ON assoc.product_a_id = pa.id
JOIN products pb ON assoc.product_b_id = pb.id
ORDER BY assoc.association_count DESC
LIMIT 20;
```

---

## Support

For issues or questions about the recommendation system:

1. Check this documentation
2. Review backend logs: `backend/app/services/recommendation_service.py`
3. Inspect database tables and indexes
4. Test individual API endpoints

---

## Version History

- **v1.0.0** (2026-01-19): Initial implementation with multi-strategy recommendations
