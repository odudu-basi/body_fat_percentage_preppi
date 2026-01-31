-- ============================================
-- MEAL PLANS TABLE MIGRATION
-- ============================================
-- Add this to your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- ============================================
-- MEAL PLANS TABLE
-- ============================================
-- Stores AI-generated daily meal plans

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Date for this meal plan
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Nutrition totals
  total_calories INTEGER,
  total_protein INTEGER,
  total_carbs INTEGER,
  total_fat INTEGER,

  -- Meals array (JSON for flexibility)
  -- Format: [{ "meal_type": "breakfast", "name": "...", "calories": 500, ... }, ...]
  meals JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one meal plan per user per day
  UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);

-- Enable RLS on meal_plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Users can only view their own meal plans
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own meal plans
CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own meal plans
CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own meal plans
CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Apply trigger to meal_plans table for automatic updated_at
DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE!
-- ============================================
