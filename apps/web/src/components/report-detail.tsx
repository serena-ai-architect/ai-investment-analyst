"use client";

import { useLang } from "./providers";
import { ReportViewer } from "./report-viewer";
import type { Report } from "@repo/db";

export function ReportDetail({ report }: { report: Report }) {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{report.company_name}</h2>
            <p className="mt-0.5 font-mono text-sm text-[var(--muted-foreground)]">{report.ticker}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {report.quality_score != null && (
              <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm dark:bg-emerald-900/20">
                <span className="text-[var(--muted-foreground)]">{t("reports.quality")}</span>
                <span className="ml-1.5 font-bold text-emerald-700 dark:text-emerald-400">{report.quality_score}/10</span>
              </div>
            )}
            {report.risk_score != null && (
              <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm dark:bg-amber-900/20">
                <span className="text-[var(--muted-foreground)]">{t("reports.risk")}</span>
                <span className="ml-1.5 font-bold text-amber-700 dark:text-amber-400">{report.risk_score}/10</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress log for running reports */}
      {report.status === "running" && report.progress_log && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              {t("reports.inProgress")}: {report.current_phase}
            </p>
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-blue-100/50 p-3 font-mono text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {(report.progress_log as string[]).map((log, i) => (
              <p key={i}>{log}</p>
            ))}
          </div>
        </div>
      )}

      {/* Report content */}
      {report.status === "completed" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] md:p-8">
          <ReportViewer
            reportEn={report.report_en ?? ""}
            reportZh={report.report_zh ?? undefined}
          />
        </div>
      )}

      {report.status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="font-semibold text-red-700 dark:text-red-400">{t("reports.failed")}</p>
          </div>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {report.current_phase ?? "Unknown error"}
          </p>
        </div>
      )}

      {report.status === "pending" && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-6 w-6 animate-pulse text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">{t("status.pending")}...</p>
        </div>
      )}
    </div>
  );
}
