import { supabase } from "../lib/supabaseClient";

export function subscribeToTable(table, callback) {
  const channel = supabase
    .channel(`report-${table}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
