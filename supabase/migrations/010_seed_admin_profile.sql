-- Migration: 010_seed_admin_profile.sql
-- Insert an initial admin user using pgcrypto's crypt() for bcrypt hashing

INSERT INTO admin_profiles_table
    (email, password_hash, full_name, role)
SELECT 'admin@smartdar.tz', crypt('admin123', gen_salt('bf', 10)), 'Admin User', 'admin'
WHERE NOT EXISTS (
  SELECT 1
FROM admin_profiles_table
WHERE email = 'admin@smartdar.tz'
);
