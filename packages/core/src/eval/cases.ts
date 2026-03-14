/**
 * Eval Cases: Golden Set Definition
 * ===================================
 * Defines the evaluation cases (golden set) for measuring AI output quality.
 *
 * Each case specifies:
 * - What type of output to evaluate (report, component, translation)
 * - Where to get the fixture data
 * - What characteristics to expect
 * - Minimum acceptable score
 */

// ── Types ────────────────────────────────────────────────────

export type EvalType = "report" | "component" | "translation" | "negative_control";
export type ComponentType = "research" | "financial_analysis" | "risk_assessment";

export interface EvalCase {
  id: string;
  type: EvalType;
  company: string;
  description: string;
  /** Fixture key — maps to a function in fixtures.ts */
  fixtureKey: string;
  /** For translation evals: the original English report fixture key */
  originalFixtureKey?: string;
  /** For component evals: which PRM step rubric to use */
  componentType?: ComponentType;
  /** Characteristics the output MUST exhibit */
  expectedCharacteristics: string[];
  /** Minimum score to pass (undefined for negative controls) */
  minimumScore?: number;
  /** Maximum score (for negative controls) */
  maximumScore?: number;
}

// ── Golden Set ───────────────────────────────────────────────

export const EVAL_CASES: EvalCase[] = [
  // ─── Full Report Evals ──────────────────────────────────────
  {
    id: "nvidia-full-report",
    type: "report",
    company: "NVIDIA",
    description: "Full NVIDIA investment report quality",
    fixtureKey: "nvidia_report.md",
    expectedCharacteristics: [
      "Data Center revenue and growth",
      "CUDA ecosystem as competitive moat",
      "GPU market share in AI training",
      "Specific financial metrics (P/E, margin, revenue)",
      "Clear investment recommendation",
    ],
    minimumScore: 6.0,
  },
  {
    id: "apple-full-report",
    type: "report",
    company: "Apple",
    description: "Full Apple investment report quality",
    fixtureKey: "apple_report.md",
    expectedCharacteristics: [
      "Services segment growth and revenue",
      "iPhone revenue and market position",
      "Ecosystem lock-in and switching costs",
      "Specific financial metrics",
      "Clear investment recommendation",
    ],
    minimumScore: 6.0,
  },
  {
    id: "amd-full-report",
    type: "report",
    company: "AMD",
    description: "Full AMD investment report quality",
    fixtureKey: "amd_report.md",
    expectedCharacteristics: [
      "EPYC server CPU market gains",
      "MI300 AI accelerator positioning",
      "Competition with NVIDIA",
      "Specific financial metrics",
      "Clear investment recommendation",
    ],
    minimumScore: 6.0,
  },

  // ─── Translation Eval ───────────────────────────────────────
  {
    id: "nvidia-translation",
    type: "translation",
    company: "NVIDIA",
    description: "Chinese translation preserves data and financial terms",
    fixtureKey: "nvidia_report_zh.md",
    originalFixtureKey: "nvidia_report.md",
    expectedCharacteristics: [
      "Numbers preserved exactly",
      "Financial terminology accurate in Chinese",
      "Markdown formatting preserved",
      "Section structure matches original",
    ],
    minimumScore: 6.0,
  },

  // ─── Component Evals ────────────────────────────────────────
  {
    id: "nvidia-research",
    type: "component",
    company: "NVIDIA",
    description: "Research summary coverage and data quality",
    fixtureKey: "synthetic:nvidia-research",
    componentType: "research",
    expectedCharacteristics: [
      "Covers data center, gaming, auto segments",
      "Recent financial data cited",
      "Multiple source types referenced",
    ],
    minimumScore: 5.0,
  },
  {
    id: "apple-financial",
    type: "component",
    company: "Apple",
    description: "Financial analysis with valuation metrics",
    fixtureKey: "synthetic:apple-financial",
    componentType: "financial_analysis",
    expectedCharacteristics: [
      "P/E ratio and valuation context",
      "Revenue growth trends",
      "Margin analysis",
      "Forward projections or targets",
    ],
    minimumScore: 5.0,
  },
  {
    id: "amd-risk",
    type: "component",
    company: "AMD",
    description: "Risk assessment is company-specific, not generic",
    fixtureKey: "synthetic:amd-risk",
    componentType: "risk_assessment",
    expectedCharacteristics: [
      "AMD-specific competitive risks vs NVIDIA",
      "Data center market concentration",
      "Supply chain dependencies",
      "Not generic boilerplate risks",
    ],
    minimumScore: 5.0,
  },

  // ─── Negative Control ───────────────────────────────────────
  {
    id: "weak-generic-report",
    type: "negative_control",
    company: "GenericCo",
    description: "Weak report SHOULD score low — validates judge discrimination",
    fixtureKey: "synthetic:weak-report",
    expectedCharacteristics: [],
    maximumScore: 5.0,
  },

  // ─── Cross-Sector ──────────────────────────────────────────
  {
    id: "healthcare-brief",
    type: "report",
    company: "UnitedHealth",
    description: "Cross-sector: healthcare industry analysis",
    fixtureKey: "synthetic:healthcare-brief",
    expectedCharacteristics: [
      "Healthcare-specific terminology",
      "Revenue or membership data",
      "Regulatory environment (CMS, ACA)",
      "Industry-specific risks",
    ],
    minimumScore: 5.0,
  },
];

/** Get a single case by ID */
export function getCase(id: string): EvalCase | undefined {
  return EVAL_CASES.find((c) => c.id === id);
}

/** Get cases by type */
export function getCasesByType(type: EvalType): EvalCase[] {
  return EVAL_CASES.filter((c) => c.type === type);
}
