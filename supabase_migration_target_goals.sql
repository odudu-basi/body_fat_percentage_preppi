-- ============================================
-- TARGET GOALS MIGRATION
-- ============================================
-- Add this to your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- ============================================
-- ADD TARGET WEIGHT AND BODY FAT COLUMNS
-- ============================================

-- Add target_weight_kg column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,2);

-- Add target_body_fat_percentage column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS target_body_fat_percentage NUMERIC(4,2);

-- Add comments to document the columns
COMMENT ON COLUMN profiles.target_weight_kg IS 'User target weight goal in kilograms';
COMMENT ON COLUMN profiles.target_body_fat_percentage IS 'User target body fat percentage goal';

-- ============================================
-- DONE!
-- ============================================
