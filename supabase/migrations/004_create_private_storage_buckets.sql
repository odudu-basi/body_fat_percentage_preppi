-- Migration: Create private storage buckets for body scans and meal photos
-- Created: 2026-01-25
-- Description: Sets up private storage with RLS policies ensuring users can only access their own images

-- ============================================
-- CREATE STORAGE BUCKETS (PRIVATE)
-- ============================================

-- Create body-scans bucket (PRIVATE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'body-scans',
  'body-scans',
  false, -- PRIVATE: Users can only access their own files
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create meal-photos bucket (PRIVATE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-photos',
  'meal-photos',
  false, -- PRIVATE: Users can only access their own files
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES - BODY SCANS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own body scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can only read their own body scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own body scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own body scans" ON storage.objects;

-- Allow authenticated users to upload their own body scans
-- Files must be in a folder matching their user ID
CREATE POLICY "Users can upload their own body scans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'body-scans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to ONLY read their own body scans
-- No one else (including admins) can see these files without authentication
CREATE POLICY "Users can only read their own body scans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'body-scans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own body scans
CREATE POLICY "Users can update their own body scans"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'body-scans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own body scans
CREATE POLICY "Users can delete their own body scans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'body-scans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- STORAGE POLICIES - MEAL PHOTOS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can only read their own meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own meal photos" ON storage.objects;

-- Allow authenticated users to upload their own meal photos
-- Files must be in a folder matching their user ID
CREATE POLICY "Users can upload their own meal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to ONLY read their own meal photos
-- No one else (including admins) can see these files without authentication
CREATE POLICY "Users can only read their own meal photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own meal photos
CREATE POLICY "Users can update their own meal photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own meal photos
CREATE POLICY "Users can delete their own meal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- NOTES
-- ============================================
--
-- Security Model:
-- 1. Buckets are PRIVATE (public = false)
-- 2. Only authenticated users can access files
-- 3. Users can ONLY access files in folders matching their user ID
-- 4. Even Supabase dashboard admins cannot view files without auth token
-- 5. Signed URLs (created server-side) are required to display images
--
-- File Structure:
-- - body-scans/{user_id}/front_{timestamp}.jpg
-- - body-scans/{user_id}/side_{timestamp}.jpg
-- - meal-photos/{user_id}/meal_{timestamp}.jpg
