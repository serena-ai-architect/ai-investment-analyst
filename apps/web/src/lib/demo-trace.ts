import type { PipelineEvent } from "@repo/core";

export interface DemoTraceItem {
  /** Cumulative delay from pipeline start in ms */
  delayMs: number;
  event: PipelineEvent;
}

/**
 * Pre-recorded pipeline trace for NVIDIA analysis demo.
 * Simulates a full-mode run with 9 nodes, PRM scores, one reflexion retry,
 * and realistic timing. Used by useDemoPlayback for portfolio visitors.
 */
export const DEMO_TRACE: DemoTraceItem[] = [
  // ── Planning ─────────────────────────────────────
  { delayMs: 0, event: { type: "node_start", node: "planning", timestamp: "2026-03-22T10:00:00.000Z" } },
  { delayMs: 500, event: { type: "log", node: "planning", message: "[10:00:00] 📋 Creating dynamic execution plan for NVIDIA...", timestamp: "2026-03-22T10:00:00.500Z" } },
  { delayMs: 2200, event: { type: "log", node: "planning", message: "[10:00:02] 📋 Dynamic plan created: 8 tasks (3 critical, 2 high, 2 medium, 1 low)", timestamp: "2026-03-22T10:00:02.200Z" } },
  { delayMs: 2800, event: { type: "phase_change", phase: "planned", timestamp: "2026-03-22T10:00:02.800Z" } },
  { delayMs: 3000, event: { type: "node_end", node: "planning", timestamp: "2026-03-22T10:00:03.000Z", durationMs: 3000 } },

  // ── Notion Context ───────────────────────────────
  { delayMs: 3200, event: { type: "node_start", node: "notionContext", timestamp: "2026-03-22T10:00:03.200Z" } },
  { delayMs: 3800, event: { type: "log", node: "notionContext", message: "[10:00:03] 📚 Fetching historical context from Notion...", timestamp: "2026-03-22T10:00:03.800Z" } },
  { delayMs: 5000, event: { type: "log", node: "notionContext", message: "[10:00:05] 📚 Found 2 previous NVIDIA analyses (2025-12, 2026-01)", timestamp: "2026-03-22T10:00:05.000Z" } },
  { delayMs: 5500, event: { type: "phase_change", phase: "context_loaded", timestamp: "2026-03-22T10:00:05.500Z" } },
  { delayMs: 5700, event: { type: "node_end", node: "notionContext", timestamp: "2026-03-22T10:00:05.700Z", durationMs: 2500 } },

  // ── Research ─────────────────────────────────────
  { delayMs: 6000, event: { type: "node_start", node: "research", timestamp: "2026-03-22T10:00:06.000Z" } },
  { delayMs: 6500, event: { type: "log", node: "research", message: "[10:00:06] 🔍 Web Researcher starting: NVIDIA earnings, product pipeline, market position", timestamp: "2026-03-22T10:00:06.500Z" } },
  { delayMs: 9000, event: { type: "log", node: "research", message: "[10:00:09] 🔍 Web Researcher: found 12 sources (SEC filings, analyst reports, news)", timestamp: "2026-03-22T10:00:09.000Z" } },
  { delayMs: 12000, event: { type: "log", node: "research", message: "[10:00:12] 📊 Data Collector: pulling financial data — revenue, margins, guidance", timestamp: "2026-03-22T10:00:12.000Z" } },
  { delayMs: 16000, event: { type: "log", node: "research", message: "[10:00:16] 🧠 Synthesizer: consolidating research data, resolving contradictions", timestamp: "2026-03-22T10:00:16.000Z" } },
  { delayMs: 19000, event: { type: "log", node: "research", message: "[10:00:19] ✅ Research complete: 18 sources, comprehensive data coverage", timestamp: "2026-03-22T10:00:19.000Z" } },
  { delayMs: 19500, event: { type: "prm_score", node: "research", score: 8.4, dimensions: { coverage: 9, recency: 8, sourceQuality: 8, contradictionHandling: 8 }, recommendation: "proceed", timestamp: "2026-03-22T10:00:19.500Z" } },
  { delayMs: 20000, event: { type: "phase_change", phase: "research_complete", timestamp: "2026-03-22T10:00:20.000Z" } },
  { delayMs: 20200, event: { type: "node_end", node: "research", timestamp: "2026-03-22T10:00:20.200Z", durationMs: 14200 } },

  // ── Analysis (3 parallel analysts) ───────────────
  { delayMs: 20500, event: { type: "node_start", node: "analysis", timestamp: "2026-03-22T10:00:20.500Z" } },
  { delayMs: 21000, event: { type: "log", node: "analysis", message: "[10:00:21] 💰 Financial Analyst: analyzing revenue growth, margins, valuation multiples", timestamp: "2026-03-22T10:00:21.000Z" } },
  { delayMs: 21500, event: { type: "log", node: "analysis", message: "[10:00:21] 📈 Market Analyst: evaluating AI chip TAM, competitive moat, customer concentration", timestamp: "2026-03-22T10:00:21.500Z" } },
  { delayMs: 22000, event: { type: "log", node: "analysis", message: "[10:00:22] 🔬 Tech Analyst: assessing CUDA ecosystem, Blackwell architecture, software stack", timestamp: "2026-03-22T10:00:22.000Z" } },
  { delayMs: 28000, event: { type: "log", node: "analysis", message: "[10:00:28] 💰 Financial: revenue $130.5B (TTM), gross margin 74.8%, P/E 55x", timestamp: "2026-03-22T10:00:28.000Z" } },
  { delayMs: 30000, event: { type: "log", node: "analysis", message: "[10:00:30] 📈 Market: AI accelerator TAM $400B by 2028, NVIDIA share ~80%", timestamp: "2026-03-22T10:00:30.000Z" } },
  { delayMs: 32000, event: { type: "log", node: "analysis", message: "[10:00:32] 🔬 Tech: Blackwell GB200 NVL72 — 30x inference improvement over Hopper", timestamp: "2026-03-22T10:00:32.000Z" } },
  { delayMs: 33000, event: { type: "prm_score", node: "financial_analysis", score: 8.8, dimensions: { accuracy: 9, valuationRigor: 9, trendAnalysis: 8, margins: 9 }, recommendation: "proceed", timestamp: "2026-03-22T10:00:33.000Z" } },
  { delayMs: 33500, event: { type: "prm_score", node: "market_analysis", score: 8.2, dimensions: { tamDefined: 9, moatArticulated: 8, competitorsNamed: 8, customerConcentration: 8 }, recommendation: "proceed", timestamp: "2026-03-22T10:00:33.500Z" } },
  { delayMs: 34000, event: { type: "prm_score", node: "tech_analysis", score: 9.0, dimensions: { architectureDepth: 9, ecosystemBreadth: 9, roadmapClarity: 9, competitiveEdge: 9 }, recommendation: "proceed", timestamp: "2026-03-22T10:00:34.000Z" } },
  { delayMs: 34500, event: { type: "phase_change", phase: "analysis_complete", timestamp: "2026-03-22T10:00:34.500Z" } },
  { delayMs: 35000, event: { type: "node_end", node: "analysis", timestamp: "2026-03-22T10:00:35.000Z", durationMs: 14500 } },

  // ── Risk Assessment ──────────────────────────────
  { delayMs: 35300, event: { type: "node_start", node: "risk", timestamp: "2026-03-22T10:00:35.300Z" } },
  { delayMs: 36000, event: { type: "log", node: "risk", message: "[10:00:36] 🛡️ Risk Crew: evaluating 6 risk dimensions for NVIDIA", timestamp: "2026-03-22T10:00:36.000Z" } },
  { delayMs: 40000, event: { type: "log", node: "risk", message: "[10:00:40] 🛡️ Risks scored: valuation (7/10), concentration (6/10), geopolitical (5/10), competition (4/10), regulatory (3/10), execution (2/10)", timestamp: "2026-03-22T10:00:40.000Z" } },
  { delayMs: 42000, event: { type: "prm_score", node: "risk_assessment", score: 8.0, dimensions: { dimensionCount: 9, likelihoodImpact: 8, companySpecific: 8, mitigations: 7 }, recommendation: "proceed", timestamp: "2026-03-22T10:00:42.000Z" } },
  { delayMs: 42500, event: { type: "phase_change", phase: "risk_complete", timestamp: "2026-03-22T10:00:42.500Z" } },
  { delayMs: 43000, event: { type: "node_end", node: "risk", timestamp: "2026-03-22T10:00:43.000Z", durationMs: 7700 } },

  // ── Report Generation (attempt 1) ────────────────
  { delayMs: 43300, event: { type: "node_start", node: "report", timestamp: "2026-03-22T10:00:43.300Z" } },
  { delayMs: 44000, event: { type: "log", node: "report", message: "[10:00:44] 📝 ReportWriter: generating investment report (EN) — attempt 1", timestamp: "2026-03-22T10:00:44.000Z" } },
  { delayMs: 50000, event: { type: "log", node: "report", message: "[10:00:50] 📝 Report draft complete: 2,847 words, 6 sections", timestamp: "2026-03-22T10:00:50.000Z" } },
  { delayMs: 51000, event: { type: "prm_score", node: "report_generation", score: 6.8, dimensions: { sectionsPresent: 8, dataSynthesis: 7, recommendation: 6, writingQuality: 6 }, recommendation: "proceed", timestamp: "2026-03-22T10:00:51.000Z" } },
  { delayMs: 52000, event: { type: "phase_change", phase: "report_generated", timestamp: "2026-03-22T10:00:52.000Z" } },
  { delayMs: 52200, event: { type: "node_end", node: "report", timestamp: "2026-03-22T10:00:52.200Z", durationMs: 8900 } },

  // ── Reflexion (attempt 1 — triggers retry) ───────
  { delayMs: 52500, event: { type: "node_start", node: "reflexion", timestamp: "2026-03-22T10:00:52.500Z" } },
  { delayMs: 53000, event: { type: "log", node: "reflexion", message: "[10:00:53] 🪞 Reflexion: evaluating report quality (attempt 1)...", timestamp: "2026-03-22T10:00:53.000Z" } },
  { delayMs: 56000, event: { type: "reflexion", score: 6.2, shouldRetry: true, actionItems: ["Strengthen recommendation with specific price targets", "Add more quantitative comparisons to AMD/Intel", "Improve risk-reward framing in executive summary"], attempt: 1, timestamp: "2026-03-22T10:00:56.000Z" } },
  { delayMs: 56500, event: { type: "log", node: "reflexion", message: "[10:00:56] 🪞 Score: 6.2/10 — below threshold (7.0), retrying report generation", timestamp: "2026-03-22T10:00:56.500Z" } },
  { delayMs: 57000, event: { type: "node_end", node: "reflexion", timestamp: "2026-03-22T10:00:57.000Z", durationMs: 4500 } },

  // ── Report Generation (attempt 2 — improved) ─────
  { delayMs: 57300, event: { type: "node_start", node: "report", timestamp: "2026-03-22T10:00:57.300Z" } },
  { delayMs: 58000, event: { type: "log", node: "report", message: "[10:00:58] 📝 ReportWriter: regenerating with reflexion feedback — attempt 2", timestamp: "2026-03-22T10:00:58.000Z" } },
  { delayMs: 60000, event: { type: "log", node: "report", message: "[10:01:00] 📝 Incorporating: price targets, competitive benchmarks, risk-reward framework", timestamp: "2026-03-22T10:01:00.000Z" } },
  { delayMs: 65000, event: { type: "log", node: "report", message: "[10:01:05] 📝 Improved report: 3,412 words, actionable recommendation added", timestamp: "2026-03-22T10:01:05.000Z" } },
  { delayMs: 66000, event: { type: "prm_score", node: "report_generation", score: 8.5, dimensions: { sectionsPresent: 9, dataSynthesis: 8, recommendation: 9, writingQuality: 8 }, recommendation: "proceed", timestamp: "2026-03-22T10:01:06.000Z" } },
  { delayMs: 66500, event: { type: "node_end", node: "report", timestamp: "2026-03-22T10:01:06.500Z", durationMs: 9200 } },

  // ── Reflexion (attempt 2 — passes) ───────────────
  { delayMs: 67000, event: { type: "node_start", node: "reflexion", timestamp: "2026-03-22T10:01:07.000Z" } },
  { delayMs: 67500, event: { type: "log", node: "reflexion", message: "[10:01:07] 🪞 Reflexion: evaluating report quality (attempt 2)...", timestamp: "2026-03-22T10:01:07.500Z" } },
  { delayMs: 70000, event: { type: "reflexion", score: 8.2, shouldRetry: false, actionItems: ["Minor: could add semiconductor cycle context"], attempt: 2, timestamp: "2026-03-22T10:01:10.000Z" } },
  { delayMs: 70500, event: { type: "log", node: "reflexion", message: "[10:01:10] 🪞 Score: 8.2/10 — above threshold, proceeding to delivery", timestamp: "2026-03-22T10:01:10.500Z" } },
  { delayMs: 71000, event: { type: "phase_change", phase: "reflexion_complete", timestamp: "2026-03-22T10:01:11.000Z" } },
  { delayMs: 71200, event: { type: "node_end", node: "reflexion", timestamp: "2026-03-22T10:01:11.200Z", durationMs: 4200 } },

  // ── Delivery ─────────────────────────────────────
  { delayMs: 71500, event: { type: "node_start", node: "delivery", timestamp: "2026-03-22T10:01:11.500Z" } },
  { delayMs: 72000, event: { type: "log", node: "delivery", message: "[10:01:12] 📤 Saving report to Notion...", timestamp: "2026-03-22T10:01:12.000Z" } },
  { delayMs: 74000, event: { type: "log", node: "delivery", message: "[10:01:14] 📤 Notion: saved ✓ | Sending email report...", timestamp: "2026-03-22T10:01:14.000Z" } },
  { delayMs: 76000, event: { type: "log", node: "delivery", message: "[10:01:16] 📤 Email: sent ✓ | Delivery complete: notion=true, email=true", timestamp: "2026-03-22T10:01:16.000Z" } },
  { delayMs: 76500, event: { type: "phase_change", phase: "delivered", timestamp: "2026-03-22T10:01:16.500Z" } },
  { delayMs: 77000, event: { type: "node_end", node: "delivery", timestamp: "2026-03-22T10:01:17.000Z", durationMs: 5500 } },

  // ── Finalize ─────────────────────────────────────
  { delayMs: 77300, event: { type: "node_start", node: "finalize", timestamp: "2026-03-22T10:01:17.300Z" } },
  { delayMs: 78000, event: { type: "log", node: "finalize", message: "[10:01:18] 📊 PRM Summary: avg 8.3/10, weakest step: report_generation (attempt 1)", timestamp: "2026-03-22T10:01:18.000Z" } },
  { delayMs: 78500, event: { type: "cost_update", totalCost: 0.34, totalTokens: 158420, byAgent: { planner: 0.02, researcher: 0.08, dataCollector: 0.04, synthesizer: 0.03, financialAnalyst: 0.04, marketAnalyst: 0.03, techAnalyst: 0.03, riskCrew: 0.03, reportWriter: 0.03, reflexion: 0.01 }, timestamp: "2026-03-22T10:01:18.500Z" } },
  { delayMs: 79000, event: { type: "log", node: "finalize", message: "[10:01:19] ✅ Pipeline complete — quality: 8.2/10, risk: 6.5/10, cost: $0.34", timestamp: "2026-03-22T10:01:19.000Z" } },
  { delayMs: 79500, event: { type: "phase_change", phase: "completed", timestamp: "2026-03-22T10:01:19.500Z" } },
  { delayMs: 80000, event: { type: "node_end", node: "finalize", timestamp: "2026-03-22T10:01:20.000Z", durationMs: 2700 } },

  // ── Pipeline Complete ────────────────────────────
  { delayMs: 80500, event: { type: "pipeline_complete", qualityScore: 8.2, riskScore: 6.5, durationMs: 80500, timestamp: "2026-03-22T10:01:20.500Z" } },
];

