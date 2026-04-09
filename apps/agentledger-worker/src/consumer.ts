import Redis from 'ioredis';
import type { AgentEvent } from '@agentledger/emitter';
import { TraceAssembler } from './traceAssembler.js';

const STREAM_KEY = 'agentledger:events';
const GROUP_NAME = 'agentledger-workers';
const CONSUMER_NAME = `worker-${process.pid}`;

export interface ConsumerOptions {
  redisUrl?: string;
  streamKey?: string;
  groupName?: string;
  /** Block timeout in ms when waiting for new messages */
  blockMs?: number;
}

/**
 * Redis Streams consumer using consumer groups for at-least-once delivery.
 *
 * Uses XREADGROUP to consume events, processes them through TraceAssembler,
 * then ACKs. On failure, events remain pending and will be re-delivered.
 */
export class EventConsumer {
  private redis: Redis;
  private running = false;
  private readonly streamKey: string;
  private readonly groupName: string;
  private readonly blockMs: number;

  constructor(
    private assembler: TraceAssembler,
    options: ConsumerOptions = {},
  ) {
    const url = options.redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(url);
    this.streamKey = options.streamKey ?? STREAM_KEY;
    this.groupName = options.groupName ?? GROUP_NAME;
    this.blockMs = options.blockMs ?? 5000;
  }

  /** Ensure consumer group exists (idempotent) */
  async ensureGroup(): Promise<void> {
    try {
      await this.redis.xgroup('CREATE', this.streamKey, this.groupName, '0', 'MKSTREAM');
    } catch (err: unknown) {
      // BUSYGROUP = group already exists, that's fine
      if (err instanceof Error && !err.message.includes('BUSYGROUP')) {
        throw err;
      }
    }
  }

  /** Start consuming events in a loop */
  async start(): Promise<void> {
    await this.ensureGroup();
    this.running = true;

    console.log(`[AgentLedger Worker] Consumer ${CONSUMER_NAME} started, listening on ${this.streamKey}`);

    while (this.running) {
      try {
        const results = await this.redis.xreadgroup(
          'GROUP', this.groupName, CONSUMER_NAME,
          'COUNT', '10',
          'BLOCK', this.blockMs,
          'STREAMS', this.streamKey, '>',
        );

        if (!results) continue;

        // ioredis xreadgroup returns [streamKey, [[messageId, fields], ...]][]
        const streams = results as [string, [string, string[]][]][];
        for (const [, messages] of streams) {
          for (const [messageId, fields] of messages) {
            try {
              const eventJson = fields[1]; // fields = ['event', '{...}']
              const event: AgentEvent = JSON.parse(eventJson);
              this.assembler.process(event);
              await this.redis.xack(this.streamKey, this.groupName, messageId);
            } catch (err) {
              console.error(`[AgentLedger Worker] Failed to process message ${messageId}:`, err);
              // Don't ACK — message stays pending for retry
            }
          }
        }
      } catch (err) {
        if (this.running) {
          console.error('[AgentLedger Worker] Consumer error:', err);
          // Brief pause before retrying
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.redis.quit();
  }
}
