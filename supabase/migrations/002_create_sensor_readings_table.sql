-- Create sensor_readings table (real-time data from ESP32)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  sensor_number INTEGER NOT NULL,
  fill_level INTEGER NOT NULL,
  distance_mm INTEGER,
  temperature DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries and filtering
CREATE INDEX idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX idx_sensor_readings_created_at ON sensor_readings(created_at DESC);
CREATE INDEX idx_sensor_readings_created_at_sensor_id ON sensor_readings(created_at DESC, sensor_id);

-- Enable RLS
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can see readings for their sensors only
CREATE POLICY "Users can view readings from their sensors" 
  ON sensor_readings FOR SELECT 
  USING (
    sensor_id IN (
      SELECT id FROM sensors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert readings" 
  ON sensor_readings FOR INSERT 
  WITH CHECK (true);
