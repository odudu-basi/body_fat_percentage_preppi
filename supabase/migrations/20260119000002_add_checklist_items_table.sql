-- ============================================
-- CHECKLIST ITEMS TABLE
-- ============================================
-- Stores user checklist items (both recurring and one-time)

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item info
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT DEFAULT 'checkbox',
  icon_color TEXT DEFAULT '#E85D04',
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE, -- If true, shows every day
  created_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Date when item was created
  
  -- Whether this is a default item or user-created
  is_custom BOOLEAN DEFAULT FALSE,
  
  -- Sort order
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECKLIST COMPLETIONS TABLE
-- ============================================
-- Tracks daily completion status for checklist items
-- This allows recurring items to be checked/unchecked per day

CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  
  -- Completion tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one completion record per item per day
  UNIQUE(checklist_item_id, date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_checklist_items_user ON checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_user_date ON checklist_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_item ON checklist_completions(checklist_item_id);

-- Enable RLS on checklist_items
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Users can only view their own checklist items
CREATE POLICY "Users can view own checklist items" ON checklist_items
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own checklist items
CREATE POLICY "Users can insert own checklist items" ON checklist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own checklist items
CREATE POLICY "Users can update own checklist items" ON checklist_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own checklist items
CREATE POLICY "Users can delete own checklist items" ON checklist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on checklist_completions
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own completions
CREATE POLICY "Users can view own completions" ON checklist_completions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own completions" ON checklist_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own completions
CREATE POLICY "Users can update own completions" ON checklist_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own completions
CREATE POLICY "Users can delete own completions" ON checklist_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Apply triggers for updated_at
DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_completions_updated_at ON checklist_completions;
CREATE TRIGGER update_checklist_completions_updated_at
  BEFORE UPDATE ON checklist_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
