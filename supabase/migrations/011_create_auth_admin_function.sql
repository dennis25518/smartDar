-- Migration: 011_create_auth_admin_function.sql
-- Creates a RPC function to authenticate admin users securely using pgcrypto

CREATE OR REPLACE FUNCTION auth_admin
(p_email text, p_password text)
RETURNS TABLE
(id uuid, email text, full_name text, role text) AS $$
SELECT id, email, full_name, role
FROM admin_profiles_table
WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)
$$ LANGUAGE sql STABLE;
