-- ============================================
-- EXERCISE LOGS TABLE
-- ============================================
-- Stores user exercises and completion status

CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Exercise info
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT, -- e.g., "30 min"
  calories INTEGER NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'fitness', -- Ionicon name
  
  -- Tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Whether this is a default exercise or user-created
  is_custom BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON exercise_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_date ON exercise_logs(date);

-- Enable RLS on exercise_logs
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own exercises
CREATE POLICY "Users can view own exercises" ON exercise_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own exercises
CREATE POLICY "Users can insert own exercises" ON exercise_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises" ON exercise_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises" ON exercise_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Apply trigger to exercise_logs table for updated_at
DROP TRIGGER IF EXISTS update_exercise_logs_updated_at ON exercise_logs;
CREATE TRIGGER update_exercise_logs_updated_at
  BEFORE UPDATE ON exercise_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
