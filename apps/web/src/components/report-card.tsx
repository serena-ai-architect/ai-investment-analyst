"use client";

import Link from "next/link";
import type { Report } from "@repo/db";
import { useLang } from "./providers";
import type { TranslationKey } from "@/lib/i18n";

const STATUS_STYLES: Record<string, { bg: string; text: string; labelKey: TranslationKey }> = {
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", labelKey: "status.pending" },
  running: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", labelKey: "status.running" },
  completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", labelKey: "status.completed" },
  failed: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", labelKey: "status.failed" },
};

export function ReportCard({ report }: { report: Report }) {
  const { t, locale } = useLang();
  const status = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;
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
      className="group block rounded-lg border border-[var(--border)] p-4 transition-colors hover:bg-[var(--muted)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold group-hover:text-[var(--primary)]">{report.company_name}</h4>
          <p className="text-sm text-[var(--muted-foreground)]">{report.ticker}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}>
          {t(status.labelKey)}
        </span>
      </div>

      {report.executive_summary && (
        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
          {report.executive_summary}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span>{formatted}</span>
        {report.quality_score != null && <span>{t("reports.quality")}: {report.quality_score}/10</span>}
        {report.risk_score != null && <span>{t("reports.risk")}: {report.risk_score}/10</span>}
      </div>
    </Link>
  );
}
