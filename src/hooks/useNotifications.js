import { useCallback, useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";

import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../services/notificationService";

function useNotifications(recipientId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!recipientId) {
      setNotifications([]);
      setLoading(false);

      return;
    }

    try {
      setError("");

      const data = await getNotifications(recipientId);

      setNotifications(data);
    } catch (loadError) {
      console.error("Gagal memuat notifikasi:", loadError);

      setError(loadError.message || "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!recipientId) {
      return undefined;
    }

    const channel = supabase
      .channel(`notifications-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${recipientId}`,
        },
        () => {
          loadNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientId, loadNotifications]);

  const markAsRead = useCallback(async (id) => {
    await markNotificationAsRead(id);

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead(recipientId);

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at || new Date().toISOString(),
      })),
    );
  }, [recipientId]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const attentionNotifications = notifications.filter((notification) => !notification.is_read && (notification.type === "REVISION_REQUIRED" || notification.type === "REJECTED"));

  return {
    notifications,
    attentionNotifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotifications;
