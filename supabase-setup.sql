-- ===================================================================
-- Christmas Card Invitation - Supabase Database Setup
-- ===================================================================
-- Run this entire script in Supabase SQL Editor
-- This script is idempotent - safe to run multiple times

-- ===================================================================
-- 1. CREATE TABLES
-- ===================================================================

-- Global settings table (singleton - only 1 row)
CREATE TABLE IF NOT EXISTS global_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  sender_name TEXT NOT NULL DEFAULT 'Andrew Reinert',
  card_front_message TEXT DEFAULT 'Wishing you a wonderful Christmas!',
  card_back_message TEXT DEFAULT 'I wish you all the best for the future. May this holiday season bring you joy and happiness.',
  envelope_color TEXT DEFAULT '#E7CDA8',
  envelope_text_color TEXT DEFAULT '#5a4a3a',
  title_color TEXT DEFAULT '#2c5f2d',
  global_image_url TEXT,
  global_logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default settings if not exists
INSERT INTO global_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Friends table (public card data)
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  custom_front_message TEXT,
  custom_back_message TEXT,
  envelope_color TEXT,
  envelope_text_color TEXT,
  title_color TEXT,
  custom_image_url TEXT,
  custom_logo_url TEXT,
  email_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_friends_code ON friends(code);

-- ===================================================================
-- 2. CREATE PRIVATE DATA TABLE
-- ===================================================================

-- Private data table for sensitive information (GDPR compliant)
CREATE TABLE IF NOT EXISTS friend_private_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id UUID NOT NULL UNIQUE REFERENCES friends(id) ON DELETE CASCADE,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_friend_private_data_friend_id ON friend_private_data(friend_id);

-- ===================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================================================

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_private_data ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on friends" ON friends;
DROP POLICY IF EXISTS "Allow all operations on global settings" ON global_settings;
DROP POLICY IF EXISTS "Anon can read friends" ON friends;
DROP POLICY IF EXISTS "Public can read friends" ON friends;
DROP POLICY IF EXISTS "Authenticated can manage friends" ON friends;
DROP POLICY IF EXISTS "Anon can read global settings" ON global_settings;
DROP POLICY IF EXISTS "Authenticated can manage global settings" ON global_settings;

-- FRIENDS TABLE: Public can read (card viewers)
CREATE POLICY "Anon can read friends (public data only)"
ON friends FOR SELECT
TO anon
USING (true);

-- FRIENDS TABLE: Only authenticated can write
CREATE POLICY "Authenticated can manage friends"
ON friends FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- GLOBAL_SETTINGS TABLE: Public can read
CREATE POLICY "Anon can read global settings"
ON global_settings FOR SELECT
TO anon
USING (true);

-- GLOBAL_SETTINGS TABLE: Only authenticated can write
CREATE POLICY "Authenticated can manage global settings"
ON global_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- FRIEND_PRIVATE_DATA TABLE: Only authenticated can access (NO public access)
CREATE POLICY "Only authenticated can access private data"
ON friend_private_data FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ===================================================================
-- 5. VERIFICATION QUERIES (Optional - Uncomment to check setup)
-- ===================================================================

-- Check table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'friends';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'friend_private_data';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'global_settings';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('friends', 'friend_private_data', 'global_settings');

-- Check policies
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public';

-- ===================================================================
-- SETUP COMPLETE! 🎄
-- ===================================================================
-- Next steps:
-- 1. Create admin user: Supabase → Authentication → Users → Add User
--    - Email: your@email.com
--    - Password: YourSecurePassword123!
-- 2. Open admin panel: /invitation/admin-7k9mP4xR/index.html
-- 3. Login with your credentials
-- 4. Start adding friends!
-- ===================================================================
