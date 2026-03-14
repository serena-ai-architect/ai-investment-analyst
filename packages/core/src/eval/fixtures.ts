/**
 * Eval Fixtures: Test Data for Evaluation Cases
 * ================================================
 * Loads real reports from output/ and provides synthetic fixtures
 * for component-level and negative control evals.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// output/ is at repo root, eval/ is inside packages/core/src/eval/
const OUTPUT_DIR = resolve(import.meta.dirname, "../../../../output");

// ── Real Report Loader ───────────────────────────────────────

export function loadReportFixture(filename: string): string {
  return readFileSync(resolve(OUTPUT_DIR, filename), "utf-8");
}

// ── Synthetic Fixtures ───────────────────────────────────────

const SYNTHETIC: Record<string, string> = {
  "synthetic:nvidia-research": `
## NVIDIA Research Summary

NVIDIA (NVDA) dominates the AI accelerator market with an estimated 80%+ share in data center GPU training.
Key segments: Data Center ($18.4B Q4 2024 revenue, +409% YoY), Gaming ($2.9B, +56% YoY), Automotive ($346M, +21% YoY).

Financial highlights: TTM revenue $60.9B, gross margin 73.0%, net margin 55.0%. The company trades at ~65x trailing P/E.

Competitive moat: CUDA software ecosystem has 4M+ developers locked in. Alternatives (AMD ROCm, Intel oneAPI) lack comparable library depth. Key products: H100, H200, Blackwell B200 GPUs.

Sources: NVIDIA 10-K (Jan 2025), Bloomberg consensus, IDC Semiconductor Tracker, company earnings call transcript Q4 FY2025.
  `.trim(),

  "synthetic:apple-financial": `
## Apple Financial Analysis

Apple (AAPL) TTM Revenue: $385.6B (+6% YoY). Services segment: $96.2B revenue (+14% YoY), now 25% of total revenue with ~70% gross margin vs 36% for products.

Valuation: P/E 31.2x (5Y avg: 28x), Forward P/E 28.5x. EV/EBITDA 24.1x. PEG ratio 2.8x suggests premium valuation relative to growth.

Margins: Gross margin 46.2% (improving from 43.3% two years ago, driven by Services mix shift). Operating margin 31.5%. FCF yield 3.1%.

Growth catalysts: Services (App Store, Apple TV+, Apple Pay), India manufacturing expansion, potential AR/VR platform. Revenue CAGR target: 7-9% through FY2027.

Dividend: $0.96/share (0.52% yield), $90B annual buyback program reducing share count ~3% annually.

Risk to valuation: iPhone revenue concentration (52% of total), China regulatory headwinds, antitrust (Epic Games, EU DMA).
  `.trim(),

  "synthetic:amd-risk": `
## AMD Risk Assessment

**Competitive Risk (High):** NVIDIA holds 80%+ AI training GPU market. AMD MI300X shows promise but lacks CUDA-equivalent ecosystem. ROCm adoption remains limited to specialized workloads. If NVIDIA's Blackwell architecture extends performance lead, AMD's AI revenue growth ($3.5B in 2024) could stall.

**Concentration Risk (Medium-High):** Data center now ~50% of AMD revenue. Heavy dependence on hyperscaler capex cycles (Microsoft, Google, Meta). Any pullback in cloud spending directly impacts AMD's growth trajectory.

**Supply Chain Risk (Medium):** Sole reliance on TSMC for leading-edge manufacturing (3nm/5nm). Geopolitical tensions around Taiwan create existential supply risk. TSMC capacity allocation favors Apple and NVIDIA.

**Margin Pressure Risk (Medium):** Competing on price vs NVIDIA in AI accelerators compresses margins. Server CPU gains (EPYC vs Intel Xeon) may face renewed competition from Intel's Granite Rapids. Gross margin 52% vs NVIDIA's 73%.

**Execution Risk (Medium):** Simultaneous competition in CPU (vs Intel), GPU (vs NVIDIA), and FPGA (vs Lattice/Intel) stretches R&D resources ($5.9B, 23% of revenue). Xilinx integration synergies still being realized.
  `.trim(),

  "synthetic:weak-report": `
# Investment Report: GenericCo

## Summary
GenericCo is a company that operates in various markets. The company has been performing well recently and shows promising growth potential. Market conditions are favorable for continued expansion.

## Analysis
The financial performance has been solid. Revenue has been growing and margins are healthy. The company has a good competitive position in its industry.

## Market Position
GenericCo competes with several other companies in the market. The competitive landscape is dynamic and evolving. The company has some advantages over its peers.

## Risks
There are several risks to consider including market risk, competitive risk, and operational risk. Economic conditions could impact the company's performance. Regulatory changes may also affect the business.

## Recommendation
Based on our analysis, we believe GenericCo presents an interesting investment opportunity. Investors should consider their risk tolerance and investment objectives when making a decision.

The company's long-term prospects appear favorable given current market dynamics and the management team's strategic vision.
  `.trim(),

  "synthetic:healthcare-brief": `
# Investment Analysis: UnitedHealth Group (UNH)

## Executive Summary
UnitedHealth Group is the largest US healthcare company by revenue ($371.6B TTM), operating through two main segments: UnitedHealthcare (insurance, 55M+ members) and Optum (health services, technology, and pharmacy benefits).

## Financial Overview
- Revenue: $371.6B TTM (+12% YoY)
- Operating Margin: 8.5%
- EPS: $25.12 (FY2024), consensus FY2025: $28.40 (+13%)
- P/E: 19.8x (below 5Y avg 23x)
- Dividend Yield: 1.5%, 14 consecutive years of increases

## Competitive Moat
Vertical integration across insurance (UnitedHealthcare), care delivery (Optum Health, 90K+ physicians), pharmacy benefits (Optum Rx, 1.4B scripts), and health IT (Optum Insight). This creates data advantages and cost efficiencies unmatched by pure-play insurers.

## Risk Factors
- **Regulatory:** CMS Medicare Advantage rate changes, potential PBM reform legislation, DOJ antitrust scrutiny of Optum acquisitions
- **Medical Cost Ratio:** MCR of 85.2% in Q4 2024 exceeded guidance (83-84%), driven by higher utilization post-COVID
- **Cybersecurity:** Feb 2024 Change Healthcare breach ($2.5B+ impact) exposed systemic IT infrastructure risks
- **Political:** Medicare-for-All proposals, drug pricing reform (IRA), Medicaid redeterminations reducing enrollment

## Recommendation
BUY with 12-month price target $620-$650 (15% upside). Valuation discount to historical average presents entry opportunity. Key catalyst: Optum margin recovery in H2 2025.
  `.trim(),
};

// ── Unified Fixture Loader ───────────────────────────────────

/**
 * Load fixture data by key.
 * - Keys like "nvidia_report.md" load from output/
 * - Keys like "synthetic:xxx" load from inline synthetic data
 */
export function loadFixture(key: string): string {
  if (key.startsWith("synthetic:")) {
    const data = SYNTHETIC[key];
    if (!data) throw new Error(`Unknown synthetic fixture: ${key}`);
    return data;
  }
  return loadReportFixture(key);
}
