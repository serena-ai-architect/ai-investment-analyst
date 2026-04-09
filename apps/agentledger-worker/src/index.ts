import { TraceStore } from '@agentledger/store';
import { TraceAssembler } from './traceAssembler.js';
import { EventConsumer } from './consumer.js';

const DB_PATH = process.env.AGENTLEDGER_DB ?? 'agentledger.db';

async function main() {
  console.log('[AgentLedger Worker] Starting...');
  console.log(`[AgentLedger Worker] DB: ${DB_PATH}`);

  const store = new TraceStore(DB_PATH);
  const assembler = new TraceAssembler(store);
  const consumer = new EventConsumer(assembler);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[AgentLedger Worker] Shutting down...');
    await consumer.stop();
    store.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await consumer.start();
}

main().catch((err) => {
  console.error('[AgentLedger Worker] Fatal error:', err);
  process.exit(1);
});
