-- Migration: 012_auth_admin_security_definer.sql
-- Update auth_admin function to run as SECURITY DEFINER so anonymous RPC callers
-- can validate admin credentials against admin_profiles_table.

CREATE OR REPLACE FUNCTION auth_admin(p_email text, p_password text)
RETURNS TABLE(id uuid, email text, full_name text, role text)
SECURITY DEFINER
AS $$
  SELECT id, email, full_name, role
  FROM admin_profiles_table
  WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION auth_admin(text, text) TO public;
