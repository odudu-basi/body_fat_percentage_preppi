-- ============================================
-- Migration: Add body_scans table
-- Created: 2026-01-17
-- Description: Stores body composition scan results
-- ============================================

-- Create body_scans table
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

-- RLS Policies: Users can only access their own scans

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

-- Add trigger for updated_at timestamp (uses existing function from initial schema)
-- If the function doesn't exist, create it first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to body_scans table
DROP TRIGGER IF EXISTS update_body_scans_updated_at ON body_scans;
CREATE TRIGGER update_body_scans_updated_at
  BEFORE UPDATE ON body_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
