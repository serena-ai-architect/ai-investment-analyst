/**
 * Analysis Engine — Main entry point for the core package.
 * =========================================================
 * Wraps the LangGraph workflow with a clean API for consumers
 * (CLI, Web API, background jobs).
 */

import { runWorkflow } from "./graph/workflow.js";
import type { AgentState } from "./types/index.js";

export interface AnalysisParams {
  company: string;
  query?: string;
  mode?: "quick" | "full";
  stream?: boolean;
  /** Callback for real-time progress updates */
  onProgress?: (log: string, phase: string) => void;
}

export interface AnalysisResult {
  company: string;
  reportEn: string;
  reportZh?: string;
  qualityScore: number;
  riskScore: number;
  financialData?: Record<string, unknown>;
  phases: string[];
  logs: string[];
  errors: string[];
}

/**
 * Run a full investment analysis pipeline.
 * This is the primary API for both CLI and web consumers.
 */
export async function runAnalysis(params: AnalysisParams): Promise<AnalysisResult> {
  const { company, query, mode = "full", stream = true, onProgress } = params;

  const state = await runWorkflow({
    company,
    query: query ?? `Comprehensive investment analysis of ${company}`,
    mode,
    stream,
  });

  const report = state.finalReport || state.draftReport || "";

  // Generate Chinese translation
  let reportZh: string | undefined;
  try {
    const { ReportWriterAgent } = await import("./agents/reportWriter.js");
    const writer = new ReportWriterAgent();
    reportZh = await writer.translate(report);
  } catch {
    // Translation is non-fatal
  }

  return {
    company,
    reportEn: report,
    reportZh,
    qualityScore: state.qualityScore ?? 0,
    riskScore: state.riskScore ?? 0,
    financialData: state.researchData,
    phases: state.logs?.filter((l: string) => l.includes("Phase:")) ?? [],
    logs: state.logs ?? [],
    errors: state.errors ?? [],
  };
}
