-- ============================================
-- MEAL IMAGES STORAGE BUCKET SETUP
-- ============================================
-- Add this to your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================
-- Note: You can also create this bucket via the Supabase Dashboard:
-- Storage -> Create a new bucket -> Name: "meal-images" -> Public: Yes

INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Policy: Anyone can view meal images (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'meal-images');

-- Policy: Authenticated users can upload their own meal images
CREATE POLICY "Authenticated users can upload meal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update their own meal images
CREATE POLICY "Users can update own meal images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own meal images
CREATE POLICY "Users can delete own meal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- DONE!
-- ============================================
-- Images will be stored at: [user_id]/meal_[timestamp].png
-- Public URL format: https://[project].supabase.co/storage/v1/object/public/meal-images/[user_id]/meal_[timestamp].png
