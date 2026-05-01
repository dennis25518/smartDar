# ESP32 Setup with Supabase Authentication

## Step 1: Get Your Supabase Anon Key

1. Go to **https://supabase.com/dashboard**
2. Select your **smartDar** project
3. Click **Settings** (bottom left)
4. Click **API** in the left sidebar
5. Under **Project API keys**, find **`anon public`** key
6. Copy the entire key (it looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 2: Update ESP32 Code

### Option A: Use the Pre-Made Firmware (RECOMMENDED)
1. Open [ESP32_FIRMWARE_WITH_AUTH.ino](ESP32_FIRMWARE_WITH_AUTH.ino)
2. Replace the configuration section:

```cpp
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // ← Your 2.4GHz WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // ← Your WiFi password

// Supabase Configuration
const char* SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";  // ← PASTE YOUR ANON KEY HERE

// Device Configuration
const char* DEVICE_ID = "esp32_household_1";   // ← Change if needed
```

### Option B: Update Existing Code
Find your `sendToSupabase` function and update it:

```cpp
void sendToSupabase(String payload) {
  HTTPClient http;
  
  const char* SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";  // ← ADD THIS
  
  http.begin(SERVER_URL);
  
  // Add these two lines
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);  // ← ADD THIS
  
  int httpCode = http.POST(payload);
  
  // ... rest of code
}
```

## Step 3: Upload to ESP32

1. In Arduino IDE, select:
   - **Tools → Board → ESP32 → ESP32 Dev Module**
   - **Tools → Port → COM3** (or your ESP32 port)
   - **Tools → Upload Speed → 921600**

2. Click **Upload** (or Ctrl+U)

3. Wait for "Leaving... Hard resetting via RTS pin..." message

## Step 4: Monitor Serial Output

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:

```
=== SmartDar ESP32 Waste Monitor ===
Initializing...
✓ Setup complete!
Connecting to WiFi: YOUR_SSID
.....
✓ WiFi connected!
IP: 192.168.1.XXX
=== Taking measurements ===
Distance: XXXX mm → Fill: XX%
Payload: {"device_id":"esp32_household_1","sensors":[...]}
Sending POST request to Supabase...
HTTP Code: 200                    ← ✓ SUCCESS!
Response: {"success":true,...}
✓ Data sent successfully!
```

## Step 5: Verify in Dashboard

1. Open **https://smartdar.vercel.app** (or localhost:3000)
2. Go to **Overview** tab
3. You should see your sensor with live data and timestamps

---

## Troubleshooting

### Still Getting 401 Error?
- ✅ Did you paste the Anon Key correctly?
- ✅ Is there whitespace before/after the key? (Remove it)
- ✅ Did you add both header lines?

### Network Issues?
- Ensure ESP32 is on 2.4GHz network (not 5GHz)
- Try connecting to 2.4GHz WiFi instead

### Data Not Showing in Dashboard?
1. Check Supabase SQL:
   ```sql
   SELECT * FROM sensor_readings 
   ORDER BY created_at DESC LIMIT 5;
   ```
2. Check Edge Function logs for errors

---

## How It Works Now

```
ESP32 sends:
POST /functions/v1/receive-sensor-data HTTP/1.1
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Body:
{
  "device_id": "esp32_household_1",
  "sensors": [
    {
      "sensor_id": 2,
      "fill_level": 45,
      "distance_mm": 1375
    }
  ]
}
        ↓
Supabase validates Anon Key ✓
        ↓
Inserts into sensor_readings table
        ↓
Creates alerts if fill level ≥ 60%
        ↓
Dashboard updates in real-time
```

---

## Key Points

- **Anon Key** = Public authentication token for your project
- **Authorization Header** = Tells Supabase this request is from your app
- **HTTP Code 200** = Success! Data received and stored
- **HTTP Code 401** = Missing or invalid Anon Key

Once this is working, every 5 minutes your ESP32 will send fresh data to the dashboard! 🚀
