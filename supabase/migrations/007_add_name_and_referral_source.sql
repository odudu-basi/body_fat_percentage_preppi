-- ============================================
-- ADD NAME AND REFERRAL SOURCE FIELDS
-- ============================================
-- Migration: 007_add_name_and_referral_source
-- Created: 2026-02-08
-- Description: Adds user name and marketing referral source tracking
-- ============================================

-- Add name column for user's full name from onboarding
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add referral_source column to track where users heard about the app
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_source TEXT CHECK (
  referral_source IN (
    'instagram',
    'tiktok',
    'friend_or_family',
    'facebook',
    'youtube',
    'ai',
    'x'
  )
);

-- Add comments to document the fields
COMMENT ON COLUMN profiles.name IS 'User full name collected during onboarding';
COMMENT ON COLUMN profiles.referral_source IS 'Marketing channel: instagram, tiktok, friend_or_family, facebook, youtube, ai, or x (twitter)';
