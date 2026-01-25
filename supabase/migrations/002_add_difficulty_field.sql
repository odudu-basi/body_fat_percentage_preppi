-- ============================================
-- ADD DIFFICULTY FIELD TO PROFILES TABLE
-- ============================================
-- Migration: 002_add_difficulty_field
-- Created: 2026-01-22
-- ============================================

-- Add difficulty column for fat loss intensity preference
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium';

-- Add comment to document the field
COMMENT ON COLUMN profiles.difficulty IS 'Fat loss difficulty level: easy (250 cal deficit), medium (500 cal deficit), hard (750 cal deficit)';
