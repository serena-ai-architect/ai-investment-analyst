import { safeQuery, isSupabaseConfigured, createClient } from "@/lib/supabase-server";
import { DashboardContent } from "@/components/dashboard-content";
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

  return <DashboardContent userName={userName} reports={reports} usage={usage} />;
}
