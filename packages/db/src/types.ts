/**
 * Database Types — mirrors Supabase schema
 * ==========================================
 * These types are used by the web app for type-safe queries.
 * Keep in sync with schema.sql.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      watchlist_items: {
        Row: WatchlistItem;
        Insert: Omit<WatchlistItem, "id" | "created_at">;
        Update: Partial<Omit<WatchlistItem, "id" | "user_id">>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at">;
        Update: Partial<Omit<Report, "id" | "user_id">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at">;
        Update: Partial<Omit<Subscription, "id" | "user_id">>;
      };
      usage: {
        Row: Usage;
        Insert: Omit<Usage, "id">;
        Update: Partial<Omit<Usage, "id" | "user_id">>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: "en" | "zh-CN" | "zh-HK";
  currency: "USD" | "HKD" | "CNY";
  tier: "free" | "pro" | "enterprise";
  stripe_customer_id: string | null;
  notion_bot_token: string | null;
  notion_database_id: string | null;
  delivery_channels: string[];
  email_reports_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  company_name: string;
  ticker: string;
  exchange: "US" | "HK" | "CN";
  mode: "quick" | "full";
  schedule: "daily" | "weekly" | "manual";
  is_active: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  company_name: string;
  ticker: string;
  status: "pending" | "running" | "completed" | "failed";
  report_en: string | null;
  report_zh: string | null;
  executive_summary: string | null;
  quality_score: number | null;
  risk_score: number | null;
  financial_data: Record<string, unknown> | null;
  cost_data: Record<string, unknown> | null;
  current_phase: string | null;
  progress_log: string[];
  notion_page_url: string | null;
  email_sent_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  tier: "pro" | "enterprise";
  current_period_end: string;
  created_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  period_start: string;
  reports_generated: number;
  tokens_used: number;
  llm_cost_usd: number;
}
