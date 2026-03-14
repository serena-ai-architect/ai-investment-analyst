/**
 * EvalJudge: LLM-as-Judge Scoring Engine
 * ========================================
 * Reuses existing ReflexionEngine and ProcessRewardModel to score
 * eval cases. No new LLM prompts are invented — we leverage the
 * same evaluation infrastructure the pipeline uses in production.
 *
 * Three scoring paths:
 * 1. Report scoring → ReflexionEngine.evaluateAndReflect()
 * 2. Component scoring → ProcessRewardModel.evaluateStep()
 * 3. Translation scoring → Custom structured output (single LLM call)
 */

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLLM } from "../config.js";
import { ReflexionEngine } from "../skills/reflexion.js";
import { ProcessRewardModel } from "../skills/processReward.js";
import { z } from "zod";
import type { EvalCase } from "./cases.js";

// ── Result Types ─────────────────────────────────────────────

export interface JudgeScores {
  completeness: number;
  dataQuality: number;
  analyticalDepth: number;
  actionability: number;
  writingQuality: number;
  overall: number;
}

export interface JudgeResult {
  caseId: string;
  scores: JudgeScores;
  reasoning: string;
  issues: string[];
  passed: boolean;
  latencyMs: number;
}

export interface TranslationScores {
  accuracy: number;
  formatting: number;
  numberPreservation: number;
  terminology: number;
  overall: number;
}

export interface TranslationJudgeResult {
  caseId: string;
  scores: TranslationScores;
  reasoning: string;
  issues: string[];
  passed: boolean;
  latencyMs: number;
}

// ── Translation Scoring Schema ───────────────────────────────

const TranslationEvalSchema = z.object({
  accuracy: z.number().min(1).max(10).describe("Accuracy of meaning transfer"),
  formatting: z.number().min(1).max(10).describe("Markdown structure preservation"),
  numberPreservation: z.number().min(1).max(10).describe("All numbers, percentages, dollar amounts preserved exactly"),
  terminology: z.number().min(1).max(10).describe("Financial/technical terms translated correctly"),
  overall: z.number().min(1).max(10).describe("Overall translation quality"),
  reasoning: z.string().describe("Brief explanation of scores"),
  issues: z.array(z.string()).describe("Specific translation problems found"),
});

// ── EvalJudge ────────────────────────────────────────────────

export class EvalJudge {
  private model: string;

  constructor(model = "deepseek-chat") {
    this.model = model;
  }

  /**
   * Score a full investment report using ReflexionEngine.
   * Injects expectedCharacteristics into the task description
   * to guide the evaluator's focus.
   */
  async scoreReport(report: string, evalCase: EvalCase): Promise<JudgeResult> {
    const start = Date.now();

    const characteristicsStr = evalCase.expectedCharacteristics.length > 0
      ? `Must include: ${evalCase.expectedCharacteristics.join("; ")}. `
      : "";

    const task =
      `Evaluate the investment report for ${evalCase.company}. ` +
      characteristicsStr +
      `Score strictly — only exceptional reports deserve 9+.`;

    const engine = new ReflexionEngine(this.model);
    const result = await engine.evaluateAndReflect(task, report, 1);

    // Parse dimension scores from the evaluation text
    const scores = this.parseEvaluationScores(result.evaluation, result.score);

    // Heuristic post-checks (no LLM cost)
    const heuristicIssues = this.runHeuristics(report, evalCase);

    const allIssues = [...result.actionItems, ...heuristicIssues];
    const passed = evalCase.minimumScore !== undefined
      ? scores.overall >= evalCase.minimumScore
      : evalCase.maximumScore !== undefined
        ? scores.overall <= evalCase.maximumScore
        : true;

    return {
      caseId: evalCase.id,
      scores,
      reasoning: result.evaluation,
      issues: allIssues,
      passed,
      latencyMs: Date.now() - start,
    };
  }

