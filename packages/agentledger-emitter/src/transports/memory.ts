import type { AgentEvent } from '../events.js';
import type { Transport } from './types.js';

/**
 * In-memory transport — stores events in an array.
 * Use for testing and as a fallback when Redis is unavailable.
 */
export class MemoryTransport implements Transport {
  name = 'memory';
  readonly events: AgentEvent[] = [];

  async send(event: AgentEvent): Promise<void> {
    this.events.push(event);
  }

  clear(): void {
    this.events.length = 0;
  }

  getByTraceId(traceId: string): AgentEvent[] {
    return this.events.filter((e) => e.traceId === traceId);
  }

  async close(): Promise<void> {
    // noop
  }
}
