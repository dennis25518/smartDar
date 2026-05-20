import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface SensorLocation {
  id: string;
  device_id: string;
  location_name: string;
  user_id: string;
  fill_level: number;
  status: string;
  sensor_number?: number;
  lat?: number;
  lng?: number;
  lastUpdate?: string;
}

export interface UseAdminSensorsReturn {
  sensors: SensorLocation[];
  loading: boolean;
  error: string | null;
}

export const useAdminSensors = (): UseAdminSensorsReturn => {
  const [sensors, setSensors] = useState<SensorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const { data: sensorsData, error: rpcError } = await supabase.rpc(
          "admin_get_sensor_summaries",
        );

        if (rpcError) throw rpcError;

        const sensorsWithReadings = (sensorsData || []).map((sensor: any) => ({
          id: sensor.id,
          device_id: sensor.device_id,
          location_name: sensor.location_name,
          user_id: sensor.user_id,
          fill_level: sensor.fill_level || 0,
          status: sensor.status,
          sensor_number: sensor.sensor_number,
          lastUpdate: sensor.last_update,
        }));

        setSensors(sensorsWithReadings);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchSensors();
  }, []);

  return { sensors, loading, error };
};
