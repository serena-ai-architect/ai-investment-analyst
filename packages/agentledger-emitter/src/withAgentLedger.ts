import type { AgentContext } from './events.js';
import { AgentLedgerEmitter, type EmitterOptions } from './emitter.js';

export interface AgentLedgerConfig {
  crew: string;
  agentName: string;
  emitter?: AgentLedgerEmitter;
  emitterOptions?: EmitterOptions;
}

/**
 * Creates a traced agent context + emitter pair.
 *
 * Usage in agentic-analyst:
 *
 *   const { emitter, agentCtx, traceId } = withAgentLedger({
 *     crew: 'Research',
 *     agentName: 'WebSearchAgent',
 *   });
 *
 *   emitter.emitRunStart(traceId, agentCtx);
 *   // ... agent does work ...
 *   emitter.emitThink(traceId, agentCtx, 'I should search for...');
 *   emitter.emitToolCall(traceId, agentCtx, 'webSearch', { query: '...' });
 *   emitter.emitRunEnd(traceId, agentCtx, 'Final answer: ...');
 */
export function withAgentLedger(config: AgentLedgerConfig) {
  const emitter = config.emitter ?? new AgentLedgerEmitter(config.emitterOptions);
  const traceId = emitter.newTraceId();

  const agentCtx: AgentContext = {
    name: config.agentName,
    crew: config.crew,
    runIndex: 0,
  };

  return {
    emitter,
    agentCtx,
    traceId,
    /** Increment runIndex for new ReAct loop iterations */
    nextIteration() {
      agentCtx.runIndex += 1;
      return agentCtx.runIndex;
    },
  };
}
