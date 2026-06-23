-- Create emptying orders table
CREATE TABLE IF NOT EXISTS emptying_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  fill_level INTEGER,
  sensor_type TEXT, -- 'Wastebin' or 'Septic Tank'
  contractor_name TEXT, -- 'Kajenjere', 'Wejisa', 'Tirima', 'Sateki'
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed'
  dispatch_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emptying_orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to emptying orders
CREATE POLICY "Allow public select on emptying_orders" 
  ON emptying_orders FOR SELECT 
  USING (true);

-- Allow public insert access to emptying orders
CREATE POLICY "Allow public insert on emptying_orders" 
  ON emptying_orders FOR INSERT 
  WITH CHECK (true);

-- Allow public update access to emptying orders
CREATE POLICY "Allow public update on emptying_orders" 
  ON emptying_orders FOR UPDATE 
  USING (true);
