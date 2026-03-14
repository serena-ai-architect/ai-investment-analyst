/**
 * Layer 5: Eval / LLM-as-Judge Tests (Real API Calls)
 * =====================================================
 * Tests REAL LLM responses from each provider (DeepSeek, OpenAI, Anthropic).
 * No mocking — verifies that each provider returns structurally valid output
 * and does NOT trigger fallback/default paths.
 *
 * Tests auto-skip when the corresponding API key is not set.
 * Estimated cost per full run: ~$0.08
 */

import { describe, it, expect } from "vitest";
import { DynamicPlanner, type ExecutionPlan } from "../skills/dynamicPlanner.js";
import { ReflexionEngine } from "../skills/reflexion.js";
import { ProcessRewardModel } from "../skills/processReward.js";
import { ReportWriterAgent } from "../agents/reportWriter.js";
import { detectProvider, LLMConfig } from "../config.js";
import type { StepEvaluation } from "../types/index.js";

// ═══════════════════════════════════════════════════════════════
// Provider Configuration
// ═══════════════════════════════════════════════════════════════

const PROVIDERS = [
  { name: "deepseek", model: "deepseek-chat", envKey: "DEEPSEEK_API_KEY" },
  { name: "openai", model: "gpt-4o-mini", envKey: "OPENAI_API_KEY" },
  { name: "anthropic", model: "claude-haiku-4-5", envKey: "ANTHROPIC_API_KEY" },
] as const;

function hasKey(envKey: string): boolean {
  return !!process.env[envKey]?.trim();
}

function availableProviders() {
  return PROVIDERS.filter((p) => hasKey(p.envKey));
}

// ═══════════════════════════════════════════════════════════════
// Minimal Test Fixtures (keep token usage low)
// ═══════════════════════════════════════════════════════════════

const FIXTURES = {
  researchOutput:
    "NVIDIA (NVDA) Q4 2024 revenue $22.1B, up 265% YoY. " +
    "Data center revenue $18.4B. Dominant GPU market share in AI training. " +
    "Gross margin 76%. P/E ratio 65. Market cap $1.8T.",

  reportDraft:
    "# NVIDIA Investment Report\n\n" +
    "## Executive Summary\n" +
    "NVIDIA dominates AI infrastructure with 80%+ GPU market share. " +
    "Revenue grew 265% YoY to $22.1B in Q4 2024.\n\n" +
    "## Financial Analysis\n" +
    "P/E: 65, Gross margin: 76%, Revenue CAGR: 95%\n\n" +
    "## Risk Assessment\n" +
    "Key risks: concentration in AI, geopolitical tensions with China.\n\n" +
    "## Recommendation\n" +
    "Buy with price target $150-$170.",

  task: "Generate investment report for NVIDIA",
};

// ═══════════════════════════════════════════════════════════════
// Assertion Helpers
// ═══════════════════════════════════════════════════════════════

function assertValidPlan(plan: ExecutionPlan, provider: string): void {
  expect(plan.company).toBe("NVIDIA");
  expect(plan.version).toBe(1);
  expect(plan.adaptations).toEqual([]);
  expect(plan.tasks.length).toBeGreaterThan(0);

  // Validate each task structure
  for (const task of plan.tasks) {
    expect(task.type, `${provider}: task.type should be a non-empty string`).toBeTruthy();
    expect(task.description, `${provider}: task.description should be non-empty`).toBeTruthy();
    expect(
      ["critical", "high", "medium", "low"],
      `${provider}: task.priority should be valid`
    ).toContain(task.priority);
    expect(task.status).toBe("pending");
  }

  // Fallback detection: the default fallback always returns exactly 7 tasks
  // with empty reasoning. If we get 7 tasks with all-empty reasoning,
  // the LLM response was not parsed successfully.
  const allEmptyReasoning = plan.tasks.every((t) => !t.reasoning);
  const isFallback = plan.tasks.length === 7 && allEmptyReasoning;
  expect(isFallback, `${provider}: DynamicPlanner should NOT fall back to default plan`).toBe(false);
}

