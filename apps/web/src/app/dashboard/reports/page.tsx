import { safeQuery } from "@/lib/supabase-server";
import { ReportCard } from "@/components/report-card";
import type { Report } from "@repo/db";

export default async function ReportsPage() {
  const reports = await safeQuery<Report[]>((sb) =>
    sb.from("reports").select("*").order("created_at", { ascending: false })
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-[var(--muted-foreground)]">All your investment analysis reports</p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-lg font-medium">No reports yet</p>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Go to the dashboard to run your first analysis.
          </p>
        </div>
      )}
    </div>
  );
}
