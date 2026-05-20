import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Function to send WhatsApp message via Twilio
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
): Promise<boolean> {
  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const whatsappFrom = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !whatsappFrom) {
      console.error("Missing Twilio configuration");
      return false;
    }

    // Ensure phone number is in E.164 format with whatsapp: prefix
    const toPhone = phoneNumber.startsWith("whatsapp:")
      ? phoneNumber
      : `whatsapp:${phoneNumber}`;
    const fromPhone = `whatsapp:${whatsappFrom}`;

    // Create Basic Auth header for Twilio
    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromPhone,
          To: toPhone,
          Body: message,
        }).toString(),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Twilio API error:", errorData);
      return false;
    }

    const data = await response.json();
    console.log("WhatsApp message sent successfully. SID:", data.sid);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

serve(async (req) => {
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

    console.log(`Received data from device: ${device_id}`);

    if (!device_id || !sensorData || !Array.isArray(sensorData)) {
      return new Response(JSON.stringify({ error: "Invalid payload format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find sensor by device_id
    const { data: sensorRecord, error: sensorError } = await supabase
      .from("sensors")
      .select("id, user_id")
      .eq("device_id", device_id)
      .single();

    if (sensorError || !sensorRecord) {
      console.error("Sensor not found:", device_id);
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

    const { error: insertError } = await supabase
      .from("sensor_readings")
      .insert(readings);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(
      `Successfully inserted ${readings.length} readings for device ${device_id}`,
    );

    // Check for threshold breaches and create alerts
    for (const reading of sensorData) {
      const fillLevel = reading.fill_level;
      let alertType = null;

      if (fillLevel >= 85) {
        alertType = "critical";
      } else if (fillLevel >= 60) {
        alertType = "warning";
      }

      if (alertType) {
        // Check if there's already an unresolved alert for this sensor
        const { data: existingAlert } = await supabase
          .from("alerts")
          .select("id")
          .eq("sensor_id", sensorRecord.id)
          .eq("sensor_number", reading.sensor_id)
          .eq("alert_type", alertType)
          .eq("resolved", false)
          .single();

        // Only create new alert if one doesn't already exist
        if (!existingAlert) {
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
            console.error("Error creating alert:", alertError);
          } else {
            // Fetch user's phone number for WhatsApp notification
            let phoneNumber: string | null = null;

            // First try to get the sensor owner's phone from users_profile
            const { data: userProfile, error: profileError } = await supabase
              .from("users_profile")
              .select("phone")
              .eq("user_id", sensorRecord.user_id)
              .single();

            if (userProfile?.phone) {
              phoneNumber = userProfile.phone;
            } else if (profileError && profileError.code !== "PGRST116") {
              console.error("Error fetching user profile:", profileError);
            }

            // If user phone not found, try to get admin's phone from admin_profiles_table
            if (!phoneNumber) {
              const { data: adminProfile } = await supabase
                .from("admin_profiles_table")
                .select("phone")
                .not("phone", "is", null)
                .limit(1)
                .single();

              if (adminProfile?.phone) {
                phoneNumber = adminProfile.phone;
              }
            }

            // Send WhatsApp message if phone number is available
            if (phoneNumber) {
              const whatsappMessage =
                alertType === "critical"
                  ? `🚨 CRITICAL ALERT: Device ${device_id}, Sensor ${reading.sensor_id} is now ${fillLevel}% FULL! Please empty the bin immediately.`
                  : `⚠️ WARNING: Device ${device_id}, Sensor ${reading.sensor_id} has reached ${fillLevel}% capacity. Please monitor or empty soon.`;

              const sent = await sendWhatsAppMessage(
                phoneNumber,
                whatsappMessage,
              );

              if (sent) {
                console.log(
                  `WhatsApp alert sent to ${phoneNumber} for sensor ${reading.sensor_id}`,
                );
              } else {
                console.warn(`Failed to send WhatsApp to ${phoneNumber}`);
              }
            } else {
              console.log(
                "No phone number found for user or admin. WhatsApp alert not sent.",
              );
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data received and processed",
        readings_count: sensorData.length,
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
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
