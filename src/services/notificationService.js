import { supabase } from "../lib/supabaseClient";

export async function getNotifications(recipientId) {
  if (!recipientId) {
    return [];
  }

  const { data, error } = await supabase.from("notifications").select("*").eq("recipient_id", recipientId).order("created_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function markNotificationAsRead(id) {
  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead(recipientId) {
  if (!recipientId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) {
    throw error;
  }
}
