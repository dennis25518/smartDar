import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface SensorReading {
  id: string;
  sensor_id: string;
  device_id: string;
  sensor_number: number;
  fill_level: number;
  distance_mm: number | null;
  created_at: string;
}

export interface Alert {
  id: string;
  sensor_id: string;
  device_id: string;
  sensor_number: number;
  alert_type: "critical" | "warning" | "info";
  fill_level_trigger: number;
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface Sensor {
  id: string;
  device_id: string;
  location_name: string;
  sensor_count: number;
  status: string;
  created_at: string;
}

interface UseSensorDataReturn {
  sensors: Sensor[];
  latestReadings: Map<string, SensorReading>;
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

export const useSensorData = (): UseSensorDataReturn => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [latestReadings, setLatestReadings] = useState<
    Map<string, SensorReading>
  >(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Fetch sensors
        const { data: sensorsData, error: sensorsError } = await supabase
          .from("sensors")
          .select("*")
          .eq("user_id", user.id);

        if (sensorsError) throw sensorsError;
        setSensors(sensorsData || []);

        // Fetch latest readings
        if (sensorsData && sensorsData.length > 0) {
          const sensorIds = sensorsData.map((s) => s.id);

          const { data: readingsData, error: readingsError } = await supabase
            .from("sensor_readings")
            .select("*")
            .in("sensor_id", sensorIds)
            .order("created_at", { ascending: false })
            .limit(100);

          if (readingsError) throw readingsError;

          // Keep only latest reading per sensor_id + sensor_number combo
          const latestMap = new Map<string, SensorReading>();
          readingsData?.forEach((reading: SensorReading) => {
            const key = `${reading.sensor_id}-${reading.sensor_number}`;
            if (!latestMap.has(key)) {
              latestMap.set(key, reading);
            }
          });
          setLatestReadings(latestMap);

          // Fetch alerts
          const { data: alertsData, error: alertsError } = await supabase
            .from("alerts")
            .select("*")
            .in("sensor_id", sensorIds)
            .eq("resolved", false)
            .order("created_at", { ascending: false });

          if (alertsError) throw alertsError;
          setAlerts(alertsData || []);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to real-time updates for sensor_readings
    const readingsSubscription = supabase
      .channel("sensor_readings_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
        },
        (payload) => {
          const newReading = payload.new as SensorReading;
          setLatestReadings((prev) => {
            const updated = new Map(prev);
            const key = `${newReading.sensor_id}-${newReading.sensor_number}`;
            updated.set(key, newReading);
            return updated;
          });
        },
      )
      .subscribe();

    // Subscribe to real-time updates for alerts
    const alertsSubscription = supabase
      .channel("alerts_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts((prev) => [newAlert, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          const updatedAlert = payload.new as Alert;
          setAlerts((prev) =>
            prev.map((alert) =>
              alert.id === updatedAlert.id ? updatedAlert : alert,
            ),
          );
        },
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      readingsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, []);

  return { sensors, latestReadings, alerts, loading, error };
};
