/**
 * Eval Test Suite (Vitest Wrapper)
 * ==================================
 * Wraps the eval system in Vitest so it integrates with CI.
 * Auto-skips when DEEPSEEK_API_KEY is not set.
 *
 * Run: npx vitest run eval.test
 */

import { describe, it, expect } from "vitest";
import { EVAL_CASES, type EvalCase } from "./cases.js";
import { loadFixture } from "./fixtures.js";
import { EvalJudge } from "./judge.js";

const HAS_KEY = !!process.env.DEEPSEEK_API_KEY?.trim();

// ── Report Evals ─────────────────────────────────────────────

const reportCases = EVAL_CASES.filter((c) => c.type === "report");

describe.skipIf(!HAS_KEY)("Eval: Full Reports", () => {
  const judge = new EvalJudge();

  for (const evalCase of reportCases) {
    it(
      `${evalCase.id}: score >= ${evalCase.minimumScore}`,
      async () => {
        const fixture = loadFixture(evalCase.fixtureKey);
        const result = await judge.scoreReport(fixture, evalCase);

        expect(result.scores.overall).toBeGreaterThanOrEqual(evalCase.minimumScore!);
        expect(result.passed).toBe(true);
      },
      60_000
    );
  }
});

// ── Component Evals ──────────────────────────────────────────

const componentCases = EVAL_CASES.filter((c) => c.type === "component");

describe.skipIf(!HAS_KEY)("Eval: Components", () => {
  const judge = new EvalJudge();

  for (const evalCase of componentCases) {
    it(
      `${evalCase.id}: score >= ${evalCase.minimumScore}`,
      async () => {
        const fixture = loadFixture(evalCase.fixtureKey);
        const result = await judge.scoreComponent(fixture, evalCase);

        expect(result.scores.overall).toBeGreaterThanOrEqual(evalCase.minimumScore!);
        expect(result.passed).toBe(true);
      },
      30_000
    );
  }
});

// ── Translation Eval ─────────────────────────────────────────

const translationCases = EVAL_CASES.filter((c) => c.type === "translation");

describe.skipIf(!HAS_KEY)("Eval: Translation", () => {
  const judge = new EvalJudge();

  for (const evalCase of translationCases) {
    it(
      `${evalCase.id}: score >= ${evalCase.minimumScore}`,
      async () => {
        const original = loadFixture(evalCase.originalFixtureKey!);
        const translation = loadFixture(evalCase.fixtureKey);
        const result = await judge.scoreTranslation(original, translation, evalCase);

        expect(result.scores.overall).toBeGreaterThanOrEqual(evalCase.minimumScore!);
        expect(result.passed).toBe(true);
      },
      30_000
    );
  }
});

// ── Negative Control ─────────────────────────────────────────

const negativeCases = EVAL_CASES.filter((c) => c.type === "negative_control");

describe.skipIf(!HAS_KEY)("Eval: Negative Controls", () => {
  const judge = new EvalJudge();

  for (const evalCase of negativeCases) {
    it(
      `${evalCase.id}: score <= ${evalCase.maximumScore} (judge discrimination)`,
      async () => {
        const fixture = loadFixture(evalCase.fixtureKey);
        const result = await judge.scoreReport(fixture, evalCase);

        expect(
          result.scores.overall,
          `Negative control should score low — judge lacks discrimination if high`
        ).toBeLessThanOrEqual(evalCase.maximumScore!);
      },
      60_000
    );
  }
});
