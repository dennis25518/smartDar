-- Create users profile table
CREATE TABLE
IF NOT EXISTS users_profile
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users
(id) ON
DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT
NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  organization TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW
(),
  updated_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Create index for faster queries
CREATE INDEX idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_users_profile_status ON users_profile(status);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" 
  ON users_profile FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON users_profile FOR
INSERT 
  WITH CHECK (auth.uid() =
user_id);

CREATE POLICY "Users can update their own profile" 
  ON users_profile FOR
UPDATE 
  USING (auth.uid()
= user_id);

CREATE POLICY "Public can view basic profile info" 
  ON users_profile FOR
SELECT
    USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_profile_timestamp
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_profile_update_timestamp
BEFORE
UPDATE ON users_profile
FOR EACH ROW
EXECUTE FUNCTION update_users_profile_timestamp
();
