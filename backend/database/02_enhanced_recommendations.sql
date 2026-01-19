-- ============================================
-- ENHANCED RECOMMENDATION SYSTEM TABLES
-- ============================================

-- ============================================
-- PRODUCT VIEWS TABLE
-- Track user browsing behavior
-- ============================================
CREATE TABLE IF NOT EXISTS product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    session_id TEXT, -- For tracking anonymous users
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0, -- How long they viewed it
    source TEXT -- Where they came from (search, category, recommendation, etc.)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session_id ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- ============================================
-- USER PREFERENCES TABLE
-- Store learned user preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    preference_score DECIMAL(3, 2) DEFAULT 0.00 CHECK (preference_score >= 0 AND preference_score <= 1),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_score ON user_preferences(preference_score DESC);

-- ============================================
-- WISHLIST TABLE
-- Track products users are interested in
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist_items(product_id);

-- ============================================
-- PRODUCT ASSOCIATIONS TABLE
-- Track which products are frequently bought together
-- ============================================
CREATE TABLE IF NOT EXISTS product_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_a_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_b_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    association_count INTEGER DEFAULT 1,
    confidence_score DECIMAL(3, 2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_a_id, product_b_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_associations_product_a ON product_associations(product_a_id);
CREATE INDEX IF NOT EXISTS idx_product_associations_product_b ON product_associations(product_b_id);
CREATE INDEX IF NOT EXISTS idx_product_associations_score ON product_associations(confidence_score DESC);

-- ============================================
-- MATERIALIZED VIEW: PRODUCT POPULARITY
-- Pre-computed product popularity metrics
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS product_popularity AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.purchase_count,
    p.view_count,
    p.trending_score,
    COALESCE(pv.recent_views, 0) AS recent_views_7d,
    COALESCE(po.recent_purchases, 0) AS recent_purchases_30d,
    (
        (p.purchase_count * 10) + 
        (p.view_count * 0.1) + 
        (COALESCE(pv.recent_views, 0) * 5) +
        (COALESCE(po.recent_purchases, 0) * 20) +
        p.trending_score
    ) AS popularity_score
FROM products p
LEFT JOIN (
    SELECT product_id, COUNT(*) as recent_views
    FROM product_views
    WHERE viewed_at > NOW() - INTERVAL '7 days'
    GROUP BY product_id
) pv ON p.id = pv.product_id
LEFT JOIN (
    SELECT oi.product_id, COUNT(*) as recent_purchases
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at > NOW() - INTERVAL '30 days'
    AND o.payment_status = 'completed'
    GROUP BY oi.product_id
) po ON p.id = po.product_id
WHERE p.is_active = TRUE;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_popularity_id ON product_popularity(id);
CREATE INDEX IF NOT EXISTS idx_product_popularity_score ON product_popularity(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_product_popularity_category ON product_popularity(category);

-- ============================================
-- FUNCTION: Update Product Associations
-- Automatically update product associations when orders are completed
-- ============================================
CREATE OR REPLACE FUNCTION update_product_associations()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when order is marked as completed
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        -- Insert or update associations for all product pairs in this order
        INSERT INTO product_associations (product_a_id, product_b_id, association_count)
        SELECT 
            oi1.product_id AS product_a_id,
            oi2.product_id AS product_b_id,
            1 AS association_count
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id
        WHERE oi1.order_id = NEW.id
        AND oi1.product_id < oi2.product_id  -- Avoid duplicates
        ON CONFLICT (product_a_id, product_b_id)
        DO UPDATE SET 
            association_count = product_associations.association_count + 1,
            last_updated = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic association updates
DROP TRIGGER IF EXISTS trigger_update_product_associations ON orders;
CREATE TRIGGER trigger_update_product_associations
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_product_associations();

-- ============================================
-- FUNCTION: Refresh Product Popularity
-- Call this periodically to update the materialized view
-- ============================================
CREATE OR REPLACE FUNCTION refresh_product_popularity()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_popularity;
END;
$$ LANGUAGE plpgsql;

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
-- FUNCTION: Update User Preferences
-- Automatically calculate and update user category preferences
-- ============================================
CREATE OR REPLACE FUNCTION calculate_user_preferences(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Calculate preference scores based on views, cart, and purchases
    INSERT INTO user_preferences (user_id, category, preference_score)
    SELECT 
        p_user_id,
        category,
        LEAST(1.0, (
            (COALESCE(view_score, 0) * 0.2) +
            (COALESCE(cart_score, 0) * 0.3) +
            (COALESCE(purchase_score, 0) * 0.5)
        )) AS preference_score
    FROM (
        SELECT 
            p.category,
            COUNT(DISTINCT pv.id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM product_views WHERE user_id = p_user_id), 0) AS view_score,
            COUNT(DISTINCT ci.id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM cart_items WHERE user_id = p_user_id), 0) AS cart_score,
            COUNT(DISTINCT oi.id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM order_items oi2 JOIN orders o2 ON oi2.order_id = o2.id WHERE o2.user_id = p_user_id), 0) AS purchase_score
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.user_id = p_user_id
        LEFT JOIN cart_items ci ON p.id = ci.product_id AND ci.user_id = p_user_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = p_user_id
        WHERE p.category IS NOT NULL
        GROUP BY p.category
        HAVING COUNT(DISTINCT pv.id) > 0 OR COUNT(DISTINCT ci.id) > 0 OR COUNT(DISTINCT oi.id) > 0
    ) scores
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
        preference_score = EXCLUDED.preference_score,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE product_views IS 'Tracks user product viewing behavior for recommendations';
COMMENT ON TABLE user_preferences IS 'Stores calculated user category preferences based on behavior';
COMMENT ON TABLE wishlist_items IS 'User wishlist for tracking product interest';
COMMENT ON TABLE product_associations IS 'Tracks which products are frequently bought together';
COMMENT ON MATERIALIZED VIEW product_popularity IS 'Pre-computed product popularity scores for fast recommendations';
COMMENT ON FUNCTION update_product_associations() IS 'Automatically updates product associations when orders are completed';
COMMENT ON FUNCTION calculate_user_preferences(UUID) IS 'Calculates and updates user category preferences based on their behavior';
COMMENT ON FUNCTION refresh_product_popularity() IS 'Refreshes the product popularity materialized view';
