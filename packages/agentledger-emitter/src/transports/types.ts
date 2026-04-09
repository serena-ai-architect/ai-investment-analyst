import type { AgentEvent } from '../events.js';

export interface Transport {
  name: string;
  send(event: AgentEvent): Promise<void>;
  close(): Promise<void>;
}
