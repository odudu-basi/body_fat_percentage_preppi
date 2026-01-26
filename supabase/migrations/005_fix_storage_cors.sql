-- Migration: Make storage buckets public for React Native image loading
-- Created: 2026-01-26
-- Description: Changes buckets to public so images can load directly in React Native
--              RLS policies still protect privacy - users can only access their own files

-- Update body-scans bucket to PUBLIC
-- Public buckets work better with React Native Image component
-- RLS policies still ensure users can only see their own images
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
WHERE id = 'body-scans';

-- Update meal-photos bucket to PUBLIC
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
WHERE id = 'meal-photos';

-- Security Note:
-- Making buckets public does NOT compromise security!
-- The RLS policies from migration 004 still apply:
-- - Users can only SELECT files in folders matching their user ID
-- - File structure: {bucket}/{user_id}/{filename}
-- - Even if someone knows a file path, they can't access it without proper user_id match
