import { supabase } from "../lib/supabaseClient";

async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Gagal mengambil user aktif: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Session user tidak ditemukan.");
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, username, role, unit").eq("id", user.id).maybeSingle();

  if (profileError) {
    throw new Error(`Gagal mengambil profile: ${profileError.message}`);
  }

  if (!profile) {
    throw new Error("Profile user tidak ditemukan.");
  }

  return profile;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Gagal mengambil user aktif: ${error.message}`);
  }

  if (!user) {
    throw new Error("Session user tidak ditemukan.");
  }

  return user.id;
}

async function ensureSalesProfile() {
  const profile = await getCurrentProfile();

  if (profile.role !== "SALES") {
    throw new Error("Aksi ini hanya dapat dilakukan oleh Sales.");
  }

  if (!profile.unit) {
    throw new Error("Unit Sales belum dikonfigurasi.");
  }

  return profile;
}

/**
 * Hapus laporan milik Sales yang masih menunggu persetujuan.
 * Memeriksa hasil DELETE agar kegagalan akibat RLS tidak dianggap berhasil.
 */
async function deleteSalesReport(table, entityLabel, id) {
  if (!id) {
    throw new Error("ID laporan tidak valid.");
  }

  const profile = await ensureSalesProfile();

  const { data, error } = await supabase.from(table).delete().eq("id", id).eq("created_by", profile.id).eq("unit", profile.unit).eq("approval_status", "PENDING_APPROVAL").select("id").maybeSingle();

  if (error) {
    throw new Error(`Gagal menghapus ${entityLabel}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Data ${entityLabel} tidak terhapus. Pastikan data masih berstatus PENDING_APPROVAL, merupakan milik akun ini, dan policy DELETE Supabase mengizinkan penghapusan.`);
  }

  return data;
}

/**
 * =========================
 * PROPOSAL
 * =========================
 */

export async function getProposals() {
  const profile = await getCurrentProfile();

  let query = supabase.from("proposals").select("*").is("cancelled_at", null).order("created_at", {
    ascending: false,
  });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil data proposal: ${error.message}`);
  }

  return data ?? [];
}

export async function createProposal(payload) {
  const profile = await ensureSalesProfile();

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      unit: profile.unit,
      cadeb: payload.cadeb,
      nama_so: payload.namaSo?.trim() || null,
      plafond: Number(payload.plafond) || 0,
      fresh_money: Number(payload.freshMoney) || 0,
      produk: payload.produk || null,
      posisi: payload.posisi || null,
      created_by: userId,
      approval_status: "PENDING_APPROVAL",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan proposal: ${error.message}`);
  }

  return data;
}

/**
 * Memperbarui Proposal milik Sales yang masih PENDING_APPROVAL.
 *
 * Status persetujuan tidak diubah oleh fungsi ini.
 * Pembatasan kepemilikan, unit, dan status juga diterapkan oleh RLS.
 */
export async function updatePendingProposal(proposalId, payload) {
  if (!proposalId) {
    throw new Error("ID Proposal tidak ditemukan.");
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("unit").eq("id", userId).single();

  if (profileError || !profile?.unit) {
    throw new Error("Unit pengguna tidak ditemukan.");
  }

  const updates = {
    cadeb: payload.cadeb,
    nama_so: payload.namaSo?.trim() || null,
    plafond: payload.plafond,
    fresh_money: payload.freshMoney,
    produk: payload.produk,
    posisi: payload.posisi,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("proposals").update(updates).eq("id", proposalId).eq("created_by", userId).eq("unit", profile.unit).eq("approval_status", "PENDING_APPROVAL").select().maybeSingle();

  if (error) {
    throw new Error(`Gagal memperbarui Proposal: ${error.message}`);
  }

  if (!data) {
    throw new Error("Proposal tidak dapat diedit. Periksa kepemilikan, unit, atau status Proposal.");
  }

  return data;
}

export async function deleteProposal(id) {
  const { data, error } = await supabase.rpc("delete_report", {
    p_entity_type: "proposal",
    p_entity_id: id,
  });

  if (error) {
    throw new Error(`Gagal menghapus Proposal: ${error.message}`);
  }

  return data;
}

/**
 * =========================
 * OTS AREA
 * =========================
 */

export async function getOtsArea() {
  const profile = await getCurrentProfile();

  let query = supabase.from("ots_area").select("*").is("cancelled_at", null).order("created_at", {
    ascending: false,
  });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil data OTS Area: ${error.message}`);
  }

  return data ?? [];
}

