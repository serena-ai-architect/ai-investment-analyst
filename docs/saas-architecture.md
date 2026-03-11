# AI Investment Analyst — SaaS Architecture Plan

> Bilingual document / 双语文档

---

# English Version

## Multi-Market Strategy

This SaaS targets three markets simultaneously: mainland China, Hong Kong, and international users. Key architectural decisions reflect this:

- **Payment:** Stripe with Alipay + WeChat Pay (China), FPS + card (HK), card + Apple Pay (international) — one integration, all markets
- **UI:** Mobile-first responsive web → PWA → WeChat mini-program (future)
- **Report delivery:** Web dashboard (primary), email (universal), PDF export, Notion (international), Feishu/Lark (China enterprise, future)
- **Pricing:** CNY / HKD / USD variants with geo-aware display
- **i18n:** EN / ZH toggle throughout UI, reports already support both languages
- **Markets:** US stocks, HK stocks (.HK), A-shares (.SS/.SZ)

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| **Frontend + API** | Next.js 15 (App Router) | Vercel AI SDK `useChat` for streaming, Tailwind for mobile-responsive |
| **Database + Auth** | Supabase (Postgres + Auth) | RLS for row-level security, Realtime for live progress, Google OAuth |
| **Background Jobs** | Inngest | Durable execution for 2-5 min analysis pipelines, cron scheduling, step retries |
| **Payment** | Stripe | Supports Alipay, WeChat Pay, FPS, card, Apple Pay — one integration for all markets |
| **Email** | Resend | Modern API, 3k free/month, replaces nodemailer |
| **LLM** | DeepSeek-V3 | ~$0.025/report, >90% gross margin |
| **Report Delivery** | Pluggable | Web (primary) → Email → PDF → Notion (OAuth) → Feishu (future) |
| **i18n** | next-intl | EN/ZH dashboard toggle |
| **Monorepo** | Turborepo | Zero-config TypeScript workspaces |
| **Deployment** | Vercel + Inngest + Supabase | Fully managed, near-zero ops |

## Monorepo Structure

```
ai-investment-analyst/
  turbo.json
  packages/
    core/                       # Analysis engine (extracted from current src/)
      src/
        engine.ts               # Entry: runAnalysis(params) -> AnalysisResult
        config.ts               # LLM config (parameterized, no env singletons)
        graph/                  # LangGraph workflow (unchanged)
        crews/                  # 4 Crews (unchanged)
        agents/                 # ReportWriter (unchanged)
        skills/                 # Reflexion / PRM / Planner / CostTracker
        tools/                  # Search / Finance / MCP tools
        integrations/           # Notion (accepts token param) + Resend
    db/                         # Database layer
      src/
        schema.ts               # Drizzle ORM table definitions
        queries/                # Type-safe query functions
  apps/
    web/                        # Next.js 15 Dashboard
      src/app/
        (auth)/                 # Login / signup / OAuth
        (dashboard)/
          watchlist/            # Manage watched companies
          reports/              # Report history + live streaming viewer
          settings/             # Notion OAuth + email prefs + locale
          billing/              # Stripe subscription management
        api/
          analyze/              # Trigger analysis (-> Inngest)
          webhooks/             # Stripe + Inngest webhooks
          notion/               # OAuth callback
```

## Database Schema

```sql
profiles (
  id                uuid PK references auth.users(id),
  email             text not null,
  full_name         text,
  locale            text default 'en',           -- 'en' | 'zh-CN' | 'zh-HK'
  currency          text default 'USD',          -- 'USD' | 'HKD' | 'CNY'
  tier              text default 'free',         -- 'free' | 'pro' | 'enterprise'
  stripe_customer_id    text unique,
  notion_bot_token      text,                    -- encrypted, from OAuth
  notion_database_id    text,
  delivery_channels     jsonb default '["web","email"]',  -- pluggable
  email_reports_enabled boolean default true
)

watchlist_items (
  id              uuid PK,
  user_id         uuid FK -> profiles,
  company_name    text not null,
  ticker          text not null,
  exchange        text default 'US',             -- 'US' | 'HK' | 'CN'
  mode            text default 'full',           -- 'quick' | 'full'
  schedule        text default 'weekly',         -- 'daily' | 'weekly' | 'manual'
  is_active       boolean default true,
  unique(user_id, ticker)
)

reports (
  id              uuid PK,
  user_id         uuid FK -> profiles,
  company_name    text not null,
  ticker          text not null,
  status          text default 'pending',        -- pending | running | completed | failed
  report_en       text,
  report_zh       text,
  executive_summary text,
  quality_score   numeric(3,1),
  risk_score      numeric(3,1),
  financial_data  jsonb,                         -- Yahoo Finance snapshot
  cost_data       jsonb,                         -- LLM cost breakdown
  current_phase   text,
  progress_log    jsonb default '[]',
  notion_page_url text,
  email_sent_at   timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz
)

subscriptions (
  id                      uuid PK,
  user_id                 uuid FK -> profiles,
  stripe_subscription_id  text unique,
  status                  text,                  -- active | canceled | past_due
  tier                    text,
  current_period_end      timestamptz
)

usage (
  id              uuid PK,
  user_id         uuid FK -> profiles,
  period_start    date,                          -- month start
  reports_generated integer default 0,
  tokens_used     bigint default 0,
  llm_cost_usd    numeric(10,4) default 0,
  unique(user_id, period_start)
)
```

