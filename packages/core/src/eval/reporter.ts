/**
 * Eval Reporter: Terminal-Friendly Output
 * =========================================
 * Formats eval results into a clear, scannable terminal report.
 */

import type { EvalRunResult, RegressionReport } from "./regression.js";
import type { EvalCase } from "./cases.js";

// ── Formatting Helpers ───────────────────────────────────────

function pad(str: string, len: number): string {
  return str.padEnd(len);
}

function scoreColor(score: number, min?: number, max?: number): string {
  if (max !== undefined) {
    // Negative control: pass if score <= max
    return score <= max ? "\x1b[32m" : "\x1b[31m"; // green : red
  }
  if (min !== undefined) {
    return score >= min ? "\x1b[32m" : "\x1b[31m"; // green : red
  }
  return "\x1b[0m"; // default
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

// ── Main Report Formatter ────────────────────────────────────

export function formatEvalReport(
  result: EvalRunResult,
  cases: EvalCase[],
  regression: RegressionReport | null
): string {
  const lines: string[] = [];
  const W = 60;

  // Header
  lines.push("");
  lines.push("=".repeat(W));
  lines.push(`${BOLD}  AI Investment Analyst — Eval Report${RESET}`);
  lines.push(`  Run: ${result.timestamp.slice(0, 19)}Z | Commit: ${result.gitCommit}`);
  lines.push(`  Model: ${result.model} | Cases: ${result.summary.totalCases}`);
  lines.push("=".repeat(W));

  // Group cases by type
  const caseMap = new Map(cases.map((c) => [c.id, c]));
  const resultMap = new Map(result.cases.map((c) => [c.caseId, c]));

  const groups: Array<{ title: string; caseIds: string[] }> = [
    { title: "FULL REPORT EVALS", caseIds: cases.filter((c) => c.type === "report" && c.id !== "healthcare-brief").map((c) => c.id) },
    { title: "COMPONENT EVALS", caseIds: cases.filter((c) => c.type === "component").map((c) => c.id) },
    { title: "TRANSLATION EVAL", caseIds: cases.filter((c) => c.type === "translation").map((c) => c.id) },
    { title: "NEGATIVE CONTROL", caseIds: cases.filter((c) => c.type === "negative_control").map((c) => c.id) },
    { title: "CROSS-SECTOR", caseIds: ["healthcare-brief"] },
  ];

  for (const group of groups) {
    const groupResults = group.caseIds
      .map((id) => ({ case_: caseMap.get(id), result_: resultMap.get(id) }))
      .filter((g) => g.case_ && g.result_);

    if (groupResults.length === 0) continue;

    lines.push("");
    lines.push(`${BOLD}${group.title}${RESET}`);

    for (const { case_: c, result_: r } of groupResults) {
      if (!c || !r) continue;

      const passIcon = r.passed ? `${GREEN}[PASS]${RESET}` : `${RED}[FAIL]${RESET}`;
      const scoreStr = `${r.overall.toFixed(1)}/10`;
      const color = scoreColor(r.overall, c.minimumScore, c.maximumScore);

      let threshold: string;
      if (c.maximumScore !== undefined) {
        threshold = `${DIM}(expected <= ${c.maximumScore})${RESET}`;
      } else if (c.minimumScore !== undefined) {
        threshold = `${DIM}(min: ${c.minimumScore})${RESET}`;
      } else {
        threshold = "";
      }

      lines.push(
        `  ${passIcon} ${pad(c.id, 28)} ${color}${scoreStr}${RESET}  ${threshold}`
      );
    }
  }

  // Summary
  lines.push("");
  lines.push("-".repeat(W));
  const summaryColor = result.summary.failed === 0 ? GREEN : RED;
  lines.push(
    `${BOLD}SUMMARY:${RESET} ${summaryColor}${result.summary.passed}/${result.summary.totalCases} passed${RESET}` +
    ` | Avg: ${result.summary.averageScore.toFixed(1)}/10`
  );

  // Regression comparison
  if (regression) {
    lines.push("");
    lines.push(`${BOLD}REGRESSION vs baseline:${RESET}`);

    for (const item of regression.improved) {
      lines.push(
        `  ${GREEN}${pad(item.caseId + ":", 30)} ${item.from.toFixed(1)} -> ${item.to.toFixed(1)}  (+${item.delta.toFixed(1)} improved)${RESET}`
      );
    }

    for (const item of regression.regressed) {
      lines.push(
        `  ${RED}${pad(item.caseId + ":", 30)} ${item.from.toFixed(1)} -> ${item.to.toFixed(1)}  (${item.delta.toFixed(1)} REGRESSED)${RESET}`
      );
    }

    if (regression.hasRegression) {
      lines.push(`  ${RED}${BOLD}WARNING: Regressions detected!${RESET}`);
    } else if (regression.improved.length > 0) {
      lines.push(`  ${GREEN}No regressions detected.${RESET}`);
    } else {
      lines.push(`  ${DIM}Scores stable, no significant changes.${RESET}`);
    }

    if (regression.overallDelta !== 0) {
      const deltaColor = regression.overallDelta > 0 ? GREEN : RED;
      const sign = regression.overallDelta > 0 ? "+" : "";
      lines.push(`  Overall avg delta: ${deltaColor}${sign}${regression.overallDelta.toFixed(2)}${RESET}`);
    }
  } else {
    lines.push("");
    lines.push(`${DIM}No baseline found. Run with --save-baseline to create one.${RESET}`);
  }

  lines.push("");
  return lines.join("\n");
}

// ── JSON Output ──────────────────────────────────────────────

export function formatEvalJSON(
  result: EvalRunResult,
  regression: RegressionReport | null
): string {
  return JSON.stringify({ result, regression }, null, 2);
}
