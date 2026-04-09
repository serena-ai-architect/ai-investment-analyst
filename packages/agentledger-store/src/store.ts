import Database from 'better-sqlite3';
import { SCHEMA_SQL } from './schema.js';

export interface TraceRow {
  trace_id: string;
  agent_name: string;
  crew: string;
  status: string;
  input: string | null;
  output: string | null;
  confidence: number | null;
  total_latency_ms: number | null;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost: number;
  tool_call_count: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface SpanRow {
  span_id: string;
  trace_id: string;
  parent_span_id: string | null;
  event_type: string;
  agent_name: string;
  crew: string;
  run_index: number;
  payload: string;
  latency_ms: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost: number | null;
  timestamp: string;
  created_at: string;
}

export interface GovernanceRow {
  id: number;
  trace_id: string;
  explainability_score: number | null;
  governance_accountability_status: string | null;
  governance_accountability_evidence: string | null;
  fairness_status: string | null;
  fairness_evidence: string | null;
  transparency_status: string | null;
  transparency_evidence: string | null;
  data_privacy_status: string | null;
  data_privacy_evidence: string | null;
  fairness_flags: string;
  overall_status: string | null;
  recommendation: string | null;
  assessed_at: string;
}

export class TraceStore {
  private db: Database.Database;

