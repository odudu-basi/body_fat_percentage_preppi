-- Test query to verify storage buckets and policies
-- Run this in Supabase SQL Editor to check your setup

-- Check bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('body-scans', 'meal-photos');

-- Check RLS policies on storage.objects
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;
