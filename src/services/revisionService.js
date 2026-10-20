import { supabase } from "../lib/supabaseClient";

const REVISION_TABLES = {
  proposal: "proposals",
  ots_area: "ots_area",
  target_co: "target_co",
};

export async function getRevisionItems(userId) {
  if (!userId) return [];

  const results = await Promise.all(
    Object.entries(REVISION_TABLES).map(async ([entityType, table]) => {
      const { data, error } = await supabase.from(table).select("*").eq("approval_status", "REVISION").eq("created_by", userId).order("updated_at", { ascending: false });

      if (error) {
        throw new Error(`Gagal mengambil data revisi ${entityType}: ${error.message}`);
      }

      return (data ?? []).map((item) => ({
        ...item,
        entityType,
      }));
    }),
  );

  return results.flat().sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
}

export async function resubmitRevision({ entityType, entityId, payload }) {
  if (!entityType || !entityId || !payload) {
    throw new Error("Data revisi tidak lengkap.");
  }

  if (!Object.hasOwn(REVISION_TABLES, entityType)) {
    throw new Error("Jenis data revisi tidak valid.");
  }

  const { data, error } = await supabase.rpc("resubmit_report", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_payload: payload,
  });

  if (error) {
    throw new Error(`Gagal mengirim ulang data revisi: ${error.message}`);
  }

  return data;
}
