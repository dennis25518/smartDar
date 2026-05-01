# ESP32 Public Testing Setup (No Auth)

## Quick Setup for Testing

### Step 1: Use Simple Firmware

Use **[ESP32_SIMPLE_PUBLIC.ino](ESP32_SIMPLE_PUBLIC.ino)** instead - NO Anon Key needed!

Just update:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* DEVICE_ID = "esp32_household_1";
```

### Step 2: Make Function Public in Supabase

**IMPORTANT:** You need to configure the function to accept public requests.

1. Go to **https://supabase.com/dashboard**
2. Select **smartDar** project
3. Click **Edge Functions** (left menu)
4. Click **receive-sensor-data**
5. Look for **Function Details** or **Settings** tab
6. Find a toggle or setting for:
   - **"Require Auth"** or **"Authentication"**
   - **"JWT Verification"**
   - **"Security"**
7. **Disable/Toggle OFF** any authentication requirement
8. **Save** or **Deploy**

Alternatively, if you see a code editor:

- The function should NOT require Bearer token validation
- It should accept all POST requests

### Step 3: Upload & Test

1. Open **ESP32_SIMPLE_PUBLIC.ino** in Arduino IDE
2. Update WiFi/Device ID
3. Upload to ESP32
4. Check Serial Monitor (115200 baud)
5. Should see: **HTTP Code: 200** ✓

### What Should Happen

```
=== Taking measurement ===
Distance: 1500 mm → Fill: 40%
Sending data...
Payload: {"device_id":"esp32_household_1","sensors":[...]}
HTTP Code: 200              ← ✓ SUCCESS!
Response: {"success":true,...}
✓ Success!
```

### Verify in Dashboard

1. Open https://smartdar.vercel.app
2. **Overview** tab
3. Should see live data from your device

---

## Why It's Still Failing?

The "YOUR_SECRE" prefix in the error log means:

- ❌ The Anon Key field still has the placeholder text
- ❌ OR the function has strict auth validation enabled

**Solution:** Use the simple firmware + disable function authentication in Supabase.

---

## After Testing

Once it's working, we can:

1. Add proper API key authentication
2. Add rate limiting
3. Add device validation
4. Secure for production

For now, just get it working! 🚀
