-- Add missing nutrition and macro tracking fields to profiles table
-- Migration: 003_add_nutrition_fields
-- Date: 2026-01-23

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS protein_g INTEGER,
ADD COLUMN IF NOT EXISTS carbs_g INTEGER,
ADD COLUMN IF NOT EXISTS fats_g INTEGER,
ADD COLUMN IF NOT EXISTS fiber_g INTEGER,
ADD COLUMN IF NOT EXISTS sodium_mg INTEGER,
ADD COLUMN IF NOT EXISTS sugar_g INTEGER,
ADD COLUMN IF NOT EXISTS tdee INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN profiles.protein_g IS 'Daily protein target in grams (macro tracking)';
COMMENT ON COLUMN profiles.carbs_g IS 'Daily carbohydrates target in grams (macro tracking)';
COMMENT ON COLUMN profiles.fats_g IS 'Daily fats target in grams (macro tracking)';
COMMENT ON COLUMN profiles.fiber_g IS 'Daily fiber target in grams';
COMMENT ON COLUMN profiles.sodium_mg IS 'Daily sodium limit in milligrams';
COMMENT ON COLUMN profiles.sugar_g IS 'Daily sugar limit in grams';
COMMENT ON COLUMN profiles.tdee IS 'Total Daily Energy Expenditure (maintenance calories)';
