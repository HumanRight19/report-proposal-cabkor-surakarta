import { supabase } from "../lib/supabaseClient";

export async function getSupervisorOverview() {
  const [proposalsResult, otsResult, targetResult] = await Promise.all([
    supabase.from("proposals").select("*").order("created_at", { ascending: false }),
    supabase.from("ots_area").select("*").order("created_at", { ascending: false }),
    supabase.from("target_co").select("*").order("created_at", { ascending: false }),
  ]);

  if (proposalsResult.error) {
    throw new Error(`Gagal mengambil Proposal: ${proposalsResult.error.message}`);
  }

  if (otsResult.error) {
    throw new Error(`Gagal mengambil OTS Area: ${otsResult.error.message}`);
  }

  if (targetResult.error) {
    throw new Error(`Gagal mengambil Target CO: ${targetResult.error.message}`);
  }

  return {
    proposals: proposalsResult.data ?? [],
    otsArea: otsResult.data ?? [],
    targetCo: targetResult.data ?? [],
  };
}

export async function reviewReport({ entityType, entityId, action, note = null }) {
  const { data, error } = await supabase.rpc("review_report", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_action: action,
    p_note: note || null,
  });

  if (error) {
    throw new Error(`Gagal memproses approval: ${error.message}`);
  }

  return data;
}
