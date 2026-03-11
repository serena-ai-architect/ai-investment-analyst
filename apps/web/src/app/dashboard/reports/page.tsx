import { safeQuery } from "@/lib/supabase-server";
import { ReportsContent } from "@/components/reports-content";
import { DEMO_REPORTS } from "@/lib/demo-data";
import type { Report } from "@repo/db";

export default async function ReportsPage() {
  let reports = await safeQuery<Report[]>((sb) =>
    sb.from("reports").select("*").order("created_at", { ascending: false })
  );

  // Fall back to demo data
  if (!reports) reports = DEMO_REPORTS;

  return <ReportsContent reports={reports} />;
}
