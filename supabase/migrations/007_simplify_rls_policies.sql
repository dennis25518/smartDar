-- Final RLS policy fix for users_profile table
-- Remove all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Service role can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Service role can insert profiles" ON users_profile;
DROP POLICY IF EXISTS "Service role can update profiles" ON users_profile;
DROP POLICY IF EXISTS "Service role can delete profiles" ON users_profile;
DROP POLICY IF EXISTS "Public can view basic profile info" ON users_profile;
DROP POLICY IF EXISTS "Public can view profile data" ON users_profile;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON users_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users_profile;

-- Simple and effective policies

-- SELECT: Users can view their own profile
CREATE POLICY "select_own_profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own profile
CREATE POLICY "insert_own_profile"
  ON users_profile FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.role() IN ('authenticated', 'service_role')
  );

-- UPDATE: Users can update their own profile
CREATE POLICY "update_own_profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own profile
CREATE POLICY "delete_own_profile"
  ON users_profile FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "service_role_all"
  ON users_profile
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
