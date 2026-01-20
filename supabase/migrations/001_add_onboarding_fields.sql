-- ============================================
-- ADD ONBOARDING FIELDS TO PROFILES TABLE
-- ============================================
-- Migration: 001_add_onboarding_fields
-- Created: 2026-01-20
-- ============================================

-- Add new columns for onboarding data
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS workout_frequency TEXT CHECK (workout_frequency IN ('0-2', '3-5', '6+')),
ADD COLUMN IF NOT EXISTS water_intake_liters DECIMAL(3,1);

-- Add comment to document the fields
COMMENT ON COLUMN profiles.birthday IS 'User birth date from onboarding';
COMMENT ON COLUMN profiles.ethnicity IS 'User ethnicity selection from onboarding';
COMMENT ON COLUMN profiles.workout_frequency IS 'Weekly workout frequency: 0-2, 3-5, or 6+ workouts per week';
COMMENT ON COLUMN profiles.water_intake_liters IS 'Daily water intake in liters (0-5L)';
