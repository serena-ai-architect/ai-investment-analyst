"use client";

import { useLang } from "./providers";
import { ReportCard } from "./report-card";
import type { Report } from "@repo/db";

export function ReportsContent({ reports }: { reports: Report[] | null }) {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("reports.title")}</h2>
        <p className="text-[var(--muted-foreground)]">{t("reports.description")}</p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-lg font-medium">{t("reports.noReports")}</p>
          <p className="mt-1 text-[var(--muted-foreground)]">
            {t("reports.goToDashboard")}
          </p>
        </div>
      )}
    </div>
  );
}
