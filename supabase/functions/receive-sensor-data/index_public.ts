import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// PUBLIC VERSION - FOR TESTING ONLY
// No authentication required - device_id validation only

serve(async (req) => {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { device_id, sensors: sensorData } = body;

    console.log(
      `[IoT] Device: ${device_id}, Readings: ${sensorData?.length || 0}`,
    );

    if (!device_id || !sensorData || !Array.isArray(sensorData)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", success: false }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate device exists
    const { data: sensor, error: sensorError } = await supabase
      .from("sensors")
      .select("id")
      .eq("device_id", device_id)
      .single();

    if (sensorError || !sensor) {
      return new Response(
        JSON.stringify({ error: "Device not registered", device_id }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insert readings
    const readings = sensorData.map((s: any) => ({
      sensor_id: sensor.id,
      device_id,
      sensor_number: s.sensor_id,
      fill_level: s.fill_level,
      distance_mm: s.distance_mm,
    }));

    const { error: insertError } = await supabase
      .from("sensor_readings")
      .insert(readings);

    if (insertError) throw insertError;

    // Check for alerts
    for (const reading of sensorData) {
      const fillLevel = reading.fill_level;
      let alertType: string | null = null;

      if (fillLevel >= 85) {
        alertType = "critical";
      } else if (fillLevel >= 60) {
        alertType = "warning";
      }

      if (alertType) {
        // Check if alert already exists
        const { data: existing } = await supabase
          .from("alerts")
          .select("id")
          .eq("sensor_id", sensor.id)
          .eq("sensor_number", reading.sensor_id)
          .eq("alert_type", alertType)
          .eq("resolved", false)
          .single();

        if (!existing) {
          const alertMessage =
            alertType === "critical"
              ? `🚨 CRITICAL: Sensor ${reading.sensor_id} at ${fillLevel}% - IMMEDIATE ACTION NEEDED`
              : `⚠️ WARNING: Sensor ${reading.sensor_id} at ${fillLevel}% - Monitor closely`;

          const { error: alertError } = await supabase.from("alerts").insert([
            {
              sensor_id: sensor.id,
              device_id,
              sensor_number: reading.sensor_id,
              alert_type: alertType,
              fill_level_trigger: fillLevel,
              message: alertMessage,
              created_at: new Date().toISOString(),
            },
          ]);

          if (alertError) {
            console.error("Alert creation error:", alertError);
          } else {
            console.log(
              `Alert created: ${alertType} for sensor ${reading.sensor_id}`,
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted: readings.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
