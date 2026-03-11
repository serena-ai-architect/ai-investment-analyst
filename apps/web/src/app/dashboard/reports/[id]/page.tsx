import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ReportViewer } from "@/components/report-viewer";
import type { Report } from "@repo/db";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single() as { data: Report | null };

  if (!report) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{report.company_name}</h2>
          <p className="text-[var(--muted-foreground)]">{report.ticker}</p>
        </div>
        <div className="flex items-center gap-3">
          {report.quality_score != null && (
            <span className="rounded-lg bg-[var(--muted)] px-3 py-1 text-sm">
              Quality: <strong>{report.quality_score}/10</strong>
            </span>
          )}
          {report.risk_score != null && (
            <span className="rounded-lg bg-[var(--muted)] px-3 py-1 text-sm">
              Risk: <strong>{report.risk_score}/10</strong>
            </span>
          )}
        </div>
      </div>

      {/* Progress log for running reports */}
      {report.status === "running" && report.progress_log && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-400">
            Analysis in progress... Phase: {report.current_phase}
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-blue-600 dark:text-blue-300">
            {(report.progress_log as string[]).map((log, i) => (
              <p key={i}>{log}</p>
            ))}
          </div>
        </div>
      )}

      {/* Report content */}
      {report.status === "completed" && (
        <ReportViewer
          reportEn={report.report_en ?? ""}
          reportZh={report.report_zh ?? undefined}
        />
      )}

      {report.status === "failed" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="font-medium text-red-700 dark:text-red-400">Analysis failed</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">
            {report.current_phase ?? "Unknown error"}
          </p>
        </div>
      )}

      {report.status === "pending" && (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
          Waiting to start...
        </div>
      )}
    </div>
  );
}
