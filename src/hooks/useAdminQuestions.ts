import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  response_message: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface UseAdminQuestionsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  updateTicket: (
    ticketId: string,
    updates: Partial<SupportTicket>,
  ) => Promise<boolean>;
}

export const useAdminQuestions = (): UseAdminQuestionsReturn => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription
    const subscription = supabase
      .channel("admin_support_tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTickets((prev) => [payload.new as SupportTicket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as SupportTicket).id
                  ? (payload.new as SupportTicket)
                  : t,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) =>
              prev.filter((t) => t.id !== (payload.old as SupportTicket).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "admin_get_support_tickets",
      );

      if (rpcError) throw rpcError;

      setTickets((data as SupportTicket[]) || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const updateTicket = async (
    ticketId: string,
    updates: Partial<SupportTicket>,
  ): Promise<boolean> => {
    try {
      const { data, error: updateError } = await supabase.rpc(
        "admin_update_support_ticket",
        {
          p_ticket_id: ticketId,
          p_updates: updates,
        },
      );

      if (updateError) throw updateError;

      if (Array.isArray(data) && data.length > 0) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === data[0].id ? (data[0] as SupportTicket) : t,
          ),
        );
      }

      return true;
    } catch (err) {
      console.error("Error updating ticket:", err);
      return false;
    }
  };

  return { tickets, loading, error, updateTicket };
};