All tables have Row Level Security — users can only access their own data.

## Report Delivery Architecture

```
ReportDelivery (pluggable interface)
  ├── WebDashboard    — always on, report stored in DB, viewed in-app
  ├── EmailDelivery   — always on, Resend with HTML summary + MD attachment
  ├── PDFExport       — user-triggered download (@react-pdf/renderer)
  ├── NotionDelivery  — optional, user OAuth-connects their workspace
  └── FeishuDelivery  — optional, Phase 5 (Feishu Open API)
```

Web dashboard is the PRIMARY channel. All others are supplementary push channels.

## Pricing

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **CNY** | ¥0 | ¥98/月 | ¥368/月 |
| **HKD** | HK$0 | HK$128/月 | HK$488/月 |
| **USD** | $0 | $16/mo | $63/mo |
| Reports/month | 3 | 50 | Unlimited |
| Watchlist | 3 | 20 | Unlimited |
| Mode | Quick | Quick + Full | Quick + Full |
| Languages | EN | EN + ZH | EN + ZH |
| Scheduling | None | Weekly | Daily + Weekly |
| Markets | US | US + HK | US + HK + A-shares |
| Notion/Feishu | No | 1 workspace | Multiple |
| PDF export | No | Yes | Yes |
| API access | No | No | Yes |

**Unit economics:** Full report ~$0.025 LLM cost. Pro user at 50 reports/month = $1.55 cost, $16 revenue. **Gross margin >90%.**

## Streaming Architecture

```
User clicks "Analyze"
  -> Next.js Server Action -> Inngest event
  -> Inngest function starts (durable, retryable)
    -> Each LangGraph node updates report.progress_log via Supabase
    -> Supabase Realtime broadcasts row changes
  <- Client subscribes via Supabase Realtime
  <- Dashboard updates progress timeline in real-time

When complete:
  <- Report content rendered with react-markdown
  <- Email sent via Resend
  <- Notion page created (if connected)
```

## Phased Plan

| Phase | Week | Focus | Deliverable |
|-------|------|-------|-------------|
| **1** | W1 | Foundation | Monorepo + Supabase Auth + mobile-responsive dashboard + manual analysis trigger |
| **2** | W2 | Background + Streaming | Inngest jobs + Supabase Realtime progress + in-app report viewer + Resend email |
| **3** | W3 | Billing + Integrations | Stripe (Alipay/WeChat Pay/card) + multi-currency + Notion OAuth + tier limits |
| **4** | W4 | Markets + Launch | HK/A-share tickers + bilingual UI (next-intl) + landing page + PDF export |
| **5** | Future | China Channels | WeChat mini-program (Taro) + Feishu delivery + WeChat official account push |

---

# 中文版本

## 多市场策略

本 SaaS 同时面向三个市场：中国大陆、香港和国际用户。架构核心决策：

- **支付：** Stripe 一套集成覆盖所有市场 —— 支付宝 + 微信支付（大陆）、FPS + 银行卡（香港）、银行卡 + Apple Pay（国际）
- **UI 形态：** 移动端优先的响应式网页 → PWA → 微信小程序（未来）
- **报告交付：** 网页看报告（主力）、邮件（通用）、PDF 下载、Notion（国际用户）、飞书（企业用户，未来）
- **定价：** 人民币 / 港币 / 美元 三套价格，根据地区自动显示
- **国际化：** 界面中英文切换，报告已支持中英双语
- **市场：** 美股、港股 (.HK)、A 股 (.SS/.SZ)

## 技术选型

| 关注点 | 选型 | 理由 |
|--------|------|------|
| **前端 + API** | Next.js 15 (App Router) | Vercel AI SDK `useChat` 天然适配，Tailwind 移动端适配 |
| **数据库 + Auth** | Supabase (Postgres + Auth) | RLS 行级安全，Realtime 实时推送进度，Google OAuth |
| **后台任务** | Inngest | 为 2-5 分钟分析任务设计的持久执行，cron 定时调度，步骤级重试 |
| **支付** | Stripe | 原生支持支付宝、微信支付、FPS、银行卡、Apple Pay —— 一套集成三个市场 |
| **邮件** | Resend | 现代 API，免费 3k 封/月 |
| **LLM** | DeepSeek-V3 | ~$0.025/篇，毛利率 >90% |
| **报告交付** | 可插拔架构 | 网页（主力）→ 邮件 → PDF → Notion（OAuth）→ 飞书（未来）|
| **国际化** | next-intl | 中英文界面切换 |
| **Monorepo** | Turborepo | TypeScript 零配置 |
| **部署** | Vercel + Inngest + Supabase | 全托管，运维接近零 |

## Monorepo 结构

