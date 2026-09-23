import { formatRupiah } from "../../utils/format";

function DashboardStats({ proposals, otsArea, targetCo }) {
  const proposalPlafond = proposals.reduce((total, row) => total + Number(row.plafond || 0), 0);

  const stats = [
    {
      label: "NOA KANTOR PUSAT",
      value: proposals.length,
      icon: "🏢",
      card: "stat-card-emerald",
      iconBg: "stat-icon-emerald",
      line: "stat-line-emerald",
    },
    {
      label: "PLAFON KANTOR PUSAT",
      value: formatRupiah(proposalPlafond),
      icon: "💰",
      card: "stat-card-sky",
      iconBg: "stat-icon-sky",
      line: "stat-line-sky",
      currency: true,
    },
    {
      label: "NOA BAHAN BAKU OTS",
      value: otsArea.length,
      icon: "📋",
      card: "stat-card-amber",
      iconBg: "stat-icon-amber",
      line: "stat-line-amber",
    },
    {
      label: "NOA TARGET CO",
      value: targetCo.length,
      icon: "🎯",
      card: "stat-card-violet",
      iconBg: "stat-icon-violet",
      line: "stat-line-violet",
    },
  ];

  return (
    <section className="dashboard-stats">
      {stats.map((stat) => (
        <article key={stat.label} className={`dashboard-stat-card ${stat.card}`}>
          <div className="dashboard-stat-top">
            <div className={`dashboard-stat-icon ${stat.iconBg}`}>{stat.icon}</div>

            <span className="dashboard-stat-kpi">KPI</span>
          </div>

          <div className="dashboard-stat-content">
            <p>{stat.label}</p>

            <strong className={stat.currency ? "dashboard-stat-value currency" : "dashboard-stat-value"}>{stat.value}</strong>
          </div>

          <div className={`dashboard-stat-line ${stat.line}`} />

          <div className="dashboard-stat-decoration" />
        </article>
      ))}
    </section>
  );
}

export default DashboardStats;
