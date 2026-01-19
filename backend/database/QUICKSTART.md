# Quick Start Guide - Recommendation System Deployment

## 🚀 5-Minute Setup

Follow these steps to deploy the enhanced recommendation system:

---

## Step 1: Apply Database Migrations (3 minutes)

⚠️ **IMPORTANT:** Run migrations in the correct order!

### If using Supabase (Recommended):

#### Migration 1: Add Product Tracking Columns

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `01_add_product_tracking_columns.sql` 
5. Paste into the SQL editor
6. Click **RUN** (or press `Ctrl/Cmd + Enter`)
7. Wait for "Success" message

#### Migration 2: Enhanced Recommendations

1. In SQL Editor, create another new query
2. Copy the entire contents of `02_enhanced_recommendations.sql` 
3. Paste into the SQL editor
4. Click **RUN**
5. Wait for "Success. No rows returned" message

### If using PostgreSQL directly:

```bash
# Navigate to the database folder
cd backend/database

# Run migrations in order
psql -U your_username -d your_database -f 01_add_product_tracking_columns.sql
psql -U your_username -d your_database -f 02_enhanced_recommendations.sql

# Or if using environment variables
psql $DATABASE_URL -f 01_add_product_tracking_columns.sql
psql $DATABASE_URL -f 02_enhanced_recommendations.sql
```

---

## Step 2: Verify Migrations (1 minute)

### Verify Migration 1: Product Columns

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('video_url', 'trending_score', 'view_count', 'purchase_count', 'shipping_cost')
ORDER BY column_name;
```

**Expected Result:** Should return 5 rows

### Verify Migration 2: Recommendation Tables

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

**Expected Result:** Should return 4 rows (one for each table)

### Verify Materialized View:

```sql
SELECT COUNT(*) FROM product_popularity;
```

**Expected Result:** Should return the number of active products (no error)

---

## Step 3: Deploy Backend (1 minute)

Your backend is already updated with the new code. Just deploy as usual:

```bash
# If using Git deployment
git add .
git commit -m "Add enhanced recommendation system"
git push origin main

# If using Render, Railway, or similar
# They will auto-deploy from your Git push
```

---

## Step 4: Deploy Frontend (1 minute)

Your frontend is also ready. Deploy as usual:

```bash
# Navigate to frontend folder
cd frontend

# Build (if needed)
npm run build

# Deploy (depends on your hosting)
# Vercel: vercel --prod
# Netlify: netlify deploy --prod
# Or push to Git for auto-deployment
```

---

## Step 5: Test (2 minutes)

### Test 1: Homepage (Non-Logged-In)
1. Open your website in an incognito/private window
2. Go to homepage
3. ✅ Should see "All Products" section
4. ❌ Should NOT see "Recommended for You" section

### Test 2: Homepage (Logged-In)
1. Login to your account
2. Go to homepage
3. ✅ Should see "Recommended for You" section
4. ✅ Should see "All Products" section below

### Test 3: Product View Tracking
1. Open browser dev tools (F12)
2. Go to Network tab
3. Click on any product to view details
4. ✅ Should see a POST request to `/api/products/{id}/track-view`
5. ✅ Should get 200 OK response

### Test 4: API Endpoints
Visit these URLs (replace YOUR_DOMAIN):

```
https://YOUR_DOMAIN/api/products/recommendations/personalized
```

✅ Should return JSON array of products

---

## ✅ You're Done!

Your recommendation system is now live and working!

---

## 🎯 What Happens Next?

The system will automatically:

1. **Track user behavior** when they view products
2. **Update recommendations** based on cart items
3. **Learn from purchases** to improve suggestions
4. **Build product associations** when orders complete

### Over time, recommendations will get better as:
- Users browse products
- Users add items to cart
- Users make purchases
- Product associations build up

---

## 🔧 Optional: Daily Maintenance

For optimal performance, set up a daily job to refresh product popularity:

### Using Cron (Linux/Mac):

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily):
0 2 * * * psql $DATABASE_URL -c "SELECT refresh_product_popularity();"
```

### Using Supabase Cron Jobs:

1. Go to Database → Cron Jobs
2. Create new cron job
3. Name: "Refresh Product Popularity"
4. Schedule: `0 2 * * *` (daily at 2 AM)
5. Command: `SELECT refresh_product_popularity();`

---

## 🐛 Quick Troubleshooting

### Problem: Migration fails

**Error:** "relation already exists"
- **Solution:** Tables might already exist. Check if migration ran before.

**Error:** "permission denied"
- **Solution:** Make sure your database user has CREATE permissions.

### Problem: No recommendations showing

1. Check browser console for errors
2. Verify backend is deployed
3. Confirm user is logged in
4. Check API endpoint: `/api/products/recommendations/personalized`

### Problem: Product views not tracking

1. Check Network tab in browser dev tools
2. Verify endpoint responds: `/api/products/{id}/track-view`
3. Check backend logs for errors

---

## 📖 Need More Help?

See detailed documentation:
- **Full Documentation:** `RECOMMENDATIONS_README.md`
- **Implementation Summary:** `RECOMMENDATIONS_IMPLEMENTATION.md` (in project root)

---

## 🎉 Congratulations!

Your e-commerce platform now has enterprise-level product recommendations! 🚀

The system will continuously learn and improve as users interact with your site.