```
ai-investment-analyst/
  turbo.json
  packages/
    core/                       # 分析引擎（从当前 src/ 提取）
      src/
        engine.ts               # 主入口: runAnalysis(params) -> AnalysisResult
        config.ts               # LLM 配置（参数化，不再依赖 env 单例）
        graph/                  # LangGraph 工作流（保持不变）
        crews/                  # 4 个 Crew（保持不变）
        agents/                 # ReportWriter（保持不变）
        skills/                 # Reflexion / PRM / Planner / CostTracker
        tools/                  # 搜索 / 金融 / MCP 工具
        integrations/           # Notion（接受 token 参数）+ Resend
    db/                         # 数据库层
      src/
        schema.ts               # Drizzle ORM 表定义
        queries/                # 类型安全查询
  apps/
    web/                        # Next.js 15 仪表板
      src/app/
        (auth)/                 # 登录 / 注册 / OAuth
        (dashboard)/
          watchlist/            # 管理关注列表
          reports/              # 报告历史 + 实时流式查看
          settings/             # Notion OAuth + 邮件偏好 + 语言
          billing/              # Stripe 订阅管理
        api/
          analyze/              # 触发分析（-> Inngest）
          webhooks/             # Stripe + Inngest webhooks
          notion/               # OAuth 回调
```

## 数据库设计

```sql
profiles          -- 用户资料 + locale/currency + Notion token + Stripe ID
watchlist_items   -- 关注公司（每用户，含交易所 US/HK/CN + 调度频率）
reports           -- 分析报告（中英文内容、评分、进度日志、交付状态）
subscriptions     -- Stripe 订阅状态同步
usage             -- 月度用量追踪（报告数、token、成本）
```

所有表启用 Row Level Security —— 用户只能看到自己的数据。

## 报告交付架构

```
ReportDelivery（可插拔接口）
  ├── WebDashboard    — 默认开启，报告存数据库，在网页查看
  ├── EmailDelivery   — 默认开启，Resend 发送 HTML 摘要 + MD 附件
  ├── PDFExport       — 用户触发下载（@react-pdf/renderer）
  ├── NotionDelivery  — 可选，用户 OAuth 授权自己的 workspace
  └── FeishuDelivery  — 可选，Phase 5（飞书开放平台 API）
```

网页仪表板是**主要交付渠道**。其他都是可选的推送渠道。

## 定价模型

| 功能 | Free | Pro | Enterprise |
|------|------|-----|------------|
| **人民币** | ¥0 | ¥98/月 | ¥368/月 |
| **港币** | HK$0 | HK$128/月 | HK$488/月 |
| **美元** | $0 | $16/月 | $63/月 |
| 月报告数 | 3 | 50 | 无限 |
| 关注公司 | 3 | 20 | 无限 |
| 分析模式 | Quick | Quick + Full | Quick + Full |
| 报告语言 | EN | EN + ZH | EN + ZH |
| 定时报告 | 无 | 每周 | 每日 + 每周 |
| 支持市场 | 美股 | 美股 + 港股 | 美股 + 港股 + A 股 |
| Notion/飞书 | 无 | 1 workspace | 多 workspace |
| PDF 导出 | 无 | 有 | 有 |
| API 访问 | 无 | 无 | 有 |

**单位经济**：Full 模式 ~$0.025 LLM 成本/篇。Pro 用户 50 篇/月 = $1.55 成本，$16 收入。**毛利率 >90%**。

## 实时流式架构

```
用户点击 "分析"
  -> Next.js Server Action -> Inngest 事件
  -> Inngest 函数启动（持久执行，可重试）
    -> 每个 LangGraph 节点更新 report.progress_log (Supabase)
    -> Supabase Realtime 广播行变更
  <- 前端订阅 Supabase Realtime
  <- 仪表板实时更新进度时间线

分析完成时：
  <- report 内容用 react-markdown 渲染
  <- 通过 Resend 发送邮件通知
  <- 创建 Notion 页面（如已连接）
```

## 分阶段计划

| 阶段 | 周 | 重点 | 交付物 |
|------|------|------|--------|
| **1** | W1 | 基础搭建 | Monorepo + Supabase Auth + 移动端适配仪表板 + 手动分析触发 |
| **2** | W2 | 后台 + 流式 | Inngest 后台任务 + Supabase Realtime 进度推送 + 网页报告查看器 + Resend 邮件 |
| **3** | W3 | 计费 + 集成 | Stripe（支付宝/微信/银行卡）+ 多币种 + Notion OAuth + 层级限制 |
| **4** | W4 | 市场 + 上线 | 港股/A 股 ticker + 双语 UI (next-intl) + Landing Page + PDF 导出 |
| **5** | 未来 | 大陆渠道 | 微信小程序 (Taro) + 飞书交付 + 微信公众号推送 |

## Stripe 支付配置

```
Stripe Checkout 按地区展示支付方式：
  大陆用户 → 支付宝 + 微信支付
  香港用户 → 银行卡 + FPS + Apple Pay
  国际用户 → 银行卡 + Apple Pay + Google Pay
```

注意：Stripe 需要香港或海外主体。如果是大陆主体，替代方案：LemonSqueezy（也支持支付宝）或 Paddle。
