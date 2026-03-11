"use client";

import { useLang } from "./providers";
import { NewAnalysisForm } from "./new-analysis-form";
import { ReportCard } from "./report-card";
import type { Report, Usage } from "@repo/db";

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

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
        <p className="text-[var(--muted-foreground)]">
          {t("dashboard.welcome")}, {userName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t("dashboard.reportsThisMonth")} value={usage?.reports_generated ?? 0} />
        <StatCard label={t("dashboard.tokensUsed")} value={formatNumber(usage?.tokens_used ?? 0)} />
        <StatCard label={t("dashboard.llmCost")} value={`$${(usage?.llm_cost_usd ?? 0).toFixed(2)}`} />
        <StatCard label={t("dashboard.totalReports")} value={reports?.length ?? 0} />
      </div>

      <section>
        <h3 className="mb-4 text-lg font-semibold">{t("dashboard.newAnalysis")}</h3>
        <NewAnalysisForm />
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold">{t("dashboard.recentReports")}</h3>
        {reports && reports.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            {t("dashboard.noReports")}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
