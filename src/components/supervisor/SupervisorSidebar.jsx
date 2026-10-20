import { BarChart3, ClipboardCheck, FileText, LayoutDashboard, ListChecks, X } from "lucide-react";

const menus = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "proposal",
    label: "Monitoring Proposal",
    icon: FileText,
  },
  {
    id: "ots",
    label: "Monitoring OTS Area",
    icon: ListChecks,
  },
  {
    id: "target",
    label: "Monitoring Plan",
    icon: BarChart3,
  },
  {
    id: "approval",
    label: "Approval",
    icon: ClipboardCheck,
  },
];

function SupervisorSidebar({ activeMenu, onChange, open, onClose }) {
  return (
    <>
      {open && (
        <button
          type="button"
          onClick={onClose}
          className="
            fixed inset-0 z-40
            bg-slate-950/35 backdrop-blur-sm
            lg:hidden
          "
          aria-label="Tutup menu"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[270px] flex-col
          border-r border-slate-200/80
          bg-white
          shadow-xl shadow-slate-200/40
          transition-transform duration-300
          dark:border-slate-800
          dark:bg-slate-950
          dark:shadow-black/20
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Area Surakarta</p>

            <h2 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">Report Proposal</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg text-slate-400
              hover:bg-slate-100
              lg:hidden
              dark:hover:bg-slate-800
            "
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Workspace</p>

          <nav className="space-y-1">
            {menus.map((menu) => {
              const Icon = menu.icon;
              const active = activeMenu === menu.id;

              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => {
                    onChange(menu.id);
                    onClose();
                  }}
                  className={`
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-3
                    text-left text-sm
                    transition
                    ${
                      active
                        ? `
                          bg-slate-900
                          font-bold text-white
                          shadow-lg shadow-slate-900/10
                          dark:bg-white dark:text-slate-900
                        `
                        : `
                          font-semibold text-slate-500
                          hover:bg-slate-100
                          hover:text-slate-900
                          dark:text-slate-400
                          dark:hover:bg-slate-900
                          dark:hover:text-white
                        `
                    }
                  `}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />

                  <span className="truncate">{menu.label}</span>

                  {menu.id === "approval" && (
                    <span
                      className={`
                        ml-auto rounded-full px-2 py-0.5
                        text-[9px] font-black
                        ${active ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-900" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}
                      `}
                    >
                      Review
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div
            className="
              rounded-2xl border border-slate-200
              bg-slate-50 p-4
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Access</p>

            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">Supervisor</p>

            <p className="mt-1 text-[11px] leading-4 text-slate-400">Monitoring seluruh unit Area Surakarta.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default SupervisorSidebar;
