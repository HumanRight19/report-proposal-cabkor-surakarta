import { useCallback, useEffect, useState } from "react";

import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardMenu from "../components/dashboard/DashboardMenu";
import DashboardStats from "../components/dashboard/DashboardStats";
import SupervisorFeedbackCard from "../components/dashboard/SupervisorFeedbackCard";
import useNotifications from "../hooks/useNotifications";
import NotificationCenter from "../components/dashboard/NotificationCenter";
import RevisionWorkspace from "../components/dashboard/RevisionWorkspace";
import { getRevisionItems, resubmitRevision } from "../services/revisionService";

import ProposalReport from "../components/reports/ProposalReport";
import OtsAreaReport from "../components/reports/OtsAreaReport";
import TargetCoReport from "../components/reports/TargetCoReport";

import useReportRealtime from "../hooks/useReportRealtime";

import {
  updatePendingProposal,
  updatePendingOtsArea,
  resubmitReport,
  createOtsArea,
  createProposal,
  createTargetCo,
  getOtsArea,
  getProposals,
  getTargetCo,
  getCancellationRequests,
  requestReportCancellation,
  updateApprovedOtsCompleteness,
} from "../services/reportService";

function Dashboard() {
  const { user, profile } = useContext(AuthContext);

  const salesUnit = profile?.role === "SALES" ? profile.unit || "" : "";

  const recipientId = user?.id || null;

  const { notifications, attentionNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(recipientId);

  const [activeMenu, setActiveMenu] = useState("home");

  const [proposals, setProposals] = useState([]);

  const [otsArea, setOtsArea] = useState([]);

  const [targetCo, setTargetCo] = useState([]);

  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [cancellationSavingId, setCancellationSavingId] = useState(null);
  const [otsCompletenessSavingId, setOtsCompletenessSavingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [otsLoading, setOtsLoading] = useState(true);

  const [targetLoading, setTargetLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [otsSaving, setOtsSaving] = useState(false);

  const [targetSaving, setTargetSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [otsDeletingId, setOtsDeletingId] = useState(null);

  const [targetDeletingId, setTargetDeletingId] = useState(null);

  const [revisionItems, setRevisionItems] = useState([]);
  const [revisionLoading, setRevisionLoading] = useState(true);
  const [revisionSaving, setRevisionSaving] = useState(false);

  const [error, setError] = useState("");

  const scopedProposals = proposals.filter((row) => !salesUnit || row.unit === salesUnit);

  const scopedOtsArea = otsArea.filter((row) => !salesUnit || row.unit === salesUnit);

  const scopedTargetCo = targetCo.filter((row) => !salesUnit || row.unit === salesUnit);

  const [revisionTarget, setRevisionTarget] = useState(null);

  const loadProposals = useCallback(async () => {
    try {
      const data = await getProposals();

      setProposals(data);
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat data proposal.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOtsArea = useCallback(async () => {
    try {
      const data = await getOtsArea();

      setOtsArea(data);
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat data OTS Area.");
    } finally {
      setOtsLoading(false);
    }
  }, []);

  const loadTargetCo = useCallback(async () => {
    try {
      const data = await getTargetCo();

      setTargetCo(data);
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat Target CO.");
    } finally {
      setTargetLoading(false);
    }
  }, []);

  const loadCancellationRequests = useCallback(async () => {
    setCancellationLoading(true);

    try {
      const data = await getCancellationRequests();
      setCancellationRequests(data || []);
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat permintaan pembatalan laporan.");
    } finally {
      setCancellationLoading(false);
    }
  }, []);

  const loadRevisionItems = useCallback(async () => {
    if (!user?.id) {
      setRevisionItems([]);
      setRevisionLoading(false);
      return;
    }

    try {
      const data = await getRevisionItems(user.id);

      setRevisionItems(data);
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat data revisi.");
    } finally {
      setRevisionLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        const [proposalData, otsData, targetData, revisionData, cancellationData] = await Promise.all([getProposals(), getOtsArea(), getTargetCo(), user?.id ? getRevisionItems(user.id) : Promise.resolve([]), getCancellationRequests()]);
        if (cancelled) {
          return;
        }

        setProposals(proposalData);
        setOtsArea(otsData);
        setTargetCo(targetData);
        setRevisionItems(revisionData);
        setCancellationRequests(cancellationData || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Gagal memuat data dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setOtsLoading(false);
          setTargetLoading(false);
          setRevisionLoading(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRealtimeChange = useCallback(() => {
    loadProposals();
    loadOtsArea();
    loadTargetCo();
    loadRevisionItems();
    loadCancellationRequests();
  }, [loadProposals, loadOtsArea, loadTargetCo, loadRevisionItems, loadCancellationRequests]);

  useReportRealtime(handleRealtimeChange);

  async function handleCreateProposal(payload) {
    setSaving(true);
    setError("");

    try {
      await createProposal(payload);
    } catch (createError) {
      setError(createError.message || "Gagal menyimpan proposal.");

      throw createError;
    } finally {
      setSaving(false);
    }
  }

  async function handleResubmitProposal(id, payload) {
    setSaving(true);
    setError("");

    try {
      await resubmitReport("proposal", id, payload);

      await Promise.all([loadProposals(), loadRevisionItems()]);
    } catch (resubmitError) {
      setError(resubmitError.message || "Gagal mengirim kembali revisi Proposal.");

      throw resubmitError;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateOts(payload) {
    setOtsSaving(true);
    setError("");

    try {
      await createOtsArea(payload);
    } catch (createError) {
      setError(createError.message || "Gagal menyimpan OTS Area.");

      throw createError;
    } finally {
      setOtsSaving(false);
    }
  }

  async function handleCreateTargetCo(payload) {
    setTargetSaving(true);
    setError("");

    try {
      await createTargetCo(payload);
    } catch (createError) {
      setError(createError.message || "Gagal menyimpan Target CO.");

      throw createError;
    } finally {
      setTargetSaving(false);
    }
  }

  async function handleRequestCancellation(entityType, entityId, reason) {
    setCancellationSavingId(entityId);
    setError("");

    try {
      await requestReportCancellation(entityType, entityId, reason);

      await Promise.all([loadCancellationRequests(), loadProposals(), loadOtsArea(), loadTargetCo()]);
    } catch (requestError) {
      setError(requestError.message || "Gagal mengajukan pembatalan laporan.");
      throw requestError;
    } finally {
      setCancellationSavingId(null);
    }
  }

  async function handleUpdateOtsCompleteness(id, payload) {
    setOtsCompletenessSavingId(id);
    setError("");

    try {
      await updateApprovedOtsCompleteness(id, payload);
      await loadOtsArea();
    } catch (updateError) {
      setError(updateError.message || "Gagal memperbarui kelengkapan OTS Area.");
      throw updateError;
    } finally {
      setOtsCompletenessSavingId(null);
    }
  }

  async function handleResubmitRevision({ entityType, entityId, payload }) {
    setRevisionSaving(true);
    setError("");

    try {
      await resubmitRevision({
        entityType,
        entityId,
        payload,
      });

      await loadRevisionItems();

      await Promise.all([loadProposals(), loadOtsArea(), loadTargetCo()]);
    } catch (resubmitError) {
      setError(resubmitError.message || "Gagal mengirim kembali data revisi.");

      throw resubmitError;
    } finally {
      setRevisionSaving(false);
    }
  }

  function renderActiveReport() {
    if (activeMenu === "pusat") {
      return (
        <ProposalReport
          proposals={scopedProposals}
          cancellationRequests={cancellationRequests}
          loading={loading}
          saving={saving}
          cancellationSubmittingId={cancellationSavingId}
          onCreate={handleCreateProposal}
          onUpdatePending={updatePendingProposal}
          onResubmit={handleResubmitProposal}
          onRequestCancellation={(id, reason) => handleRequestCancellation("proposal", id, reason)}
        />
      );
    }

    if (activeMenu === "ots") {
      return (
        <OtsAreaReport
          otsArea={scopedOtsArea}
          loading={otsLoading}
          saving={otsSaving}
          deletingId={cancellationSavingId}
          cancellationRequests={cancellationRequests}
          cancellationLoading={cancellationLoading}
          completenessSavingId={otsCompletenessSavingId}
          onCreate={handleCreateOts}
          onRequestCancellation={(id, reason) => handleRequestCancellation("ots_area", id, reason)}
          onUpdateApprovedCompleteness={handleUpdateOtsCompleteness}
          onUpdatePending={updatePendingOtsArea}
          onResubmit={(id, payload) => resubmitReport("ots_area", id, payload)}
        />
      );
    }

    if (activeMenu === "target") {
      return (
        <TargetCoReport
          targetCo={scopedTargetCo}
          cancellationRequests={cancellationRequests}
          loading={targetLoading}
          saving={targetSaving}
          cancellationSubmittingId={cancellationSavingId}
          onCreate={handleCreateTargetCo}
          onRequestCancellation={(id, reason) => handleRequestCancellation("target_co", id, reason)}
          onResubmit={resubmitReport}
        />
      );
    }

    if (activeMenu === "revision") {
      return <RevisionWorkspace items={revisionItems} loading={revisionLoading} saving={revisionSaving} onResubmit={handleResubmitRevision} targetItem={revisionTarget} />;
    }

    if (activeMenu === "notification") {
      return (
        <NotificationCenter
          notifications={notifications}
          onMarkAllRead={markAllAsRead}
          loading={loading}
          isOpen={activeMenu === "notification"}
          onOpen={(notification) => {
            markAsRead(notification.id);

            const entityType = notification.entity_type;
            const entityId = notification.entity_id;

            if (entityId && ["proposal", "ots_area", "target_co"].includes(entityType)) {
              setRevisionTarget({
                entityType,
                entityId,
                token: Date.now(),
              });

              setActiveMenu("revision");
              return;
            }

            // Fallback untuk notifikasi yang tidak terkait record.
            setActiveMenu("notification");
          }}
        />
      );
    }

    return null;
  }

  return (
    <div
      className="
        min-h-screen
        overflow-x-hidden
        bg-slate-50
        text-slate-800
        dark:bg-slate-950
        dark:text-slate-100
      "
    >
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main
        className="
          mx-auto
          w-full
          max-w-7xl
          space-y-5
          px-3
          pb-32
          pt-4
          sm:px-5
          sm:pb-36
          sm:pt-6
          lg:px-6
          lg:pb-40
        "
      >
        {/* Error */}
        {error && (
          <div
            className="
              rounded-2xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              font-medium
              text-red-700
              shadow-sm
              dark:border-red-900/60
              dark:bg-red-950/30
              dark:text-red-400
            "
          >
            {error}
          </div>
        )}

        {/* Dashboard Overview */}
        <DashboardStats proposals={scopedProposals} otsArea={scopedOtsArea} targetCo={scopedTargetCo} unit={salesUnit} />

        <SupervisorFeedbackCard
          items={attentionNotifications.map((notification) => ({
            id: notification.id,

            title: notification.title,

            description: notification.message,

            type: notification.type === "REVISION_REQUIRED" ? "Perlu Revisi" : "Ditolak",

            entityType: notification.entity_type,

            entityId: notification.entity_id,

            isRead: notification.is_read,
          }))}
          onOpen={(notification) => {
            markAsRead(notification.id);

            if (notification.entityType === "proposal") {
              setActiveMenu("pusat");

              return;
            }

            if (notification.entityType === "ots_area") {
              setActiveMenu("ots");

              return;
            }

            if (notification.entityType === "target_co") {
              setActiveMenu("target");
            }
          }}
        />

        {/* Active Report */}
        {renderActiveReport()}
      </main>

      {/* Bottom Navigation */}
      <DashboardMenu activeMenu={activeMenu} onChange={setActiveMenu} notificationCount={unreadCount} />
    </div>
  );
}

export default Dashboard;