// ═══════════════════════════════════════════════════════════════
// Dynamic Demo Trace Generator — works with ANY company name
// ═══════════════════════════════════════════════════════════════

const HK_TICKER_PATTERNS = [".HK", "0700", "1211", "1810", "3690", "9988", "9618"];

/** Detect if a company name/ticker likely refers to an HK-listed company */
function isHKCompany(company: string): boolean {
  const upper = company.toUpperCase();
  if (HK_TICKER_PATTERNS.some((p) => upper.includes(p))) return true;
  const hkNames = ["tencent", "byd", "xiaomi", "meituan", "alibaba hk", "jd hk", "netease", "baidu",
    "腾讯", "比亚迪", "小米", "美团", "阿里巴巴", "京东", "网易", "百度"];
  return hkNames.some((n) => company.toLowerCase().includes(n));
}

/**
 * Generate a realistic demo trace for any company name.
 * HK companies get compliance skill invocation events.
 */
export function generateDemoTrace(company: string): { trace: DemoTraceItem[]; qualityScore: number; riskScore: number } {
  const hk = isHKCompany(company);
  const ts = (offset: number) => new Date(Date.now() + offset).toISOString();
  const qualityScore = 7.8 + Math.random() * 1.2; // 7.8-9.0
  const riskScore = 4.5 + Math.random() * 2.5;    // 4.5-7.0

  const trace: DemoTraceItem[] = [
    // ── Planning ──
    { delayMs: 0, event: { type: "node_start", node: "planning", timestamp: ts(0) } },
    { delayMs: 500, event: { type: "log", node: "planning", message: `[Planning] Creating execution plan for ${company}...`, timestamp: ts(500) } },
    { delayMs: 2500, event: { type: "log", node: "planning", message: `[Planning] Plan created: ${hk ? 9 : 8} tasks${hk ? " (including HK regulatory analysis)" : ""}`, timestamp: ts(2500) } },
    { delayMs: 3000, event: { type: "phase_change", phase: "planned", timestamp: ts(3000) } },
    { delayMs: 3200, event: { type: "node_end", node: "planning", timestamp: ts(3200), durationMs: 3200 } },

    // ── Context ──
    { delayMs: 3500, event: { type: "node_start", node: "notionContext", timestamp: ts(3500) } },
    { delayMs: 5000, event: { type: "log", node: "notionContext", message: `[Context] Searching for past analyses of ${company}...`, timestamp: ts(5000) } },
    { delayMs: 5500, event: { type: "node_end", node: "notionContext", timestamp: ts(5500), durationMs: 2000 } },

    // ── Research ──
    { delayMs: 6000, event: { type: "node_start", node: "research", timestamp: ts(6000) } },
    { delayMs: 7000, event: { type: "log", node: "research", message: `[Research] Web Researcher: gathering data on ${company}...`, timestamp: ts(7000) } },
    ...(hk ? [
      { delayMs: 10000, event: { type: "skill_invocation" as const, skill: "search_hkex_filings", provider: "fin-intel-mcp", node: "research", timestamp: ts(10000) } },
      { delayMs: 11000, event: { type: "log" as const, node: "research", message: `[Research] HKEX filings retrieved for ${company}`, timestamp: ts(11000) } },
    ] : []),
    { delayMs: 14000, event: { type: "log", node: "research", message: `[Research] Data Collector: financial metrics retrieved`, timestamp: ts(14000) } },
    { delayMs: 17000, event: { type: "log", node: "research", message: `[Research] Synthesizer: consolidating ${hk ? 15 : 18} sources`, timestamp: ts(17000) } },
    { delayMs: 18000, event: { type: "prm_score", node: "research", score: 8.2 + Math.random() * 0.8, dimensions: { coverage: 9, recency: 8, sourceQuality: 8, contradictionHandling: 8 }, recommendation: "proceed", timestamp: ts(18000) } },
    { delayMs: 18500, event: { type: "phase_change", phase: "research_complete", timestamp: ts(18500) } },
    { delayMs: 19000, event: { type: "node_end", node: "research", timestamp: ts(19000), durationMs: 13000 } },

    // ── Analysis ──
    { delayMs: 19500, event: { type: "node_start", node: "analysis", timestamp: ts(19500) } },
    { delayMs: 20500, event: { type: "log", node: "analysis", message: `[Analysis] Financial Analyst: analyzing ${company} fundamentals`, timestamp: ts(20500) } },
    { delayMs: 23000, event: { type: "log", node: "analysis", message: `[Analysis] Market Analyst: evaluating competitive moat`, timestamp: ts(23000) } },
    { delayMs: 26000, event: { type: "log", node: "analysis", message: `[Analysis] Tech Analyst: assessing technology stack`, timestamp: ts(26000) } },
    { delayMs: 28000, event: { type: "prm_score", node: "financial_analysis", score: 8.0 + Math.random(), dimensions: { accuracy: 9, valuationRigor: 8, trendAnalysis: 8, margins: 8 }, recommendation: "proceed", timestamp: ts(28000) } },
    { delayMs: 29000, event: { type: "phase_change", phase: "analysis_complete", timestamp: ts(29000) } },
    { delayMs: 29500, event: { type: "node_end", node: "analysis", timestamp: ts(29500), durationMs: 10000 } },

    // ── Risk + Compliance ──
    { delayMs: 30000, event: { type: "node_start", node: "risk", timestamp: ts(30000) } },
    { delayMs: 31000, event: { type: "log", node: "risk", message: `[Risk] Evaluating ${hk ? 6 : 5} risk dimensions for ${company}`, timestamp: ts(31000) } },
    ...(hk ? [
      { delayMs: 33000, event: { type: "skill_invocation" as const, skill: "check_hk_compliance", provider: "fin-intel-mcp", node: "risk", timestamp: ts(33000) } },
      { delayMs: 34000, event: { type: "log" as const, node: "risk", message: `[Compliance] HK regulatory: HKMA, SFC, PDPO rules checked`, timestamp: ts(34000) } },
      { delayMs: 35000, event: { type: "skill_invocation" as const, skill: "assess_cross_border_risk", provider: "fin-intel-mcp", node: "risk", timestamp: ts(35000) } },
      { delayMs: 36000, event: { type: "log" as const, node: "risk", message: `[Compliance] Cross-border risk: data localization, capital flow assessed`, timestamp: ts(36000) } },
    ] : []),
    { delayMs: 38000, event: { type: "prm_score", node: "risk_assessment", score: 7.8 + Math.random() * 0.8, dimensions: { dimensionCount: 9, likelihoodImpact: 8, companySpecific: 8, mitigations: 7 }, recommendation: "proceed", timestamp: ts(38000) } },
    { delayMs: 38500, event: { type: "node_end", node: "risk", timestamp: ts(38500), durationMs: 8500 } },

    // ── Report (attempt 1) ──
    { delayMs: 39000, event: { type: "node_start", node: "report", timestamp: ts(39000) } },
    { delayMs: 40000, event: { type: "log", node: "report", message: `[Report] Generating ${company} investment report — attempt 1`, timestamp: ts(40000) } },
    { delayMs: 47000, event: { type: "prm_score", node: "report_generation", score: 6.5 + Math.random() * 0.5, dimensions: { sectionsPresent: 7, dataSynthesis: 7, recommendation: 6, writingQuality: 6 }, recommendation: "proceed", timestamp: ts(47000) } },
    { delayMs: 47500, event: { type: "node_end", node: "report", timestamp: ts(47500), durationMs: 8500 } },

    // ── Reflexion (attempt 1 — retry) ──
    { delayMs: 48000, event: { type: "node_start", node: "reflexion", timestamp: ts(48000) } },
    { delayMs: 51000, event: { type: "reflexion", score: 6.5, shouldRetry: true, actionItems: [
      "Strengthen recommendation with specific price targets",
      hk ? "Add HK regulatory analysis with HKMA/SFC citations" : "Add more competitive analysis depth",
      "Improve executive summary clarity",
    ], attempt: 1, timestamp: ts(51000) } },
    { delayMs: 51500, event: { type: "log", node: "reflexion", message: `[Reflexion] Score: 6.5/10 — below threshold, retrying`, timestamp: ts(51500) } },
    { delayMs: 52000, event: { type: "node_end", node: "reflexion", timestamp: ts(52000), durationMs: 4000 } },

    // ── Report (attempt 2 — improved) ──
    { delayMs: 52500, event: { type: "node_start", node: "report", timestamp: ts(52500) } },
    { delayMs: 53500, event: { type: "log", node: "report", message: `[Report] Regenerating with reflexion feedback — attempt 2`, timestamp: ts(53500) } },
    { delayMs: 60000, event: { type: "prm_score", node: "report_generation", score: +(qualityScore.toFixed(1)), dimensions: { sectionsPresent: 9, dataSynthesis: 8, recommendation: 8, writingQuality: 8 }, recommendation: "proceed", timestamp: ts(60000) } },
    { delayMs: 60500, event: { type: "node_end", node: "report", timestamp: ts(60500), durationMs: 8000 } },

    // ── Reflexion (attempt 2 — passes) ──
    { delayMs: 61000, event: { type: "node_start", node: "reflexion", timestamp: ts(61000) } },
    { delayMs: 64000, event: { type: "reflexion", score: +qualityScore.toFixed(1), shouldRetry: false, actionItems: ["Minor improvements possible"], attempt: 2, timestamp: ts(64000) } },
    { delayMs: 64500, event: { type: "log", node: "reflexion", message: `[Reflexion] Score: ${qualityScore.toFixed(1)}/10 — above threshold, proceeding`, timestamp: ts(64500) } },
    { delayMs: 65000, event: { type: "node_end", node: "reflexion", timestamp: ts(65000), durationMs: 4000 } },

    // ── Delivery ──
    { delayMs: 65500, event: { type: "node_start", node: "delivery", timestamp: ts(65500) } },
    { delayMs: 68000, event: { type: "log", node: "delivery", message: `[Delivery] ${company} report: Notion saved, Email sent`, timestamp: ts(68000) } },
    { delayMs: 69000, event: { type: "node_end", node: "delivery", timestamp: ts(69000), durationMs: 3500 } },

    // ── Finalize ──
    { delayMs: 69500, event: { type: "node_start", node: "finalize", timestamp: ts(69500) } },
    { delayMs: 70500, event: { type: "cost_update", totalCost: +(0.2 + Math.random() * 0.2).toFixed(2), totalTokens: Math.round(120000 + Math.random() * 40000), byAgent: { planner: 0.02, researcher: 0.06, dataCollector: 0.03, synthesizer: 0.02, financialAnalyst: 0.03, marketAnalyst: 0.03, techAnalyst: 0.02, riskAnalyst: 0.02, complianceAnalyst: hk ? 0.03 : 0.01, reportWriter: 0.02, reflexion: 0.01 }, timestamp: ts(70500) } },
    { delayMs: 71000, event: { type: "phase_change", phase: "completed", timestamp: ts(71000) } },
    { delayMs: 71500, event: { type: "node_end", node: "finalize", timestamp: ts(71500), durationMs: 2000 } },

    // ── Complete ──
    { delayMs: 72000, event: { type: "pipeline_complete", qualityScore: +qualityScore.toFixed(1), riskScore: +riskScore.toFixed(1), durationMs: 72000, timestamp: ts(72000) } },
  ];

  return { trace, qualityScore: +qualityScore.toFixed(1), riskScore: +riskScore.toFixed(1) };
}

