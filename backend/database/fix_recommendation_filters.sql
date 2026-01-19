-- ============================================
-- FIX: Recommendation System Filter Issue
-- ============================================
-- This patch adds the increment_view_count function
-- that was missing from the initial migration.
-- 
-- Apply this ONLY if you already applied enhanced_recommendations.sql
-- If you haven't applied the initial migration yet, just use the
-- updated enhanced_recommendations.sql file instead.
-- ============================================

-- ============================================
-- FUNCTION: Increment Product View Count
-- Atomically increment view count for a product
-- ============================================
CREATE OR REPLACE FUNCTION increment_view_count(product_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the function was created:
-- SELECT proname FROM pg_proc WHERE proname = 'increment_view_count';
-- Should return one row with 'increment_view_count'
