-- AI Investment Analyst — Supabase Schema
-- ==========================================
-- Run this in Supabase SQL Editor to create all tables.
-- All tables have RLS enabled — users can only access their own data.

-- ═══════════════════════════════════════════════════════════════
-- Profiles (extends Supabase auth.users)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text,
  avatar_url            text,
  locale                text not null default 'en' check (locale in ('en', 'zh-CN', 'zh-HK')),
  currency              text not null default 'USD' check (currency in ('USD', 'HKD', 'CNY')),
  tier                  text not null default 'free' check (tier in ('free', 'pro', 'enterprise')),
  stripe_customer_id    text unique,
  notion_bot_token      text,
  notion_database_id    text,
  delivery_channels     jsonb not null default '["web","email"]',
  email_reports_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- Watchlist Items
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.watchlist_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  company_name    text not null,
  ticker          text not null,
  exchange        text not null default 'US' check (exchange in ('US', 'HK', 'CN')),
  mode            text not null default 'full' check (mode in ('quick', 'full')),
  schedule        text not null default 'manual' check (schedule in ('daily', 'weekly', 'manual')),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique(user_id, ticker)
);

alter table public.watchlist_items enable row level security;

create policy "Users can manage own watchlist"
  on public.watchlist_items for all using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Reports
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  company_name      text not null,
  ticker            text not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'running', 'completed', 'failed')),
  report_en         text,
  report_zh         text,
  executive_summary text,
  quality_score     numeric(3,1),
  risk_score        numeric(3,1),
  financial_data    jsonb,
  cost_data         jsonb,
  current_phase     text,
  progress_log      jsonb not null default '[]',
  notion_page_url   text,
  email_sent_at     timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can read own reports"
  on public.reports for select using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.reports for insert with check (auth.uid() = user_id);

-- Service role can update reports (background jobs)
create policy "Service can update reports"
  on public.reports for update using (true);

-- ═══════════════════════════════════════════════════════════════
-- Subscriptions
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id  text unique not null,
  status                  text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  tier                    text not null check (tier in ('pro', 'enterprise')),
  current_period_end      timestamptz not null,
  created_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Usage Tracking
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.usage (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  period_start      date not null,
  reports_generated integer not null default 0,
  tokens_used       bigint not null default 0,
  llm_cost_usd      numeric(10,4) not null default 0,
  unique(user_id, period_start)
);

alter table public.usage enable row level security;

create policy "Users can read own usage"
  on public.usage for select using (auth.uid() = user_id);

-- Service role can upsert usage
create policy "Service can manage usage"
  on public.usage for all using (true);

-- ═══════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_watchlist_user_id on public.watchlist_items(user_id);
create index if not exists idx_usage_user_period on public.usage(user_id, period_start);
