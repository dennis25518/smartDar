# SmartDar ESP32 Integration - Setup Guide

## Overview

This guide walks you through setting up your ESP32 to communicate with the SmartDar dashboard via Supabase.

---

## **Step 1: Set Up Supabase Database**

### Run Migrations in Supabase

1. Go to your Supabase dashboard: https://supabase.com
2. Navigate to your SmartDar project
3. Click **SQL Editor** → **New Query**
4. Run each SQL migration in order (copy & paste):

#### Migration 1: Create Sensors Table

```sql
-- Copy from supabase/migrations/001_create_sensors_table.sql
```

#### Migration 2: Create Sensor Readings Table

```sql
-- Copy from supabase/migrations/002_create_sensor_readings_table.sql
```

#### Migration 3: Create Alerts Table

```sql
-- Copy from supabase/migrations/003_create_alerts_table.sql
```

---

## **Step 2: Deploy Edge Function**

### Deploy the Receive Sensor Data Function

1. In Supabase dashboard, click **Edge Functions** → **Create Function**
2. Name it: `receive-sensor-data`
3. Copy the code from `supabase/functions/receive-sensor-data/index.ts`
4. Click **Deploy**

### Get Your Function URL

```
https://your-project-id.supabase.co/functions/v1/receive-sensor-data
```

You'll need this URL for the ESP32 firmware.

---

## **Step 3: Register Your Device in Supabase**

Before ESP32 sends data, you must register it. Run this SQL query:

```sql
INSERT INTO sensors (user_id, device_id, location_name, sensor_count, max_capacity_ml, status)
VALUES (
  'YOUR_USER_ID',           -- Get from Auth → Users in Supabase
  'esp32_household_1',      -- Same device_id used in ESP32 code
  'My Home Waste Bin',      -- Location name for dashboard
  2,                        -- Number of ultrasonic sensors
  1000,                     -- Max container capacity in ml
  'active'
);
```

**To find your USER_ID:**

1. In Supabase, go to **Authentication** → **Users**
2. Click your user account
3. Copy the `UUID` from the top

---

## **Step 4: ESP32 Firmware Setup**

### Hardware Connection

```
ESP32           HC-SR04 Sensor 1    HC-SR04 Sensor 2
━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━
GPIO 5  ────→   TRIG
GPIO 18 ←────   ECHO

GPIO 17 ────→   TRIG
GPIO 16 ←────   ECHO

GND ────→       GND                 GND
5V ─────→       VCC                 VCC
```

### Arduino IDE Setup

1. **Install Arduino IDE** (if not already installed)
   - Download from: https://www.arduino.cc/en/software

2. **Install ESP32 Board Package**
   - Open Arduino IDE
   - Go to **File** → **Preferences**
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to **Tools** → **Board** → **Board Manager**
   - Search for "ESP32" and install the latest version

3. **Install Required Libraries**
   - Click **Sketch** → **Include Library** → **Manage Libraries**
   - Search and install:
     - `ArduinoJson` by Benoit Blanchon
     - `WiFi` (usually pre-installed)
     - `HTTPClient` (usually pre-installed)

### Upload Firmware

Create a new Arduino sketch with this code:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* DEVICE_ID = "esp32_household_1";  // Must match Supabase registration

// Supabase Edge Function endpoint
const char* SERVER_URL = "https://your-project-id.supabase.co/functions/v1/receive-sensor-data";

// Pin definitions
const int TRIG_PIN1 = 5;   // First sensor trigger
const int ECHO_PIN1 = 18;  // First sensor echo
const int TRIG_PIN2 = 17;  // Second sensor trigger
const int ECHO_PIN2 = 16;  // Second sensor echo

// ===== TIMING =====
const unsigned long MEASUREMENT_INTERVAL = 300000; // 5 minutes in milliseconds

unsigned long lastMeasurement = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n=== SmartDar ESP32 Booting ===");

  // Setup sensor pins
  pinMode(TRIG_PIN1, OUTPUT);
  pinMode(ECHO_PIN1, INPUT);
  pinMode(TRIG_PIN2, OUTPUT);
  pinMode(ECHO_PIN2, INPUT);

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check if it's time for a measurement
  if (millis() - lastMeasurement >= MEASUREMENT_INTERVAL) {
    lastMeasurement = millis();
    measureAndSend();
  }

  delay(1000); // Check every second
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi connection failed!");
  }
}

long getDistance(int trigPin, int echoPin) {
  // Trigger ultrasonic sensor
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure echo pulse
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout

  if (duration == 0) {
    return -1; // No echo received
  }

  // Calculate distance (speed of sound = 343 m/s = 0.0343 cm/µs)
  long distance_mm = (duration * 0.0343) / 2;
  return distance_mm;
}

int getCapacityPercent(long distance_mm, long max_distance_mm) {
  // Assuming container is full at 0mm and empty at max_distance_mm
  if (distance_mm < 0) return -1; // Invalid reading

  int percentage = 100 - ((distance_mm * 100) / max_distance_mm);

  if (percentage < 0) return 0;
  if (percentage > 100) return 100;

  return percentage;
}

