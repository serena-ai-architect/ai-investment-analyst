# AGENTS.md — ai-investment-analyst

## Quick Reference

- **Architecture**: 10-agent, 4-crew (Research, Analysis, Risk, Delivery)
- **Stack**: TypeScript, LangGraph.js, LangChain.js, Turborepo
- **Schema validation**: Zod (all inter-crew communication + tool parameters)
- **Key patterns**: Reflexion Engine, Process Reward Model, Dynamic Planner, Cost Tracker
- **Model routing**: Multi-provider (DeepSeek / OpenAI / Anthropic) via `detectProvider()`

## Source Index

| Area | Entry Point | Description |
|------|------------|-------------|
| Orchestration | `packages/core/src/graph/workflow.ts` | LangGraph state machine + conditional edges |
| Nodes | `packages/core/src/graph/nodes.ts` | 9 node functions (planning → delivery → finalize) |
| Crews | `packages/core/src/crews/index.ts` | 4 crews: Research, Analysis, Risk, Delivery |
| Agent Builder | `packages/core/src/agents/reactAgent.ts` | ReAct agent factory with tool binding |
| Report Writer | `packages/core/src/agents/reportWriter.ts` | EN + ZH report generation |
| Config | `packages/core/src/config.ts` | LLM routing, agent roles, watchlist |
| Types | `packages/core/src/types/index.ts` | LangGraph state annotation + domain types |
| Tools | `packages/core/src/tools/` | searchTools, financeTools, mcpTools |
| Skills | `packages/core/src/skills/` | Reflexion, PRM, Planner, CostTracker |
| Integrations | `packages/core/src/integrations/` | Notion API, email (SMTP) |
| Tests | `packages/core/src/__tests__/` | 8-layer test pyramid (~230 tests) |
| Session State | `claude-progress.txt` | Current session state, blockers, and next steps |
| Web Dashboard | `apps/web/` | Next.js 15 + Supabase |
| CLI | `apps/cli/` | CLI entry point |

## Architectural Boundaries (enforced)

These constraints are validated by `boundaries.test.ts`:

1. **Tool isolation** — each agent receives ONLY its designated tools:
   - Research crew: search tools + MCP research tools (Notion search, Gmail search)
   - Analysis crew financial: finance tools only
   - Analysis crew market/tech: search tools only
   - Risk crew: search tools only
   - Delivery crew: MCP delivery tools only (Notion save, Gmail send, Calendar)
   - Synthesizer: zero tools (pure reasoning)

2. **Crew communication** — crews communicate ONLY through LangGraph shared state, never directly

3. **Schema enforcement** — `RiskScoreSchema` (Zod) validates all risk dimension outputs

4. **Cost guardrails** — per-report budget ceiling ($0.50 / 200K tokens)

## Build & Test Commands

```bash
# All tests (L1-L8)
npm run -w @repo/core test

# Type checking
npm run type-check

# Lint
npm run lint

# Architectural validation (boundaries + schemas)
npm run validate

# Garbage collection check (doc/code consistency)
npx tsx scripts/gc-check.ts

# Run analysis
npm run start -- --company "NVIDIA" --mode full
```

## When the Agent Struggles

If a task fails, do NOT retry with a different prompt. Instead:
1. Check if the required context/docs are discoverable from this file
2. Check if the architectural boundary is mechanically enforced (test/linter)
3. Check if there's a missing tool or data source
4. Add the fix to the repo, then retry
