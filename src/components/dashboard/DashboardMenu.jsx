const menus = [
  {
    id: "pusat",
    label: "KANTOR PUSAT",
    shortLabel: "PUSAT",
  },
  {
    id: "ots",
    label: "BAHAN BAKU OTS",
    shortLabel: "OTS",
  },
  {
    id: "target",
    label: "TARGET CO HARI INI",
    shortLabel: "TARGET CO",
  },
];

function DashboardMenu({ activeMenu, onChange }) {
  return (
    <nav className="clay-menu" aria-label="Menu laporan">
      {menus.map((menu) => {
        const active = activeMenu === menu.id;

        return (
          <button key={menu.id} type="button" onClick={() => onChange(menu.id)} aria-current={active ? "page" : undefined} className={["clay-menu-button", active ? "clay-menu-button-active" : "clay-menu-button-inactive"].join(" ")}>
            <span className="clay-menu-label-full">{menu.label}</span>

            <span className="clay-menu-label-short">{menu.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default DashboardMenu;
