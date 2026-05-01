# ESP32 Setup - Troubleshooting & Verification Guide

## Issue 1: 401 UNAUTHORIZED_NO_AUTH_HEADER Error ✅ FIXED

### What Happened

The Edge Function was requiring authorization headers, but IoT devices don't have auth tokens.

### Solution Applied

✅ Updated `receive-sensor-data/index.ts` to:

- Remove auth requirements
- Accept unauthenticated requests from ESP32
- Validate device using `device_id` instead of JWT tokens
- Added detailed logging for debugging

### What You Need to Do

**Step 1: Deploy Updated Function**

1. Go to **Supabase Dashboard → Edge Functions**
2. Click **receive-sensor-data** function
3. You should see the updated code
4. Verify deployment shows "✓ Deployed" status

**Step 2: Check Function Permissions**
In Supabase dashboard, verify the function allows unauthenticated access:

- Go to **Edge Functions → receive-sensor-data**
- Look for any authentication settings
- Ensure it's set to allow public/unauthenticated access

**Step 3: Re-test ESP32**

- Upload the firmware again (same Arduino code)
- ESP32 should now send data successfully
- Should show **HTTP Code: 200** instead of 401

---

## Issue 2: Network Setup (4G vs 5G) ⚠️

Your router likely supports both 2.4GHz and 5GHz bands:

- **2.4GHz:** Better range, slower (older devices use this)
- **5GHz:** Faster, shorter range

### Recommendation

1. **For ESP32:** Use 2.4GHz band
   - Most IoT devices only support 2.4GHz
   - Go to your router settings and ensure 2.4GHz is enabled
   - Use 2.4GHz SSID in Arduino sketch

2. **For your PCs:** Use 5GHz for faster speeds
   - Modern computers support both bands
   - 5GHz provides better throughput

### ESP32 WiFi Configuration

Make sure in Arduino sketch:

```cpp
const char* ssid = "YOUR_ROUTER_SSID_2_4GHZ";  // Use 2.4GHz network
const char* password = "YOUR_ROUTER_PASSWORD";
```

---

## Issue 3: How to Check if Data is Being Received ✅

### Method 1: Check Supabase Dashboard (RECOMMENDED)

1. Go to **Supabase Dashboard → SQL Editor**
2. Run this query:

```sql
SELECT * FROM sensor_readings
ORDER BY created_at DESC
LIMIT 10;
```

3. You should see recent readings from your ESP32
4. Check timestamps - should be very recent (within last 5 minutes)

### Method 2: Check Dashboard App

1. Open your SmartDar app (https://smartdar.vercel.app or localhost:3000)
2. Go to **Overview** tab
3. You should see:
   - Your sensor location
   - Live fill level percentage
   - "Just now" or "X min ago" timestamp
   - If fill ≥ 60%, see warning alerts
   - If fill ≥ 85%, see critical alerts

### Method 3: Check Edge Function Logs

1. Go to **Supabase Dashboard → Edge Functions → receive-sensor-data**
2. Look for **Execution Logs** or **Logs** tab
3. Should show:
   ```
   Received data from device: esp32_household_1
   Successfully inserted 1 readings for device esp32_household_1
   ```

### Method 4: Monitor Arduino Serial Monitor

Look for:

```
✓ WiFi connected!
IP: 192.168.1.XXX
=== Taking measurements ===
Sensor 2: XXXX mm → X%
Payload: {...}
Sending POST request...
HTTP Code: 200          ← THIS SHOULD BE 200 NOW
Response: {"success":true,...}
```

---

## Expected Data Flow After Fix

```
ESP32 (every 5 minutes)
  ↓ HTTP POST (no auth needed)
Supabase Edge Function
  ↓ Validates device_id against sensors table
  ↓ Inserts into sensor_readings
  ↓ Checks thresholds → Creates alerts if needed
Dashboard (Real-time update via Realtime subscription)
  ↓ Shows live fill level, timestamps, alerts
```

---

## Device Registration Checklist

✅ Have you registered your ESP32 in Supabase?

Run this in **Supabase SQL Editor**:

```sql
SELECT device_id, location_name, user_id FROM sensors;
```

You should see your device. If not, register it:

```sql
INSERT INTO sensors (device_id, location_name, latitude, longitude, user_id)
VALUES (
  'esp32_household_1',
  'My Waste Bin',
  -6.7924,
  39.2083,
  (SELECT id FROM auth.users WHERE email = 'musicsmart255@gmail.com')
);
```

---

## Next Steps After Verification

1. **Verify data is flowing** (use one of the 4 methods above)
2. **Check dashboard for live updates**
3. **Test alert triggering** by placing ESP32 to measure low distances (< 150mm for 85%+ fill)
4. **Monitor for 24 hours** to ensure stable readings every 5 minutes

---

## Troubleshooting Commands

### Check device registration

```sql
SELECT id, device_id, location_name FROM sensors WHERE device_id = 'esp32_household_1';
```

### Check recent readings

```sql
SELECT device_id, fill_level, created_at FROM sensor_readings
WHERE device_id = 'esp32_household_1'
ORDER BY created_at DESC LIMIT 5;
```

### Check alerts

```sql
SELECT device_id, alert_type, fill_level_trigger, created_at FROM alerts
WHERE device_id = 'esp32_household_1'
ORDER BY created_at DESC LIMIT 5;
```

---

Need help? Check the Arduino Serial Monitor output and share the HTTP response!
