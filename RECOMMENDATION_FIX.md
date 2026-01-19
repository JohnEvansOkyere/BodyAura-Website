# Recommendation System Fix - Product Filtering Issue

## Issue Identified

**Date:** 2026-01-19  
**Reporter:** User testing  
**Severity:** High

### Problem Description

A user with ID `78480d6b-5220-4fac-afcb-096944a51b1d` who had:
- ✅ Purchase history (completed orders)
- ❌ No items in cart

Was receiving **ALL products** as recommendations instead of filtered, relevant suggestions.

### Root Cause

The Supabase/PostgREST query builder's `.not_.in_()` syntax was not working correctly for filtering out excluded products. This caused the exclusion filter to fail silently, resulting in all products being returned.

```python
# BEFORE (Broken):
if exclude_list:
    recs_query = recs_query.not_.in_('id', exclude_list)  # ❌ Didn't work
```

---

## What Was Fixed

### 1. **Product Exclusion Logic**

Changed all recommendation methods to fetch products and filter in Python instead of relying on Supabase's `.not_.in_()` syntax:

```python
# AFTER (Fixed):
if exclude_list:
    recs_query = recs_query.limit(limit * 3)  # Fetch more to filter
    result = recs_query.execute()
    
    # Filter out excluded products in Python
    filtered_products = [
        p for p in result.data 
        if p['id'] not in exclude_list
    ]
```

**Affected Methods:**
- ✅ `_get_purchase_history_recommendations()`
- ✅ `_get_cart_based_recommendations()`
- ✅ `_get_browsing_history_recommendations()`
- ✅ `_get_trending_products()`

### 2. **Product View Count Increment**

Fixed the atomic increment of view counts when tracking product views:

```python
# BEFORE (Broken):
db.table('products').update({
    'view_count': db.table('products').select('view_count')...  # ❌ Nested query
}).eq('id', product_id).execute()

# AFTER (Fixed):
try:
    # Use PostgreSQL function for atomic increment
    db.rpc('increment_view_count', {'product_uuid': product_id}).execute()
except:
    # Fallback: fetch and update
    product = db.table('products').select('view_count').eq('id', product_id).single().execute()
    if product.data:
        current_count = product.data.get('view_count', 0)
        db.table('products').update({'view_count': current_count + 1}).eq('id', product_id).execute()
```

### 3. **Added PostgreSQL Function**

Added `increment_view_count()` function for atomic, efficient view count updates:

```sql
CREATE OR REPLACE FUNCTION increment_view_count(product_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql;
```

---

## Files Modified

### Backend:
1. **`backend/app/services/recommendation_service.py`**
   - Fixed exclusion filters in all recommendation methods
   - Fixed view count increment logic
   - Added proper error handling

2. **`backend/database/enhanced_recommendations.sql`**
   - Added `increment_view_count()` function

3. **`backend/database/fix_recommendation_filters.sql`** (NEW)
   - Patch migration for existing installations

---

## How to Apply the Fix

### If You Haven't Deployed Yet:
Just deploy the updated code - the fix is already included!

### If You Already Deployed:

#### Option 1: Full Redeploy
1. Pull the latest code
2. Redeploy backend (no database changes needed if you applied the function)
3. Test recommendations

#### Option 2: Database Patch Only
If you already ran the initial migration, apply the patch:

```bash
# Using psql
psql -U username -d database -f backend/database/fix_recommendation_filters.sql

# Or in Supabase SQL Editor
# Copy contents of fix_recommendation_filters.sql and run
```

Then redeploy your backend.

---

## Testing the Fix

### Test 1: Recommendations Don't Return All Products

1. Login as a user with purchase history
2. Go to homepage
3. Check "Recommended for You" section
4. ✅ Should show limited, relevant products (not all products)
5. ✅ Should exclude products user already purchased

### Test 2: Product View Tracking Works

1. Open browser dev tools → Network tab
2. View a product detail
3. ✅ POST request to `/track-view` should succeed
4. ✅ Product view_count should increment in database:

```sql
-- Check view count
SELECT name, view_count FROM products WHERE id = 'some-product-id';
```

### Test 3: Exclusion Filters Work

1. Add items to cart
2. Go to homepage
3. ✅ Recommended products should NOT include items already in cart
4. Remove cart items
5. Make a purchase
6. ✅ Recommended products should NOT include purchased items

---

## Verification Queries

### Check if function exists:
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'increment_view_count';
```

### Check product views are being tracked:
```sql
SELECT COUNT(*) 
FROM product_views 
WHERE viewed_at > NOW() - INTERVAL '1 hour';
```

### Check recommendations diversity:
```sql
-- This should show product counts per category in recommendations
-- Not all products from all categories
SELECT p.category, COUNT(*) as product_count
FROM products p
WHERE p.is_active = TRUE
GROUP BY p.category
ORDER BY product_count DESC;
```

---

## Performance Impact

### Before Fix:
- ❌ All products returned (could be 100s or 1000s)
- ❌ Frontend overwhelmed with data
- ❌ Slow page loads
- ❌ Poor user experience

### After Fix:
- ✅ Only requested number of products returned (typically 8-12)
- ✅ Proper filtering and exclusion
- ✅ Fast, relevant recommendations
- ✅ Better user experience

---

## Additional Improvements Made

### 1. **Better Logging**
Added more detailed logging to track what's happening:

```python
logger.info(f"Purchase history recommendations: {len(filtered_products)} products from {len(categories)} categories")
logger.info(f"Trending products: {len(final_products)} products (excluded {len(exclude_product_ids)} products)")
```

### 2. **Deduplication**
Added `list(set(...))` to ensure exclude lists don't have duplicates:

```python
exclude_list = list(set(exclude_product_ids + purchased_product_ids))
```

### 3. **Smarter Fetching**
Fetch more products than needed to account for filtering:

```python
# Fetch 3x limit to ensure we have enough after filtering
recs_query = recs_query.limit(limit * 3)
```

---

## Lessons Learned

1. **Don't Trust ORM Syntax Blindly**
   - Supabase's `.not_.in_()` didn't work as expected
   - Always test filter queries with real data
   - Python filtering is acceptable for moderate data sizes

2. **Atomic Operations**
   - Use database functions for atomic increments
   - Prevents race conditions
   - Better performance than fetch-and-update

3. **Comprehensive Testing**
   - Test with users who have different states:
     - No history
     - Cart items only
     - Purchase history only
     - Both cart and purchase history

4. **Logging is Critical**
   - Detailed logs helped identify the issue
   - Include counts and context in log messages

---

## Future Improvements

### Short-term:
- [ ] Add caching to reduce database queries
- [ ] Add metrics/monitoring for recommendation quality
- [ ] A/B test different exclusion strategies

### Long-term:
- [ ] Move to dedicated recommendation service
- [ ] Use Redis for caching recommendations
- [ ] Implement ML-based recommendations
- [ ] Add recommendation diversity scoring

---

## Summary

✅ **Fixed:** Product filtering now works correctly  
✅ **Fixed:** View count tracking is atomic and efficient  
✅ **Improved:** Better logging and error handling  
✅ **Added:** Database function for atomic increments  

The recommendation system now properly filters products and provides relevant, personalized suggestions without overwhelming users with all products.

---

## Need Help?

If you encounter issues after applying this fix:

1. Check backend logs for error messages
2. Verify the `increment_view_count` function exists
3. Test individual API endpoints
4. Check database indexes are present
5. Review this document's testing section

For detailed documentation, see:
- `backend/database/RECOMMENDATIONS_README.md`
- `RECOMMENDATIONS_IMPLEMENTATION.md`
