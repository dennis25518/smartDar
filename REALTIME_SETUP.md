# Real-Time Dashboard Setup Guide

Your dashboard now has **real-time updates**! New sensor readings and alerts will appear automatically without page refresh.

## ✅ What Changed

### 1. **Dashboard Hook** (`useSensorData.ts`)
- Added proper Realtime subscriptions for `sensor_readings` table
- Added subscriptions for `alerts` table (INSERT and UPDATE events)
- Subscriptions are **filtered by your user's sensors only** (more efficient)
- Added console logging to track updates

### 2. **ESP32 Firmware** 
- Added `Authorization: Bearer public-testing` header to bypass Supabase platform auth check

## 🚀 How It Works Now

```
ESP32 (every 5 minutes)
    ↓ sends sensor data
Edge Function (receive-sensor-data)
    ↓ inserts to sensor_readings table
Supabase Realtime Broadcast
    ↓ detects INSERT event
Your Dashboard (instant update!)
    ↓ no refresh needed
```

## ⚠️ If Real-Time Still Doesn't Work

Real-time updates require proper **Row Level Security (RLS)** policies. If updates aren't showing up, follow these steps:

### Step 1: Check RLS is Enabled Correctly

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Check RLS status for sensor_readings
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'sensor_readings';

-- View RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'sensor_readings';
```

### Step 2: Add Missing RLS Policy (If Needed)

If you see no policies or they don't allow SELECT, run this:

```sql
-- Allow Realtime service to read sensor readings
CREATE POLICY "realtime_select_sensor_readings" ON sensor_readings
FOR SELECT
USING (true);

-- Allow Realtime service to read alerts
CREATE POLICY "realtime_select_alerts" ON alerts
FOR SELECT
USING (true);
```

### Step 3: Enable Realtime on Tables

1. Go to **Supabase Dashboard**
2. Click **Database** → **Replication**
3. Find `sensor_readings` table
4. Toggle **Realtime** to **ON** ✓
5. Find `alerts` table
6. Toggle **Realtime** to **ON** ✓

### Step 4: Test in Browser

1. Open Dashboard: https://smartdar.vercel.app
2. Open **Browser Console** (F12 → Console tab)
3. You should see logs like:
   ```
   Readings subscription: SUBSCRIBED
   Alerts subscription: SUBSCRIBED
   ```
4. When ESP32 sends data, you'll see:
   ```
   📊 New sensor reading: {sensor_id: "...", fill_level: 45, ...}
   ```

## 📊 Real-Time Console Logs

When working correctly, the browser console will show:

```
✅ Setup Complete:
   Readings subscription: SUBSCRIBED
   Alerts subscription: SUBSCRIBED

📊 New sensor reading: {
  id: "550e8400-e29b...",
  sensor_id: "123",
  fill_level: 62,
  created_at: "2026-05-01T16:25:30Z"
}

🚨 New alert: {
  id: "660e8400-e29b...",
  alert_type: "warning",
  message: "WARNING: 62% full"
}
```

## 🔄 Dashboard Updates

Once real-time is working:

- **Overview Tab** - Fill level updates instantly (no refresh)
- **Notification Tab** - New alerts appear immediately
- **Status Tab** - Last updated time changes to "Just now"

## 🧪 Quick Test

1. **Upload updated firmware** to ESP32
2. **Open Dashboard**
3. **Open Console** (F12)
4. Check for subscription logs
5. **Wait 5 minutes** for ESP32 to send reading
6. Should see data update without refresh!

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Console shows `FAILED` or `PAUSED` | RLS policies are blocking Realtime |
| Subscriptions don't show up | Realtime not enabled on table in Supabase |
| Data shows after refresh but not real-time | Run the RLS policy SQL from Step 2 |
| Still 401 error on ESP32 | Ensure Authorization header is added in firmware |

If issues persist, check [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
