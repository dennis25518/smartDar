# ESP32 Integration Roadmap

## Current Status ✅

- User authentication system (SignUp/SignIn/Password Reset)
- User profile management with avatar uploads
- Real-time sensor data dashboard
- Alert system with thresholds
- All database tables with RLS policies

## Phase 1: ESP32 Device Registration (1-2 hours)

### Step 1: Register Your ESP32 as a Device

1. Go to **Supabase → SQL Editor**
2. Run this query to register your device:

```sql
INSERT INTO sensors (device_id, location_name, latitude, longitude, user_id)
VALUES (
  'ESP32_LIVING_ROOM',
  'Living Room Waste Bin',
  -6.7924,
  39.2083,
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
);
```

3. Copy the returned `id` (sensor ID) - you'll need this in the firmware

### Step 2: Upload ESP32 Firmware

1. Open [ESP32_SETUP_GUIDE.md](../ESP32_SETUP_GUIDE.md) in the repository
2. Follow the hardware setup instructions:
   - Connect HC-SR04 ultrasonic sensor to GPIO pins
   - Wire up power/ground correctly
3. Configure WiFi credentials in the firmware
4. Update the `DEVICE_ID` and `SENSOR_ID` in the code
5. Upload firmware to ESP32 using Arduino IDE

### Step 3: Verify Device Connection

- Wait 5 minutes for first reading
- Check Supabase → `sensor_readings` table
- Should see new rows from your device
- Dashboard should show real-time data

---

## Phase 2: Real-time Data Recording (Already Working)

### Automatic Features

- ESP32 sends readings every 5 minutes via HTTP POST
- Edge Function (`receive-sensor-data`) validates and inserts data
- Alerts auto-trigger when fill level ≥ 85% (critical) or ≥ 60% (warning)
- Dashboard updates in real-time via Supabase subscriptions

### Data Flow

```
ESP32 (HC-SR04 sensor)
  ↓ (HTTP POST every 5 minutes)
Supabase Edge Function: receive-sensor-data
  ↓ (validates device_id, calculates fill %)
sensor_readings table (stored)
  ↓ (Realtime subscription)
Dashboard (live updates)
  ↓ (alerts triggered)
alerts table (recorded)
```

---

## Phase 3: Advanced Features (Optional)

### Dashboard Enhancements

- [ ] Map view showing all device locations
- [ ] Historical data charts (last 24h, 7d, 30d)
- [ ] Export data as CSV/PDF
- [ ] Predictive maintenance (fill rate trends)

### Mobile App

- [ ] React Native mobile app with push notifications
- [ ] Offline-first support
- [ ] Camera integration for waste type classification

### Admin Features

- [ ] Manage multiple devices per user
- [ ] Team collaboration (assign technicians)
- [ ] Maintenance log and service history
- [ ] Cost analytics

---

## Quick Checklist Before Starting ESP32

- [ ] Have ESP32 board + HC-SR04 sensor + jumper wires
- [ ] Have Arduino IDE installed + ESP32 board package
- [ ] WiFi network available for ESP32
- [ ] Supabase project active and accessible
- [ ] Device registered in Supabase sensors table
- [ ] VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_ANON_KEY in .env

---

## Files to Reference

- **[ESP32_SETUP_GUIDE.md](../ESP32_SETUP_GUIDE.md)** - Complete hardware & firmware setup
- **[DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)** - Database structure and relationships
- **Edge Functions** - Located in `supabase/functions/`
  - `receive-sensor-data/index.ts` - Handles ESP32 data
  - `on-user-signup/index.ts` - Auto-creates user profile

---

## Estimated Timeline

- **Step 1 (Device Registration):** 5 minutes
- **Step 2 (Firmware Upload):** 30-45 minutes (includes hardware setup)
- **Step 3 (Verification):** 5 minutes waiting + testing
- **Total:** ~1 hour

After this, your dashboard will be receiving real-time waste level data from your ESP32! 🎉
