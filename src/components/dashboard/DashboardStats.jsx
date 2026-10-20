import { ClipboardList, FileCheck2, FileText, WalletCards } from "lucide-react";

import { formatRupiah } from "../../utils/format";

function DashboardStats({ proposals = [], otsArea = [], targetCo = [], unit = "" }) {
  const proposalPlafond = proposals.reduce((total, row) => total + Number(row.plafond || 0), 0);

  const stats = [
    {
      id: "proposal",
      label: "Proposal",
      value: proposals.length,
      description: "Proposal cabang",
      icon: FileText,
    },
    {
      id: "plafond",
      label: "Plafon Proposal",
      value: formatRupiah(proposalPlafond),
      description: "Total plafon",
      icon: WalletCards,
      currency: true,
    },
    {
      id: "ots",
      label: "OTS Area",
      value: otsArea.length,
      description: "Bahan baku OTS",
      icon: ClipboardList,
    },
    {
      id: "plan",
      label: "Plan",
      value: targetCo.length,
      description: "Target CO hari ini",
      icon: FileCheck2,
    },
  ];

  return (
    <section className="space-y-4">
      {/* Greeting */}
      <div className="px-1">
        <p
          className="
            text-xs
            font-medium
            text-slate-500
            dark:text-slate-400
          "
        >
          Dashboard Cabang
        </p>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2
            className="
              text-xl
              font-extrabold
              tracking-tight
              text-slate-900
              dark:text-white
              sm:text-2xl
            "
          >
            {unit || "Cabang"}
          </h2>

          <span
            className="
              rounded-full
              bg-emerald-50
              px-2
              py-0.5
              text-[10px]
              font-bold
              uppercase
              tracking-wide
              text-emerald-700
              dark:bg-emerald-950/30
              dark:text-emerald-400
            "
          >
            Sales
          </span>
        </div>

        <p
          className="
            mt-1
            text-xs
            leading-relaxed
            text-slate-500
            dark:text-slate-400
          "
        >
          Ringkasan aktivitas dan pencapaian cabang kamu.
        </p>
      </div>

      {/* KPI */}
      <div
        className="
          grid
          grid-cols-2
          gap-3
          lg:grid-cols-4
        "
      >
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.id}
              className="
                group
                relative
                overflow-hidden
                rounded-[22px]
                border
                border-slate-200/80
                bg-white
                p-4
                shadow-[0_8px_25px_rgba(15,23,42,0.05)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]
                dark:border-slate-700/80
                dark:bg-slate-900
                dark:shadow-[0_8px_25px_rgba(0,0,0,0.18)]
                dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.24)]
                sm:p-5
              "
            >
              {/* Soft decoration */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-8
                  -top-8
                  h-20
                  w-20
                  rounded-full
                  bg-slate-100/70
                  blur-2xl
                  dark:bg-slate-800/60
                "
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-slate-700
                      dark:bg-slate-800
                      dark:text-slate-200
                    "
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>

                  <span
                    className="
                      rounded-full
                      bg-slate-100
                      px-2
                      py-1
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-wide
                      text-slate-500
                      dark:bg-slate-800
                      dark:text-slate-400
                    "
                  >
                    KPI
                  </span>
                </div>

                <div className="mt-4">
                  <p
                    className="
                      text-xs
                      font-medium
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {stat.label}
                  </p>

                  <strong
                    className={`
                      mt-1
                      block
                      truncate
                      font-extrabold
                      tracking-tight
                      text-slate-900
                      dark:text-white
                      ${stat.currency ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}
                    `}
                  >
                    {stat.value}
                  </strong>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      font-medium
                      text-slate-400
                      dark:text-slate-500
                    "
                  >
                    {stat.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default DashboardStats;
