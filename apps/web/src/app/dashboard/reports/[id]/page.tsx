import { notFound } from "next/navigation";
import { isSupabaseConfigured, createClient } from "@/lib/supabase-server";
import { ReportDetail } from "@/components/report-detail";
import { DEMO_REPORTS } from "@/lib/demo-data";
import type { Report } from "@repo/db";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let report: Report | null = null;

  // Try Supabase first
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single() as { data: Report | null };
      report = data;
    } catch { /* demo mode fallback */ }
  }

  // Fall back to demo data
  if (!report) {
    report = DEMO_REPORTS.find((r) => r.id === id) ?? null;
  }

  if (!report) notFound();

  return <ReportDetail report={report} />;
}
