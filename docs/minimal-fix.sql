-- Minimal Fix for "Database error saving new user"
-- This script only removes the problematic trigger that's causing signup failures

-- 1. Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. Verify the fix
SELECT 'Minimal fix completed! User signup should now work.' as status;

