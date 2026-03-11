import { safeQuery } from "@/lib/supabase-server";
import { ReportsContent } from "@/components/reports-content";
import type { Report } from "@repo/db";

export default async function ReportsPage() {
  const reports = await safeQuery<Report[]>((sb) =>
    sb.from("reports").select("*").order("created_at", { ascending: false })
  );

  return <ReportsContent reports={reports} />;
}
