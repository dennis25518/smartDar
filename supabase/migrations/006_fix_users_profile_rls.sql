-- Fix RLS policies for users_profile table
-- Drop existing restrictive policies
DROP POLICY
IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY
IF EXISTS "Users can insert their own profile" ON users_profile;
DROP POLICY
IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY
IF EXISTS "Public can view basic profile info" ON users_profile;
DROP POLICY
IF EXISTS "Service role can manage all profiles" ON users_profile;
DROP POLICY
IF EXISTS "Public can view profile data" ON users_profile;
DROP POLICY
IF EXISTS "Authenticated users can view profiles" ON users_profile;

-- Create new RLS Policies with proper permissions

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON users_profile FOR
SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON users_profile FOR
INSERT
  WITH CHECK (auth.uid() =
user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON users_profile FOR
UPDATE
  USING (auth.uid()
= user_id)
  WITH CHECK
(auth.uid
() = user_id);

-- Allow service role (Edge Functions & Admin) SELECT
CREATE POLICY "Service role can view all profiles" 
  ON users_profile FOR
SELECT
    USING (auth.role() = 'service_role');

-- Allow service role INSERT
CREATE POLICY "Service role can insert profiles" 
  ON users_profile FOR
INSERT
  WITH CHECK (auth.role() = 'service_role')
;

-- Allow service role UPDATE
CREATE POLICY "Service role can update profiles" 
  ON users_profile FOR
UPDATE
  USING (auth.role()
= 'service_role')
  WITH CHECK
(auth.role
() = 'service_role');

-- Allow service role DELETE
CREATE POLICY "Service role can delete profiles" 
  ON users_profile FOR
DELETE
  USING (auth.role
() = 'service_role');


