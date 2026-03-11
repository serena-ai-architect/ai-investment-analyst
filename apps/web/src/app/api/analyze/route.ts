import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { company, mode = "full" } = body;

  if (!company || typeof company !== "string") {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  // Guess ticker from company name
  const ticker = guessTickerFromCompany(company);

  // Create report record in pending state
  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      company_name: company,
      ticker: ticker ?? company.toUpperCase(),
      status: "pending",
      progress_log: [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // In Phase 2, this will trigger an Inngest background job.
  // For now, we run the analysis inline (blocking).
  // This is acceptable for Phase 1 MVP.
  runAnalysisInBackground(report.id, company, mode, supabase);

  return NextResponse.json({ reportId: report.id });
}

/**
 * Run analysis and update the report record.
 * In Phase 2 this becomes an Inngest function.
 */
async function runAnalysisInBackground(
  reportId: string,
  company: string,
  mode: "quick" | "full",
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    // Mark as running
    await supabase
      .from("reports")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", reportId);

    // Import and run the analysis engine
    const { runAnalysis } = await import("@repo/core");
    const result = await runAnalysis({ company, mode, stream: false });

    // Extract executive summary (first paragraph after # heading)
    const summaryMatch = result.reportEn.match(/## 1\. Executive Summary\n\n([\s\S]*?)(?=\n## )/);
    const executiveSummary = summaryMatch?.[1]?.trim().slice(0, 500) ?? null;

    // Update report with results
    await supabase
      .from("reports")
      .update({
        status: "completed",
        report_en: result.reportEn,
        report_zh: result.reportZh ?? null,
        executive_summary: executiveSummary,
        quality_score: result.qualityScore,
        risk_score: result.riskScore,
        progress_log: result.logs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

  } catch (e) {
    await supabase
      .from("reports")
      .update({
        status: "failed",
        current_phase: String(e),
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId);
  }
}

const TICKER_MAP: Record<string, string> = {
  nvidia: "NVDA", apple: "AAPL", google: "GOOGL", alphabet: "GOOGL",
  microsoft: "MSFT", amazon: "AMZN", meta: "META", tesla: "TSLA",
  amd: "AMD", intel: "INTC", micron: "MU", alibaba: "BABA",
  tencent: "0700.HK", byd: "1211.HK", xiaomi: "1810.HK",
};

function guessTickerFromCompany(company: string): string | null {
  const lower = company.toLowerCase().trim();
  if (TICKER_MAP[lower]) return TICKER_MAP[lower];
  for (const [key, ticker] of Object.entries(TICKER_MAP)) {
    if (lower.includes(key)) return ticker;
  }
  if (/^[A-Z]{1,5}$/.test(company.trim())) return company.trim();
  return null;
}
