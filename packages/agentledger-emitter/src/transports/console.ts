import type { AgentEvent } from '../events.js';
import type { Transport } from './types.js';

/**
 * Console transport — logs events to stdout.
 * Use for development and debugging.
 */
export class ConsoleTransport implements Transport {
  name = 'console';

  async send(event: AgentEvent): Promise<void> {
    const prefix = `[AgentLedger] ${event.timestamp}`;
    const agent = `${event.agent.crew}/${event.agent.name}`;

    switch (event.eventType) {
      case 'agent.run.start':
        console.log(`${prefix} ▶ ${agent} started (trace: ${event.traceId})`);
        break;
      case 'agent.think':
        console.log(`${prefix} 💭 ${agent} thought: ${event.payload.thought?.slice(0, 120)}`);
        break;
      case 'agent.tool.call':
        console.log(`${prefix} 🔧 ${agent} calling ${event.payload.toolName}`);
        break;
      case 'agent.tool.result':
        console.log(`${prefix} ✅ ${agent} ${event.payload.toolName} returned (${event.metrics.latencyMs ?? '?'}ms)`);
        break;
      case 'agent.observe':
        console.log(`${prefix} 👁 ${agent} observed: ${event.payload.observation?.slice(0, 120)}`);
        break;
      case 'agent.run.end':
        console.log(`${prefix} ⏹ ${agent} completed (trace: ${event.traceId})`);
        break;
      case 'agent.error':
        console.error(`${prefix} ❌ ${agent} error: ${event.payload.error}`);
        break;
    }
  }

  async close(): Promise<void> {
    // noop
  }
}
