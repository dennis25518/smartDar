import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface UserWithSensors {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  status: string;
  created_at: string;
  sensor_count?: number;
  active_alerts?: number;
}

export interface UseAdminUsersReturn {
  users: UserWithSensors[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminUsers = (): UseAdminUsersReturn => {
  const [users, setUsers] = useState<UserWithSensors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: rpcError } = await supabase.rpc(
        "admin_get_users_with_data",
      );

      if (rpcError) throw rpcError;

      setUsers((usersData as UserWithSensors[]) || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};
