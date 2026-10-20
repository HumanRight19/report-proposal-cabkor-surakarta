const STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: "Menunggu Supervisor",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
    icon: "◷",
  },
  APPROVED: {
    label: "Disetujui",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: "✓",
  },
  REJECTED: {
    label: "Ditolak",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
    icon: "✕",
  },
  REVISION: {
    label: "Perlu Revisi",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    icon: "↻",
  },
};

export default function ApprovalStatusBadge({ status }) {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const config = STATUS_CONFIG[normalizedStatus];

  // Jangan menampilkan badge yang berpotensi menyesatkan
  // jika status belum tersedia atau tidak dikenal.
  if (!config) return null;

  return (
    <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`} role="status">
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
