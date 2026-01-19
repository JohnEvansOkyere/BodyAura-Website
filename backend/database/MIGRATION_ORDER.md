# Database Migration Order

## ⚠️ IMPORTANT: Run migrations in this exact order!

---

## For New Installations (Fresh Database)

If you're setting up the database from scratch, run:

### Step 1: Base Schema
```sql
-- Run: schema.sql
```

This creates all base tables including products with the tracking columns already included.

### Step 2: Enhanced Recommendations
```sql
-- Run: 02_enhanced_recommendations.sql
```

This adds the recommendation system tables, views, and functions.

---

## For Existing Installations (Upgrading)

If you already have a database with products, orders, etc., run these migrations:

### Migration 1: Add Product Tracking Columns
```sql
-- Run: 01_add_product_tracking_columns.sql
```

**What it does:**
- ✅ Adds `video_url`, `trending_score`, `view_count`, `purchase_count`, `shipping_cost` columns
- ✅ Creates indexes for performance
- ✅ Adds trigger to auto-increment purchase_count when orders complete
- ✅ Backfills purchase_count from existing completed orders

**Time:** ~30 seconds (depending on data size)

### Migration 2: Enhanced Recommendations System
```sql
-- Run: 02_enhanced_recommendations.sql
```

**What it does:**
- ✅ Creates `product_views`, `user_preferences`, `wishlist_items`, `product_associations` tables
- ✅ Creates `product_popularity` materialized view
- ✅ Adds triggers for automatic product associations
- ✅ Adds helper functions for recommendations

**Time:** ~1 minute

---

## How to Run Migrations

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of migration file
5. Paste and click **RUN**
6. Wait for "Success" message
7. Repeat for next migration

### Option B: psql Command Line

```bash
cd backend/database

# For new installation
psql -U username -d database -f schema.sql
psql -U username -d database -f 02_enhanced_recommendations.sql

# For existing installation
psql -U username -d database -f 01_add_product_tracking_columns.sql
psql -U username -d database -f 02_enhanced_recommendations.sql
```

### Option C: Using Database URL

```bash
cd backend/database

# For new installation
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f 02_enhanced_recommendations.sql

# For existing installation
psql $DATABASE_URL -f 01_add_product_tracking_columns.sql
psql $DATABASE_URL -f 02_enhanced_recommendations.sql
```

---

## Verification

After running migrations, verify everything is set up correctly:

### Check 1: Product Columns Exist
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('video_url', 'trending_score', 'view_count', 'purchase_count', 'shipping_cost')
ORDER BY column_name;
```

**Expected:** Should return 5 rows

### Check 2: Recommendation Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_views', 'user_preferences', 'wishlist_items', 'product_associations');
```

**Expected:** Should return 4 rows

### Check 3: Materialized View Exists
```sql
SELECT COUNT(*) FROM product_popularity;
```

**Expected:** Should return number of active products (no error)

### Check 4: Functions Exist
```sql
SELECT proname 
FROM pg_proc 
WHERE proname IN ('increment_view_count', 'increment_purchase_count', 'refresh_product_popularity', 'calculate_user_preferences', 'update_product_associations');
```

**Expected:** Should return 5 rows

### Check 5: Triggers Exist
```sql
SELECT tgname 
FROM pg_trigger 
WHERE tgname IN ('trigger_increment_purchase_count', 'trigger_update_product_associations');
```

**Expected:** Should return 2 rows

---

## Troubleshooting

### Error: "column already exists"

**Solution:** You already ran part of the migration. This is safe to ignore, or you can use:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS column_name TYPE;
```

### Error: "column does not exist"

**Solution:** You need to run migration 01 first! Go back and run:
```sql
-- backend/database/01_add_product_tracking_columns.sql
```

### Error: "relation already exists"

**Solution:** Tables already exist. This is safe to ignore if using `CREATE TABLE IF NOT EXISTS`.

### Error: "permission denied"

**Solution:** Your database user needs CREATE permissions:
```sql
GRANT CREATE ON SCHEMA public TO your_user;
```

---

## Rollback (If Needed)

If you need to rollback the migrations:

### Rollback Recommendation System Only:
```sql
-- Drop recommendation tables
DROP TABLE IF EXISTS product_associations CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS product_views CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS product_popularity CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS increment_view_count(UUID);
DROP FUNCTION IF EXISTS increment_purchase_count();
DROP FUNCTION IF EXISTS refresh_product_popularity();
DROP FUNCTION IF EXISTS calculate_user_preferences(UUID);
DROP FUNCTION IF EXISTS update_product_associations();
```

### Rollback Product Columns (⚠️ Caution - will lose data!):
```sql
ALTER TABLE products DROP COLUMN IF EXISTS video_url;
ALTER TABLE products DROP COLUMN IF EXISTS trending_score;
ALTER TABLE products DROP COLUMN IF EXISTS view_count;
ALTER TABLE products DROP COLUMN IF EXISTS purchase_count;
ALTER TABLE products DROP COLUMN IF EXISTS shipping_cost;
```

---

## Post-Migration Steps

After successful migration:

1. ✅ Redeploy your backend
2. ✅ Redeploy your frontend
3. ✅ Test recommendations API: `/api/products/recommendations/personalized`
4. ✅ Test product view tracking
5. ✅ Set up daily cron job to refresh materialized view:
   ```sql
   SELECT refresh_product_popularity();
   ```

---

## Migration Files Summary

| File | Purpose | Required |
|------|---------|----------|
| `schema.sql` | Base database schema | Yes (new installations only) |
| `01_add_product_tracking_columns.sql` | Add tracking columns to products | Yes (existing installations only) |
| `02_enhanced_recommendations.sql` | Recommendation system | Yes (always) |
| `fix_recommendation_filters.sql` | Patch for filter fix | Only if deployed before fix |

---

## Need Help?

If you encounter issues:

1. Check which migration failed
2. Read the error message carefully
3. Check the verification queries above
4. Review this guide's troubleshooting section
5. Check `RECOMMENDATIONS_README.md` for detailed documentation

---

## Summary

✅ **New Installations:**
1. Run `schema.sql`
2. Run `02_enhanced_recommendations.sql`

✅ **Existing Installations:**
1. Run `01_add_product_tracking_columns.sql`
2. Run `02_enhanced_recommendations.sql`

Then redeploy your application and test! 🚀
