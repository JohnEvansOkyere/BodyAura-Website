-- Add new columns for Grejoy China Market features
-- Run this migration to add video_url, trending_score, view_count, purchase_count, and shipping_cost to products table

-- Add video_url column (optional video link for products)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add trending_score column (for trending products feature)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0 CHECK (trending_score >= 0);

-- Add view_count column (track product views)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);

-- Add purchase_count column (track how many times product was purchased)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0 CHECK (purchase_count >= 0);

-- Add shipping_cost column (admin-controlled shipping cost per product)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0.00 CHECK (shipping_cost >= 0);

-- Create index on trending_score for faster trending queries
CREATE INDEX IF NOT EXISTS idx_products_trending_score ON products(trending_score DESC);

-- Add shipping_cost to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0.00 CHECK (shipping_cost >= 0);

-- Update existing products to have default values (if needed)
UPDATE products
SET
  trending_score = 0,
  view_count = 0,
  purchase_count = 0,
  shipping_cost = 0.00
WHERE trending_score IS NULL
  OR view_count IS NULL
  OR purchase_count IS NULL
  OR shipping_cost IS NULL;
