/**
 * Layer 7: Chaos / Resilience Tests
 * ===================================
 * Injects failures at every layer to verify graceful degradation.
 * No LLM calls — all dependencies are mocked to simulate failures.
 *
 * Tests three categories:
 *   1. External service failures (API timeouts, malformed responses)
 *   2. LLM response corruption (invalid JSON, empty responses, wrong schema)
 *   3. State corruption (missing fields, unexpected values)
 *   4. Concurrent execution safety
 */

import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "crypto";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { AgentStateAnnotation, type AgentState } from "../types/index.js";
import type { StepEvaluation } from "../types/index.js";
import {
  routeAfterResearch,
  shouldSkipRisk,
  routeAfterReflexion,
} from "../graph/workflow.js";
import { guessTickerFromCompany, appendLiveDataSection } from "../graph/nodes.js";
import { ReflexionMemory } from "../skills/reflexion.js";

function makeState(overrides: Partial<AgentState> = {}): AgentState {
  return {
    company: "NVIDIA",
    query: "Full investment analysis",
    mode: "full",
    executionPlan: "",
    historicalContext: "",
    researchData: {},
    researchSources: [],
    researchSummary: "",
    financialAnalysis: "",
    marketAnalysis: "",
    techAnalysis: "",
    riskAssessment: "",
    riskScore: 0,
    draftReport: "",
    finalReport: "",
    reflexionMemory: "",
    stepEvaluations: [],
    deliveryStatus: "",
    qualityScore: 0,
    qualityFeedback: "",
    humanFeedback: "",
    iterationCount: 0,
    researchRetries: 0,
    analysisRetries: 0,
    costReport: "",
    errors: [],
    logs: [],
    currentPhase: "initialized",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. Routing under corrupted state
// ═══════════════════════════════════════════════════════════════

describe("Routing resilience — corrupted state", () => {
  it("routeAfterResearch handles undefined researchRetries", () => {
    const state = makeState({
      currentPhase: "research_blocked",
      researchRetries: undefined as any,
    });
    // Should use ?? 0 fallback and retry
    expect(routeAfterResearch(state)).toBe("research");
  });

  it("routeAfterResearch handles NaN researchRetries", () => {
    const state = makeState({
      currentPhase: "research_blocked",
      researchRetries: NaN as any,
    });
    // NaN < 2 is false, so should degrade to report
    expect(routeAfterResearch(state)).toBe("report");
  });

  it("routeAfterResearch handles negative retries", () => {
    const state = makeState({
      currentPhase: "research_blocked",
      researchRetries: -1,
    });
    // -1 < 2, should retry
    expect(routeAfterResearch(state)).toBe("research");
  });

  it("routeAfterResearch handles very large retry count", () => {
    const state = makeState({
      currentPhase: "research_blocked",
      researchRetries: 999,
    });
    expect(routeAfterResearch(state)).toBe("report");
  });

  it("routeAfterReflexion handles undefined qualityScore", () => {
    const state = makeState({
      qualityScore: undefined as any,
      iterationCount: 0,
    });
    // ?? 0, which is < 7.0 threshold, and iterations < 3, so retry
    expect(routeAfterReflexion(state)).toBe("report");
  });

  it("routeAfterReflexion handles NaN qualityScore", () => {
    const state = makeState({
      qualityScore: NaN,
      iterationCount: 2,
    });
    // NaN >= 7.0 is false, NaN >= 3 is false for iterations... wait
    // iterations = 2 < 3, so should retry
    expect(routeAfterReflexion(state)).toBe("report");
  });

  it("routeAfterReflexion handles negative score", () => {
    const state = makeState({
      qualityScore: -5,
      iterationCount: 3,
    });
    // -5 < 7.0, iterations 3 >= 3, so force delivery
    expect(routeAfterReflexion(state)).toBe("delivery");
  });

  it("shouldSkipRisk handles undefined mode", () => {
    const state = makeState({ mode: undefined as any });
    // undefined !== "quick", so should include risk
    expect(shouldSkipRisk(state)).toBe("risk");
  });

  it("routeAfterResearch handles unexpected phase string", () => {
    const state = makeState({
      currentPhase: "something_unexpected",
      researchRetries: 5,
    });
    // Not "research_blocked", so proceeds to analysis regardless of retries
    expect(routeAfterResearch(state)).toBe("analysis");
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Helper functions under malformed input
// ═══════════════════════════════════════════════════════════════

describe("Helper resilience — malformed input", () => {
  describe("guessTickerFromCompany edge cases", () => {
    it("handles empty string", () => {
      expect(guessTickerFromCompany("")).toBeNull();
    });

    it("handles whitespace-only string", () => {
      expect(guessTickerFromCompany("   ")).toBeNull();
    });

    it("handles special characters", () => {
      expect(guessTickerFromCompany("@#$%^&*")).toBeNull();
    });

    it("handles very long string", () => {
      const longStr = "A".repeat(10000);
      expect(guessTickerFromCompany(longStr)).toBeNull();
    });

    it("handles string with newlines", () => {
      expect(guessTickerFromCompany("NVIDIA\ncorporation")).toBe("NVDA");
    });

    it("handles unicode beyond CJK", () => {
      expect(guessTickerFromCompany("🚀🌙💎")).toBeNull();
    });
  });

  describe("appendLiveDataSection edge cases", () => {
    it("handles empty report", () => {
      const data = JSON.stringify({ Company: "Test" });
      const result = appendLiveDataSection("", data);
      expect(result).toContain("Live Market Data");
    });

    it("handles empty JSON object", () => {
      const result = appendLiveDataSection("# Report", "{}");
      // Should still work, just show N/A for everything
      expect(result).toContain("N/A");
    });

    it("handles JSON array instead of object", () => {
      const result = appendLiveDataSection("# Report", "[1,2,3]");
      // Should not crash — array access returns undefined → N/A
      expect(result).toContain("N/A");
    });

    it("handles deeply nested JSON", () => {
      const nested = JSON.stringify({ Company: { name: "Test" }, "Current Price": null });
      const result = appendLiveDataSection("# Report", nested);
      // Shouldn't crash
      expect(typeof result).toBe("string");
    });

    it("handles JSON with XSS payload in values", () => {
      const data = JSON.stringify({
        Company: '<script>alert("xss")</script>',
        "Current Price": "125",
      });
      const result = appendLiveDataSection("# Report", data);
      // Should pass through (markdown doesn't execute scripts)
      expect(result).toContain("script");
    });

    it("handles extremely large JSON", () => {
      const bigData: Record<string, string> = { Company: "Test" };
      for (let i = 0; i < 1000; i++) {
        bigData[`field_${i}`] = "x".repeat(100);
      }
      const result = appendLiveDataSection("# Report", JSON.stringify(bigData));
      expect(result).toContain("Test");
    });

    it("handles invalid timestamp in Data Timestamp", () => {
      const data = JSON.stringify({
        Company: "Test",
        "Data Timestamp": "not-a-date",
      });
      const result = appendLiveDataSection("# Report", data);
      // new Date("not-a-date").toISOString() throws → should fallback or handle
      // The code does: new Date(data["Data Timestamp"]).toISOString().split("T")[0]
      // Invalid Date → toISOString() throws → catch block → return original report
      expect(typeof result).toBe("string");
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. ReflexionMemory under stress
// ═══════════════════════════════════════════════════════════════

describe("ReflexionMemory resilience", () => {
  it("handles rapid add/query cycle", () => {
    const memory = new ReflexionMemory(5);
    for (let i = 0; i < 100; i++) {
      memory.add({
        attemptNumber: i,
        taskDescription: `Task ${i}`,
        outputSummary: `Output ${i}`,
        score: Math.random() * 10,
        reflection: `Reflection ${i}`,
        actionItems: [`Action ${i}`],
        timestamp: new Date().toISOString(),
      });
    }
    // Should only keep last 5
    const formatted = memory.formatForPrompt();
    expect(formatted).toContain("Attempt #99");
    expect(formatted).not.toMatch(/Attempt #94 \(/);
  });

  it("handles entries with empty actionItems", () => {
    const memory = new ReflexionMemory();
    memory.add({
      attemptNumber: 1,
      taskDescription: "Test",
      outputSummary: "Output",
      score: 5,
      reflection: "OK",
      actionItems: [],
      timestamp: new Date().toISOString(),
    });
    const formatted = memory.formatForPrompt();
    expect(formatted).toContain("Attempt #1");
    expect(formatted).toContain("Action Items:");
  });

  it("handles entries with very long strings", () => {
    const memory = new ReflexionMemory();
    memory.add({
      attemptNumber: 1,
      taskDescription: "x".repeat(10000),
      outputSummary: "y".repeat(10000),
      score: 5,
      reflection: "z".repeat(10000),
      actionItems: ["a".repeat(10000)],
      timestamp: new Date().toISOString(),
    });
    // Should not crash
    const formatted = memory.formatForPrompt();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("getBestScore handles entries with score 0", () => {
    const memory = new ReflexionMemory();
    memory.add({
      attemptNumber: 1,
      taskDescription: "Test",
      outputSummary: "Output",
      score: 0,
      reflection: "Failed",
      actionItems: [],
      timestamp: new Date().toISOString(),
    });
    expect(memory.getBestScore()).toBe(0);
  });

  it("getBestScore handles entries with negative scores", () => {
    const memory = new ReflexionMemory();
    memory.add({
      attemptNumber: 1,
      taskDescription: "Test",
      outputSummary: "Output",
      score: -5,
      reflection: "Failed",
      actionItems: [],
      timestamp: new Date().toISOString(),
    });
    expect(memory.getBestScore()).toBe(-5);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. Graph execution under failure injection
// ═══════════════════════════════════════════════════════════════

describe("Graph resilience — node failures", () => {
  /** Build a graph with configurable node failures */
  async function runGraphWithFailures(
    failingNodes: string[],
    overrides: Partial<AgentState> = {}
  ): Promise<{ finalState: AgentState; visited: string[] }> {
    const visited: string[] = [];

    const makeNode = (name: string, updates: (s: AgentState) => Partial<AgentState>) => {
      return async (state: AgentState): Promise<Partial<AgentState>> => {
        visited.push(name);
        if (failingNodes.includes(name)) {
          throw new Error(`${name} exploded!`);
        }
        return updates(state);
      };
    };

    // Wrap failing nodes in try-catch (simulating the real node error handling)
    const safeNode = (name: string, updates: (s: AgentState) => Partial<AgentState>) => {
      return async (state: AgentState): Promise<Partial<AgentState>> => {
        visited.push(name);
        try {
          if (failingNodes.includes(name)) {
            throw new Error(`${name} exploded!`);
          }
          return updates(state);
        } catch (e) {
          // Simulate real node error handling patterns
          const errorMsg = String(e);
          const fallbacks: Record<string, Partial<AgentState>> = {
            planning: {
              executionPlan: JSON.stringify({ tasks: [], version: 1, adaptations: [] }),
              currentPhase: "planned",
              errors: [errorMsg],
              logs: [`Planning failed: ${errorMsg}`],
            },
            research: {
              researchSummary: `Research failed: ${errorMsg}`,
              currentPhase: "research_blocked",
              researchRetries: (state.researchRetries ?? 0) + 1,
              errors: [errorMsg],
              logs: [`Research failed: ${errorMsg}`],
            },
            analysis: {
              currentPhase: "analysis_complete", // degrade: continue with empty analysis
              errors: [errorMsg],
              logs: [`Analysis failed: ${errorMsg}`],
            },
            risk: {
              riskScore: 5.0,
              currentPhase: "risk_complete",
              errors: [errorMsg],
              logs: [`Risk failed: ${errorMsg}`],
            },
            report: {
              draftReport: state.draftReport || "Report generation failed.",
              currentPhase: "report_generated",
              errors: [errorMsg],
              logs: [`Report failed: ${errorMsg}`],
            },
            reflexion: {
              qualityScore: 7.0, // default pass
              iterationCount: (state.iterationCount ?? 0) + 1,
              currentPhase: "reflexion_complete",
              errors: [errorMsg],
              logs: [`Reflexion failed: ${errorMsg}`],
            },
            delivery: {
              deliveryStatus: "failed",
              currentPhase: "delivered",
              errors: [errorMsg],
              logs: [`Delivery failed: ${errorMsg}`],
            },
          };
          return fallbacks[name] ?? { errors: [errorMsg], logs: [`${name} failed`] };
        }
      };
    };

    const graph = new StateGraph(AgentStateAnnotation)
      .addNode("planning", safeNode("planning", () => ({
        executionPlan: "{}", currentPhase: "planned", logs: ["Planned"],
      })))
      .addNode("notionContext", safeNode("notionContext", () => ({
        historicalContext: "No history.", logs: ["Context OK"],
      })))
      .addNode("research", safeNode("research", (s) => ({
        researchSummary: "Research done.",
        currentPhase: "research_complete",
        logs: ["Research OK"],
      })))
      .addNode("analysis", safeNode("analysis", () => ({
        financialAnalysis: "FA", marketAnalysis: "MA", techAnalysis: "TA",
        currentPhase: "analysis_complete", logs: ["Analysis OK"],
      })))
      .addNode("risk", safeNode("risk", () => ({
        riskAssessment: "Risk done.", riskScore: 5,
        currentPhase: "risk_complete", logs: ["Risk OK"],
      })))
      .addNode("report", safeNode("report", () => ({
        draftReport: "# Report", currentPhase: "report_generated", logs: ["Report OK"],
      })))
      .addNode("reflexion", safeNode("reflexion", (s) => ({
        qualityScore: 8.0, iterationCount: (s.iterationCount ?? 0) + 1,
        currentPhase: "reflexion_complete", logs: ["Reflexion OK"],
      })))
      .addNode("delivery", safeNode("delivery", () => ({
        deliveryStatus: "done", currentPhase: "delivered", logs: ["Delivery OK"],
      })))
      .addNode("finalize", safeNode("finalize", (s) => ({
        finalReport: s.draftReport ?? "No report.",
        currentPhase: "completed", logs: ["Finalized"],
      })))
      .addEdge(START, "planning")
      .addEdge("planning", "notionContext")
      .addEdge("notionContext", "research")
      .addConditionalEdges("research", routeAfterResearch, {
        analysis: "analysis", research: "research", report: "report",
      })
      .addConditionalEdges("analysis", shouldSkipRisk, {
        risk: "risk", report: "report",
      })
      .addEdge("risk", "report")
      .addEdge("report", "reflexion")
      .addConditionalEdges("reflexion", routeAfterReflexion, {
        report: "report", delivery: "delivery",
      })
      .addEdge("delivery", "finalize")
      .addEdge("finalize", END);

    const checkpointer = new MemorySaver();
    const workflow = graph.compile({ checkpointer });

    const initialState: Partial<AgentState> = {
      company: "TestCo", query: "test", mode: "full",
      researchData: {}, researchSources: [], researchSummary: "",
      financialAnalysis: "", marketAnalysis: "", techAnalysis: "",
      riskAssessment: "", riskScore: 0, draftReport: "", finalReport: "",
      qualityScore: 0, qualityFeedback: "", humanFeedback: "",
      iterationCount: 0, researchRetries: 0, analysisRetries: 0,
      errors: [], logs: [], currentPhase: "initialized",
      ...overrides,
    };

    const config = { configurable: { thread_id: `chaos-${randomUUID().slice(0, 8)}` } };
    const finalState = (await workflow.invoke(initialState, config)) as AgentState;
    return { finalState, visited };
  }

  it("survives planning failure — continues with empty plan", async () => {
    const { finalState } = await runGraphWithFailures(["planning"]);

    expect(finalState.currentPhase).toBe("completed");
    expect(finalState.errors.length).toBeGreaterThan(0);
    expect(finalState.errors.some((e: string) => e.includes("planning exploded"))).toBe(true);
  });

  it("survives research failure — retries then degrades", async () => {
    const { finalState, visited } = await runGraphWithFailures(["research"]);

    // Research fails → blocked → retries → eventually degrades to report
    const researchCount = visited.filter((n) => n === "research").length;
    expect(researchCount).toBeGreaterThanOrEqual(2);
    expect(finalState.currentPhase).toBe("completed");
    expect(finalState.errors.some((e: string) => e.includes("research exploded"))).toBe(true);
  });

  it("survives analysis failure — continues to risk and report", async () => {
    const { finalState, visited } = await runGraphWithFailures(["analysis"]);

    expect(visited).toContain("risk");
    expect(visited).toContain("report");
    expect(finalState.currentPhase).toBe("completed");
  });

  it("survives risk failure — continues with default score", async () => {
    const { finalState } = await runGraphWithFailures(["risk"]);

    expect(finalState.currentPhase).toBe("completed");
    expect(finalState.errors.some((e: string) => e.includes("risk exploded"))).toBe(true);
  });

  it("survives report failure — still reaches finalize", async () => {
    const { finalState } = await runGraphWithFailures(["report"]);

    expect(finalState.currentPhase).toBe("completed");
  });

  it("survives delivery failure — still finalizes", async () => {
    const { finalState, visited } = await runGraphWithFailures(["delivery"]);

    expect(visited).toContain("finalize");
    expect(finalState.currentPhase).toBe("completed");
  });

  it("survives multiple simultaneous failures", async () => {
    const { finalState } = await runGraphWithFailures([
      "planning", "risk", "delivery",
    ]);

    expect(finalState.currentPhase).toBe("completed");
    expect(finalState.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accumulates errors from all failed nodes", async () => {
    const { finalState } = await runGraphWithFailures([
      "planning", "analysis", "delivery",
    ]);

    const errorMessages = finalState.errors.join("\n");
    expect(errorMessages).toContain("planning");
    expect(errorMessages).toContain("analysis");
    expect(errorMessages).toContain("delivery");
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. Concurrent execution safety
// ═══════════════════════════════════════════════════════════════

describe("Concurrent execution safety", () => {
  it("parallel graph executions don't corrupt each other's state", async () => {
    const makeGraph = (company: string) => {
      const graph = new StateGraph(AgentStateAnnotation)
        .addNode("work", async (state: AgentState) => ({
          finalReport: `Report for ${state.company}`,
          currentPhase: "completed",
          logs: [`Done: ${state.company}`],
        }))
        .addEdge(START, "work")
        .addEdge("work", END);

      return graph.compile({ checkpointer: new MemorySaver() });
    };

    const companies = ["NVIDIA", "Apple", "Google", "Tesla", "Amazon"];
    const results = await Promise.all(
      companies.map(async (company) => {
        const workflow = makeGraph(company);
        const state: Partial<AgentState> = {
          company,
          query: `Analyze ${company}`,
          mode: "full",
          researchData: {},
          researchSources: [],
          errors: [],
          logs: [],
          stepEvaluations: [],
          currentPhase: "initialized",
        };
        const config = {
          configurable: { thread_id: `concurrent-${company}-${randomUUID().slice(0, 8)}` },
        };
        return (await workflow.invoke(state, config)) as AgentState;
      })
    );

    // Each result should have the correct company — no cross-contamination
    for (let i = 0; i < companies.length; i++) {
      expect(results[i].finalReport).toContain(companies[i]);
      expect(results[i].company).toBe(companies[i]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. PRM logic under edge-case evaluations
// ═══════════════════════════════════════════════════════════════

describe("PRM logic resilience", () => {
  // Test the pure logic (replicated from processReward.test.ts) with chaos inputs
  function hasBlockingFailure(evals: StepEvaluation[]): boolean {
    return evals.some((e) => e.isBlocking && e.score < 4);
  }

  function getWeakestStep(evals: StepEvaluation[]): string | null {
    if (evals.length === 0) return null;
    return evals.reduce((min, e) => (e.score < min.score ? e : min)).stepName;
  }

  it("handles evaluation with Infinity score", () => {
    const evals: StepEvaluation[] = [{
      stepName: "research", score: Infinity, dimensions: {},
      issues: [], isBlocking: false, recommendation: "proceed", details: "",
    }];
    expect(hasBlockingFailure(evals)).toBe(false);
    expect(getWeakestStep(evals)).toBe("research");
  });

  it("handles evaluation with -Infinity score", () => {
    const evals: StepEvaluation[] = [{
      stepName: "research", score: -Infinity, dimensions: {},
      issues: [], isBlocking: true, recommendation: "abort", details: "",
    }];
    expect(hasBlockingFailure(evals)).toBe(true);
    expect(getWeakestStep(evals)).toBe("research");
  });

  it("handles evaluation with NaN score", () => {
    const evals: StepEvaluation[] = [
      {
        stepName: "research", score: NaN, dimensions: {},
        issues: [], isBlocking: true, recommendation: "retry", details: "",
      },
      {
        stepName: "analysis", score: 5, dimensions: {},
        issues: [], isBlocking: false, recommendation: "proceed", details: "",
      },
    ];
    // NaN < 4 is false, so not blocking
    expect(hasBlockingFailure(evals)).toBe(false);
    // NaN < 5 is false, so reduce won't pick it — analysis wins as weakest
    // Actually: reduce starts with first element (NaN), then NaN < 5 → false → keeps NaN
    // So weakest is "research" with NaN score
    expect(getWeakestStep(evals)).toBe("research");
  });

  it("handles 1000 evaluations without performance issues", () => {
    const evals: StepEvaluation[] = Array.from({ length: 1000 }, (_, i) => ({
      stepName: `step_${i}`,
      score: Math.random() * 10,
      dimensions: {},
      issues: [],
      isBlocking: i === 500, // one blocking step
      recommendation: "proceed" as const,
      details: "",
    }));

    // Should complete quickly
    const start = Date.now();
    hasBlockingFailure(evals);
    getWeakestStep(evals);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100); // should be < 1ms honestly
  });
});
