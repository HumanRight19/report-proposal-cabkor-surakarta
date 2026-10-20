import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

function SupervisorFeedbackCard({ items = [], onOpen }) {
  const hasItems = items.length > 0;

  return (
    <section
      className="
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200/80
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        dark:border-slate-700/80
        dark:bg-slate-900
        dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-amber-50
              text-amber-600
              dark:bg-amber-950/30
              dark:text-amber-400
            "
          >
            <AlertCircle className="h-5 w-5" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-sm
                font-bold
                text-slate-900
                dark:text-white
                sm:text-base
              "
            >
              Perlu Perhatian
            </h2>

            <p
              className="
                mt-0.5
                text-xs
                leading-relaxed
                text-slate-500
                dark:text-slate-400
              "
            >
              Bagian yang perlu diperbaiki berdasarkan review Supervisor.
            </p>
          </div>
        </div>

        {hasItems && (
          <span
            className="
              shrink-0
              rounded-full
              bg-amber-100
              px-2.5
              py-1
              text-[10px]
              font-bold
              text-amber-700
              dark:bg-amber-950/40
              dark:text-amber-400
            "
          >
            {items.length} item
          </span>
        )}
      </div>

      {/* Content */}
      <div className="border-t border-slate-100 dark:border-slate-800">
        {!hasItems ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              px-5
              py-8
              text-center
            "
          >
            <div
              className="
                mb-3
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-emerald-50
                text-emerald-600
                dark:bg-emerald-950/30
                dark:text-emerald-400
              "
            >
              <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            </div>

            <p
              className="
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
            >
              Tidak ada perbaikan
            </p>

            <p
              className="
                mt-1
                max-w-sm
                text-xs
                leading-relaxed
                text-slate-500
                dark:text-slate-400
              "
            >
              Semua laporan kamu saat ini tidak memiliki catatan perbaikan dari Supervisor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen?.(item)}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  px-4
                  py-3.5
                  text-left
                  transition-colors
                  hover:bg-slate-50
                  dark:hover:bg-slate-800/60
                  sm:px-5
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-amber-50
                    text-amber-600
                    dark:bg-amber-950/30
                    dark:text-amber-400
                  "
                >
                  <AlertCircle className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate
                      text-sm
                      font-semibold
                      text-slate-800
                      dark:text-slate-100
                    "
                  >
                    {item.title}
                  </p>

                  <p
                    className="
                      mt-0.5
                      line-clamp-2
                      text-xs
                      leading-relaxed
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {item.description}
                  </p>

                  {item.type && (
                    <span
                      className="
                        mt-1.5
                        inline-flex
                        rounded-full
                        bg-slate-100
                        px-2
                        py-0.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                        dark:bg-slate-800
                        dark:text-slate-400
                      "
                    >
                      {item.type}
                    </span>
                  )}
                </div>

                <ChevronRight
                  className="
                    h-4
                    w-4
                    shrink-0
                    text-slate-400
                  "
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SupervisorFeedbackCard;
