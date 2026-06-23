import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Device Name Mappings
const DEVICE_NAMES: Record<string, string> = {
  esp32_household_1: "KariaKoo Residency",
  // Add more device mappings here as needed
};

// Sensor Component Mappings
const SENSOR_NAMES: Record<number, string> = {
  1: "Waste Bin",
  2: "Septic Tank",
  // Add more sensor mappings here as needed
};

// Email Rate Limiting (in milliseconds) - 2 minutes for testing
const EMAIL_RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutes

// Helper function to get device readable name
function getDeviceName(deviceId: string): string {
  return DEVICE_NAMES[deviceId] || deviceId;
}

// Helper function to get sensor readable name
function getSensorName(sensorId: number): string {
  return SENSOR_NAMES[sensorId] || `Sensor ${sensorId}`;
}

function normalizeEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(normalized) ? normalized : null;
}

async function sendResendEmail(
  recipientEmail: string,
  subject: string,
  body: string,
): Promise<boolean> {
  try {
    console.log(`[EMAIL] Starting email send to: ${recipientEmail}`);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error(
        "[EMAIL] CRITICAL: Missing Resend API key - email not sent",
      );
      return false;
    }

    console.log("[EMAIL] API key found, proceeding with send");

    // Using Resend sandbox testing domain for free tier
    const fromEmail = "SmartDar Alerts <onboarding@resend.dev>";

    const emailPayload = {
      from: fromEmail,
      to: recipientEmail,
      subject,
      html: body,
    };

    console.log("[EMAIL] Payload prepared:", JSON.stringify(emailPayload));

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    console.log(`[EMAIL] Resend API response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "[EMAIL] Resend API error response:",
        JSON.stringify(errorData),
      );
      console.error(`[EMAIL] Failed to send to ${recipientEmail}`);
      return false;
    }

    const data = await response.json();
    console.log(
      `[EMAIL] SUCCESS - Email sent. Response:`,
      JSON.stringify(data),
    );
    return true;
  } catch (error) {
    console.error("[EMAIL] Exception caught:", error);
    return false;
  }
}

serve(async (req) => {
  console.log(
    `[receive-sensor-data] ${req.method} request received at ${new Date().toISOString()}`,
  );
  console.log(`[receive-sensor-data] Headers:`, req.headers);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Initialize Supabase client with service role (no auth needed for IoT)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Parse request body
    const body = await req.json();
    const { device_id, sensors: sensorData } = body;

    console.log(`[REQUEST] Received data from device: ${device_id}`);
    console.log(`[REQUEST] Sensor data received:`, JSON.stringify(sensorData));

    if (!device_id || !sensorData || !Array.isArray(sensorData)) {
      console.error(
        `[REQUEST] Invalid payload - device_id: ${device_id}, sensorData is array: ${Array.isArray(sensorData)}`,
      );
      return new Response(JSON.stringify({ error: "Invalid payload format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find sensor by device_id
    const { data: sensorRecord, error: sensorError } = await supabase
      .from("sensors")
      .select("id, user_id, location_name")
      .eq("device_id", device_id)
      .maybeSingle();

    console.log(
      `[SENSOR] Query error: ${sensorError ? JSON.stringify(sensorError) : "NONE"}`,
    );
    console.log(
      `[SENSOR] Sensor found: ${sensorRecord ? "YES" : "NO"}${sensorRecord ? `, ID: ${sensorRecord.id}, User ID: ${sensorRecord.user_id}` : ""}`,
    );

    if (sensorError || !sensorRecord) {
      console.error("[SENSOR] Sensor not found for device:", device_id);
      return new Response(
        JSON.stringify({ error: "Device not registered", device_id }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insert sensor readings
    const readings = sensorData.map((reading: any) => ({
      sensor_id: sensorRecord.id,
      device_id,
      sensor_number: reading.sensor_id,
      fill_level: reading.fill_level,
      distance_mm: reading.distance_mm || null,
      created_at: new Date().toISOString(),
    }));

    console.log(
      `[READINGS] Preparing to insert ${readings.length} readings:`,
      JSON.stringify(readings),
    );

    const { error: insertError } = await supabase
      .from("sensor_readings")
      .insert(readings);

    if (insertError) {
      console.error("[READINGS] Insert error:", insertError);
      throw insertError;
    }

    console.log(
      `[READINGS] Successfully inserted ${readings.length} readings for device ${device_id}`,
    );

    // Check for threshold breaches and create alerts
    for (const reading of sensorData) {
      const fillLevel = reading.fill_level;
      let alertType = null;

      console.log(
        `[ALERT] Processing sensor ${reading.sensor_id} with fill level: ${fillLevel}%`,
      );

      if (fillLevel >= 85) {
        alertType = "critical";
      } else if (fillLevel >= 60) {
        alertType = "warning";
      }

      if (alertType) {
        console.log(`[ALERT] Alert type triggered: ${alertType}`);

        // Check if there's already an unresolved alert for this sensor
        const { data: existingAlert, error: existingAlertError } =
          await supabase
            .from("alerts")
            .select("id")
            .eq("sensor_id", sensorRecord.id)
            .eq("sensor_number", reading.sensor_id)
            .eq("alert_type", alertType)
            .eq("resolved", false)
            .maybeSingle();

        console.log(
          `[ALERT] Existing alert check - Error: ${existingAlertError ? "YES" : "NO"}, Alert found: ${existingAlert ? "YES" : "NO"}`
        );

        // Check rate limiting - query the last alert BEFORE inserting the new one,
        // so we don't accidentally check against the alert we are about to insert.
        const { data: lastAlert, error: lastAlertError } = await supabase
          .from("alerts")
          .select("created_at")
          .eq("sensor_id", sensorRecord.id)
          .eq("sensor_number", reading.sensor_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log(
          `[ALERT] Last alert query - Error: ${lastAlertError ? "YES" : "NO"}, Found: ${lastAlert ? lastAlert.created_at : "NONE"}`
        );

        // Create a new alert record only when no unresolved alert exists, but always send notification
        if (!existingAlert) {
          console.log(
            `[ALERT] No existing unresolved alert found, creating new one`
          );

          const message =
            alertType === "critical"
              ? `Sensor ${reading.sensor_id}: Critical level reached (${fillLevel}%)`
              : `Sensor ${reading.sensor_id}: Warning level reached (${fillLevel}%)`;

          const { error: alertError } = await supabase.from("alerts").insert([
            {
              sensor_id: sensorRecord.id,
              device_id,
              sensor_number: reading.sensor_id,
              alert_type: alertType,
              fill_level_trigger: fillLevel,
              message,
              created_at: new Date().toISOString(),
            },
          ]);

          if (alertError) {
            console.error(
              "[ALERT] Error creating alert in database:",
              alertError,
            );
          } else {
            console.log(`[ALERT] Alert created successfully in database`);
          }
        } else {
          console.log(
            `[ALERT] Existing unresolved alert found, skipping duplicate alert insert`,
          );
        }

        // Fetch user's email for notification and send on every threshold hit
        let recipientEmail: string | null = null;

        console.log(
          `[EMAIL] Looking up email for user_id: ${sensorRecord.user_id}`,
        );

        // First try to get the sensor owner's email from users_profile
        const { data: userProfile, error: userProfileError } = await supabase
          .from("users_profile")
          .select("email")
          .eq("user_id", sensorRecord.user_id)
          .maybeSingle();

        console.log(
          `[EMAIL] User profile query - Error: ${userProfileError ? JSON.stringify(userProfileError) : "NONE"}`,
        );
        console.log(
          `[EMAIL] User profile found: ${userProfile ? "YES" : "NO"}${userProfile?.email ? `, Email: ${userProfile.email}` : ""}`,
        );

        if (userProfile?.email) {
          recipientEmail = normalizeEmail(userProfile.email);
          console.log(`[EMAIL] Normalized user email: ${recipientEmail}`);
        }

        // If user email not found, try to get admin's email from admin_profiles_table
        if (!recipientEmail) {
          console.log(
            `[EMAIL] User email not found, checking admin_profiles_table`,
          );

          const { data: adminProfile, error: adminProfileError } =
            await supabase
              .from("admin_profiles_table")
              .select("email")
              .not("email", "is", null)
              .limit(1)
              .maybeSingle();

          console.log(
            `[EMAIL] Admin profile query - Error: ${adminProfileError ? JSON.stringify(adminProfileError) : "NONE"}`,
          );
          console.log(
            `[EMAIL] Admin profile found: ${adminProfile ? "YES" : "NO"}${adminProfile?.email ? `, Email: ${adminProfile.email}` : ""}`,
          );

          if (adminProfile?.email) {
            recipientEmail = normalizeEmail(adminProfile.email);
            console.log(`[EMAIL] Normalized admin email: ${recipientEmail}`);
          }
        }

        if (recipientEmail) {
          console.log(`[EMAIL] Proceeding to send email to: ${recipientEmail}`);

          const now = new Date();
          let shouldSendEmail = true;

          if (lastAlert && lastAlert.created_at) {
            const lastAlertTime = new Date(lastAlert.created_at).getTime();
            const timeSinceLastAlert = now.getTime() - lastAlertTime;

            console.log(
              `[EMAIL] Rate limit check - Last alert: ${lastAlert.created_at}, Time since: ${timeSinceLastAlert}ms, Rate limit: ${EMAIL_RATE_LIMIT_MS}ms`,
            );

            if (timeSinceLastAlert < EMAIL_RATE_LIMIT_MS) {
              shouldSendEmail = false;
              console.log(
                `[EMAIL] Rate limit active - Email skipped. Next email can be sent in ${Math.ceil((EMAIL_RATE_LIMIT_MS - timeSinceLastAlert) / 1000)} seconds`,
              );
            }
          }

          if (shouldSendEmail) {
            const deviceName = getDeviceName(device_id);
            const sensorName = getSensorName(reading.sensor_id);
            const locationName =
              sensorRecord.location_name || "Main Residential Unit (Zone 1)";

            const subject = `IoT Monitoring Network | Automated Status Alert - ${sensorName} at ${fillLevel}%`;

            const messageBody = `<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px;">
                    <h2 style="color: #2c3e50; border-bottom: 3px solid #27ae60; padding-bottom: 10px; margin-bottom: 20px;">IoT Monitoring Network | Automated Status Alert</h2>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">Please be advised that the <strong>${sensorName}</strong> on device <strong>${device_id}</strong> has reached <strong>${fillLevel}% capacity</strong>.</p>
                    
                    <h3 style="color: #2c3e50; margin-top: 25px; margin-bottom: 12px; border-left: 4px solid #27ae60; padding-left: 12px;">System Diagnostics:</h3>
                    <ul style="background-color: #ecf0f1; padding: 15px 15px 15px 30px; border-left: 4px solid #27ae60; margin: 0;">
                      <li style="margin-bottom: 8px;"><strong>Asset Name:</strong> ${sensorName}</li>
                      <li style="margin-bottom: 8px;"><strong>Hardware ID:</strong> ${device_id}</li>
                      <li style="margin-bottom: 8px;"><strong>Current Capacity:</strong> ${fillLevel}%</li>
                      <li><strong>Location:</strong> ${locationName}</li>
                    </ul>
                    
                    <h3 style="color: #2c3e50; margin-top: 25px; margin-bottom: 12px; border-left: 4px solid #27ae60; padding-left: 12px;">Required Action Items:</h3>
                    <ol style="padding-left: 20px;">
                      <li style="margin-bottom: 12px;"><strong>Schedule Maintenance:</strong> Coordinate a service technician to schedule an emptying appointment within the next 48 hours.</li>
                      <li><strong>Monitor Telemetry:</strong> Observe hourly data spikes to ensure fill rates do not experience sudden acceleration.</li>
                    </ol>
                    
                    <hr style="border: none; border-top: 2px solid #ecf0f1; margin: 30px 0;">
                    <p style="font-size: 12px; color: #7f8c8d; font-style: italic;"><strong>Confidentiality Notice:</strong> This automated operational report is intended solely for system administrators. Please do not reply directly to this message.</p>
                  </div>`;

            const sent = await sendResendEmail(
              recipientEmail,
              subject,
              messageBody,
            );

            if (sent) {
              console.log(
                `[EMAIL] Email successfully sent to ${recipientEmail} for sensor ${reading.sensor_id}`,
              );
            } else {
              console.warn(`[EMAIL] Failed to send email to ${recipientEmail}`);
            }
          } else {
            console.log(
              `[EMAIL] Email rate limit in effect - notification skipped for sensor ${reading.sensor_id}`,
            );
          }
        } else {
          console.log(
            "[EMAIL] No email address found for user or admin. Notification not sent.",
          );
        }
      } else {
        // Automatically resolve existing alerts if the level is back to optimal (< 60%)
        console.log(
          `[ALERT] Fill level is safe (${fillLevel}%). Resolving open alerts for sensor ${reading.sensor_id}`,
        );
        const { data: resolvedAlerts, error: resolveError } = await supabase
          .from("alerts")
          .update({
            resolved: true,
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("sensor_id", sensorRecord.id)
          .eq("sensor_number", reading.sensor_id)
          .eq("resolved", false)
          .select();

        if (resolveError) {
          console.error(
            "[ALERT] Error resolving alerts in database:",
            resolveError,
          );
        } else if (resolvedAlerts && resolvedAlerts.length > 0) {
          console.log(
            `[ALERT] Automatically resolved ${resolvedAlerts.length} alerts in database`,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data received and processed",
        readings_count: readings.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
