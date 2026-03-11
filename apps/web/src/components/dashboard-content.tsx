"use client";

import { useLang } from "./providers";
import { NewAnalysisForm } from "./new-analysis-form";
import { ReportCard } from "./report-card";
import type { Report, Usage } from "@repo/db";
import type { TranslationKey } from "@/lib/i18n";

const STAT_CONFIG: { key: TranslationKey; color: string; icon: string }[] = [
  { key: "dashboard.reportsThisMonth", color: "from-indigo-500 to-purple-500", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "dashboard.tokensUsed", color: "from-blue-500 to-cyan-500", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { key: "dashboard.llmCost", color: "from-emerald-500 to-teal-500", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "dashboard.totalReports", color: "from-amber-500 to-orange-500", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
];

export function DashboardContent({
  userName,
  reports,
  usage,
}: {
  userName: string;
  reports: Report[] | null;
  usage: Usage | null;
}) {
  const { t } = useLang();

  const statValues = [
    usage?.reports_generated ?? 0,
    formatNumber(usage?.tokens_used ?? 0),
    `$${(usage?.llm_cost_usd ?? 0).toFixed(2)}`,
    reports?.length ?? 0,
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">
          {t("dashboard.welcome")}, {userName}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CONFIG.map((stat, i) => (
          <div
            key={stat.key}
            className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] transition-all duration-200 hover:shadow-[var(--shadow-md)]"
          >
            <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-4 translate-x-4 rounded-full bg-gradient-to-br ${stat.color} opacity-10 transition-transform duration-300 group-hover:scale-125`} />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} opacity-90`}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{t(stat.key)}</p>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{statValues[i]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New Analysis */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--gradient-from)] to-[var(--gradient-to)]" />
          <h3 className="text-lg font-semibold">{t("dashboard.newAnalysis")}</h3>
        </div>
        <NewAnalysisForm demoReportIds={reports?.filter(r => r.status === "completed").map(r => r.id)} />
      </section>

      {/* Recent Reports */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[var(--gradient-from)] to-[var(--gradient-to)]" />
          <h3 className="text-lg font-semibold">{t("dashboard.recentReports")}</h3>
        </div>
        {reports && reports.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
              <svg className="h-6 w-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{t("dashboard.noReports")}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