  /**
   * Score a pipeline component (research, financial analysis, risk) using PRM.
   */
  async scoreComponent(output: string, evalCase: EvalCase): Promise<JudgeResult> {
    const start = Date.now();

    const stepName = evalCase.componentType ?? "research";
    const prm = new ProcessRewardModel(this.model);
    const evaluation = await prm.evaluateStep(stepName, output);

    // Map PRM dimensions to judge scores
    const dims = evaluation.dimensions ?? {};
    const scores: JudgeScores = {
      completeness: (dims["coverage"] ?? dims["completeness"] ?? evaluation.score) ,
      dataQuality: (dims["accuracy"] ?? dims["dataQuality"] ?? evaluation.score),
      analyticalDepth: (dims["depth"] ?? dims["analyticalDepth"] ?? evaluation.score),
      actionability: (dims["actionability"] ?? evaluation.score),
      writingQuality: (dims["clarity"] ?? dims["writingQuality"] ?? evaluation.score),
      overall: evaluation.score,
    };

    // Normalize dimension scores to 1-10 range
    for (const key of Object.keys(scores) as (keyof JudgeScores)[]) {
      if (key !== "overall") {
        scores[key] = Math.min(10, Math.max(1, scores[key]));
      }
    }

    const passed = evalCase.minimumScore !== undefined
      ? scores.overall >= evalCase.minimumScore
      : true;

    return {
      caseId: evalCase.id,
      scores,
      reasoning: evaluation.details,
      issues: evaluation.issues,
      passed,
      latencyMs: Date.now() - start,
    };
  }

  /**
   * Score a translation using custom structured output.
   * Evaluates: accuracy, formatting preservation, number preservation, terminology.
   */
  async scoreTranslation(
    original: string,
    translation: string,
    evalCase: EvalCase
  ): Promise<TranslationJudgeResult> {
    const start = Date.now();

    const llm = createLLM({ model: this.model, temperature: 0 });
    const structuredLLM = (llm as any).withStructuredOutput(TranslationEvalSchema);

    let result: z.infer<typeof TranslationEvalSchema>;
    try {
      result = await structuredLLM.invoke([
        new SystemMessage(
          `You evaluate English-to-Chinese translations of financial reports.\n` +
          `Score each dimension 1-10. Be strict.\n` +
          `Check that ALL numbers, percentages, and dollar amounts are preserved exactly.\n` +
          `Check that financial terms are correctly translated (e.g., P/E = 市盈率, margin = 利润率/毛利率).`
        ),
        new HumanMessage(
          `Original (English):\n${original.slice(0, 3000)}\n\n` +
          `Translation (Chinese):\n${translation.slice(0, 3000)}\n\n` +
          `Evaluate the translation quality.`
        ),
      ]);
    } catch {
      result = {
        accuracy: 5, formatting: 5, numberPreservation: 5,
        terminology: 5, overall: 5,
        reasoning: "Translation evaluation parsing failed, using default scores.",
        issues: ["Evaluation parsing failed"],
      };
    }

    const scores: TranslationScores = {
      accuracy: result.accuracy,
      formatting: result.formatting,
      numberPreservation: result.numberPreservation,
      terminology: result.terminology,
      overall: result.overall,
    };

    const passed = evalCase.minimumScore !== undefined
      ? scores.overall >= evalCase.minimumScore
      : true;

    return {
      caseId: evalCase.id,
      scores,
      reasoning: result.reasoning,
      issues: result.issues,
      passed,
      latencyMs: Date.now() - start,
    };
  }

  // ── Private Helpers ──────────────────────────────────────────

  /**
   * Parse dimension scores from ReflexionEngine's evaluation text.
   * Format: "COMPLETENESS: 1.5/2\nDATA_QUALITY: 1/2\n..."
   */
  private parseEvaluationScores(evaluationText: string, overallScore: number): JudgeScores {
    const extract = (label: string): number => {
      const match = evaluationText.match(new RegExp(`${label}:\\s*([\\d.]+)`));
      // Dimension scores are 0-2 in ReflexionEngine, scale to 0-10
      return match ? Math.min(10, parseFloat(match[1]) * 5) : overallScore;
    };

    return {
      completeness: extract("COMPLETENESS"),
      dataQuality: extract("DATA_QUALITY"),
      analyticalDepth: extract("ANALYTICAL_DEPTH"),
      actionability: extract("ACTIONABILITY"),
      writingQuality: extract("WRITING_QUALITY"),
      overall: overallScore,
    };
  }

  /**
   * Heuristic checks that don't cost LLM calls.
   */
  private runHeuristics(report: string, evalCase: EvalCase): string[] {
    const issues: string[] = [];

    // Data density: count numbers in report
    const numbers = report.match(/\d+\.?\d*[%$BMK]?/g) ?? [];
    if (numbers.length < 5) {
      issues.push(`Low data density: only ${numbers.length} numbers found (expected 5+)`);
    }

    // Risk specificity: generic risk language without company name
    if (evalCase.company !== "GenericCo") {
      const hasGenericRisk = /market risk|competitive risk|operational risk/i.test(report);
      const hasCompanyName = report.toLowerCase().includes(evalCase.company.toLowerCase());
      if (hasGenericRisk && !hasCompanyName) {
        issues.push("Risk assessment uses generic language without company-specific context");
      }
    }

    return issues;
  }
}