function assertValidStepEval(evaluation: StepEvaluation, provider: string): void {
  expect(evaluation.stepName).toBe("research");
  expect(evaluation.score, `${provider}: score should be 1-10`).toBeGreaterThanOrEqual(1);
  expect(evaluation.score, `${provider}: score should be 1-10`).toBeLessThanOrEqual(10);
  expect(typeof evaluation.isBlocking).toBe("boolean");
  expect(
    ["proceed", "retry", "skip_downstream", "abort"],
    `${provider}: recommendation should be valid`
  ).toContain(evaluation.recommendation);
  expect(Array.isArray(evaluation.issues)).toBe(true);
  expect(typeof evaluation.details).toBe("string");

  // Fallback detection: if score=6.0 AND details contains "Auto-pass",
  // the JSON parse failed and fallback fired
  const isFallback =
    evaluation.score === 6.0 &&
    evaluation.details.includes("Auto-pass due to evaluation error");
  expect(isFallback, `${provider}: PRM should NOT fall back to defaults`).toBe(false);
}

function assertValidReflexion(
  result: {
    score: number;
    evaluation: string;
    reflection: string;
    actionItems: string[];
    shouldRetry: boolean;
    pastReflections: string;
  },
  provider: string
): void {
  expect(result.score, `${provider}: score should be 1-10`).toBeGreaterThanOrEqual(1);
  expect(result.score, `${provider}: score should be 1-10`).toBeLessThanOrEqual(10);
  expect(typeof result.shouldRetry).toBe("boolean");
  expect(Array.isArray(result.actionItems)).toBe(true);
  expect(result.evaluation.length, `${provider}: evaluation should be non-empty`).toBeGreaterThan(0);
  expect(result.reflection.length, `${provider}: reflection should be non-empty`).toBeGreaterThan(0);

  // Fallback detection: this string only appears when structured output parsing fails
  expect(
    result.evaluation.includes("Evaluation parsing failed"),
    `${provider}: ReflexionEngine evaluation should NOT fall back to defaults`
  ).toBe(false);
}

// ═══════════════════════════════════════════════════════════════
// DynamicPlanner — Per-Provider Tests
// ═══════════════════════════════════════════════════════════════