export async function createOtsArea(payload) {
  const profile = await ensureSalesProfile();

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("ots_area")
    .insert({
      unit: profile.unit,
      cadeb: payload.cadeb,
      usaha: payload.usaha || null,
      plafond: Number(payload.plafond) || 0,
      kelengkapan: payload.kelengkapan || null,
      kekurangan: payload.kekurangan || null,
      nama_so: payload.namaSo || null,
      created_by: userId,
      approval_status: "PENDING_APPROVAL",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan OTS Area: ${error.message}`);
  }

  return data;
}

/**
 * Memperbarui OTS Area milik Sales yang masih PENDING_APPROVAL.
 * Status approval tidak diubah oleh fungsi ini.
 */
export async function updatePendingOtsArea(otsAreaId, payload) {
  if (!otsAreaId) {
    throw new Error("ID OTS Area tidak ditemukan.");
  }

  const profile = await ensureSalesProfile();

  const updates = {
    cadeb: payload.cadeb.trim(),
    usaha: payload.usaha.trim(),
    plafond: Number(payload.plafond),
    kelengkapan: payload.kelengkapan,
    kekurangan: payload.kelengkapan === "Belum Lengkap" ? payload.kekurangan.trim() : null,
    nama_so: payload.namaSo.trim(),
    updated_at: new Date().toISOString(),
  };

  if (!Number.isFinite(updates.plafond) || updates.plafond <= 0) {
    throw new Error("Plafond harus lebih dari Rp0.");
  }

  const { data, error } = await supabase.from("ots_area").update(updates).eq("id", otsAreaId).eq("created_by", profile.id).eq("unit", profile.unit).eq("approval_status", "PENDING_APPROVAL").select().maybeSingle();

  if (error) {
    throw new Error(`Gagal memperbarui OTS Area: ${error.message}`);
  }

  if (!data) {
    throw new Error("OTS Area tidak dapat diedit. Pastikan data masih PENDING_APPROVAL, merupakan milik akun ini, dan policy RLS mengizinkan perubahan.");
  }

  return data;
}

export async function deleteOtsArea(id) {
  return deleteSalesReport("ots_area", "OTS Area", id);
}

/**
 * =========================
 * TARGET CO
 * =========================
 */

export async function getTargetCo() {
  const profile = await getCurrentProfile();

  let query = supabase.from("target_co").select("*").is("cancelled_at", null).order("created_at", {
    ascending: false,
  });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil Target CO: ${error.message}`);
  }

  return data ?? [];
}

