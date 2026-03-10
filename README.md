# AI Investment Analyst

A production-grade multi-agent system that automates investment research — from data collection to report delivery.

10 specialized AI agents organized in 4 crews collaborate through a LangGraph.js state machine to produce comprehensive investment analysis reports.

## Architecture

```
Planning → Notion Context → Research Crew → Analysis Crew → Risk Crew → Report → Reflexion → Delivery
                              (3 agents)     (3 in parallel)  (2 agents)           (self-improve)  (Notion/Gmail/Calendar)
```

### Agents & Crews

| Crew | Agents | Mode |
|------|--------|------|
| **Research** | Web Researcher, Data Collector, Synthesizer | Sequential |
| **Analysis** | Financial Analyst, Market Analyst, Tech Analyst | Parallel (`Promise.all`) |
| **Risk** | Risk Analyst, Compliance Analyst | Sequential |
| **Delivery** | Knowledge Manager, Distribution Coordinator | Sequential (MCP) |

### Key Design Patterns

- **Reflexion** — structured self-improvement with memory across retries (Shinn et al., 2023)
- **Process Reward Model** — step-level quality evaluation, not just final output (Lightman et al., 2023)
- **Dynamic Planning** — LLM generates and adapts execution plans at runtime
- **MCP Integration** — Notion, Gmail, Calendar via Model Context Protocol
- **Cost Tracking** — per-agent token usage and budget enforcement
- **Live Data Verification** — real-time Yahoo Finance data appended to reports, superseding any LLM-hallucinated figures
- **Proxy-Aware Networking** — all HTTP tools auto-detect `https_proxy` / `http_proxy` via undici

## Tech Stack

TypeScript / LangGraph.js + LangChain.js + Vercel AI SDK + MCP + DeepSeek + Yahoo Finance API

## Quick Start

```bash
npm install

# Demo mode (no API key needed)
npx tsx src/main.ts --demo

# Full pipeline
cp .env.example .env
# Add your DEEPSEEK_API_KEY to .env
npx tsx src/main.ts --company "NVIDIA" --mode full

# Quick mode (skips risk assessment)
npx tsx src/main.ts --company "Apple" --mode quick
```

## Project Structure

```
src/
├── main.ts                  # CLI entry point
├── config.ts                # Model & workflow config
├── streaming.ts             # Vercel AI SDK streaming
├── types/index.ts           # LangGraph state + domain types
├── tools/
│   ├── searchTools.ts       # DuckDuckGo HTML search, proxy-aware (3 tools)
│   ├── financeTools.ts      # Yahoo Finance API, real-time quotes (2 tools)
│   └── mcpTools.ts          # Notion/Gmail/Calendar (6 tools)
├── crews/index.ts           # 4 crews: Research/Analysis/Risk/Delivery
├── graph/
│   ├── nodes.ts             # 9 LangGraph node functions
│   └── workflow.ts          # State machine + streaming runner
├── agents/reportWriter.ts   # Report generation + EN→ZH translation
└── skills/
    ├── reflexion.ts         # Self-reflection engine
    ├── dynamicPlanner.ts    # Adaptive task planning
    ├── processReward.ts     # Step-level evaluation (PRM)
    └── costTracker.ts       # Token economics & budget
```

## Sample Output

See [`output/`](./output/) for generated reports (English & Chinese).
