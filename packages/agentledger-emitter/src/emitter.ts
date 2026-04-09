import { v4 as uuidv4 } from 'uuid';
import type { AgentEvent, AgentEventPayload, AgentEventMetrics, AgentContext, AgentEventType } from './events.js';
import { createEvent } from './events.js';
import type { Transport } from './transports/types.js';
import { ConsoleTransport } from './transports/console.js';

export interface EmitterOptions {
  transports?: Transport[];
  /** If true, errors in transports are swallowed (default: true — never block the agent) */
  silentErrors?: boolean;
}

/**
 * AgentLedgerEmitter — the core class that agents use to emit governance events.
 *
 * Design principles:
 * - Fire-and-forget: emit() returns immediately, never blocks the agent
 * - Multi-transport: events go to all configured transports in parallel
 * - Fault-tolerant: transport failures are swallowed by default
 */
export class AgentLedgerEmitter {
  private transports: Transport[];
  private silentErrors: boolean;

  constructor(options: EmitterOptions = {}) {
    this.transports = options.transports ?? [new ConsoleTransport()];
    this.silentErrors = options.silentErrors ?? true;
  }

  /** Generate a new trace ID for an agent run */
  newTraceId(): string {
    return uuidv4();
  }

  /** Generate a new span ID for a step */
  newSpanId(): string {
    return uuidv4();
  }

  /** Emit an event to all transports. Fire-and-forget. */
  emit(event: AgentEvent): void {
    // Fire-and-forget: don't await, don't block the agent
    void this.sendToAll(event);
  }

  /** Emit and await delivery to all transports (for testing/verification) */
  async emitAsync(event: AgentEvent): Promise<void> {
    await this.sendToAll(event);
  }

  private async sendToAll(event: AgentEvent): Promise<void> {
    const results = await Promise.allSettled(
      this.transports.map((t) => t.send(event)),
    );

    if (!this.silentErrors) {
      for (const result of results) {
        if (result.status === 'rejected') {
          throw result.reason;
        }
      }
    }
  }

  /** Close all transports (call on process shutdown) */
  async close(): Promise<void> {
    await Promise.allSettled(this.transports.map((t) => t.close()));
  }

  // ── Convenience methods ───────────────────────────────────────────

  emitRunStart(traceId: string, agent: AgentContext, parentSpanId?: string): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.run.start', traceId, spanId, agent, {}, { parentSpanId }));
    return spanId;
  }

  emitThink(traceId: string, agent: AgentContext, thought: string, parentSpanId?: string): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.think', traceId, spanId, agent, { thought }, { parentSpanId }));
    return spanId;
  }

  emitToolCall(traceId: string, agent: AgentContext, toolName: string, toolInput: unknown, parentSpanId?: string): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.tool.call', traceId, spanId, agent, { toolName, toolInput }, { parentSpanId }));
    return spanId;
  }

  emitToolResult(
    traceId: string,
    agent: AgentContext,
    toolName: string,
    toolOutput: unknown,
    latencyMs: number,
    parentSpanId?: string,
  ): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.tool.result', traceId, spanId, agent, { toolName, toolOutput }, {
      parentSpanId,
      metrics: { latencyMs },
    }));
    return spanId;
  }

  emitObserve(traceId: string, agent: AgentContext, observation: string, parentSpanId?: string): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.observe', traceId, spanId, agent, { observation }, { parentSpanId }));
    return spanId;
  }

  emitRunEnd(
    traceId: string,
    agent: AgentContext,
    finalOutput: string,
    metrics: AgentEventMetrics = {},
    confidence?: number,
    parentSpanId?: string,
  ): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.run.end', traceId, spanId, agent, { finalOutput, confidence }, {
      parentSpanId,
      metrics,
    }));
    return spanId;
  }

  emitError(traceId: string, agent: AgentContext, error: string, parentSpanId?: string): string {
    const spanId = this.newSpanId();
    this.emit(createEvent('agent.error', traceId, spanId, agent, { error }, { parentSpanId }));
    return spanId;
  }
}
