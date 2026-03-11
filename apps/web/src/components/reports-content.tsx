"use client";

import { useLang } from "./providers";
import { ReportCard } from "./report-card";
import type { Report } from "@repo/db";

export function ReportsContent({ reports }: { reports: Report[] | null }) {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("reports.title")}</h2>
        <p className="mt-1 text-[var(--muted-foreground)]">{t("reports.description")}</p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-7 w-7 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-lg font-medium">{t("reports.noReports")}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("reports.goToDashboard")}</p>
        </div>
      )}
    </div>
  );
}
