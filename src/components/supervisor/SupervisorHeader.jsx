import { Bell, CheckCheck, ClipboardCheck, FileText, LogOut, Menu, X, UserRound } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../../context/AuthContext";

function formatNotificationDate(value) {
  if (!value) return "Waktu tidak tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Waktu tidak tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SupervisorHeader({ sidebarOpen, onToggleSidebar, unreadCount = 0, notifications = [], onOpenApproval, onNotificationClick }) {
  const { user, logout } = useContext(AuthContext);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  }

  function handleNotificationClick(notification) {
    setNotificationOpen(false);
    onNotificationClick?.(notification);
  }

  function handleOpenApproval() {
    setNotificationOpen(false);
    onOpenApproval?.();
  }

  return (
    <header
      className="
        sticky top-0 z-30
        border-b border-slate-200/80
        bg-white/85 backdrop-blur-xl
        dark:border-slate-800 dark:bg-slate-950/85
      "
    >
      <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl border border-slate-200 bg-white
              text-slate-600 shadow-sm transition hover:bg-slate-50
              lg:hidden dark:border-slate-700 dark:bg-slate-900
              dark:text-slate-300
            "
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Report Proposal</p>
            <h1 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">Supervisor Workspace</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* NOTIFICATION BELL */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen((current) => !current)}
              className={`
                relative flex h-10 w-10 items-center justify-center
                rounded-xl border shadow-sm transition
                ${
                  notificationOpen
                    ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }
              `}
              aria-label={`Notifikasi, ${unreadCount} perlu ditindaklanjuti`}
              aria-expanded={notificationOpen}
              aria-haspopup="dialog"
            >
              <Bell className={`h-[19px] w-[19px] transition-transform duration-300 ${unreadCount > 0 ? "animate-[wiggle_1.5s_ease-in-out_infinite]" : ""}`} />

              {unreadCount > 0 && (
                <span
                  className="
                    absolute -right-1 -top-1
                    flex h-5 min-w-5 items-center justify-center
                    rounded-full bg-red-500 px-1
                    text-[9px] font-black text-white
                    ring-2 ring-white dark:ring-slate-950
                  "
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                role="dialog"
                aria-label="Daftar notifikasi Supervisor"
                className="
                  absolute right-0 top-12 z-50
                  w-[min(90vw,380px)] origin-top-right
                  overflow-hidden rounded-2xl
                  border border-slate-200 bg-white
                  shadow-2xl shadow-slate-900/10
                  animate-in fade-in slide-in-from-top-2 duration-200
                  dark:border-slate-800 dark:bg-slate-900
                "
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">Notifikasi</h2>
                    <p className="mt-1 text-[11px] text-slate-500">{unreadCount > 0 ? `${unreadCount} pekerjaan menunggu tindakan` : "Tidak ada pekerjaan yang menunggu tindakan"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-9 text-center">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <CheckCheck className="h-6 w-6" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">Semua sudah ditangani</p>
                      <p className="mt-1 text-xs text-slate-500">Belum ada laporan atau pembatalan yang menunggu tindakan.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="
                          flex w-full items-start gap-3 rounded-xl p-3
                          text-left transition
                          hover:bg-slate-50
                          focus:outline-none focus:ring-2 focus:ring-indigo-500
                          dark:hover:bg-slate-800/70
                        "
                      >
                        <span
                          className={`
                            flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                            ${notification.type === "cancellation" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"}
                          `}
                        >
                          {notification.type === "cancellation" ? <X className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-black text-slate-800 dark:text-slate-100">{notification.title}</span>
                          <span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">{notification.description}</span>
                          <span className="mt-1.5 block text-[10px] font-medium text-slate-400">{formatNotificationDate(notification.createdAt)}</span>
                        </span>

                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleOpenApproval}
                    className="
                      flex w-full items-center justify-center gap-2
                      rounded-xl bg-slate-900 px-4 py-3
                      text-xs font-black text-white transition
                      hover:bg-indigo-600
                      dark:bg-white dark:text-slate-900
                      dark:hover:bg-indigo-400
                    "
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Buka halaman Approval
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SUPERVISOR PROFILE */}
          <div
            className="
              hidden items-center gap-3 rounded-xl border
              border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex
              dark:border-slate-700 dark:bg-slate-900
            "
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <UserRound className="h-4 w-4" />
            </span>

            <div className="max-w-[150px]">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{user?.email || "Supervisor"}</p>
              <p className="text-[10px] font-medium text-slate-400">Supervisor</p>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            className="
              flex h-10 items-center gap-2 rounded-xl
              border border-slate-200 bg-white px-3
              text-xs font-bold text-slate-600 shadow-sm transition
              hover:border-red-200 hover:bg-red-50 hover:text-red-600
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300
              dark:hover:border-red-900 dark:hover:bg-red-950/30
            "
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default SupervisorHeader;
