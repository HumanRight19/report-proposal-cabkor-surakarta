import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, ChevronRight, CircleAlert, XCircle } from "lucide-react";

function formatNotificationDate(value) {
  if (!value) return "Waktu tidak tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Waktu tidak tersedia";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function NotificationCenter({ notifications = [], loading = false, onOpen, onMarkAllRead, isOpen = true }) {
  const listRef = useRef(null);
  const timersRef = useRef([]);
  const [highlightedId, setHighlightedId] = useState(null);

  // Urutkan notifikasi: terbaru terlebih dahulu.
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const dateA = new Date(a.created_at ?? 0).getTime();
      const dateB = new Date(b.created_at ?? 0).getTime();

      const validA = Number.isFinite(dateA) ? dateA : 0;
      const validB = Number.isFinite(dateB) ? dateB : 0;

      return validB - validA;
    });
  }, [notifications]);

  const latestNotification = sortedNotifications[0];

  // Scroll ke atas setiap kali menu dibuka atau data terbaru tersedia.
  useEffect(() => {
    if (!isOpen || loading || sortedNotifications.length === 0 || !latestNotification) {
      return;
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    setHighlightedId(latestNotification.id);

    const scrollTimer = window.setTimeout(() => {
      listRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);

    const highlightTimer = window.setTimeout(() => {
      setHighlightedId(null);
    }, 3500);

    timersRef.current.push(scrollTimer, highlightTimer);

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [isOpen, loading, latestNotification?.id, sortedNotifications.length]);

  // Bersihkan timer saat komponen dilepas.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function getIcon(type) {
    if (type === "REVISION_REQUIRED") return CircleAlert;
    if (type === "REJECTED") return XCircle;
    return CheckCircle2;
  }

  function getIconClass(type) {
    if (type === "REVISION_REQUIRED") {
      return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
    }

    if (type === "REJECTED") {
      return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400";
    }

    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";
  }

  return (
    <section
      className="
        overflow-hidden rounded-[24px] border
        border-slate-200/80 bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        dark:border-slate-700/80 dark:bg-slate-900
        dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]
      "
    >
      {/* Header */}
      <div
        className="
          flex items-center justify-between gap-3
          border-b border-slate-100 px-4 py-4
          dark:border-slate-800 sm:px-5
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl bg-slate-100 text-slate-700
              dark:bg-slate-800 dark:text-slate-200
            "
          >
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">Notifikasi</h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Status dan tindakan dari Supervisor.</p>
          </div>
        </div>

        {notifications.some((item) => !item.is_read) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="
              shrink-0 text-[10px] font-bold
              text-slate-500 transition hover:text-slate-900
              dark:text-slate-400 dark:hover:text-white
            "
          >
            Tandai dibaca
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="px-5 py-10 text-center">
          <div
            className="
              mx-auto h-6 w-6 animate-spin rounded-full border-2
              border-slate-200 border-t-slate-700
              dark:border-slate-700 dark:border-t-white
            "
          />

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Memuat notifikasi...</p>
        </div>
      ) : sortedNotifications.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />

          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Belum ada notifikasi</p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Semua aktivitas Supervisor akan muncul di sini.</p>
        </div>
      ) : (
        /* Daftar notifikasi */
        <div
          ref={listRef}
          className="
            max-h-[min(70vh,560px)]
            overflow-y-auto overscroll-contain
            divide-y divide-slate-100
            dark:divide-slate-800
          "
        >
          {sortedNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const isHighlighted = highlightedId === notification.id;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => onOpen?.(notification)}
                className={`
                  relative flex w-full items-start gap-3
                  border-l-4 px-4 py-4 text-left
                  transition-colors duration-500
                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-inset
                  focus-visible:ring-indigo-500
                  ${
                    isHighlighted
                      ? `
                        border-l-indigo-500 bg-indigo-50
                        ring-2 ring-inset ring-indigo-300/80
                        dark:border-l-indigo-400 dark:bg-indigo-950/60
                        dark:ring-indigo-700/80
                      `
                      : `
                        border-l-transparent
                        hover:bg-slate-50
                        dark:hover:bg-slate-800/60
                        ${!notification.is_read ? "bg-slate-50/70 dark:bg-slate-800/30" : ""}
                      `
                  }
                `}
              >
                <div
                  className={`
                    flex h-9 w-9 shrink-0 items-center
                    justify-center rounded-xl
                    ${getIconClass(notification.type)}
                  `}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p
                      className={`
                        flex-1 text-sm font-semibold
                        ${isHighlighted ? "text-indigo-950 dark:text-indigo-100" : "text-slate-800 dark:text-slate-100"}
                      `}
                    >
                      {notification.title}
                    </p>

                    {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Belum dibaca" />}
                  </div>

                  <p
                    className={`
                      mt-1 line-clamp-2 text-xs leading-relaxed
                      ${isHighlighted ? "text-indigo-800 dark:text-indigo-200" : "text-slate-500 dark:text-slate-400"}
                    `}
                  >
                    {notification.message}
                  </p>

                  {/* Tanggal dan waktu notifikasi */}
                  <p
                    className="
                      mt-2 flex items-center gap-1.5
                      text-[11px] font-medium
                      text-slate-400 dark:text-slate-500
                    "
                  >
                    <span aria-hidden="true">◷</span>
                    <time dateTime={notification.created_at ?? undefined}>{formatNotificationDate(notification.created_at)}</time>
                  </p>
                </div>

                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default NotificationCenter;
