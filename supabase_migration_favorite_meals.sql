-- ============================================
-- FAVORITE MEALS TABLE MIGRATION
-- ============================================
-- Add this to your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- ============================================
-- CREATE FAVORITE_MEALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT,
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  fiber_g INTEGER,
  sugar_g INTEGER,
  sodium_mg INTEGER,
  ingredients JSONB DEFAULT '[]'::jsonb,
  portion_details TEXT,
  prep_time TEXT,
  cook_time TEXT,
  image_uri TEXT,
  recipe JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meal_name)
);

-- Add comment
COMMENT ON TABLE favorite_meals IS 'Stores user favorite meals for easy reuse';

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Index for faster user + meal_type queries
CREATE INDEX IF NOT EXISTS idx_favorite_meals_user_type
ON favorite_meals(user_id, meal_type);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_favorite_meals_user
ON favorite_meals(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE favorite_meals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own favorites
CREATE POLICY "Users can view own favorite meals"
ON favorite_meals FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorite meals"
ON favorite_meals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own favorites
CREATE POLICY "Users can update own favorite meals"
ON favorite_meals FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorite meals"
ON favorite_meals FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- DONE!
-- ============================================
