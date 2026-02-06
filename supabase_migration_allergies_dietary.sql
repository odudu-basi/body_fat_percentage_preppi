-- ============================================
-- ALLERGIES AND DIETARY RESTRICTIONS MIGRATION
-- ============================================
-- Add this to your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- ============================================
-- ADD ALLERGIES AND DIETARY RESTRICTION COLUMNS
-- ============================================

-- Add allergies column (array of strings)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';

-- Add dietary_restriction column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dietary_restriction TEXT DEFAULT 'none';

-- Add comments to document the columns
COMMENT ON COLUMN profiles.allergies IS 'User food allergies (e.g., peanuts, dairy, gluten)';
COMMENT ON COLUMN profiles.dietary_restriction IS 'User dietary restriction (e.g., vegetarian, vegan, pescatarian, halal, kosher, none)';

-- ============================================
-- DONE!
-- ============================================
