#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// SIMPLE CONFIGURATION - NO AUTH NEEDED
// ============================================

const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";
const char *SERVER_URL = "https://qpqmnlqamvkduxomnzvq.supabase.co/functions/v1/receive-sensor-data";
const char *DEVICE_ID = "esp32_household_1";

// HC-SR04 Pins
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int MAX_DISTANCE = 2500;

// ============================================
// SETUP
// ============================================

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== SmartDar ESP32 Sensor ===");

    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);

    connectToWiFi();

    Serial.println("✓ Ready!");
}

// ============================================
// LOOP - Measure every 5 minutes
// ============================================

void loop()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("\n=== Taking measurement ===");

        long distance = measureDistance();
        int fill_level = calculateFillLevel(distance);

        Serial.print("Distance: ");
        Serial.print(distance);
        Serial.print(" mm → Fill: ");
        Serial.print(fill_level);
        Serial.println("%");

        sendData(distance, fill_level);
    }
    else
    {
        Serial.println("WiFi lost, reconnecting...");
        connectToWiFi();
    }

    Serial.println("Waiting 5 minutes...");
    delay(300000); // 5 minutes
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
        Serial.println("\n✓ Connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.println("\n✗ Connection failed!");
    }
}

long measureDistance()
{
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    long distance_mm = duration * 0.171;

    return distance_mm;
}

int calculateFillLevel(long distance_mm)
{
    if (distance_mm <= 0)
        return 100;
    if (distance_mm >= MAX_DISTANCE)
        return 0;

    int fill_level = 100 - ((distance_mm * 100) / MAX_DISTANCE);
    return constrain(fill_level, 0, 100);
}

void sendData(long distance, int fill_level)
{
    HTTPClient http;

    Serial.println("Sending data...");

    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;

    JsonArray sensors = doc.createNestedArray("sensors");
    JsonObject sensor = sensors.createNestedObject();
    sensor["sensor_id"] = 2;
    sensor["fill_level"] = fill_level;
    sensor["distance_mm"] = distance;

    String payload;
    serializeJson(doc, payload);

    Serial.print("Payload: ");
    Serial.println(payload);

    int httpCode = http.POST(payload);

    Serial.print("HTTP Code: ");
    Serial.println(httpCode);

    if (httpCode > 0)
    {
        String response = http.getString();
        Serial.print("Response: ");
        Serial.println(response);

        if (httpCode == 200)
        {
            Serial.println("✓ Success!");
        }
        else
        {
            Serial.println("✗ Error!");
        }
    }
    else
    {
        Serial.print("✗ Failed: ");
        Serial.println(http.errorToString(httpCode));
    }

    http.end();
}
