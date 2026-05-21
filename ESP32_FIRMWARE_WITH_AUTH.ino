#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION - UPDATE THESE WITH YOUR INFO
// ============================================

// WiFi Configuration
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";

// Supabase Configuration
const char *SUPABASE_URL = "https://qpqmnlqamvkduxomnzvq.supabase.co";
const char *SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE"; // ← GET THIS FROM SUPABASE
const char *SERVER_URL = "https://qpqmnlqamvkduxomnzvq.supabase.co/functions/v1/receive-sensor-data";

// Device Configuration
const char *DEVICE_ID = "esp32_household_1"; // Change this to match your device

// HC-SR04 Sensor Pins
const int TRIG_PIN = 5;        // GPIO5
const int ECHO_PIN = 18;       // GPIO18
const int MAX_DISTANCE = 2500; // 2.5 meters in mm

// ============================================
// SETUP
// ============================================

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n\n=== SmartDar ESP32 Waste Monitor ===");
    Serial.println("Initializing...");

    // Setup HC-SR04 pins
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);

    // Connect to WiFi
    connectToWiFi();

    // Set up timer for measurements
    Serial.println("✓ Setup complete!");
}

// ============================================
// MAIN LOOP
// ============================================

void loop()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        takeAndSendMeasurement();
    }
    else
    {
        Serial.println("✗ WiFi disconnected, reconnecting...");
        connectToWiFi();
    }

    // Wait 5 minutes (300 seconds) before next reading
    delay(300000);
}

// ============================================
// FUNCTIONS
// ============================================

void connectToWiFi()
{
    Serial.print("Connecting to WiFi: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20)
    {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("\n✓ WiFi connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.println("\n✗ Failed to connect to WiFi!");
    }
}

long measureDistance()
{
    // Clear the trigger pin
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);

    // Set the trigger pin high for 10 microseconds
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // Read the echo time
    long duration = pulseIn(ECHO_PIN, HIGH, 30000); // Timeout after 30ms

    // Calculate distance: speed of sound = 343 m/s = 0.343 mm/microsecond
    // distance = (duration / 2) * 0.343
    long distance_mm = duration * 0.171;

    return distance_mm;
}

int calculateFillLevel(long distance_mm)
{
    // Assuming: 0mm = full (100%), MAX_DISTANCE = empty (0%)
    if (distance_mm <= 0)
        return 100; // Safety: if sensor reads 0, consider it full
    if (distance_mm >= MAX_DISTANCE)
        return 0; // If distance > max, it's empty

    int fill_level = 100 - ((distance_mm * 100) / MAX_DISTANCE);
    return constrain(fill_level, 0, 100);
}

void takeAndSendMeasurement()
{
    Serial.println("\n=== Taking measurements ===");

    // Take measurement
    long distance = measureDistance();
    int fill_level = calculateFillLevel(distance);

    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.print(" mm → Fill: ");
    Serial.print(fill_level);
    Serial.println("%");

    // Prepare payload
    String payload = createPayload(distance, fill_level);
    Serial.print("Payload: ");
    Serial.println(payload);

    // Send to Supabase
    sendToSupabase(payload);
}

String createPayload(long distance, int fill_level)
{
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;

    JsonArray sensors = doc.createNestedArray("sensors");
    JsonObject sensor = sensors.createNestedObject();
    sensor["sensor_id"] = 2;
    sensor["fill_level"] = fill_level;
    sensor["distance_mm"] = distance;

    String output;
    serializeJson(doc, output);
    return output;
}

void sendToSupabase(String payload)
{
    HTTPClient http;

    Serial.println("Sending POST request to Supabase...");

    http.begin(SERVER_URL);

    // Add headers
    http.addHeader("Content-Type", "application/json");
    // Note: Function uses service role key internally, no auth header needed from device

    // Send POST request
    int httpCode = http.POST(payload);

    // Handle response
    if (httpCode > 0)
    {
        String response = http.getString();
        Serial.print("HTTP Code: ");
        Serial.println(httpCode);
        Serial.print("Response: ");
        Serial.println(response);

        if (httpCode == 200)
        {
            Serial.println("✓ Data sent successfully!");
        }
        else
        {
            Serial.println("✗ Server returned error!");
        }
    }
    else
    {
        Serial.print("✗ Connection failed, error: ");
        Serial.println(http.errorToString(httpCode));
    }

    http.end();
}
