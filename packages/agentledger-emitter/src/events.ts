/**
 * AgentLedger Event Schema
 *
 * 7 standard event types capturing the full ReAct cycle:
 * think → act (tool.call) → observe (tool.result) → decide (run.end)
 *
 * Follows OpenTelemetry semantic conventions for data format,
 * transported via Redis Streams (not OTel Collector).
 */

export const AGENT_EVENT_TYPES = [
  'agent.run.start',
  'agent.think',
  'agent.tool.call',
  'agent.tool.result',
  'agent.observe',
  'agent.run.end',
  'agent.error',
] as const;

export type AgentEventType = (typeof AGENT_EVENT_TYPES)[number];

export interface AgentContext {
  name: string;       // e.g., "WebSearchAgent"
  crew: string;       // e.g., "Research"
  runIndex: number;   // Which ReAct loop iteration
}

export interface AgentEventPayload {
  thought?: string;        // agent.think: ReAct thought
  toolName?: string;       // agent.tool.call: which tool
  toolInput?: unknown;     // agent.tool.call: tool input
  toolOutput?: unknown;    // agent.tool.result: tool return
  observation?: string;    // agent.observe: agent's observation
  finalOutput?: string;    // agent.run.end: final output
  error?: string;          // agent.error: error message
  confidence?: number;     // 0-1: agent self-assessed confidence
}

export interface AgentEventMetrics {
  latencyMs?: number;
  tokenUsage?: {
    input: number;
    output: number;
    cost: number;
  };
}

export interface AgentEvent {
  eventType: AgentEventType;
  traceId: string;        // Unique ID for the entire agent run
  spanId: string;         // Unique ID for this step
  parentSpanId?: string;  // Crew → agent → step hierarchy
  timestamp: string;      // ISO 8601

  agent: AgentContext;
  payload: AgentEventPayload;
  metrics: AgentEventMetrics;
}

/** Helper to create a minimal event (fills defaults) */
export function createEvent(
  eventType: AgentEventType,
  traceId: string,
  spanId: string,
  agent: AgentContext,
  payload: AgentEventPayload = {},
  overrides: Partial<Pick<AgentEvent, 'parentSpanId' | 'metrics'>> = {},
): AgentEvent {
  return {
    eventType,
    traceId,
    spanId,
    timestamp: new Date().toISOString(),
    agent,
    payload,
    metrics: overrides.metrics ?? {},
    ...(overrides.parentSpanId && { parentSpanId: overrides.parentSpanId }),
  };
}