  constructor(dbPath: string = 'agentledger.db') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA_SQL);
  }

  // ── Traces ─────────────────────────────────────────────────────────

  insertTrace(trace: Pick<TraceRow, 'trace_id' | 'agent_name' | 'crew' | 'started_at'> & { input?: string }): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO traces (trace_id, agent_name, crew, started_at, input)
      VALUES (@trace_id, @agent_name, @crew, @started_at, @input)
    `).run({ ...trace, input: trace.input ?? null });
  }

  completeTrace(traceId: string, output: string, confidence: number | null, completedAt: string): void {
    this.db.prepare(`
      UPDATE traces SET status = 'completed', output = @output, confidence = @confidence,
                        completed_at = @completedAt
      WHERE trace_id = @traceId
    `).run({ traceId, output, confidence, completedAt });
  }

  errorTrace(traceId: string, error: string, completedAt: string): void {
    this.db.prepare(`
      UPDATE traces SET status = 'error', output = @error, completed_at = @completedAt
      WHERE trace_id = @traceId
    `).run({ traceId, error, completedAt });
  }

  updateTraceMetrics(traceId: string, metrics: {
    latencyMs?: number;
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    toolCalls?: number;
  }): void {
    if (metrics.latencyMs != null) {
      this.db.prepare(`UPDATE traces SET total_latency_ms = @val WHERE trace_id = @traceId`)
        .run({ traceId, val: metrics.latencyMs });
    }
    if (metrics.tokensIn != null) {
      this.db.prepare(`UPDATE traces SET total_tokens_in = total_tokens_in + @val WHERE trace_id = @traceId`)
        .run({ traceId, val: metrics.tokensIn });
    }
    if (metrics.tokensOut != null) {
      this.db.prepare(`UPDATE traces SET total_tokens_out = total_tokens_out + @val WHERE trace_id = @traceId`)
        .run({ traceId, val: metrics.tokensOut });
    }
    if (metrics.cost != null) {
      this.db.prepare(`UPDATE traces SET total_cost = total_cost + @val WHERE trace_id = @traceId`)
        .run({ traceId, val: metrics.cost });
    }
    if (metrics.toolCalls != null) {
      this.db.prepare(`UPDATE traces SET tool_call_count = tool_call_count + @val WHERE trace_id = @traceId`)
        .run({ traceId, val: metrics.toolCalls });
    }
  }

  // ── Spans ──────────────────────────────────────────────────────────

  insertSpan(span: Omit<SpanRow, 'created_at'>): void {
    this.db.prepare(`
      INSERT INTO spans (span_id, trace_id, parent_span_id, event_type, agent_name, crew, run_index, payload, latency_ms, tokens_in, tokens_out, cost, timestamp)
      VALUES (@span_id, @trace_id, @parent_span_id, @event_type, @agent_name, @crew, @run_index, @payload, @latency_ms, @tokens_in, @tokens_out, @cost, @timestamp)
    `).run(span);
  }

  // ── Governance ─────────────────────────────────────────────────────

  insertGovernanceScore(score: Omit<GovernanceRow, 'id' | 'assessed_at'>): void {
    this.db.prepare(`
      INSERT INTO governance_scores (
        trace_id, explainability_score,
        governance_accountability_status, governance_accountability_evidence,
        fairness_status, fairness_evidence,
        transparency_status, transparency_evidence,
        data_privacy_status, data_privacy_evidence,
        fairness_flags, overall_status, recommendation
      ) VALUES (
        @trace_id, @explainability_score,
        @governance_accountability_status, @governance_accountability_evidence,
        @fairness_status, @fairness_evidence,
        @transparency_status, @transparency_evidence,
        @data_privacy_status, @data_privacy_evidence,
        @fairness_flags, @overall_status, @recommendation
      )
    `).run(score);
  }

  // ── Queries ────────────────────────────────────────────────────────

  getTrace(traceId: string): TraceRow | undefined {
    return this.db.prepare('SELECT * FROM traces WHERE trace_id = ?').get(traceId) as TraceRow | undefined;
  }

  getSpansByTrace(traceId: string): SpanRow[] {
    return this.db.prepare('SELECT * FROM spans WHERE trace_id = ? ORDER BY timestamp ASC').all(traceId) as SpanRow[];
  }

  getGovernanceByTrace(traceId: string): GovernanceRow | undefined {
    return this.db.prepare('SELECT * FROM governance_scores WHERE trace_id = ? ORDER BY assessed_at DESC LIMIT 1').get(traceId) as GovernanceRow | undefined;
  }

  listTraces(options: {
    crew?: string;
    agentName?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): TraceRow[] {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (options.crew) {
      conditions.push('crew = @crew');
      params.crew = options.crew;
    }
    if (options.agentName) {
      conditions.push('agent_name = @agentName');
      params.agentName = options.agentName;
    }
    if (options.status) {
      conditions.push('status = @status');
      params.status = options.status;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    return this.db.prepare(
      `SELECT * FROM traces ${where} ORDER BY started_at DESC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit, offset }) as TraceRow[];
  }

  listGovernanceScores(options: {
    overallStatus?: string;
    limit?: number;
  } = {}): GovernanceRow[] {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (options.overallStatus) {
      conditions.push('overall_status = @overallStatus');
      params.overallStatus = options.overallStatus;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit ?? 50;

    return this.db.prepare(
      `SELECT * FROM governance_scores ${where} ORDER BY assessed_at DESC LIMIT @limit`
    ).all({ ...params, limit }) as GovernanceRow[];
  }

  /** Get summary stats for dashboard */
  getStats(): {
    totalTraces: number;
    completedTraces: number;
    errorTraces: number;
    avgExplainability: number | null;
    complianceBreakdown: { status: string; count: number }[];
  } {
    const total = (this.db.prepare('SELECT COUNT(*) as c FROM traces').get() as { c: number }).c;
    const completed = (this.db.prepare("SELECT COUNT(*) as c FROM traces WHERE status = 'completed'").get() as { c: number }).c;
    const errors = (this.db.prepare("SELECT COUNT(*) as c FROM traces WHERE status = 'error'").get() as { c: number }).c;
    const avgExpl = (this.db.prepare('SELECT AVG(explainability_score) as avg FROM governance_scores').get() as { avg: number | null }).avg;
    const breakdown = this.db.prepare(
      'SELECT overall_status as status, COUNT(*) as count FROM governance_scores GROUP BY overall_status'
    ).all() as { status: string; count: number }[];

    return {
      totalTraces: total,
      completedTraces: completed,
      errorTraces: errors,
      avgExplainability: avgExpl,
      complianceBreakdown: breakdown,
    };
  }

  close(): void {
    this.db.close();
  }
}