/**
 * Pre-recorded pipeline trace for Tencent (0700.HK) analysis demo.
 * Showcases HK regulatory compliance skills and cross-border risk assessment.
 */
export const DEMO_TRACE_HK: DemoTraceItem[] = [
  // ── Planning ─────────────────────────────────────
  { delayMs: 0, event: { type: "node_start", node: "planning", timestamp: "2026-03-22T14:00:00.000Z" } },
  { delayMs: 500, event: { type: "log", node: "planning", message: "[14:00:00] 📋 Creating execution plan for Tencent (0700.HK)...", timestamp: "2026-03-22T14:00:00.500Z" } },
  { delayMs: 2500, event: { type: "log", node: "planning", message: "[14:00:02] 📋 Plan created: 9 tasks (including regulatory_analysis for HK jurisdiction)", timestamp: "2026-03-22T14:00:02.500Z" } },
  { delayMs: 3000, event: { type: "phase_change", phase: "planned", timestamp: "2026-03-22T14:00:03.000Z" } },
  { delayMs: 3200, event: { type: "node_end", node: "planning", timestamp: "2026-03-22T14:00:03.200Z", durationMs: 3200 } },

  // ── Notion Context ───────────────────────────────
  { delayMs: 3500, event: { type: "node_start", node: "notionContext", timestamp: "2026-03-22T14:00:03.500Z" } },
  { delayMs: 4500, event: { type: "log", node: "notionContext", message: "[14:00:04] 📚 Found 1 previous Tencent analysis (2025-11)", timestamp: "2026-03-22T14:00:04.500Z" } },
  { delayMs: 5000, event: { type: "node_end", node: "notionContext", timestamp: "2026-03-22T14:00:05.000Z", durationMs: 1500 } },

  // ── Research ─────────────────────────────────────
  { delayMs: 5300, event: { type: "node_start", node: "research", timestamp: "2026-03-22T14:00:05.300Z" } },
  { delayMs: 6000, event: { type: "log", node: "research", message: "[14:00:06] 🔍 Researching Tencent: WeChat ecosystem, gaming, cloud, fintech", timestamp: "2026-03-22T14:00:06.000Z" } },
  { delayMs: 9000, event: { type: "skill_invocation", skill: "search_hkex_filings", provider: "fin-intel-mcp", node: "research", timestamp: "2026-03-22T14:00:09.000Z" } },
  { delayMs: 10000, event: { type: "log", node: "research", message: "[14:00:10] 🔍 HKEX filings: Annual Results 2024, ESG Report, Connected Transactions", timestamp: "2026-03-22T14:00:10.000Z" } },
  { delayMs: 14000, event: { type: "log", node: "research", message: "[14:00:14] 📊 Data: revenue ¥614.2B, WeChat MAU 1.34B, gaming recovery +5%", timestamp: "2026-03-22T14:00:14.000Z" } },
  { delayMs: 18000, event: { type: "log", node: "research", message: "[14:00:18] ✅ Research complete: 15 sources (HKEX, SFC, analysts)", timestamp: "2026-03-22T14:00:18.000Z" } },
  { delayMs: 18500, event: { type: "prm_score", node: "research", score: 8.6, dimensions: { coverage: 9, recency: 9, sourceQuality: 8, contradictionHandling: 8 }, recommendation: "proceed", timestamp: "2026-03-22T14:00:18.500Z" } },
  { delayMs: 19000, event: { type: "phase_change", phase: "research_complete", timestamp: "2026-03-22T14:00:19.000Z" } },
  { delayMs: 19200, event: { type: "node_end", node: "research", timestamp: "2026-03-22T14:00:19.200Z", durationMs: 13900 } },

  // ── Analysis ─────────────────────────────────────
  { delayMs: 19500, event: { type: "node_start", node: "analysis", timestamp: "2026-03-22T14:00:19.500Z" } },
  { delayMs: 20000, event: { type: "log", node: "analysis", message: "[14:00:20] 💰 Financial: ¥614.2B revenue, 47.3% gross margin, P/E 22x", timestamp: "2026-03-22T14:00:20.000Z" } },
  { delayMs: 22000, event: { type: "log", node: "analysis", message: "[14:00:22] 📈 Market: WeChat + Mini Programs + WeCom = digital infrastructure moat", timestamp: "2026-03-22T14:00:22.000Z" } },
  { delayMs: 24000, event: { type: "log", node: "analysis", message: "[14:00:24] 🔬 Tech: Hunyuan LLM, Cloud AI, Tencent Meeting AI features", timestamp: "2026-03-22T14:00:24.000Z" } },
  { delayMs: 26000, event: { type: "prm_score", node: "financial_analysis", score: 8.5, dimensions: { accuracy: 9, valuationRigor: 8, trendAnalysis: 8, margins: 9 }, recommendation: "proceed", timestamp: "2026-03-22T14:00:26.000Z" } },
  { delayMs: 27000, event: { type: "prm_score", node: "market_analysis", score: 8.8, dimensions: { tamDefined: 9, moatArticulated: 9, competitorsNamed: 8, customerConcentration: 9 }, recommendation: "proceed", timestamp: "2026-03-22T14:00:27.000Z" } },
  { delayMs: 28000, event: { type: "phase_change", phase: "analysis_complete", timestamp: "2026-03-22T14:00:28.000Z" } },
  { delayMs: 28500, event: { type: "node_end", node: "analysis", timestamp: "2026-03-22T14:00:28.500Z", durationMs: 9000 } },

  // ── Risk + Compliance (HK regulatory tools) ──────
  { delayMs: 28800, event: { type: "node_start", node: "risk", timestamp: "2026-03-22T14:00:28.800Z" } },
  { delayMs: 29500, event: { type: "log", node: "risk", message: "[14:00:29] 🛡️ Risk assessment: 6 dimensions including regulatory compliance", timestamp: "2026-03-22T14:00:29.500Z" } },
  { delayMs: 31000, event: { type: "skill_invocation", skill: "check_hk_compliance", provider: "fin-intel-mcp", node: "risk", timestamp: "2026-03-22T14:00:31.000Z" } },
  { delayMs: 32000, event: { type: "log", node: "risk", message: "[14:00:32] 🛡️ HK Compliance: SFC Type 9 licence (asset mgmt), PDPO AI guidance applicable", timestamp: "2026-03-22T14:00:32.000Z" } },
  { delayMs: 33500, event: { type: "skill_invocation", skill: "assess_cross_border_risk", provider: "fin-intel-mcp", node: "risk", timestamp: "2026-03-22T14:00:33.500Z" } },
  { delayMs: 35000, event: { type: "log", node: "risk", message: "[14:00:35] 🛡️ Cross-border: data localization (PIPL high), capital flow (medium), VIE risk (medium)", timestamp: "2026-03-22T14:00:35.000Z" } },
  { delayMs: 37000, event: { type: "log", node: "risk", message: "[14:00:37] 🛡️ Risks: regulatory 6/10, geopolitical 7/10, market 4/10, competitive 5/10", timestamp: "2026-03-22T14:00:37.000Z" } },
  { delayMs: 38000, event: { type: "prm_score", node: "risk_assessment", score: 8.4, dimensions: { dimensionCount: 9, likelihoodImpact: 8, companySpecific: 9, mitigations: 7 }, recommendation: "proceed", timestamp: "2026-03-22T14:00:38.000Z" } },
  { delayMs: 38500, event: { type: "node_end", node: "risk", timestamp: "2026-03-22T14:00:38.500Z", durationMs: 9700 } },

  // ── Report (attempt 1) ───────────────────────────
  { delayMs: 39000, event: { type: "node_start", node: "report", timestamp: "2026-03-22T14:00:39.000Z" } },
  { delayMs: 40000, event: { type: "log", node: "report", message: "[14:00:40] 📝 Generating report — attempt 1", timestamp: "2026-03-22T14:00:40.000Z" } },
  { delayMs: 47000, event: { type: "prm_score", node: "report_generation", score: 6.5, dimensions: { sectionsPresent: 7, dataSynthesis: 7, recommendation: 6, writingQuality: 6 }, recommendation: "proceed", timestamp: "2026-03-22T14:00:47.000Z" } },
  { delayMs: 47500, event: { type: "node_end", node: "report", timestamp: "2026-03-22T14:00:47.500Z", durationMs: 8500 } },

  // ── Reflexion (attempt 1 — retry) ────────────────
  { delayMs: 48000, event: { type: "node_start", node: "reflexion", timestamp: "2026-03-22T14:00:48.000Z" } },
  { delayMs: 51000, event: { type: "reflexion", score: 6.5, shouldRetry: true, actionItems: ["Strengthen HK regulatory analysis section with specific HKMA/SFC citations", "Add Stock Connect flow data and Southbound capital trends", "Quantify cross-border data compliance costs"], attempt: 1, timestamp: "2026-03-22T14:00:51.000Z" } },
  { delayMs: 51500, event: { type: "log", node: "reflexion", message: "[14:00:51] 🪞 Score: 6.5/10 — HK regulatory depth insufficient, retrying", timestamp: "2026-03-22T14:00:51.500Z" } },
  { delayMs: 52000, event: { type: "node_end", node: "reflexion", timestamp: "2026-03-22T14:00:52.000Z", durationMs: 4000 } },

  // ── Report (attempt 2 — improved) ────────────────
  { delayMs: 52500, event: { type: "node_start", node: "report", timestamp: "2026-03-22T14:00:52.500Z" } },
  { delayMs: 53000, event: { type: "log", node: "report", message: "[14:00:53] 📝 Regenerating with reflexion feedback — attempt 2", timestamp: "2026-03-22T14:00:53.000Z" } },
  { delayMs: 55000, event: { type: "skill_invocation", skill: "check_hk_compliance", provider: "fin-intel-mcp", node: "report", timestamp: "2026-03-22T14:00:55.000Z" } },
  { delayMs: 60000, event: { type: "prm_score", node: "report_generation", score: 8.3, dimensions: { sectionsPresent: 9, dataSynthesis: 8, recommendation: 8, writingQuality: 8 }, recommendation: "proceed", timestamp: "2026-03-22T14:01:00.000Z" } },
  { delayMs: 60500, event: { type: "node_end", node: "report", timestamp: "2026-03-22T14:01:00.500Z", durationMs: 8000 } },

  // ── Reflexion (attempt 2 — passes) ───────────────
  { delayMs: 61000, event: { type: "node_start", node: "reflexion", timestamp: "2026-03-22T14:01:01.000Z" } },
  { delayMs: 64000, event: { type: "reflexion", score: 8.3, shouldRetry: false, actionItems: ["Minor: add Southbound Connect daily volume data"], attempt: 2, timestamp: "2026-03-22T14:01:04.000Z" } },
  { delayMs: 64500, event: { type: "log", node: "reflexion", message: "[14:01:04] 🪞 Score: 8.3/10 — HK regulatory depth improved, proceeding", timestamp: "2026-03-22T14:01:04.500Z" } },
  { delayMs: 65000, event: { type: "node_end", node: "reflexion", timestamp: "2026-03-22T14:01:05.000Z", durationMs: 4000 } },

  // ── Delivery ─────────────────────────────────────
  { delayMs: 65500, event: { type: "node_start", node: "delivery", timestamp: "2026-03-22T14:01:05.500Z" } },
  { delayMs: 68000, event: { type: "log", node: "delivery", message: "[14:01:08] 📤 Delivery: Notion ✓ | Email ✓", timestamp: "2026-03-22T14:01:08.000Z" } },
  { delayMs: 69000, event: { type: "node_end", node: "delivery", timestamp: "2026-03-22T14:01:09.000Z", durationMs: 3500 } },

  // ── Finalize ─────────────────────────────────────
  { delayMs: 69500, event: { type: "node_start", node: "finalize", timestamp: "2026-03-22T14:01:09.500Z" } },
  { delayMs: 70000, event: { type: "log", node: "finalize", message: "[14:01:10] 📊 PRM avg: 8.4/10 | Skills invoked: 5 (3 HK compliance)", timestamp: "2026-03-22T14:01:10.000Z" } },
  { delayMs: 70500, event: { type: "cost_update", totalCost: 0.28, totalTokens: 132800, byAgent: { planner: 0.02, researcher: 0.06, dataCollector: 0.03, synthesizer: 0.02, financialAnalyst: 0.03, marketAnalyst: 0.03, techAnalyst: 0.02, riskAnalyst: 0.02, complianceAnalyst: 0.02, reportWriter: 0.02, reflexion: 0.01 }, timestamp: "2026-03-22T14:01:10.500Z" } },
  { delayMs: 71000, event: { type: "phase_change", phase: "completed", timestamp: "2026-03-22T14:01:11.000Z" } },
  { delayMs: 71500, event: { type: "node_end", node: "finalize", timestamp: "2026-03-22T14:01:11.500Z", durationMs: 2000 } },

  // ── Pipeline Complete ────────────────────────────
  { delayMs: 72000, event: { type: "pipeline_complete", qualityScore: 8.3, riskScore: 5.8, durationMs: 72000, timestamp: "2026-03-22T14:01:12.000Z" } },
];
