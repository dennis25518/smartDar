-- Create alerts table (alert history)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  sensor_number INTEGER NOT NULL,
  alert_type TEXT NOT NULL,
  fill_level_trigger INTEGER NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_alerts_sensor_id ON alerts(sensor_id);
CREATE INDEX idx_alerts_device_id ON alerts(device_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view alerts from their sensors" 
  ON alerts FOR SELECT 
  USING (
    sensor_id IN (
      SELECT id FROM sensors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert alerts" 
  ON alerts FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can update alerts" 
  ON alerts FOR UPDATE 
  WITH CHECK (true);
