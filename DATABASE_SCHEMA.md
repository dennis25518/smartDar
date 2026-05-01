# SmartDar Complete Database Schema

This document contains all SQL migrations needed to set up the SmartDar database. Run these migrations in order in your Supabase SQL Editor.

---

## Migration 1: Create Sensors Table

```sql
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
```

---

## Migration 2: Create Sensor Readings Table

```sql
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
```

---

## Migration 3: Create Alerts Table

```sql
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
```

---

## Migration 4: Create Users Profile Table

```sql
-- Create users profile table
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  organization TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_users_profile_status ON users_profile(status);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view basic profile info"
  ON users_profile FOR SELECT
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_profile_update_timestamp
BEFORE UPDATE ON users_profile
FOR EACH ROW
EXECUTE FUNCTION update_users_profile_timestamp();
```

---

## Migration 5: Create Support Tickets Table

```sql
-- Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT 'TICKET-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0'),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  response_message TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own tickets
CREATE POLICY "Users can view their own support tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update tickets"
  ON support_tickets FOR UPDATE
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_update_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_tickets_timestamp();

-- Create trigger to set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION set_support_ticket_resolved_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_resolved_time
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_support_ticket_resolved_time();
```

---

## Installation Steps

### Step 1: Run All Migrations in Order

Copy and paste each migration above into Supabase **SQL Editor**, one at a time, in this order:

1. **Migration 1** - Sensors Table
2. **Migration 2** - Sensor Readings Table
3. **Migration 3** - Alerts Table
4. **Migration 4** - Users Profile Table
5. **Migration 5** - Support Tickets Table

### Step 2: Verify Tables Created

In Supabase, go to **Table Editor** and verify you see:

- `sensors`
- `sensor_readings`
- `alerts`
- `users_profile`
- `support_tickets`

### Step 3: Deploy Edge Functions

1. **receive-sensor-data** - For ESP32 data ingestion
2. **on-user-signup** - For automatic user profile creation

---

## Database Schema Diagram

```
┌─────────────────────┐
│   auth.users        │
│  (Supabase Auth)    │
└──────────┬──────────┘
           │
           ├─────────────────────┬──────────────┬──────────────┐
           │                     │              │              │
           ▼                     ▼              ▼              ▼
    ┌────────────────┐   ┌──────────────┐  ┌────────────┐  ┌──────────────┐
    │ users_profile  │   │   sensors    │  │  alerts    │  │ support_     │
    ├────────────────┤   ├──────────────┤  ├────────────┤  │ tickets      │
    │ • user_id (PK) │   │ • id (PK)    │  │ • id (PK)  │  ├──────────────┤
    │ • first_name   │   │ • user_id(FK)│  │ • sensor_  │  │ • id (PK)    │
    │ • last_name    │   │ • device_id  │  │   id (FK)  │  │ • user_id(FK)│
    │ • email        │   │ • location   │  │ • alert_   │  │ • name       │
    │ • phone        │   │ • status     │  │   type     │  │ • email      │
    │ • avatar_url   │   │ • created_at │  │ • message  │  │ • subject    │
    │ • role         │   └──────┬───────┘  │ • resolved │  │ • category   │
    │ • status       │          │          │ • created_ │  │ • status     │
    │ • created_at   │          ▼          │   at       │  │ • created_at │
    │ • updated_at   │   ┌──────────────┐  └────────────┘  │ • updated_at │
    └────────────────┘   │   sensor_    │                  └──────────────┘
                         │   readings   │
                         ├──────────────┤
                         │ • id (PK)    │
                         │ • sensor_id  │
                         │ • fill_level │
                         │ • distance_mm│
                         │ • created_at │
                         └──────────────┘
```

---

## Table Relationships

### `users_profile`

- Stores extended user information beyond Supabase Auth
- Auto-created when user signs up (via Edge Function)
- One-to-one relationship with `auth.users`

### `sensors`

- Device registry for ESP32 boards
- Links to users via `user_id`
- One user can have multiple sensors

### `sensor_readings`

- Real-time IoT data from ESP32 devices
- References sensors by `sensor_id`
- Historical data for trends and analytics

### `alerts`

- Alert history and notifications
- Created automatically when readings exceed thresholds
- Tracks alert resolution

### `support_tickets`

- Support/help request management
- Auto-generates ticket numbers
- Tracks ticket status and resolution

---

## Security Features

### Row-Level Security (RLS)

- All tables have RLS enabled
- Users can only see their own data
- Service role has elevated permissions for system operations

### Automatic Timestamps

- `updated_at` automatically updates on row modifications
- `resolved_at` auto-sets when support ticket is resolved

### Data Integrity

- Foreign keys ensure referential integrity
- ON DELETE CASCADE for clean data removal
- Unique constraints prevent duplicates

---

## Queries for Common Operations

### Register a New Sensor

```sql
INSERT INTO sensors (user_id, device_id, location_name, sensor_count, max_capacity_ml)
VALUES (
  '12345678-1234-1234-1234-123456789012',  -- Your user ID
  'esp32_household_1',
  'Living Room Waste Bin',
  2,
  1000
);
```

### Get Latest Readings for a Sensor

```sql
SELECT * FROM sensor_readings
WHERE sensor_id = '12345678-1234-1234-1234-123456789012'
ORDER BY created_at DESC
LIMIT 10;
```

### Get Active Alerts

```sql
SELECT * FROM alerts
WHERE resolved = FALSE
ORDER BY created_at DESC;
```

### Create Support Ticket

```sql
INSERT INTO support_tickets (user_id, name, email, subject, category, message)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'John Doe',
  'john@example.com',
  'Issue with sensor readings',
  'technical',
  'My sensor is showing incorrect readings...'
);
```

---

## Next Steps

1. Run all 5 migrations in Supabase SQL Editor
2. Deploy Edge Functions in Supabase
3. Your app is now fully functional with:
   - User profiles
   - Sensor management
   - Real-time data collection
   - Alert system
   - Support ticket system

---

For more information, see [ESP32_SETUP_GUIDE.md](ESP32_SETUP_GUIDE.md)
