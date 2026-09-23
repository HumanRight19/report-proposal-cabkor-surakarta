import { useEffect } from "react";

import { supabase } from "../lib/supabaseClient";

function useReportRealtime(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("report-proposal-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
        },
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ots_area",
        },
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "target_co",
        },
        onChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

export default useReportRealtime;
