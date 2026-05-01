-- Create sensors table (device registry)
CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  location_name TEXT NOT NULL,
  sensor_count INTEGER DEFAULT 2,
  max_capacity_ml INTEGER DEFAULT 1000,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_sensors_user_id ON sensors(user_id);
CREATE INDEX idx_sensors_device_id ON sensors(device_id);

-- Enable RLS
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sensors" 
  ON sensors FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sensors" 
  ON sensors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sensors" 
  ON sensors FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sensors" 
  ON sensors FOR DELETE 
  USING (auth.uid() = user_id);
