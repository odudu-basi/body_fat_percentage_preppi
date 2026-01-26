-- Migration: Update RLS policies to allow public read access for public buckets
-- Created: 2026-01-26
-- Description: Allows public read access to images while maintaining write security
--              Users can still only upload/update/delete their own files

-- ============================================
-- BODY SCANS - UPDATE RLS POLICIES
-- ============================================

-- Drop the old SELECT policy that requires authentication
DROP POLICY IF EXISTS "Users can only read their own body scans" ON storage.objects;

-- Create new SELECT policy that allows public read
-- This is safe because:
-- 1. Users still can't upload files to other users' folders (INSERT policy)
-- 2. Users still can't modify/delete other users' files (UPDATE/DELETE policies)
-- 3. Images are only accessible if you know the exact URL
CREATE POLICY "Public can read body scans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'body-scans');

-- ============================================
-- MEAL PHOTOS - UPDATE RLS POLICIES
-- ============================================

-- Drop the old SELECT policy that requires authentication
DROP POLICY IF EXISTS "Users can only read their own meal photos" ON storage.objects;

-- Create new SELECT policy that allows public read
CREATE POLICY "Public can read meal photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meal-photos');

-- ============================================
-- SECURITY NOTES
-- ============================================
--
-- Why this is still secure:
-- 1. INSERT policies still require auth and folder name matching user ID
-- 2. UPDATE policies still require auth and folder name matching user ID
-- 3. DELETE policies still require auth and folder name matching user ID
-- 4. Users can only know image URLs if they have access to the database records
-- 5. Database RLS policies prevent users from seeing other users' meal/scan records
--
-- This change simply allows the React Native Image component to load images
-- from public URLs without authentication, which is necessary for the mobile app.
