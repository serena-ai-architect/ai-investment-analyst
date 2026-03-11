# AI Investment Analyst

Multi-agent investment research platform — 10 specialized agents across 4 crews, orchestrated by LangGraph.js with Reflexion self-improvement, real-time market data, and a Next.js web dashboard.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js&logoColor=white)
![LangGraph.js](https://img.shields.io/badge/LangGraph.js-1C3C3C?logo=langchain&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-000000?logo=vercel&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)

## Architecture

```mermaid
graph TD
    START([START]) --> planning[Planning<br/><i>Dynamic task generation</i>]
    planning --> notionContext[Notion Context<br/><i>Retrieve past analyses via MCP</i>]
    notionContext --> research[Research Crew<br/><i>3 agents · sequential</i>]
    research --> analysis[Analysis Crew<br/><i>3 agents · parallel via Promise.all</i>]

    analysis -->|"mode = full"| risk[Risk Crew<br/><i>2 agents · sequential</i>]
    analysis -->|"mode = quick"| report[Report Generation<br/><i>EN + ZH translation</i>]
    risk --> report

    report --> reflexion{Reflexion<br/><i>Score ≥ 7/10?</i>}
    reflexion -->|"score < 7 AND retries < 3"| report
    reflexion -->|"score ≥ 7 OR max retries"| delivery[Delivery Crew<br/><i>2 agents · MCP</i>]

    delivery --> finalize[Finalize<br/><i>Save to Notion + email + cost summary</i>]
    finalize --> END([END])
```

## Technical Highlights

**Agent Patterns**
- **Reflexion** — structured self-improvement with memory across retries; 5-dimension rubric evaluation with root-cause analysis + action items carried forward to next attempt
- **Process Reward Model** — step-level quality scoring, each dimension scored independently to pinpoint weaknesses
- **Dynamic Planning** — LLM generates execution plans at runtime, adapting research focus per company

**Engineering**
- **Turborepo Monorepo** — shared `@repo/core` analysis engine used by both CLI and web dashboard
- **Next.js 15 Dashboard** — mobile-responsive UI with Supabase Auth, real-time report viewer, watchlist management
- **Live Data Verification** — real-time Yahoo Finance data appended as verified appendix, superseding any LLM-hallucinated figures
- **Parallel Execution** — Analysis crew runs 3 specialists concurrently via `Promise.all`, cutting latency ~3x
- **Pluggable Delivery** — web dashboard (primary), email, Notion, PDF export — all channels are optional
- **Multi-Market** — US stocks, HK stocks (.HK), A-shares (.SS/.SZ)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, react-markdown |
| **Auth + DB** | Supabase (Postgres + Auth + RLS + Realtime) |
| **Orchestration** | LangGraph.js (state machine, conditional edges, checkpointer) |
| **Agents** | LangChain.js (tool-augmented LLM agents) |
| **Streaming** | Vercel AI SDK |
| **LLM** | DeepSeek-V3 (~$0.025/report) |
| **Finance Data** | Yahoo Finance Chart API (real-time quotes, historical data) |
| **Delivery** | Notion API, Nodemailer, web dashboard |
| **Monorepo** | Turborepo (npm workspaces) |

## Quick Start

```bash
npm install

# ── Web Dashboard ──────────────────────────────────
npm run dev:web         # http://localhost:3000

# ── CLI ────────────────────────────────────────────
npm run demo            # Architecture showcase (no API keys)

cp .env.example .env    # Add DEEPSEEK_API_KEY
npm run start -- --company "NVIDIA" --mode full
npm run start -- --company "Apple" --mode quick

# Watchlist — analyze all 10 tracked companies
npm run watchlist       # full analysis
npm run watchlist:quick # quick mode
```

### Supabase Setup (for web dashboard)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `packages/db/src/schema.sql` in Supabase SQL Editor
3. Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DEEPSEEK_API_KEY=your-deepseek-key
```

### Notion + Email Setup (Optional)

Add to `.env` to enable auto-delivery:

```bash
NOTION_API_KEY=ntn_xxx
NOTION_DATABASE_ID=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_TO=you@gmail.com
```

## Agents & Crews

| Crew | Agents | Mode | Tools |
|------|--------|------|-------|
| **Research** | Web Researcher, Data Collector, Synthesizer | Sequential | `web_search`, `news_search`, `competitor_search`, `get_stock_info`, `get_financial_history` |
| **Analysis** | Financial Analyst, Market Analyst, Tech Analyst | Parallel | `get_stock_info`, `get_financial_history`, `web_search`, `news_search` |
| **Risk** | Risk Analyst, Compliance Analyst | Sequential | `web_search`, `news_search`, `competitor_search` |
| **Delivery** | Knowledge Manager, Distribution Coordinator | Sequential | `notion_save_analysis`, `gmail_send_report` |

## Example: AMD Analysis (Live Run)

Full pipeline — planning, 10-agent research, Reflexion self-improvement loop, real-time Yahoo Finance data, Notion + email delivery.

```
Target: AMD
Mode: full
Started: 2026-03-11T08:17:25Z
-----------------------------------------------------------------
  [16:17:42] Dynamic plan created: 9 tasks
  [16:18:22] Research crew completed for AMD
  [16:18:25] Analysis crew completed (3 analysts ran in parallel)
  [16:18:31] Risk crew completed (score: 5)
  [16:19:11] Report generated (iteration 1)
  [16:19:38] Reflexion: score=5/10 (attempt 1), retry=true
  [16:20:41] Report generated (iteration 2)
  [16:21:05] Reflexion: score=5/10 (attempt 2), retry=true
  [16:22:06] Report generated (iteration 3)
  [16:22:44] Delivery: Notion saved, Email sent
  [16:22:44] Workflow completed. Final report ready.
```

| Metric | Value |
|--------|-------|
| **Company** | Advanced Micro Devices, Inc. |
| **Current Price** | $203.23 |
| **Market Cap** | $331.35B |
| **P/E Ratio (TTM)** | 78.17 |
| **Revenue (TTM)** | $34.64B |
| **Gross Margin** | 52.49% |
| **Risk Score** | 5/10 |
| **Recommendation** | HOLD |

*Full reports: [English](output/amd_report.md) · [中文](output/amd_report_zh.md)*

## Project Structure

```
ai-investment-analyst/
├── turbo.json                      # Turborepo config
├── package.json                    # Workspace root
├── packages/
│   ├── core/                       # Analysis engine (@repo/core)
│   │   └── src/
│   │       ├── engine.ts           # Main entry: runAnalysis()
│   │       ├── config.ts           # LLM & workflow config
│   │       ├── graph/              # LangGraph workflow + nodes
│   │       ├── crews/              # 4 crews: Research/Analysis/Risk/Delivery
│   │       ├── agents/             # ReportWriter (EN + ZH)
│   │       ├── skills/             # Reflexion, PRM, Planner, CostTracker
│   │       ├── tools/              # Search, Finance, MCP tools
│   │       └── integrations/       # Notion API, email (SMTP)
│   └── db/                         # Database layer (@repo/db)
│       └── src/
│           ├── schema.sql          # Supabase schema (RLS enabled)
│           └── types.ts            # TypeScript DB types
├── apps/
│   ├── web/                        # Next.js 15 Dashboard (@repo/web)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── dashboard/      # Main dashboard, reports, watchlist, settings
│   │       │   ├── (auth)/         # Login (Google OAuth + Magic Link)
│   │       │   └── api/analyze/    # Analysis trigger endpoint
│   │       ├── components/         # ReportViewer, WatchlistManager, etc.
│   │       ├── lib/                # Supabase client helpers
│   │       └── middleware.ts       # Auth guard
│   └── cli/                        # CLI tool (@repo/cli)
│       └── src/main.ts             # CLI entry point
├── docs/
│   └── saas-architecture.md        # SaaS architecture plan (EN + ZH)
└── output/                         # Generated reports (*.md)
```
