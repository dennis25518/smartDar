import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

          await supabase.from("alerts").insert([
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
