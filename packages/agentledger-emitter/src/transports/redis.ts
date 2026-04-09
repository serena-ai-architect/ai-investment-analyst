import type { AgentEvent } from '../events.js';
import type { Transport } from './types.js';

const STREAM_KEY = 'agentledger:events';

export interface RedisTransportOptions {
  /** Redis connection URL, default: redis://localhost:6379 */
  url?: string;
  /** Redis stream key, default: agentledger:events */
  streamKey?: string;
  /** Max stream length (approximate trimming), default: 10000 */
  maxLen?: number;
}

/**
 * Redis Streams transport — production event bus.
 *
 * Uses XADD with approximate MAXLEN trimming to prevent unbounded growth.
 * Consumer side uses XREADGROUP for at-least-once delivery.
 *
 * Lazy-connects on first send to avoid blocking agent startup.
 */
export class RedisTransport implements Transport {
  name = 'redis';
  private redis: import('ioredis').default | null = null;
  private readonly url: string;
  private readonly streamKey: string;
  private readonly maxLen: number;

  constructor(options: RedisTransportOptions = {}) {
    this.url = options.url ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.streamKey = options.streamKey ?? STREAM_KEY;
    this.maxLen = options.maxLen ?? 10_000;
  }

  private async getRedis(): Promise<import('ioredis').default> {
    if (!this.redis) {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(this.url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      await this.redis.connect();
    }
    return this.redis;
  }

  async send(event: AgentEvent): Promise<void> {
    const redis = await this.getRedis();
    // XADD with approximate MAXLEN trimming
    await redis.xadd(
      this.streamKey,
      'MAXLEN',
      '~',
      String(this.maxLen),
      '*',  // auto-generate stream ID
      'event', JSON.stringify(event),
    );
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}
