import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, FileText, RefreshCw, Archive } from "lucide-react";

import SupervisorHeader from "../components/supervisor/SupervisorHeader";
import SupervisorSidebar from "../components/supervisor/SupervisorSidebar";
import ApprovalWorkspace from "../components/supervisor/ApprovalWorkspace";
import CancellationWorkspace from "../components/supervisor/CancellationWorkspace";
import ProposalMonitoringWorkspace from "../components/supervisor/ProposalMonitoringWorkspace";
import OtsAreaMonitoringWorkspace from "../components/supervisor/OtsAreaMonitoringWorkspace";
import TargetCoMonitoringWorkspace from "../components/supervisor/TargetCoMonitoringWorkspace";
import SupervisorDashboard from "../components/supervisor/SupervisorDashboard";

import { getSupervisorOverview, reviewReport } from "../services/supervisorService";

import { getCancellationRequests, reviewCancellationRequest } from "../services/reportService";

function Supervisor() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [data, setData] = useState({
    proposals: [],
    otsArea: [],
    targetCo: [],
  });

  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [overview, cancellationData] = await Promise.all([getSupervisorOverview(), getCancellationRequests()]);

      setData({
        proposals: overview.proposals ?? [],
        otsArea: overview.otsArea ?? [],
        targetCo: overview.targetCo ?? [],
      });

      setCancellationRequests(cancellationData ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat dashboard Supervisor.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Data aktif untuk KPI, approval laporan, dan monitoring.
  // Data yang dibatalkan tetap dipertahankan di state data untuk
  // membantu pencocokan riwayat permintaan pembatalan.
  const activeData = useMemo(
    () => ({
      proposals: data.proposals.filter((item) => !item.cancelled_at),
      otsArea: data.otsArea.filter((item) => !item.cancelled_at),
      targetCo: data.targetCo.filter((item) => !item.cancelled_at),
    }),
    [data],
  );

  const allItems = useMemo(
    () => [
      ...activeData.proposals.map((item) => ({
        ...item,
        entityType: "proposal",
      })),
      ...activeData.otsArea.map((item) => ({
        ...item,
        entityType: "ots_area",
      })),
      ...activeData.targetCo.map((item) => ({
        ...item,
        entityType: "target_co",
      })),
    ],
    [activeData],
  );

  const supervisorNotifications = [
    ...allItems
      .filter((item) => item.approval_status === "PENDING_APPROVAL")
      .map((item) => ({
        id: `report-${item.entityType}-${item.id}`,
        type: "report",
        title: `${
          {
            proposal: "Proposal",
            ots_area: "OTS Area",
            target_co: "Target CO",
          }[item.entityType] || "Laporan"
        } menunggu approval`,
        description: `${item.cadeb || item.nama || item.nama_debitur || "Laporan"}${item.unit ? ` · ${item.unit}` : ""}`,
        createdAt: item.created_at,
      })),

    ...cancellationRequests
      .filter((item) => String(item.status || "").toUpperCase() === "PENDING")
      .map((item) => ({
        id: `cancellation-${item.id}`,
        type: "cancellation",
        title: "Permintaan pembatalan",
        description: item.reason || "Permintaan pembatalan menunggu keputusan Supervisor.",
        createdAt: item.created_at,
      })),
  ].sort((a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0));

  const pendingCount = allItems.filter((item) => item.approval_status === "PENDING_APPROVAL").length;

  const approvedCount = allItems.filter((item) => item.approval_status === "APPROVED").length;

  const revisionCount = allItems.filter((item) => item.approval_status === "REVISION").length;

  const rejectedCount = allItems.filter((item) => item.approval_status === "REJECTED").length;

  const pendingCancellationCount = cancellationRequests.filter((request) => String(request.status || "").toUpperCase() === "PENDING").length;

  async function handleReview(payload) {
    try {
      await reviewReport(payload);
      await loadDashboard(true);
    } catch (reviewError) {
      setError(reviewError.message || "Gagal menyimpan keputusan approval.");

      throw reviewError;
    }
  }

  async function handleCancellationReview(requestId, decision, decisionReason = "") {
    try {
      await reviewCancellationRequest(requestId, decision, decisionReason);

      await loadDashboard(true);
    } catch (reviewError) {
      setError(reviewError.message || "Gagal menyimpan keputusan pembatalan.");

      throw reviewError;
    }
  }

  function renderContent() {
    if (activeMenu === "approval") {
      return (
        <div className="space-y-8">
          <ApprovalWorkspace proposals={activeData.proposals} otsArea={activeData.otsArea} targetCo={activeData.targetCo} loading={loading} onReview={handleReview} />

          <div className="border-t border-slate-200 pt-7 dark:border-slate-800">
            <CancellationWorkspace cancellationRequests={cancellationRequests} proposals={data.proposals} otsArea={data.otsArea} targetCo={data.targetCo} loading={loading} onReview={handleCancellationReview} />
          </div>
        </div>
      );
    }

    if (activeMenu === "proposal") {
      return <ProposalMonitoringWorkspace proposals={activeData.proposals} loading={loading} />;
    }

    if (activeMenu === "ots") {
      return <OtsAreaMonitoringWorkspace otsArea={activeData.otsArea} loading={loading} />;
    }

    if (activeMenu === "target") {
      return <TargetCoMonitoringWorkspace targetCo={activeData.targetCo} loading={loading} />;
    }

    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <SupervisorSidebar activeMenu={activeMenu} onChange={setActiveMenu} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[270px]">
        <SupervisorHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          notifications={supervisorNotifications}
          onOpenApproval={() => setActiveMenu("approval")}
          onNotificationClick={() => setActiveMenu("approval")}
          unreadCount={pendingCount + pendingCancellationCount}
        />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
              <span className="break-words">{error}</span>

              <button type="button" onClick={() => loadDashboard()} className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-black shadow-sm dark:bg-slate-900">
                Coba Lagi
              </button>
            </div>
          )}

          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Overview</p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">Selamat datang, Supervisor</h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pantau laporan, selesaikan approval, dan tinjau permintaan pembatalan dari seluruh Capem.</p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard()}
              disabled={loading || refreshing}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {activeMenu === "dashboard" ? (
            <SupervisorDashboard allItems={allItems} cancellationRequests={cancellationRequests} loading={loading} />
          ) : (
            <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              <StatCard label="Menunggu Approval" value={pendingCount} icon={ClipboardCheck} emphasis />

              <StatCard label="Approved" value={approvedCount} icon={CheckCircle2} />

              <StatCard label="Perlu Revisi" value={revisionCount} icon={RefreshCw} />

              <StatCard label="Rejected" value={rejectedCount} icon={FileText} />

              <StatCard label="Menunggu Pembatalan" value={pendingCancellationCount} icon={Archive} emphasis={pendingCancellationCount > 0} />
            </section>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, emphasis = false }) {
  return (
    <article
      className={`
        rounded-3xl border p-5
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        ${emphasis ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20" : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </span>

        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">KPI</span>
      </div>

      <p className="mt-5 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>

      <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
    </article>
  );
}

export default Supervisor;
