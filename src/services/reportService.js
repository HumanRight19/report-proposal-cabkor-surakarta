import { supabase } from "../lib/supabaseClient";

export async function getProposals() {
  const { data, error } = await supabase.from("proposals").select("*").order("id", {
    ascending: true,
  });

  if (error) {
    throw new Error(`Gagal mengambil data proposal: ${error.message}`);
  }

  return data ?? [];
}

export async function createProposal(payload) {
  const { data, error } = await supabase
    .from("proposals")
    .insert({
      unit: payload.unit,
      cadeb: payload.cadeb,
      plafond: payload.plafond,
      fresh_money: payload.freshMoney,
      produk: payload.produk,
      posisi: payload.posisi,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan proposal: ${error.message}`);
  }

  return data;
}

export async function deleteProposal(id) {
  const { error } = await supabase.from("proposals").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus proposal: ${error.message}`);
  }
}

export async function getOtsArea() {
  const { data, error } = await supabase.from("ots_area").select("*").order("id", {
    ascending: true,
  });

  if (error) {
    throw new Error(`Gagal mengambil data OTS Area: ${error.message}`);
  }

  return data ?? [];
}

export async function createOtsArea(payload) {
  const { data, error } = await supabase
    .from("ots_area")
    .insert({
      unit: payload.unit,
      cadeb: payload.cadeb,
      usaha: payload.usaha,
      plafond: payload.plafond,
      kelengkapan: payload.kelengkapan,
      kekurangan: payload.kekurangan,
      nama_so: payload.namaSo,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan OTS Area: ${error.message}`);
  }

  return data;
}

export async function deleteOtsArea(id) {
  const { error } = await supabase.from("ots_area").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus OTS Area: ${error.message}`);
  }
}

export async function getTargetCo() {
  const { data, error } = await supabase.from("target_co").select("*").order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createTargetCo(payload) {
  const { data, error } = await supabase
    .from("target_co")
    .insert({
      unit: payload.unit,
      nama: payload.nama,
      plafond: Number(payload.plafond) || 0,
      new_ijin: payload.new_ijin || null,
      produk: payload.produk || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteTargetCo(id) {
  const { error } = await supabase.from("target_co").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
