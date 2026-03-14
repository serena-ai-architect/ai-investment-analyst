/**
 * Regression Detection: Baseline Comparison
 * ============================================
 * Stores eval results, compares against baseline, and detects
 * score regressions across runs.
 *
 * Regression threshold: any case dropping > 1.0 point triggers alert.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import type { JudgeResult, TranslationJudgeResult } from "./judge.js";

const RESULTS_DIR = resolve(import.meta.dirname, "results");

// ── Types ────────────────────────────────────────────────────

export interface EvalSummary {
  totalCases: number;
  passed: number;
  failed: number;
  averageScore: number;
}

export interface EvalRunResult {
  runId: string;
  gitCommit: string;
  model: string;
  timestamp: string;
  cases: Array<{
    caseId: string;
    overall: number;
    passed: boolean;
    latencyMs: number;
  }>;
  summary: EvalSummary;
}

export interface RegressionReport {
  improved: Array<{ caseId: string; from: number; to: number; delta: number }>;
  regressed: Array<{ caseId: string; from: number; to: number; delta: number }>;
  stable: string[];
  overallDelta: number;
  hasRegression: boolean;
}

// ── Git Commit Helper ────────────────────────────────────────

function getGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

// ── Result Conversion ────────────────────────────────────────

export function buildRunResult(
  results: Array<JudgeResult | TranslationJudgeResult>,
  model: string
): EvalRunResult {
  const cases = results.map((r) => ({
    caseId: r.caseId,
    overall: r.scores.overall,
    passed: r.passed,
    latencyMs: r.latencyMs,
  }));

  const scores = cases.map((c) => c.overall);
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  return {
    runId: new Date().toISOString(),
    gitCommit: getGitCommit(),
    model,
    timestamp: new Date().toISOString(),
    cases,
    summary: {
      totalCases: cases.length,
      passed: cases.filter((c) => c.passed).length,
      failed: cases.filter((c) => !c.passed).length,
      averageScore: Math.round(averageScore * 100) / 100,
    },
  };
}

// ── File Operations ──────────────────────────────────────────

function ensureDir(): void {
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

export function saveResult(result: EvalRunResult): string {
  ensureDir();
  const filename = `${result.runId.replace(/[:.]/g, "-")}.json`;
  const filepath = resolve(RESULTS_DIR, filename);
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  return filepath;
}

export function loadBaseline(): EvalRunResult | null {
  const filepath = resolve(RESULTS_DIR, "baseline.json");
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, "utf-8"));
}

export function saveAsBaseline(result: EvalRunResult): string {
  ensureDir();
  const filepath = resolve(RESULTS_DIR, "baseline.json");
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  return filepath;
}

// ── Regression Comparison ────────────────────────────────────

const REGRESSION_THRESHOLD = 1.0;

export function compareToBaseline(current: EvalRunResult): RegressionReport | null {
  const baseline = loadBaseline();
  if (!baseline) return null;

  const baselineMap = new Map(baseline.cases.map((c) => [c.caseId, c.overall]));
  const currentMap = new Map(current.cases.map((c) => [c.caseId, c.overall]));

  const improved: RegressionReport["improved"] = [];
  const regressed: RegressionReport["regressed"] = [];
  const stable: string[] = [];

  for (const [caseId, currentScore] of currentMap) {
    const baselineScore = baselineMap.get(caseId);
    if (baselineScore === undefined) continue; // New case, skip

    const delta = Math.round((currentScore - baselineScore) * 100) / 100;

    if (delta > 0.5) {
      improved.push({ caseId, from: baselineScore, to: currentScore, delta });
    } else if (delta < -REGRESSION_THRESHOLD) {
      regressed.push({ caseId, from: baselineScore, to: currentScore, delta });
    } else {
      stable.push(caseId);
    }
  }

  const overallDelta = Math.round(
    (current.summary.averageScore - baseline.summary.averageScore) * 100
  ) / 100;

  return {
    improved,
    regressed,
    stable,
    overallDelta,
    hasRegression: regressed.length > 0,
  };
}
