#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION
// ============================================

const char *ssid = "CSY";
const char *password = "Osyxnihx.";
const char *SERVER_URL = "https://qpqmnlqamvkduxomnzvq.supabase.co/functions/v1/receive-sensor-data";
const char *DEVICE_ID = "esp32_household_3";
const char *AUTH_KEY = "sb_publishable_DF23bGNHDoHRn9YBq8uvKA_iib7It1f";

// HC-SR04 Pins — Sensor 1 (Water Tank)
const int TRIG_PIN_1 = 16;
const int ECHO_PIN_1 = 17;

// HC-SR04 Pins — Sensor 2 (Sewage Tank)
// ⚠️ Change these to whatever pins your second sensor is physically wired to
const int TRIG_PIN_2 = 18;
const int ECHO_PIN_2 = 19;

const int MAX_DISTANCE = 2500;

// ============================================
// SETUP
// ============================================

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== SmartDar ESP32 Sensor ===");

    pinMode(TRIG_PIN_1, OUTPUT);
    pinMode(ECHO_PIN_1, INPUT);
    pinMode(TRIG_PIN_2, OUTPUT);
    pinMode(ECHO_PIN_2, INPUT);

    connectToWiFi();

    Serial.println("✓ Ready!");
}

// ============================================
// LOOP (5 SECONDS)
// ============================================

void loop()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("\n========== SENSOR DATA ==========");

        long distance1 = measureDistance(TRIG_PIN_1, ECHO_PIN_1);
        int fill1 = calculateFillLevel(distance1);

        long distance2 = measureDistance(TRIG_PIN_2, ECHO_PIN_2);
        int fill2 = calculateFillLevel(distance2);

        Serial.print("Water Distance: ");
        Serial.print(distance1);
        Serial.print(" mm | Fill: ");
        Serial.print(fill1);
        Serial.println("%");

        Serial.print("Sewage Distance: ");
        Serial.print(distance2);
        Serial.print(" mm | Fill: ");
        Serial.print(fill2);
        Serial.println("%");

        sendData(distance1, fill1, distance2, fill2);
    }
    else
    {
        Serial.println("WiFi lost, reconnecting...");
        connectToWiFi();
    }

    Serial.println("Waiting 5 seconds...");
    delay(5000);
}

// ============================================
// WIFI
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

// ============================================
// ULTRASONIC SENSOR
// ============================================

long measureDistance(int trigPin, int echoPin)
{
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH, 30000);

    if (duration == 0)
    {
        Serial.println("⚠ No echo detected");
        return -1;
    }

    long distance_mm = (duration * 0.343) / 2;
    return distance_mm;
}

// ============================================
// FILL LEVEL
// ============================================

int calculateFillLevel(long distance_mm)
{
    if (distance_mm <= 0)
        return 0;
    if (distance_mm >= MAX_DISTANCE)
        return 0;

    int fill_level = 100 - ((distance_mm * 100) / MAX_DISTANCE);
    return constrain(fill_level, 0, 100);
}

// ============================================
// SEND DATA (BOTH SENSORS)
// ============================================

void sendData(long distance1, int fill1, long distance2, int fill2)
{
    HTTPClient http;

    Serial.println("Sending Data:");

    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", AUTH_KEY);
    http.addHeader("Authorization", String("Bearer ") + AUTH_KEY);

    StaticJsonDocument<512> doc;
    doc["device_id"] = DEVICE_ID;

    JsonArray sensors = doc.createNestedArray("sensors");

    // Sensor 1 — Water Tank
    JsonObject sensor1 = sensors.createNestedObject();
    sensor1["sensor_id"] = 1;
    sensor1["fill_level"] = fill1;
    sensor1["distance_mm"] = distance1;

    // Sensor 2 — Sewage Tank
    JsonObject sensor2 = sensors.createNestedObject();
    sensor2["sensor_id"] = 2;
    sensor2["fill_level"] = fill2;
    sensor2["distance_mm"] = distance2;

    String payload;
    serializeJson(doc, payload);

    Serial.println(payload);

    int httpCode = http.POST(payload);

    Serial.print("HTTP Code: ");
    Serial.println(httpCode);

    String response = http.getString();
    Serial.print("Server Response: ");
    Serial.println(response);

    if (httpCode == 200)
    {
        Serial.println("Upload Success!");
    }
    else
    {
        Serial.println("✗ Upload Failed!");
    }

    http.end();
}
