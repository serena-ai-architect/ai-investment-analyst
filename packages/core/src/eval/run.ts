#!/usr/bin/env tsx
/**
 * Eval CLI Runner
 * ================
 * Run the full eval suite from the command line.
 *
 * Usage:
 *   npx tsx packages/core/src/eval/run.ts              # Run all
 *   npx tsx packages/core/src/eval/run.ts --save-baseline  # Save as baseline
 *   npx tsx packages/core/src/eval/run.ts --case nvidia-full-report  # Single case
 *   npx tsx packages/core/src/eval/run.ts --json       # JSON output
 *
 * Exit codes: 0 = all passed, 1 = failures or regressions
 */

import "dotenv/config";
import { EVAL_CASES, getCase } from "./cases.js";
import { loadFixture } from "./fixtures.js";
import { EvalJudge, type JudgeResult, type TranslationJudgeResult } from "./judge.js";
import {
  buildRunResult,
  saveResult,
  saveAsBaseline,
  compareToBaseline,
} from "./regression.js";
import { formatEvalReport, formatEvalJSON } from "./reporter.js";

// ── CLI Args ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const saveBaseline = args.includes("--save-baseline");
const jsonOutput = args.includes("--json");
const caseFilter = args.find((_, i, a) => a[i - 1] === "--case");

// ── API Key Check ────────────────────────────────────────────

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY?.trim();
if (!DEEPSEEK_KEY) {
  console.error("DEEPSEEK_API_KEY not set. Skipping eval.");
  process.exit(0);
}

// ── Run Evals ────────────────────────────────────────────────

async function main() {
  const model = "deepseek-chat";
  const judge = new EvalJudge(model);

  // Filter cases if --case flag is set
  const casesToRun = caseFilter
    ? EVAL_CASES.filter((c) => c.id === caseFilter)
    : EVAL_CASES;

  if (casesToRun.length === 0) {
    console.error(`No eval case found matching: ${caseFilter}`);
    process.exit(1);
  }

  if (!jsonOutput) {
    console.log(`\nRunning ${casesToRun.length} eval case(s)...\n`);
  }

  const results: Array<JudgeResult | TranslationJudgeResult> = [];

  for (const evalCase of casesToRun) {
    if (!jsonOutput) {
      process.stdout.write(`  Evaluating ${evalCase.id}...`);
    }

    try {
      const fixture = loadFixture(evalCase.fixtureKey);
      let result: JudgeResult | TranslationJudgeResult;

      switch (evalCase.type) {
        case "report":
        case "negative_control":
          result = await judge.scoreReport(fixture, evalCase);
          break;

        case "component":
          result = await judge.scoreComponent(fixture, evalCase);
          break;

        case "translation": {
          const original = loadFixture(evalCase.originalFixtureKey!);
          result = await judge.scoreTranslation(original, fixture, evalCase);
          break;
        }
      }

      results.push(result);

      if (!jsonOutput) {
        const icon = result.passed ? " \x1b[32mPASS\x1b[0m" : " \x1b[31mFAIL\x1b[0m";
        console.log(`${icon} (${result.scores.overall.toFixed(1)}/10, ${result.latencyMs}ms)`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!jsonOutput) {
        console.log(` \x1b[31mERROR\x1b[0m (${msg})`);
      }

      // Create a failed result
      results.push({
        caseId: evalCase.id,
        scores: {
          completeness: 0, dataQuality: 0, analyticalDepth: 0,
          actionability: 0, writingQuality: 0, overall: 0,
        },
        reasoning: `Error: ${msg}`,
        issues: [msg],
        passed: false,
        latencyMs: 0,
      });
    }
  }

  // Build run result
  const runResult = buildRunResult(results, model);

  // Save result
  saveResult(runResult);

  // Compare to baseline
  const regression = compareToBaseline(runResult);

  // Output
  if (jsonOutput) {
    console.log(formatEvalJSON(runResult, regression));
  } else {
    console.log(formatEvalReport(runResult, casesToRun, regression));
  }

  // Save as baseline if requested
  if (saveBaseline) {
    const filepath = saveAsBaseline(runResult);
    if (!jsonOutput) {
      console.log(`Baseline saved to: ${filepath}\n`);
    }
  }

  // Exit code
  const hasFailures = runResult.summary.failed > 0;
  const hasRegressions = regression?.hasRegression ?? false;
  process.exit(hasFailures || hasRegressions ? 1 : 0);
}

main().catch((err) => {
  console.error("Eval runner failed:", err);
  process.exit(1);
});
