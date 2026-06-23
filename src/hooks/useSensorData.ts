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
    let currentUserId: string | null = null;
    let sensorIds: string[] = [];
    let cleanupRealtimeSubscriptions: (() => void) | undefined;

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

        currentUserId = user.id;

        // Fetch sensors
        const { data: sensorsData, error: sensorsError } = await supabase
          .from("sensors")
          .select("*")
          .eq("user_id", user.id);

        if (sensorsError) throw sensorsError;
        setSensors(sensorsData || []);
        sensorIds = (sensorsData || []).map((s) => String(s.id));

        // Fetch latest readings
        if (sensorsData && sensorsData.length > 0) {
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

        // Setup real-time subscriptions after data is loaded
        cleanupRealtimeSubscriptions = setupRealtimeSubscriptions(
          currentUserId,
          sensorIds,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    const setupRealtimeSubscriptions = (
      userId: string,
      sIds: string[],
    ): (() => void) | undefined => {
      if (sIds.length === 0) return;

      // Create readings subscription with a unique channel name to avoid reusing
      // a previously subscribed channel and adding callbacks after subscribe.
      const readingsChannelName = `sensor_readings_${userId}_${Date.now()}`;
      const readingsSubscription = supabase
        .channel(readingsChannelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "sensor_readings",
          },
          (payload) => {
            const newReading = payload.new as SensorReading;
            if (sIds.includes(String(newReading.sensor_id))) {
              console.log("📊 New sensor reading:", newReading);
              setLatestReadings((prev) => {
                const updated = new Map(prev);
                const key = `${newReading.sensor_id}-${newReading.sensor_number}`;
                updated.set(key, newReading);
                return updated;
              });
            }
          },
        )
        .subscribe((status) => {
          console.log("Readings subscription status:", status);
        });

      // Create alerts subscription with all listeners chained before subscribe
      const alertsChannelName = `alerts_${userId}_${Date.now()}`;
      const alertsSubscription = supabase
        .channel(alertsChannelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alerts",
          },
          (payload) => {
            const newAlert = payload.new as Alert;
            if (sIds.includes(String(newAlert.sensor_id))) {
              console.log("🚨 New alert:", newAlert);
              if (!newAlert.resolved) {
                setAlerts((prev) => [newAlert, ...prev]);
              }
            }
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
            if (sIds.includes(String(updatedAlert.sensor_id))) {
              console.log("📝 Alert updated:", updatedAlert);
              setAlerts((prev) => {
                if (updatedAlert.resolved) {
                  return prev.filter((alert) => alert.id !== updatedAlert.id);
                }
                return prev.map((alert) =>
                  alert.id === updatedAlert.id ? updatedAlert : alert,
                );
              });
            }
          },
        )
        .subscribe((status) => {
          console.log("Alerts subscription status:", status);
        });

      // Return cleanup function
      return () => {
        readingsSubscription.unsubscribe();
        alertsSubscription.unsubscribe();
      };
    };

    fetchInitialData();

    // Return cleanup function from useEffect
    return () => {
      if (cleanupRealtimeSubscriptions) {
        cleanupRealtimeSubscriptions();
      }
    };
  }, []);

  return { sensors, latestReadings, alerts, loading, error };
};
