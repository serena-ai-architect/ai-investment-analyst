import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ReportDetail } from "@/components/report-detail";
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

  return <ReportDetail report={report} />;
}
