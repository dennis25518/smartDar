-- Migration: 009_create_admin_profiles_table.sql
-- Creates an admin_profiles_table for admin authentication
-- NOTE: Generate password hashes (bcrypt) outside of SQL and insert them securely.

-- Ensure pgcrypto (for gen_random_uuid) is available
CREATE EXTENSION
IF NOT EXISTS "pgcrypto";

CREATE TABLE
IF NOT EXISTS admin_profiles_table
(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid
(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now
()
);

CREATE INDEX
IF NOT EXISTS idx_admin_profiles_table_email ON admin_profiles_table
(email);

-- Example insert (replace <bcrypt-hash> with a securely generated bcrypt hash):
-- INSERT INTO admin_profiles_table (email, password_hash, full_name, role) 
-- VALUES ('admin@example.com', '<bcrypt-hash>', 'Admin User', 'admin');
