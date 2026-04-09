/**
 * AgentLedger SQLite Schema
 *
 * Tables:
 * - traces: One row per complete agent run (aggregated from events)
 * - spans: Individual events within a trace (think/tool/observe steps)
 * - governance_scores: Governance assessment results per trace
 */

export const SCHEMA_SQL = `
-- Traces: one per agent run (aggregated view)
CREATE TABLE IF NOT EXISTS traces (
  trace_id        TEXT PRIMARY KEY,
  agent_name      TEXT NOT NULL,
  crew            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'running',  -- running | completed | error
  input           TEXT,
  output          TEXT,
  confidence      REAL,

  -- Aggregated metrics
  total_latency_ms  INTEGER,
  total_tokens_in   INTEGER DEFAULT 0,
  total_tokens_out  INTEGER DEFAULT 0,
  total_cost        REAL DEFAULT 0,
  tool_call_count   INTEGER DEFAULT 0,

  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Spans: individual events within a trace
CREATE TABLE IF NOT EXISTS spans (
  span_id         TEXT PRIMARY KEY,
  trace_id        TEXT NOT NULL REFERENCES traces(trace_id),
  parent_span_id  TEXT,
  event_type      TEXT NOT NULL,
  agent_name      TEXT NOT NULL,
  crew            TEXT NOT NULL,
  run_index       INTEGER NOT NULL DEFAULT 0,

  -- Event payload (JSON-serialized)
  payload         TEXT NOT NULL DEFAULT '{}',

  -- Metrics
  latency_ms      INTEGER,
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  cost            REAL,

  timestamp       TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Governance scores: one set per trace
CREATE TABLE IF NOT EXISTS governance_scores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_id        TEXT NOT NULL REFERENCES traces(trace_id),

  -- Explainability (0-100)
  explainability_score  INTEGER,

  -- HKMA Four Principles
  governance_accountability_status  TEXT,  -- compliant | review_needed | non_compliant
  governance_accountability_evidence TEXT,
  fairness_status                   TEXT,
  fairness_evidence                 TEXT,
  transparency_status               TEXT,
  transparency_evidence             TEXT,
  data_privacy_status               TEXT,
  data_privacy_evidence             TEXT,

  -- Fairness flags (JSON array)
  fairness_flags  TEXT DEFAULT '[]',

  -- Overall
  overall_status  TEXT,  -- compliant | review_needed | non_compliant
  recommendation  TEXT,

  assessed_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_event_type ON spans(event_type);
CREATE INDEX IF NOT EXISTS idx_traces_crew ON traces(crew);
CREATE INDEX IF NOT EXISTS idx_traces_agent_name ON traces(agent_name);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_traces_started_at ON traces(started_at);
CREATE INDEX IF NOT EXISTS idx_governance_trace_id ON governance_scores(trace_id);
`;
