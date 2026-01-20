-- ============================================
-- BODYMAX SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
-- Stores user information and fitness goals

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Physical stats
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  
  -- Fitness goals
  fitness_goal TEXT CHECK (fitness_goal IN ('lose_weight', 'maintain_weight', 'gain_muscle', 'improve_health')),
  daily_calorie_target INTEGER,
  daily_protein_target INTEGER,
  daily_carbs_target INTEGER,
  daily_fat_target INTEGER,
  
  -- Preferences
  dietary_restrictions TEXT[], -- e.g., ['vegetarian', 'gluten-free', 'dairy-free']
  allergies TEXT[],
  
  -- Subscription
  is_pro BOOLEAN DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. MEAL LOGS TABLE
-- ============================================
-- Stores all logged meals with nutrition info

CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meal info
  meal_name TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME,
  
  -- Nutrition data
  calories INTEGER,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  fiber_g DECIMAL(6,2),
  sugar_g DECIMAL(6,2),
  sodium_mg DECIMAL(8,2),
  
  -- Additional info
  serving_size TEXT,
  servings DECIMAL(4,2) DEFAULT 1,
  notes TEXT,
  
  -- Image reference (stored in storage bucket)
  image_path TEXT,
  
  -- AI analysis data (JSON for flexibility)
  ai_analysis JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(date);

-- Enable RLS on meal_logs
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own meals
CREATE POLICY "Users can view own meals" ON meal_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own meals
CREATE POLICY "Users can insert own meals" ON meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own meals
CREATE POLICY "Users can update own meals" ON meal_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own meals
CREATE POLICY "Users can delete own meals" ON meal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. DAILY CHECKLISTS TABLE
-- ============================================
-- Stores daily checklist items and completion status

CREATE TABLE IF NOT EXISTS daily_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Checklist items (stored as JSONB for flexibility)
  -- Format: [{ "id": "water", "label": "Drink 8 glasses of water", "completed": true }, ...]
  checklist_items JSONB DEFAULT '[]'::jsonb,
  
  -- Quick access booleans for common items
  water_goal_met BOOLEAN DEFAULT FALSE,
  protein_goal_met BOOLEAN DEFAULT FALSE,
  calorie_goal_met BOOLEAN DEFAULT FALSE,
  workout_completed BOOLEAN DEFAULT FALSE,
  steps_goal_met BOOLEAN DEFAULT FALSE,
  sleep_goal_met BOOLEAN DEFAULT FALSE,
  
  -- Stats for the day
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Notes
  daily_notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one checklist per user per day
  UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_checklists_user_date ON daily_checklists(user_id, date);

-- Enable RLS on daily_checklists
ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;

-- Users can only view their own checklists
CREATE POLICY "Users can view own checklists" ON daily_checklists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own checklists
CREATE POLICY "Users can insert own checklists" ON daily_checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own checklists
CREATE POLICY "Users can update own checklists" ON daily_checklists
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own checklists
CREATE POLICY "Users can delete own checklists" ON daily_checklists
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. USER IMAGES TABLE (Metadata)
-- ============================================
-- Stores metadata for user images (actual files in Storage)

CREATE TABLE IF NOT EXISTS user_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Image info
  image_type TEXT CHECK (image_type IN ('meal', 'progress', 'profile', 'other')),
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT,
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  
  -- Related records
  meal_log_id UUID REFERENCES meal_logs(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure storage path is unique
  UNIQUE(storage_path)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_images_user ON user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_type ON user_images(image_type);

-- Enable RLS on user_images
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;

-- Users can only view their own images
CREATE POLICY "Users can view own images" ON user_images
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images" ON user_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own images
CREATE POLICY "Users can update own images" ON user_images
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images" ON user_images
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. BODY SCANS TABLE
-- ============================================
-- Stores body composition scan results

CREATE TABLE IF NOT EXISTS body_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scan date
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Body composition results
  body_fat_percentage DECIMAL(4,1),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  confidence_low DECIMAL(4,1),
  confidence_high DECIMAL(4,1),
  
  -- User measurements at time of scan
  weight_kg DECIMAL(5,2),
  weight_lbs DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  age INTEGER,
  gender TEXT,
  bmi DECIMAL(4,1),
  
  -- Image references (local URIs or storage paths)
  front_image_path TEXT,
  side_image_path TEXT,
  
  -- AI analysis data (full response for reference)
  ai_analysis JSONB,
  
  -- Visual observations from AI
  front_observations TEXT,
  side_observations TEXT,
  primary_indicators TEXT[],
  biometric_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_body_scans_user_date ON body_scans(user_id, scan_date DESC);

-- Enable RLS on body_scans
ALTER TABLE body_scans ENABLE ROW LEVEL SECURITY;

-- Users can only view their own scans
CREATE POLICY "Users can view own scans" ON body_scans
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" ON body_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scans
CREATE POLICY "Users can update own scans" ON body_scans
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans" ON body_scans
  FOR DELETE USING (auth.uid() = user_id);

-- Apply trigger to body_scans table
DROP TRIGGER IF EXISTS update_body_scans_updated_at ON body_scans;
CREATE TRIGGER update_body_scans_updated_at
  BEFORE UPDATE ON body_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. STORAGE BUCKET SETUP
-- ============================================
-- Run these commands to create a private storage bucket

-- Create a private bucket for user images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  FALSE, -- PRIVATE: Images are not publicly accessible
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. STORAGE POLICIES (User Privacy)
-- ============================================
-- These policies ensure users can only access their own images

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own images
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to meal_logs table
DROP TRIGGER IF EXISTS update_meal_logs_updated_at ON meal_logs;
CREATE TRIGGER update_meal_logs_updated_at
  BEFORE UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to daily_checklists table
DROP TRIGGER IF EXISTS update_daily_checklists_updated_at ON daily_checklists;
CREATE TRIGGER update_daily_checklists_updated_at
  BEFORE UPDATE ON daily_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE! Your database is ready.
-- ============================================
-- 
-- TABLE SUMMARY:
-- 1. profiles - User information and fitness goals
-- 2. meal_logs - All logged meals with nutrition data
-- 3. daily_checklists - Daily checklist items and completion
-- 4. user_images - Metadata for uploaded images
--
-- STORAGE:
-- - user-images bucket (PRIVATE) - Stores actual image files
--
-- SECURITY:
-- - All tables have Row Level Security (RLS) enabled
-- - Users can only access their own data
-- - Storage bucket is private with user-folder policies
-- - Images are stored in user-specific folders: {user_id}/filename.jpg
--
