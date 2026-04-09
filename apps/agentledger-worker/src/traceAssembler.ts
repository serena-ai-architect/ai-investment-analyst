import type { AgentEvent } from '@agentledger/emitter';
import { TraceStore } from '@agentledger/store';

/**
 * TraceAssembler — converts raw AgentEvents into structured trace/span rows.
 *
 * Handles the event lifecycle:
 * - agent.run.start → create trace row
 * - agent.think/tool.call/tool.result/observe → create span rows + update metrics
 * - agent.run.end → complete trace with output
 * - agent.error → mark trace as error
 */
export class TraceAssembler {
  constructor(private store: TraceStore) {}

  process(event: AgentEvent): void {
    switch (event.eventType) {
      case 'agent.run.start':
        this.handleRunStart(event);
        break;
      case 'agent.run.end':
        this.handleRunEnd(event);
        break;
      case 'agent.error':
        this.handleError(event);
        break;
      case 'agent.tool.call':
        this.handleSpan(event);
        this.store.updateTraceMetrics(event.traceId, { toolCalls: 1 });
        break;
      case 'agent.tool.result':
        this.handleSpan(event);
        if (event.metrics.tokenUsage) {
          this.store.updateTraceMetrics(event.traceId, {
            tokensIn: event.metrics.tokenUsage.input,
            tokensOut: event.metrics.tokenUsage.output,
            cost: event.metrics.tokenUsage.cost,
          });
        }
        break;
      default:
        // agent.think, agent.observe — just record as span
        this.handleSpan(event);
        break;
    }
  }

  private handleRunStart(event: AgentEvent): void {
    this.store.insertTrace({
      trace_id: event.traceId,
      agent_name: event.agent.name,
      crew: event.agent.crew,
      started_at: event.timestamp,
    });
    this.handleSpan(event);
  }

  private handleRunEnd(event: AgentEvent): void {
    this.store.completeTrace(
      event.traceId,
      event.payload.finalOutput ?? '',
      event.payload.confidence ?? null,
      event.timestamp,
    );

    if (event.metrics.latencyMs) {
      this.store.updateTraceMetrics(event.traceId, { latencyMs: event.metrics.latencyMs });
    }
    if (event.metrics.tokenUsage) {
      this.store.updateTraceMetrics(event.traceId, {
        tokensIn: event.metrics.tokenUsage.input,
        tokensOut: event.metrics.tokenUsage.output,
        cost: event.metrics.tokenUsage.cost,
      });
    }

    this.handleSpan(event);
  }

  private handleError(event: AgentEvent): void {
    this.store.errorTrace(event.traceId, event.payload.error ?? 'Unknown error', event.timestamp);
    this.handleSpan(event);
  }

  private handleSpan(event: AgentEvent): void {
    this.store.insertSpan({
      span_id: event.spanId,
      trace_id: event.traceId,
      parent_span_id: event.parentSpanId ?? null,
      event_type: event.eventType,
      agent_name: event.agent.name,
      crew: event.agent.crew,
      run_index: event.agent.runIndex,
      payload: JSON.stringify(event.payload),
      latency_ms: event.metrics.latencyMs ?? null,
      tokens_in: event.metrics.tokenUsage?.input ?? null,
      tokens_out: event.metrics.tokenUsage?.output ?? null,
      cost: event.metrics.tokenUsage?.cost ?? null,
      timestamp: event.timestamp,
    });
  }
}
