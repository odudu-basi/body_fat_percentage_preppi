-- ============================================
-- KITCHEN ITEMS PREFERENCES MIGRATION
-- ============================================
-- Add this to your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/zltkngnohnpaiowffpqc/sql
-- ============================================

-- ============================================
-- ADD KITCHEN ITEMS TO PROFILES TABLE
-- ============================================
-- Add kitchen_items column to store user's available ingredients

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kitchen_items TEXT[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN profiles.kitchen_items IS 'Array of kitchen item IDs that the user has available for meal planning';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_kitchen_items
ON profiles USING gin (kitchen_items);

-- ============================================
-- EXAMPLE DATA STRUCTURE
-- ============================================
-- kitchen_items will store an array of item IDs:
-- ['chicken', 'beef', 'fish', 'rice', 'potato', 'broccoli', ...]
--
-- These IDs correspond to the items in the KitchenItemsScreen:
-- - Protein: chicken, beef, fish, tuna, shrimp, egg, turkey, pork, ham, tofu, soy_meat, tempeh, seitan, protein_powder
-- - Carbs: rice, potato, sweet_potato, pasta, bread, oats, quinoa, couscous, tortilla
-- - Vegetables: broccoli, spinach, carrot, tomato, onion, garlic, pepper, cucumber, lettuce, cauliflower, zucchini, asparagus
-- - Fruits: banana, apple, orange, berries, strawberry, mango, pineapple, watermelon, grapes, avocado
-- - Dairy: milk, yogurt, cheese, butter, almond_milk, soy_milk, oat_milk
-- - Seasonings: olive_oil, coconut_oil, salt, pepper, paprika, cumin, oregano, basil, soy_sauce, hot_sauce

-- ============================================
-- DONE!
-- ============================================
