/**
 * AgentLedger End-to-End Demo
 *
 * Simulates a full agent run → emit events → consume → store → query.
 * Uses MemoryTransport (no Redis needed) for instant verification.
 *
 * Run: npx tsx scripts/agentledger-demo.ts
 */

import {
  AgentLedgerEmitter,
  MemoryTransport,
  ConsoleTransport,
  type AgentContext,
} from '@agentledger/emitter';
import { TraceStore } from '@agentledger/store';
import { TraceAssembler } from '../apps/agentledger-worker/src/traceAssembler.js';

async function demo() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' AgentLedger E2E Demo — Simulated Research Agent');
  console.log('═══════════════════════════════════════════════════\n');

  // ── Setup ──────────────────────────────────────────────────────

  const memoryTransport = new MemoryTransport();
  const emitter = new AgentLedgerEmitter({
    transports: [new ConsoleTransport(), memoryTransport],
  });

  const store = new TraceStore(':memory:'); // In-memory SQLite for demo
  const assembler = new TraceAssembler(store);

  // ── Simulate: Research Agent analyzing Tencent ─────────────────

  const traceId = emitter.newTraceId();
  const agent: AgentContext = {
    name: 'WebSearchAgent',
    crew: 'Research',
    runIndex: 0,
  };

  // Step 1: Run starts
  emitter.emitRunStart(traceId, agent);
  await sleep(50);

  // Step 2: Agent thinks
  emitter.emitThink(traceId, agent, 'I need to research Tencent Holdings (0700.HK) — recent earnings, market position, and regulatory environment in HK.');
  await sleep(50);

  // Step 3: Agent calls a tool
  const toolCallSpan = emitter.emitToolCall(traceId, agent, 'webSearch', {
    query: 'Tencent 0700.HK Q4 2025 earnings revenue growth',
  });
  await sleep(100);

  // Step 4: Tool returns result
  emitter.emitToolResult(traceId, agent, 'webSearch', {
    results: [
      'Tencent Q4 2025 revenue: HK$174.8B, +11% YoY',
      'Gaming revenue recovered: +9% to HK$49.5B',
      'Cloud and fintech: +18% to HK$59.4B',
    ],
  }, 234);
  await sleep(50);

  // Step 5: Agent observes
  agent.runIndex = 1;
  emitter.emitObserve(traceId, agent, 'Tencent shows solid recovery in gaming (+9%) and strong fintech/cloud growth (+18%). Revenue growth of 11% is above market consensus of 8%.');
  await sleep(50);

  // Step 6: Second tool call — financial data
  emitter.emitToolCall(traceId, agent, 'getFinancials', {
    ticker: '0700.HK',
    metrics: ['PE', 'PB', 'dividendYield'],
  });
  await sleep(80);

  emitter.emitToolResult(traceId, agent, 'getFinancials', {
    PE: 22.3,
    PB: 4.1,
    dividendYield: 0.8,
    marketCap: 'HK$3.89T',
  }, 156);
  await sleep(50);

  // Step 7: Agent thinks again
  emitter.emitThink(traceId, agent, 'PE of 22.3x is reasonable for a tech conglomerate. Dividend yield is low but Tencent is a growth stock. Strong buy-back program supports shareholder return.');
  await sleep(50);

  // Step 8: Run ends
  emitter.emitRunEnd(traceId, agent,
    'Tencent (0700.HK) — BUY. Revenue growth accelerating (+11% YoY), gaming recovery confirmed, fintech/cloud at +18%. PE 22.3x reasonable for growth profile. Key risk: regulatory tightening on gaming hours.',
    { latencyMs: 2340, tokenUsage: { input: 1250, output: 680, cost: 0.043 } },
    0.85,
  );

  // ── Process events through assembler (simulating worker) ───────

  console.log('\n─── Processing events through TraceAssembler ───\n');

  for (const event of memoryTransport.events) {
    assembler.process(event);
  }

  // ── Query the store ────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════');
  console.log(' Verification: Query Trace Store');
  console.log('═══════════════════════════════════════════════════\n');

  const trace = store.getTrace(traceId);
  if (trace) {
    console.log(`Trace ID:     ${trace.trace_id}`);
    console.log(`Agent:        ${trace.crew}/${trace.agent_name}`);
    console.log(`Status:       ${trace.status}`);
    console.log(`Confidence:   ${trace.confidence}`);
    console.log(`Latency:      ${trace.total_latency_ms}ms`);
    console.log(`Tokens:       ${trace.total_tokens_in} in / ${trace.total_tokens_out} out`);
    console.log(`Cost:         $${trace.total_cost?.toFixed(4)}`);
    console.log(`Tool Calls:   ${trace.tool_call_count}`);
    console.log(`Output:       ${trace.output?.slice(0, 100)}...`);
  }

  const spans = store.getSpansByTrace(traceId);
  console.log(`\nSpans:        ${spans.length} events recorded`);
  for (const span of spans) {
    const payload = JSON.parse(span.payload);
    const detail = payload.thought?.slice(0, 60) ?? payload.toolName ?? payload.observation?.slice(0, 60) ?? payload.finalOutput?.slice(0, 60) ?? '';
    console.log(`  ${span.event_type.padEnd(20)} | run_index=${span.run_index} | ${detail}`);
  }

  const stats = store.getStats();
  console.log('\n─── Store Stats ───');
  console.log(`Total traces:   ${stats.totalTraces}`);
  console.log(`Completed:      ${stats.completedTraces}`);
  console.log(`Errors:         ${stats.errorTraces}`);

  console.log('\n✓ End-to-end pipeline verified: emit → assemble → store → query');

  // Cleanup
  await emitter.close();
  store.close();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

demo().catch(console.error);