export async function createTargetCo(payload) {
  const profile = await ensureSalesProfile();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("target_co")
    .insert({
      unit: profile.unit,
      nama: payload.nama,
      nama_so: payload.namaSo?.trim() || null,
      plafond: Number(payload.plafond) || 0,
      new_ijin: payload.newIjin?.trim() || null,
      produk: payload.produk || null,
      created_by: userId,
      approval_status: "PENDING_APPROVAL",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan Target CO: ${error.message}`);
  }

  return data;
}

export async function deleteTargetCo(id) {
  return deleteSalesReport("target_co", "Target CO", id);
}

export async function resubmitReport(entityType, entityId, payload) {
  if (!entityId) {
    throw new Error("ID laporan tidak ditemukan.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Data perbaikan wajib diisi.");
  }

  if (!["proposal", "ots_area", "target_co"].includes(entityType)) {
    throw new Error("Jenis laporan tidak valid.");
  }

  let normalizedPayload;

  if (entityType === "ots_area") {
    const plafond = Number(payload.plafond);

    if (!payload.cadeb?.trim()) {
      throw new Error("Nama Cadeb wajib diisi.");
    }

    if (!payload.usaha?.trim()) {
      throw new Error("Usaha wajib diisi.");
    }

    if (!Number.isFinite(plafond) || plafond <= 0) {
      throw new Error("Plafond harus lebih dari Rp0.");
    }

    if (!payload.kelengkapan) {
      throw new Error("Kelengkapan berkas wajib dipilih.");
    }

    if (payload.kelengkapan === "Belum Lengkap" && !payload.kekurangan?.trim()) {
      throw new Error("Isi kekurangan berkas jika berkas belum lengkap.");
    }

    if (!payload.namaSo?.trim()) {
      throw new Error("Nama SO wajib diisi.");
    }

    normalizedPayload = {
      cadeb: payload.cadeb.trim(),
      nama_so: payload.namaSo?.trim() || null,
      usaha: payload.usaha.trim(),
      plafond,
      kelengkapan: payload.kelengkapan,
      kekurangan: payload.kelengkapan === "Belum Lengkap" ? payload.kekurangan.trim() : null,
      nama_so: payload.namaSo.trim(),
    };
  } else if (entityType === "proposal") {
    normalizedPayload = {
      cadeb: payload.cadeb,
      plafond: Number(payload.plafond),
      fresh_money: Number(payload.freshMoney),
      produk: payload.produk || null,
      posisi: payload.posisi || null,
    };
  } else {
    normalizedPayload = {
      nama: payload.nama,
      plafond: Number(payload.plafond),
      new_ijin: payload.newIjin || null,
      produk: payload.produk || null,
    };
  }

  const { data, error } = await supabase.rpc("resubmit_report", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_payload: normalizedPayload,
  });

  if (error) {
    throw new Error(`Gagal mengirim ulang data: ${error.message}`);
  }

  if (!data) {
    throw new Error("Data tidak berhasil dikirim ulang.");
  }

  return data;
}

export async function updateRevisionReport(entityType, entityId, payload) {
  const userId = await getCurrentUserId();

  let table;
  let updatePayload;

  if (entityType === "proposal") {
    table = "proposals";

    updatePayload = {
      cadeb: payload.cadeb,
      nama_so: payload.namaSo?.trim() || null,
      plafond: Number(payload.plafond) || 0,
      fresh_money: Number(payload.freshMoney) || 0,
      produk: payload.produk || null,
      posisi: payload.posisi || null,
      updated_at: new Date().toISOString(),
    };
  } else if (entityType === "ots_area") {
    table = "ots_area";

    updatePayload = {
      cadeb: payload.cadeb,
      usaha: payload.usaha || null,
      plafond: Number(payload.plafond) || 0,
      kelengkapan: payload.kelengkapan || null,
      kekurangan: payload.kekurangan || null,
      nama_so: payload.namaSo || null,
      updated_at: new Date().toISOString(),
    };
  } else if (entityType === "target_co") {
    table = "target_co";

    updatePayload = {
      nama: payload.nama,
      nama_so: payload.namaSo?.trim() || null,
      plafond: Number(payload.plafond) || 0,
      new_ijin: payload.newIjin || null,
      produk: payload.produk || null,
      updated_at: new Date().toISOString(),
    };
  } else {
    throw new Error("Jenis data revision tidak valid.");
  }

  const { data, error } = await supabase.from(table).update(updatePayload).eq("id", entityId).eq("created_by", userId).eq("approval_status", "REVISION").select().single();

  if (error) {
    throw new Error(`Gagal memperbarui data revision: ${error.message}`);
  }

  if (!data) {
    throw new Error("Data revision tidak ditemukan atau bukan milik user aktif.");
  }

  return data;
}

export async function getRevisionReports() {
  const profile = await ensureSalesProfile();

  const [proposalResult, otsResult, targetResult] = await Promise.all([
    supabase.from("proposals").select("*").is("cancelled_at", null).eq("created_by", profile.id).eq("unit", profile.unit).eq("approval_status", "REVISION").order("updated_at", { ascending: false }),

    supabase.from("ots_area").select("*").is("cancelled_at", null).eq("created_by", profile.id).eq("unit", profile.unit).eq("approval_status", "REVISION").order("updated_at", { ascending: false }),

    supabase.from("target_co").select("*").is("cancelled_at", null).eq("created_by", profile.id).eq("unit", profile.unit).eq("approval_status", "REVISION").order("updated_at", { ascending: false }),
  ]);

  if (proposalResult.error) {
    throw new Error(`Gagal mengambil revisi Proposal: ${proposalResult.error.message}`);
  }

  if (otsResult.error) {
    throw new Error(`Gagal mengambil revisi OTS Area: ${otsResult.error.message}`);
  }

  if (targetResult.error) {
    throw new Error(`Gagal mengambil revisi Plan: ${targetResult.error.message}`);
  }

  return {
    proposals: proposalResult.data ?? [],
    otsArea: otsResult.data ?? [],
    targetCo: targetResult.data ?? [],
  };
}

export async function updatePendingTargetCo(targetCoId, payload) {
  if (!targetCoId) {
    throw new Error("ID Target CO tidak ditemukan.");
  }

  const profile = await ensureSalesProfile();

  const plafond = Number(payload.plafond);

  if (!Number.isFinite(plafond) || plafond <= 0) {
    throw new Error("Plafond harus lebih dari Rp0.");
  }

  const updates = {
    nama: payload.nama.trim(),
    nama_so: payload.namaSo?.trim() || null,
    plafond,
    new_ijin: payload.newIjin || null,
    produk: payload.produk || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("target_co").update(updates).eq("id", targetCoId).eq("created_by", profile.id).eq("unit", profile.unit).eq("approval_status", "PENDING_APPROVAL").select().maybeSingle();

  if (error) {
    throw new Error(`Gagal memperbarui Target CO: ${error.message}`);
  }

  if (!data) {
    throw new Error("Target CO tidak dapat diedit. Periksa kepemilikan, unit, atau status data.");
  }

  return data;
}

/**
 * Mengambil permintaan pembatalan yang boleh dilihat
 * oleh user berdasarkan RLS Supabase.
 */
export async function getCancellationRequests() {
  const { data, error } = await supabase.from("report_cancellation_requests").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil permintaan pembatalan: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Sales mengajukan pembatalan laporan.
 *
 * entityType: "proposal" | "ots_area" | "target_co"
 */
export async function requestReportCancellation(entityType, entityId, reason) {
  const { data, error } = await supabase.rpc("request_report_cancellation", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_reason: reason.trim(),
  });

  if (error) {
    throw new Error(`Gagal mengajukan pembatalan: ${error.message}`);
  }

  return data;
}

/**
 * Supervisor menyetujui atau menolak permintaan pembatalan.
 *
 * decision: "APPROVED" | "REJECTED"
 */
export async function reviewCancellationRequest(requestId, decision, decisionReason = "") {
  const { data, error } = await supabase.rpc("review_report_cancellation", {
    p_request_id: requestId,
    p_action: decision,
    p_decision_note: decisionReason.trim() || null,
  });

  if (error) {
    throw new Error(`Gagal memproses keputusan pembatalan: ${error.message}`);
  }

  return data;
}

/**
 * Memperbarui hanya kelengkapan dan kekurangan OTS
 * yang sudah disetujui.
 */
export async function updateApprovedOtsCompleteness(otsAreaId, { kelengkapan, kekurangan, reason = "" }) {
  const { data, error } = await supabase.rpc("update_ots_completeness", {
    p_ots_area_id: otsAreaId,
    p_kelengkapan: kelengkapan,
    p_kekurangan: kekurangan,
    p_reason: reason.trim() || null,
  });

  if (error) {
    throw new Error(`Gagal memperbarui kelengkapan OTS: ${error.message}`);
  }

  return data;
}
