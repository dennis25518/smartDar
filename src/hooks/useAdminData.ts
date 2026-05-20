import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface AdminStats {
  totalUsers: number;
  activeSensors: number;
  criticalAlerts: number;
  warningAlerts: number;
  openTickets: number;
  resolvedTickets: number;
  avgFillLevel: number;
}

export interface AdminReturn {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
}

export const useAdminData = (): AdminReturn => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          "admin_dashboard_stats",
        );

        if (rpcError) throw rpcError;

        const statsRow = Array.isArray(data) ? data[0] : data;

        setStats({
          totalUsers: Number(statsRow?.total_users || 0),
          activeSensors: Number(statsRow?.active_sensors || 0),
          criticalAlerts: Number(statsRow?.critical_alerts || 0),
          warningAlerts: Number(statsRow?.warning_alerts || 0),
          openTickets: Number(statsRow?.open_tickets || 0),
          resolvedTickets: Number(statsRow?.resolved_tickets || 0),
          avgFillLevel: Number(statsRow?.avg_fill_level || 0),
        });

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchAdminData();

    // Set up real-time subscriptions
    const alertsSubscription = supabase
      .channel("admin_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          fetchAdminData();
        },
      )
      .subscribe();

    const ticketsSubscription = supabase
      .channel("admin_tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          fetchAdminData();
        },
      )
      .subscribe();

    return () => {
      alertsSubscription.unsubscribe();
      ticketsSubscription.unsubscribe();
    };
  }, []);

  return { stats, loading, error };
};
