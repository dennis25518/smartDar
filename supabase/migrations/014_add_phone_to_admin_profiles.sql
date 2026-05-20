-- Migration: 014_add_phone_to_admin_profiles.sql
-- Adds phone number field to admin_profiles_table for WhatsApp alerts

ALTER TABLE admin_profiles_table ADD COLUMN
IF NOT EXISTS phone text;
ALTER TABLE admin_profiles_table ADD COLUMN
IF NOT EXISTS updated_at timestamptz DEFAULT now
();

-- Create index for phone lookups
CREATE INDEX
IF NOT EXISTS idx_admin_profiles_table_phone ON admin_profiles_table
(phone);
