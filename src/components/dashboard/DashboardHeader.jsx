import DashboardMenu from "./DashboardMenu";

function DashboardHeader({ activeMenu, onMenuChange }) {
  return (
    <header className="clay-header">
      <div className="clay-header-inner">
        <div className="clay-header-title">
          <div className="clay-header-eyebrow">
            <span className="clay-header-dot" />
            REPORT AREA SURAKARTA
          </div>

          <h1>REPORT PROPOSAL AREA SURAKARTA</h1>

          <p>Bismillah • Lebih Baik</p>
        </div>

        <DashboardMenu activeMenu={activeMenu} onChange={onMenuChange} />
      </div>
    </header>
  );
}

export default DashboardHeader;
