# Migration Fix - Missing Product Columns

## 🐛 Issue

When running `enhanced_recommendations.sql`, you got this error:

```
ERROR: 42703: column p.purchase_count does not exist
LINE 89: p.purchase_count,
```

## 🔍 Root Cause

Your `products` table was missing several tracking columns that the recommendation system needs:
- ❌ `video_url`
- ❌ `trending_score`
- ❌ `view_count`
- ❌ `purchase_count`
- ❌ `shipping_cost`

These columns are defined in your Pydantic schemas (`backend/app/models/schemas.py`) but weren't in your database schema.

---

## ✅ What I Fixed

### 1. Created Missing Column Migration
**File:** `backend/database/01_add_product_tracking_columns.sql`

This migration:
- ✅ Adds all missing columns to `products` table
- ✅ Creates indexes for performance
- ✅ Adds trigger to auto-increment `purchase_count` when orders complete
- ✅ Backfills `purchase_count` from existing completed orders

### 2. Reorganized Migration Files
- ✅ Renamed `enhanced_recommendations.sql` → `02_enhanced_recommendations.sql`
- ✅ Clear numbering shows order: `01_` then `02_`

### 3. Updated Base Schema
**File:** `backend/database/schema.sql`

Updated to include all tracking columns so future fresh installations work correctly.

### 4. Created Migration Guide
**File:** `backend/database/MIGRATION_ORDER.md`

Complete guide on:
- Correct migration order
- Verification steps
- Troubleshooting
- Rollback procedures

---

## 🚀 How to Fix (Choose One Path)

### Path A: You Haven't Run Any Migration Yet (Recommended)

Run migrations in this order:

```bash
cd backend/database

# Step 1: Add tracking columns
psql $DATABASE_URL -f 01_add_product_tracking_columns.sql

# Step 2: Add recommendation system
psql $DATABASE_URL -f 02_enhanced_recommendations.sql
```

**Or in Supabase SQL Editor:**

1. Run all of `01_add_product_tracking_columns.sql`
2. Wait for success
3. Run all of `02_enhanced_recommendations.sql`
4. Wait for success

### Path B: You Already Tried Running the Old File

If you partially ran the old migration and got errors:

**Option 1: Clean Start (Safest)**

1. Drop any partial tables that were created:
```sql
DROP TABLE IF EXISTS product_associations CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS product_views CASCADE;
DROP MATERIALIZED VIEW IF EXISTS product_popularity CASCADE;
```

2. Run migrations in order:
```bash
psql $DATABASE_URL -f 01_add_product_tracking_columns.sql
psql $DATABASE_URL -f 02_enhanced_recommendations.sql
```

**Option 2: Continue from Where You Failed**

1. Just run the column migration first:
```bash
psql $DATABASE_URL -f 01_add_product_tracking_columns.sql
```

2. Then retry the recommendations migration:
```bash
psql $DATABASE_URL -f 02_enhanced_recommendations.sql
```

---

## ✅ Verification

After running both migrations, verify everything worked:

### Check 1: Columns Added
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('video_url', 'trending_score', 'view_count', 'purchase_count', 'shipping_cost');
```
**Expected:** 5 rows

### Check 2: Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_views', 'user_preferences', 'wishlist_items', 'product_associations');
```
**Expected:** 4 rows

### Check 3: Materialized View Works
```sql
SELECT COUNT(*) FROM product_popularity;
```
**Expected:** Number of products (not an error!)

### Check 4: Purchase Counts Calculated
```sql
SELECT name, purchase_count 
FROM products 
WHERE purchase_count > 0
LIMIT 5;
```
**Expected:** Products with their purchase counts from completed orders

---

## 📁 Files Summary

| File | Purpose | Order |
|------|---------|-------|
| `01_add_product_tracking_columns.sql` | ✅ **NEW** - Adds missing columns | Run 1st |
| `02_enhanced_recommendations.sql` | Recommendation system | Run 2nd |
| `schema.sql` | ✅ **UPDATED** - Now includes tracking columns | For fresh installs |
| `MIGRATION_ORDER.md` | ✅ **NEW** - Complete migration guide | Read this! |

---

## 🎯 Next Steps

After successful migration:

1. ✅ Verify all checks pass (see above)
2. ✅ Deploy backend (code is already updated)
3. ✅ Deploy frontend (code is already updated)
4. ✅ Test recommendations: `/api/products/recommendations/personalized`
5. ✅ Test the specific user who had issues: `78480d6b-5220-4fac-afcb-096944a51b1d`

---

## 📚 Documentation

- **Quick Start:** `backend/database/QUICKSTART.md` (UPDATED)
- **Migration Order:** `backend/database/MIGRATION_ORDER.md` (NEW)
- **Full Docs:** `backend/database/RECOMMENDATIONS_README.md`
- **Bug Fix Details:** `RECOMMENDATION_FIX.md`

---

## 🆘 Still Having Issues?

### Error: "column already exists"
✅ Safe to ignore - columns are already there

### Error: "table already exists"  
✅ Safe to ignore - tables are already there

### Error: "permission denied"
❌ Your database user needs CREATE permissions:
```sql
GRANT CREATE ON SCHEMA public TO your_user;
```

### Other errors?
1. Check `MIGRATION_ORDER.md` troubleshooting section
2. Verify you ran migrations in correct order (01 before 02)
3. Check database logs for more details

---

## Summary

✅ **Created:** Migration to add missing product columns  
✅ **Reorganized:** Migration files with clear numbering  
✅ **Updated:** Base schema for future installations  
✅ **Documented:** Complete migration guide  

**To fix:** Run `01_add_product_tracking_columns.sql` then `02_enhanced_recommendations.sql` 🚀
