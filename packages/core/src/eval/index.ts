/**
 * Eval System — Barrel Export
 * ============================
 * AI output quality evaluation with LLM-as-Judge scoring,
 * regression detection, and baseline comparison.
 */

export { EVAL_CASES, getCase, getCasesByType } from "./cases.js";
export type { EvalCase, EvalType, ComponentType } from "./cases.js";

export { loadFixture, loadReportFixture } from "./fixtures.js";

export { EvalJudge } from "./judge.js";
export type { JudgeResult, JudgeScores, TranslationJudgeResult, TranslationScores } from "./judge.js";

export {
  buildRunResult,
  saveResult,
  loadBaseline,
  saveAsBaseline,
  compareToBaseline,
} from "./regression.js";
export type { EvalRunResult, EvalSummary, RegressionReport } from "./regression.js";

export { formatEvalReport, formatEvalJSON } from "./reporter.js";
