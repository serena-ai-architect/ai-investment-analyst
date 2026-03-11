import { safeQuery, isSupabaseConfigured, createClient } from "@/lib/supabase-server";
import { NewAnalysisForm } from "@/components/new-analysis-form";
import { ReportCard } from "@/components/report-card";
import type { Report, Usage } from "@repo/db";

export default async function DashboardPage() {
  let userName = "Demo User";
  let reports: Report[] | null = null;
  let usage: Usage | null = null;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    } catch { /* demo mode */ }

    reports = await safeQuery<Report[]>((sb) =>
      sb.from("reports").select("*").order("created_at", { ascending: false }).limit(10)
    );

    const now = new Date();
    const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    usage = await safeQuery<Usage>((sb) =>
      sb.from("usage").select("*").eq("period_start", periodStart).single()
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-[var(--muted-foreground)]">
          Welcome back, {userName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Reports This Month" value={usage?.reports_generated ?? 0} />
        <StatCard label="Tokens Used" value={formatNumber(usage?.tokens_used ?? 0)} />
        <StatCard label="LLM Cost" value={`$${(usage?.llm_cost_usd ?? 0).toFixed(2)}`} />
        <StatCard label="Total Reports" value={reports?.length ?? 0} />
      </div>

      <section>
        <h3 className="mb-4 text-lg font-semibold">New Analysis</h3>
        <NewAnalysisForm />
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold">Recent Reports</h3>
        {reports && reports.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            No reports yet. Run your first analysis above!
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
