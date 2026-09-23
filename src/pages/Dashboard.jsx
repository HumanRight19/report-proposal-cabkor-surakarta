import { useCallback, useEffect, useState } from "react";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import UnitSummary from "../components/dashboard/UnitSummary";
import ProposalReport from "../components/reports/ProposalReport";
import OtsAreaReport from "../components/reports/OtsAreaReport";
import TargetCoReport from "../components/reports/TargetCoReport";

import useReportRealtime from "../hooks/useReportRealtime";

import { createOtsArea, createProposal, createTargetCo, deleteOtsArea, deleteProposal, deleteTargetCo, getOtsArea, getProposals, getTargetCo } from "../services/reportService";

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("pusat");

  const [proposals, setProposals] = useState([]);

  const [otsArea, setOtsArea] = useState([]);

  const [targetCo, setTargetCo] = useState([]);

  const [loading, setLoading] = useState(true);

  const [otsLoading, setOtsLoading] = useState(true);

  const [targetLoading, setTargetLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [otsSaving, setOtsSaving] = useState(false);

  const [targetSaving, setTargetSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [otsDeletingId, setOtsDeletingId] = useState(null);

  const [targetDeletingId, setTargetDeletingId] = useState(null);

  const [error, setError] = useState("");

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

  // const loadAllData = useCallback(async () => {
  //   setError("");

  //   await Promise.all([loadProposals(), loadOtsArea(), loadTargetCo()]);
  // }, [loadProposals, loadOtsArea, loadTargetCo]);

  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        const [proposalData, otsData, targetData] = await Promise.all([getProposals(), getOtsArea(), getTargetCo()]);

        if (cancelled) {
          return;
        }

        setProposals(proposalData);
        setOtsArea(otsData);
        setTargetCo(targetData);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Gagal memuat data dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setOtsLoading(false);
          setTargetLoading(false);
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
  }, [loadProposals, loadOtsArea, loadTargetCo]);

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

  async function handleDeleteProposal(id) {
    setDeletingId(id);
    setError("");

    try {
      await deleteProposal(id);
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus proposal.");

      throw deleteError;
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteOts(id) {
    setOtsDeletingId(id);
    setError("");

    try {
      await deleteOtsArea(id);
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus OTS Area.");

      throw deleteError;
    } finally {
      setOtsDeletingId(null);
    }
  }

  async function handleDeleteTargetCo(id) {
    setTargetDeletingId(id);
    setError("");

    try {
      await deleteTargetCo(id);
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus Target CO.");

      throw deleteError;
    } finally {
      setTargetDeletingId(null);
    }
  }

  function renderActiveReport() {
    if (activeMenu === "pusat") {
      return <ProposalReport proposals={proposals} loading={loading} saving={saving} deletingId={deletingId} onCreate={handleCreateProposal} onDelete={handleDeleteProposal} />;
    }

    if (activeMenu === "ots") {
      return <OtsAreaReport otsArea={otsArea} loading={otsLoading} saving={otsSaving} deletingId={otsDeletingId} onCreate={handleCreateOts} onDelete={handleDeleteOts} />;
    }

    if (activeMenu === "target") {
      return <TargetCoReport targetCo={targetCo} loading={targetLoading} saving={targetSaving} deletingId={targetDeletingId} onCreate={handleCreateTargetCo} onDelete={handleDeleteTargetCo} />;
    }

    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold">Menu belum dibuat</h2>

        <p className="mt-2 text-sm text-slate-500">Menu ini akan kita kerjakan pada tahap berikutnya.</p>
      </section>
    );
  }

  return (
    <div className="min-h-screen text-slate-800">
      <DashboardHeader activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <main className="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-5 sm:py-6">
        {error && <div className="clay-surface rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <DashboardStats proposals={proposals} otsArea={otsArea} targetCo={targetCo} />

        <UnitSummary proposals={proposals} otsArea={otsArea} targetCo={targetCo} />

        {renderActiveReport()}
      </main>
    </div>
  );
}

export default Dashboard;