describe("L5 Eval: DynamicPlanner", () => {
  for (const provider of PROVIDERS) {
    describe.skipIf(!hasKey(provider.envKey))(
      `DynamicPlanner with ${provider.name} (${provider.model})`,
      () => {
        it(
          "createInitialPlan returns valid ExecutionPlan",
          async () => {
            const planner = new DynamicPlanner(provider.model);
            const plan = await planner.createInitialPlan(
              "NVIDIA",
              "Quick financial check",
              "quick"
            );

            assertValidPlan(plan, provider.name);
          },
          30_000
        );
      }
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// ProcessRewardModel — Per-Provider Tests
// ═══════════════════════════════════════════════════════════════

describe("L5 Eval: ProcessRewardModel", () => {
  for (const provider of PROVIDERS) {
    describe.skipIf(!hasKey(provider.envKey))(
      `PRM with ${provider.name} (${provider.model})`,
      () => {
        it(
          "evaluateStep returns valid StepEvaluation",
          async () => {
            const prm = new ProcessRewardModel(provider.model);
            const evaluation = await prm.evaluateStep(
              "research",
              FIXTURES.researchOutput
            );

            assertValidStepEval(evaluation, provider.name);
          },
          30_000
        );
      }
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// ReflexionEngine — Per-Provider Tests
// ═══════════════════════════════════════════════════════════════

describe("L5 Eval: ReflexionEngine", () => {
  for (const provider of PROVIDERS) {
    describe.skipIf(!hasKey(provider.envKey))(
      `ReflexionEngine with ${provider.name} (${provider.model})`,
      () => {
        it(
          "evaluateAndReflect returns valid structured result",
          async () => {
            const engine = new ReflexionEngine(provider.model);
            const result = await engine.evaluateAndReflect(
              FIXTURES.task,
              FIXTURES.reportDraft,
              1
            );

            assertValidReflexion(result, provider.name);
          },
          60_000
        );
      }
    );
  }
});

// ═══════════════════════════════════════════════════════════════
// ReportWriterAgent — Default Provider Only
// ═══════════════════════════════════════════════════════════════

// Determine which API key is needed for the default report model
const reportProvider = detectProvider(LLMConfig.reportModel);
const reportEnvKey =
  reportProvider === "anthropic"
    ? "ANTHROPIC_API_KEY"
    : reportProvider === "openai"
      ? "OPENAI_API_KEY"
      : "DEEPSEEK_API_KEY";

describe.skipIf(!hasKey(reportEnvKey))(
  `L5 Eval: ReportWriterAgent (${reportProvider}/${LLMConfig.reportModel})`,
  () => {
    it(
      "generate() returns Markdown with expected sections",
      async () => {
        const agent = new ReportWriterAgent();
        const report = await agent.generate({
          company: "NVIDIA",
          researchSummary: FIXTURES.researchOutput,
          financialAnalysis: "P/E: 65, Revenue: $22.1B, Gross margin: 76%",
          marketAnalysis: "80%+ GPU market share in AI training",
          techAnalysis: "CUDA ecosystem creates strong moat",
          riskAssessment: "Key risks: AI concentration, geopolitical",
          riskScore: 6.5,
        });

        expect(typeof report).toBe("string");
        expect(report.length, "Report should be substantial").toBeGreaterThan(500);
        expect(report).toContain("NVIDIA");
        expect(report).toContain("#"); // Markdown headings

        // Should contain at least 3 of these section keywords
        const sectionKeywords = [
          "Executive Summary",
          "Financial",
          "Market",
          "Risk",
          "Recommendation",
          "Technology",
        ];
        const matchCount = sectionKeywords.filter((kw) =>
          report.toLowerCase().includes(kw.toLowerCase())
        ).length;
        expect(matchCount, "Should contain ≥3 expected sections").toBeGreaterThanOrEqual(3);
      },
      60_000
    );

    it(
      "translate() returns Chinese text preserving numbers",
      async () => {
        const agent = new ReportWriterAgent();
        const translated = await agent.translate(
          "# NVIDIA Report\n\nRevenue: $22.1B. P/E ratio: 65.\n\nBuy recommendation."
        );

        expect(typeof translated).toBe("string");
        expect(translated.length).toBeGreaterThan(0);

        // Should contain Chinese characters
        expect(
          /[\u4e00-\u9fff]/.test(translated),
          "Translation should contain Chinese characters"
        ).toBe(true);

        // Should preserve numbers
        expect(translated).toContain("22.1");
        expect(translated).toContain("65");
      },
      60_000
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// Cross-Provider Consistency
// ═══════════════════════════════════════════════════════════════

const available = availableProviders();

describe.skipIf(available.length < 2)(
  `L5 Eval: Cross-provider consistency (${available.map((p) => p.name).join(", ")})`,
  () => {
    it(
      "all providers return structurally valid plans (no fallback)",
      async () => {
        const results: Array<{ provider: string; plan: ExecutionPlan }> = [];

        for (const provider of available) {
          const planner = new DynamicPlanner(provider.model);
          const plan = await planner.createInitialPlan(
            "NVIDIA",
            "Quick financial check",
            "quick"
          );
          results.push({ provider: provider.name, plan });
        }

        // All should be structurally valid and not fallback
        for (const { provider, plan } of results) {
          assertValidPlan(plan, provider);
        }
      },
      90_000
    );

    it(
      "all providers return valid PRM scores in [1,10] (no fallback)",
      async () => {
        const results: Array<{ provider: string; evaluation: StepEvaluation }> = [];

        for (const provider of available) {
          const prm = new ProcessRewardModel(provider.model);
          const evaluation = await prm.evaluateStep(
            "research",
            FIXTURES.researchOutput
          );
          results.push({ provider: provider.name, evaluation });
        }

        for (const { provider, evaluation } of results) {
          assertValidStepEval(evaluation, provider);
        }
      },
      90_000
    );
  }
);