void measureAndSend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected, reconnecting...");
    connectToWiFi();
    return;
  }

  Serial.println("\n=== Taking measurements ===");

  // Read both sensors
  long distance1_mm = getDistance(TRIG_PIN1, ECHO_PIN1);
  long distance2_mm = getDistance(TRIG_PIN2, ECHO_PIN2);

  // Assume max container height is 500mm
  int capacity1 = getCapacityPercent(distance1_mm, 500);
  int capacity2 = getCapacityPercent(distance2_mm, 500);

  Serial.printf("Sensor 1: %ldmm → %d%%\n", distance1_mm, capacity1);
  Serial.printf("Sensor 2: %ldmm → %d%%\n", distance2_mm, capacity2);

  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["device_id"] = DEVICE_ID;

  JsonArray sensors = doc.createNestedArray("sensors");

  JsonObject sensor1 = sensors.createNestedObject();
  sensor1["sensor_id"] = 1;
  sensor1["fill_level"] = capacity1;
  sensor1["distance_mm"] = distance1_mm;

  JsonObject sensor2 = sensors.createNestedObject();
  sensor2["sensor_id"] = 2;
  sensor2["fill_level"] = capacity2;
  sensor2["distance_mm"] = distance2_mm;

  // Convert to string
  String payload;
  serializeJson(doc, payload);

  Serial.println("Payload: " + payload);

  // Send to Supabase
  sendToSupabase(payload);
}

void sendToSupabase(String payload) {
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  Serial.print("POST to: ");
  Serial.println(SERVER_URL);

  int httpCode = http.POST(payload);

  Serial.print("HTTP Code: ");
  Serial.println(httpCode);

  String response = http.getString();
  Serial.print("Response: ");
  Serial.println(response);

  http.end();

  if (httpCode == 200) {
    Serial.println("✓ Data sent successfully!");
  } else {
    Serial.println("✗ Failed to send data!");
  }
}
```

### Configuration Steps

1. **Update WiFi Credentials**

   ```cpp
   const char* WIFI_SSID = "YOUR_ACTUAL_WIFI_NAME";
   const char* WIFI_PASSWORD = "YOUR_ACTUAL_PASSWORD";
   ```

2. **Update Device ID** (must match Supabase registration)

   ```cpp
   const char* DEVICE_ID = "esp32_household_1";
   ```

3. **Update Server URL** (from your Supabase project)

   ```cpp
   const char* SERVER_URL = "https://your-actual-project-id.supabase.co/functions/v1/receive-sensor-data";
   ```

4. **Upload to ESP32**
   - Connect ESP32 via USB
   - Go to **Tools** → **Board** → Select "ESP32 Dev Module"
   - Go to **Tools** → **Port** → Select COM port
   - Click Upload arrow button
   - Wait for upload completion

5. **Verify in Serial Monitor**
   - Click **Tools** → **Serial Monitor**
   - Set baud rate to **115200**
   - You should see:
     ```
     === SmartDar ESP32 Booting ===
     Connecting to WiFi: YOUR_WIFI_NAME
     ✓ WiFi connected!
     IP address: 192.168.x.x
     ```

---

## **Step 5: Test the Dashboard**

1. **Start the dev server**

   ```bash
   npm run dev
   ```

2. **Login to the dashboard**
   - Use your registered account email/password

3. **Check for sensor data**
   - Go to "Overview" tab
   - Should see "Active Devices: 1"
   - Wait 5 minutes for first data point
   - Fill level should appear and update in real-time

4. **Test alerts**
   - Block one ultrasonic sensor to simulate 85%+ fill
   - Alert should appear in Notifications tab within 5 minutes

---

## **Troubleshooting**

### ESP32 Not Connecting to WiFi

- Check WiFi name and password (case-sensitive)
- Ensure ESP32 is within WiFi range
- Try restarting ESP32

### No Data Appearing in Dashboard

- Check ESP32 Serial Monitor for errors
- Verify `device_id` matches in Supabase
- Check that Edge Function is deployed
- Verify Supabase API keys are correct

### Incorrect Distance Readings

- Ensure sensors are pointing directly at surface
- Check for obstacles/interference
- Verify pin connections
- Adjust `max_distance_mm` in code if needed

### HTTP 404 from ESP32

- Verify Edge Function URL is correct
- Check your Supabase project ID
- Ensure Edge Function is deployed

---

## **Next Steps**

1. **Deploy to Vercel**

   ```bash
   git add .
   git commit -m "Add ESP32 integration"
   git push
   ```

2. **Monitor Production**
   - Watch real-time data on deployed dashboard
   - Check alerts are working

3. **Add Additional ESP32s**
   - Register new device in Supabase
   - Upload same firmware with different `DEVICE_ID`

---

## **API Reference**

### POST /functions/v1/receive-sensor-data

**Request:**

```json
{
  "device_id": "esp32_household_1",
  "sensors": [
    {
      "sensor_id": 1,
      "fill_level": 75,
      "distance_mm": 250
    },
    {
      "sensor_id": 2,
      "fill_level": 45,
      "distance_mm": 450
    }
  ]
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Data received and processed",
  "readings_count": 2
}
```

**Response (Error - 404):**

```json
{
  "error": "Device not registered"
}
```

---

## **Support**

For issues or questions:

1. Check Serial Monitor output on ESP32
2. Review the Supabase logs
3. Check browser console for frontend errors
