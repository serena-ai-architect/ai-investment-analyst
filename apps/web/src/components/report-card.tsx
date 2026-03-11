"use client";

import Link from "next/link";
import type { Report } from "@repo/db";
import { useLang } from "./providers";
import type { TranslationKey } from "@/lib/i18n";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; labelKey: TranslationKey }> = {
  pending: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", labelKey: "status.pending" },
  running: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", labelKey: "status.running" },
  completed: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", labelKey: "status.completed" },
  failed: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", labelKey: "status.failed" },
};

export function ReportCard({ report }: { report: Report }) {
  const { t, locale } = useLang();
  const status = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
  const date = report.completed_at ?? report.created_at;
  const formatted = new Date(date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/dashboard/reports/${report.id}`}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-[var(--primary)]/30 hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold transition-colors group-hover:text-[var(--primary)]">
            {report.company_name}
          </h4>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{report.ticker}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {t(status.labelKey)}
        </span>
      </div>

      {report.executive_summary && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {report.executive_summary}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
        <span>{formatted}</span>
        {report.quality_score != null && (
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--muted)] px-2 py-0.5 font-medium">
            {t("reports.quality")} {report.quality_score}/10
          </span>
        )}
        {report.risk_score != null && (
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--muted)] px-2 py-0.5 font-medium">
            {t("reports.risk")} {report.risk_score}/10
          </span>
        )}
      </div>
    </Link>
  );
}
