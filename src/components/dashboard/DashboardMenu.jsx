import { useEffect, useRef, useState } from "react";
import { Home, FileText, ClipboardList, Bell, RotateCcw, ChevronUp, ChevronDown, X, Target } from "lucide-react";

const reportMenus = [
  {
    id: "pusat",
    label: "Proposal",
    icon: FileText,
  },
  {
    id: "ots",
    label: "OTS Area",
    icon: ClipboardList,
  },
  {
    id: "target",
    label: "Plan",
    icon: Target,
  },
];

const mainMenus = [
  {
    id: "revision",
    label: "Revisi",
    icon: RotateCcw,
  },
  {
    id: "notification",
    label: "Notifikasi",
    icon: Bell,
  },
];

function DashboardMenu({ activeMenu, onChange, notificationCount = 0 }) {
  const [reportsOpen, setReportsOpen] = useState(false);
  const reportsRef = useRef(null);

  const isReportActive = reportMenus.some((menu) => menu.id === activeMenu);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (reportsRef.current && !reportsRef.current.contains(event.target)) {
        setReportsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setReportsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleReportSelect(menuId) {
    onChange(menuId);
    setReportsOpen(false);
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className="
        fixed inset-x-0 bottom-0 z-50
        px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]
        sm:px-5
        lg:bottom-5 lg:left-1/2 lg:right-auto
        lg:w-full lg:max-w-2xl lg:-translate-x-1/2
        lg:px-0 lg:pb-0
      "
    >
      <div
        className="
          mx-auto flex h-[68px] w-full items-center
          justify-around rounded-[24px] border
          border-slate-200/80 bg-white/95 px-2
          shadow-[0_12px_35px_rgba(15,23,42,0.14)]
          backdrop-blur-xl
          dark:border-slate-700/80 dark:bg-slate-900/95
          dark:shadow-[0_12px_35px_rgba(0,0,0,0.35)]
          lg:h-[72px] lg:rounded-[26px] lg:px-3
        "
      >
        {/* Home */}
        <button
          type="button"
          onClick={() => {
            onChange("home");
            setReportsOpen(false);
          }}
          aria-current={activeMenu === "home" ? "page" : undefined}
          className={`
            flex min-w-0 flex-1 flex-col items-center
            justify-center gap-1 rounded-2xl px-1 py-2
            transition-colors duration-200
            ${activeMenu === "home" ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}
          `}
        >
          <span
            className={`
              flex h-8 w-8 items-center justify-center rounded-xl
              ${activeMenu === "home" ? "bg-slate-100 dark:bg-slate-800" : ""}
            `}
          >
            <Home className="h-[21px] w-[21px]" strokeWidth={activeMenu === "home" ? 2.3 : 1.8} />
          </span>
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        {/* Laporan dengan submenu ke atas */}
        <div ref={reportsRef} className="relative flex min-w-0 flex-1 justify-center">
          {reportsOpen && (
            <div
              id="dashboard-report-submenu"
              role="menu"
              aria-label="Menu laporan"
              className="
                absolute bottom-[calc(100%+14px)] left-1/2
                z-[60] w-48 -translate-x-1/2
                rounded-2xl border border-slate-200
                bg-white p-2
                shadow-[0_16px_45px_rgba(15,23,42,0.18)]
                dark:border-slate-700 dark:bg-slate-900
                dark:shadow-[0_16px_45px_rgba(0,0,0,0.45)]
              "
            >
              <div className="flex items-center justify-between px-2 pb-2 pt-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Menu laporan</span>
                <button
                  type="button"
                  onClick={() => setReportsOpen(false)}
                  aria-label="Tutup submenu laporan"
                  className="
                    rounded-lg p-1 text-slate-400
                    hover:bg-slate-100 hover:text-slate-700
                    dark:hover:bg-slate-800 dark:hover:text-white
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {reportMenus.map((menu) => {
                const Icon = menu.icon;
                const active = activeMenu === menu.id;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleReportSelect(menu.id)}
                    aria-current={active ? "page" : undefined}
                    className={`
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-3 text-left
                      text-sm transition-colors
                      ${active ? "bg-slate-100 font-bold text-slate-900 dark:bg-slate-800 dark:text-white" : "font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70"}
                    `}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{menu.label}</span>
                    {active && <span className="ml-auto h-2 w-2 rounded-full bg-slate-900 dark:bg-white" />}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setReportsOpen((open) => !open)}
            aria-expanded={reportsOpen}
            aria-controls="dashboard-report-submenu"
            aria-label="Buka menu laporan"
            className={`
              relative flex min-w-0 w-full flex-col
              items-center justify-center gap-1
              rounded-2xl px-1 py-2 transition-colors duration-200
              ${isReportActive || reportsOpen ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}
            `}
          >
            {(isReportActive || reportsOpen) && (
              <span
                className="
                  absolute top-0 h-1 w-7 rounded-full
                  bg-slate-900 dark:bg-white
                "
              />
            )}

            <span
              className={`
                flex h-8 w-8 items-center justify-center rounded-xl
                ${isReportActive || reportsOpen ? "bg-slate-100 dark:bg-slate-800" : ""}
              `}
            >
              <FileText className="h-[21px] w-[21px]" strokeWidth={isReportActive || reportsOpen ? 2.3 : 1.8} />
            </span>

            <span className="flex max-w-full items-center gap-1 text-[10px] font-semibold">
              Laporan
              {reportsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </span>
          </button>
        </div>

        {/* Revisi dan Notifikasi */}
        {mainMenus.map((menu) => {
          const Icon = menu.icon;
          const active = activeMenu === menu.id;

          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => {
                onChange(menu.id);
                setReportsOpen(false);
              }}
              aria-current={active ? "page" : undefined}
              className={`
                relative flex min-w-0 flex-1 flex-col
                items-center justify-center gap-1
                rounded-2xl px-1 py-2
                transition-colors duration-200
                ${active ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}
              `}
            >
              {active && (
                <span
                  className="
                    absolute top-0 h-1 w-7 rounded-full
                    bg-slate-900 dark:bg-white
                  "
                />
              )}

              <span
                className={`
                  relative flex h-8 w-8 items-center
                  justify-center rounded-xl
                  ${active ? "bg-slate-100 dark:bg-slate-800" : ""}
                `}
              >
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.3 : 1.8} />

                {menu.id === "notification" && notificationCount > 0 && (
                  <span
                    className="
                      absolute -right-2 -top-1 flex h-4 min-w-4
                      items-center justify-center rounded-full
                      bg-red-500 px-1 text-[9px] font-extrabold
                      leading-none text-white shadow-sm
                    "
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </span>

              <span
                className={`
                  max-w-full truncate text-[10px]
                  ${active ? "font-bold" : "font-medium"}
                `}
              >
                {menu.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default DashboardMenu;
