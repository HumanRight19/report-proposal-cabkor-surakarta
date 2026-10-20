import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function DashboardHeader({ activeMenu, onMenuChange }) {
  const { user, logout } = useContext(AuthContext);

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    if (logoutLoading) {
      return;
    }

    setLogoutLoading(true);
    setLogoutError("");

    try {
      await logout();
    } catch (error) {
      console.error("Gagal logout:", error);

      setLogoutError("Logout gagal. Silakan coba lagi.");

      setLogoutLoading(false);
    }
  }

  const username = user?.username || "Person";

  return (
    <header className="relative z-40 w-full px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6">
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          overflow-visible
          rounded-[24px]
          border border-slate-200/70
          bg-white/90
          p-3
          shadow-[0_12px_35px_rgba(15,23,42,0.08)]
          backdrop-blur-xl
          dark:border-slate-700/70
          dark:bg-slate-900/90
          dark:shadow-[0_12px_35px_rgba(0,0,0,0.25)]
          sm:rounded-[28px]
          sm:p-4
          lg:p-5
        "
      >
        {/* Header Top */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="
                  h-2
                  w-2
                  shrink-0
                  rounded-full
                  bg-emerald-500
                  shadow-[0_0_0_4px_rgba(16,185,129,0.12)]
                "
              />

              <span
                className="
                  truncate
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-slate-500
                  dark:text-slate-400
                  sm:text-xs
                "
              >
                Report Area Surakarta
              </span>
            </div>

            <h1
              className="
                truncate
                text-base
                font-extrabold
                tracking-tight
                text-slate-900
                dark:text-white
                sm:text-lg
                lg:text-xl
              "
            >
              Report Proposal Area Surakarta
            </h1>

            <p
              className="
                mt-0.5
                hidden
                text-xs
                font-medium
                text-slate-500
                dark:text-slate-400
                sm:block
              "
            >
              Bismillah • Lebih Baik
            </p>
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);
                setLogoutError("");
              }}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Buka menu akun"
              className={`
                group
                flex
                items-center
                gap-2
                rounded-2xl
                border
                px-2
                py-2
                transition-all
                duration-200
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-slate-400
                dark:focus-visible:ring-slate-500
                sm:gap-2.5
                sm:px-2.5
                ${
                  profileOpen
                    ? `
                      border-slate-300
                      bg-slate-100
                      shadow-inner
                      dark:border-slate-600
                      dark:bg-slate-800
                    `
                    : `
                      border-slate-200/80
                      bg-slate-50/80
                      hover:border-slate-300
                      hover:bg-white
                      hover:shadow-sm
                      dark:border-slate-700
                      dark:bg-slate-800/70
                      dark:hover:border-slate-600
                      dark:hover:bg-slate-800
                    `
                }
              `}
            >
              {/* Avatar */}
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                  text-white
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]
                  dark:bg-white
                  dark:text-slate-900
                  sm:h-10
                  sm:w-10
                "
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />

                  <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>

              {/* User info */}
              <span className="hidden min-w-0 text-left sm:block">
                <strong
                  className="
                    block
                    max-w-28
                    truncate
                    text-xs
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {username}
                </strong>

                <span
                  className="
                    mt-0.5
                    flex
                    items-center
                    gap-1
                    text-[10px]
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </span>

              {/* Chevron */}
              <svg
                className={`
                  hidden
                  h-4
                  w-4
                  text-slate-400
                  transition-transform
                  duration-200
                  sm:block
                  ${profileOpen ? "rotate-180" : ""}
                `}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div
                role="menu"
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  z-50
                  w-[min(280px,calc(100vw-24px))]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200/80
                  bg-white
                  p-2
                  shadow-[0_18px_45px_rgba(15,23,42,0.14)]
                  ring-1
                  ring-black/[0.02]
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)]
                "
              >
                {/* Account */}
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    bg-slate-50
                    p-3
                    dark:bg-slate-800
                  "
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-900
                      text-white
                      dark:bg-white
                      dark:text-slate-900
                    "
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />

                      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>

                  <div className="min-w-0">
                    <strong
                      className="
                        block
                        text-xs
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      Akun Aktif
                    </strong>

                    <span
                      title={username}
                      className="
                        mt-0.5
                        block
                        truncate
                        text-xs
                        font-medium
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {username}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />

                {/* Error */}
                {logoutError && (
                  <div
                    className="
                      mb-2
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-3
                      py-2.5
                      text-xs
                      font-medium
                      leading-relaxed
                      text-red-600
                      dark:border-red-900/60
                      dark:bg-red-950/30
                      dark:text-red-400
                    "
                  >
                    {logoutError}
                  </div>
                )}

                {/* Logout */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-semibold
                    text-slate-600
                    transition-colors
                    duration-150
                    hover:bg-red-50
                    hover:text-red-600
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:text-slate-300
                    dark:hover:bg-red-950/30
                    dark:hover:text-red-400
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-slate-100
                      dark:bg-slate-800
                    "
                  >
                    {logoutLoading ? (
                      <span
                        className="
                          h-4
                          w-4
                          animate-spin
                          rounded-full
                          border-2
                          border-slate-300
                          border-t-slate-700
                          dark:border-slate-600
                          dark:border-t-slate-200
                        "
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                        <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

                        <path d="M14 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

                        <path d="M18 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>

                  <span>{logoutLoading ? "Keluar..." : "Keluar dari Akun"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
