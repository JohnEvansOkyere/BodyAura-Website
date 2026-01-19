-- ============================================
-- ADD MISSING PRODUCT TRACKING COLUMNS
-- ============================================
-- Run this BEFORE enhanced_recommendations.sql
-- This adds columns needed for the recommendation system
-- ============================================

-- Add video_url column for product videos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add trending_score for manual trending product marking
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS trending_score INTEGER NOT NULL DEFAULT 0;

-- Add view_count to track how many times a product is viewed
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Add purchase_count to track how many times a product is purchased
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS purchase_count INTEGER NOT NULL DEFAULT 0;

-- Add shipping_cost for products with special shipping requirements
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_trending_score ON products(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_purchase_count ON products(purchase_count DESC);

-- ============================================
-- TRIGGER: Auto-increment purchase_count
-- ============================================
-- Automatically increment purchase_count when an order is completed
CREATE OR REPLACE FUNCTION increment_purchase_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when order payment is marked as completed
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        -- Update purchase count for all products in this order
        UPDATE products p
        SET purchase_count = purchase_count + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND p.id = oi.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_increment_purchase_count ON orders;
CREATE TRIGGER trigger_increment_purchase_count
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION increment_purchase_count();

-- ============================================
-- BACKFILL: Calculate existing purchase counts
-- ============================================
-- Update purchase_count for existing products based on completed orders
UPDATE products p
SET purchase_count = COALESCE(
    (
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = p.id
        AND o.payment_status = 'completed'
    ), 0
);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify the migration worked:

-- Check columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('video_url', 'trending_score', 'view_count', 'purchase_count', 'shipping_cost')
-- ORDER BY column_name;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE '%trending%' OR indexname LIKE '%view%' OR indexname LIKE '%purchase%';

-- Check trigger
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_increment_purchase_count';

-- Check purchase counts were calculated
-- SELECT name, purchase_count FROM products WHERE purchase_count > 0;
