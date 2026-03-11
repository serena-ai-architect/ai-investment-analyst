"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WatchlistItem } from "@repo/db";
import { useLang } from "./providers";
import type { TranslationKey } from "@/lib/i18n";

const EXCHANGES: { value: WatchlistItem["exchange"]; labelKey: TranslationKey }[] = [
  { value: "US", labelKey: "exchange.US" },
  { value: "HK", labelKey: "exchange.HK" },
  { value: "CN", labelKey: "exchange.CN" },
];

const SCHEDULES: { value: WatchlistItem["schedule"]; labelKey: TranslationKey }[] = [
  { value: "manual", labelKey: "schedule.manual" },
  { value: "weekly", labelKey: "schedule.weekly" },
  { value: "daily", labelKey: "schedule.daily" },
];

export function WatchlistManager({ initialItems }: { initialItems: WatchlistItem[] }) {
  const { t } = useLang();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [exchange, setExchange] = useState<WatchlistItem["exchange"]>("US");
  const [schedule, setSchedule] = useState<WatchlistItem["schedule"]>("manual");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !ticker.trim()) return;

    // Try Supabase first; fall back to local-only
    let newItem: WatchlistItem | null = null;

    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("watchlist_items")
            .insert({
              user_id: user.id,
              company_name: name.trim(),
              ticker: ticker.trim().toUpperCase(),
              exchange,
              schedule,
              mode: "full" as const,
              is_active: true,
            })
            .select()
            .single();
          if (data) newItem = data;
        }
      } catch { /* demo mode fallback */ }
    }

    // Local-only fallback (demo mode)
    if (!newItem) {
      newItem = {
        id: `local-${Date.now()}`,
        user_id: "demo",
        company_name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        exchange,
        schedule,
        mode: "full",
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }

    setItems([newItem, ...items]);
    // Reset form but keep it open for adding more
    setName("");
    setTicker("");
  }

  async function handleDelete(id: string) {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL && !id.startsWith("local-")) {
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        await supabase.from("watchlist_items").delete().eq("id", id);
      } catch { /* demo mode */ }
    }
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
          showAdd
            ? "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
            : "bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-[var(--shadow)] hover:opacity-90"
        }`}
      >
        {showAdd ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t("watchlist.cancel")}
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("watchlist.addCompany")}
          </>
        )}
      </button>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{t("watchlist.companyName")}</label>
              <input
                placeholder={t("watchlist.companyName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{t("watchlist.ticker")}</label>
              <input
                placeholder={t("watchlist.ticker")}
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{t("watchlist.exchange")}</label>
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value as WatchlistItem["exchange"])}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none"
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex.value} value={ex.value}>{t(ex.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{t("watchlist.schedule")}</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value as WatchlistItem["schedule"])}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none"
              >
                {SCHEDULES.map((s) => (
                  <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!name.trim() || !ticker.trim()}
                className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {t("watchlist.add")}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
              <svg className="h-6 w-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{t("watchlist.empty")}</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.company_name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <span className="font-mono text-xs">{item.ticker}</span>
                  <span className="text-[var(--border)]">|</span>
                  <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium">{t(`exchange.${item.exchange}` as TranslationKey)}</span>
                  <span className="text-[var(--border)]">|</span>
                  <span className="text-xs">{t(`schedule.${item.schedule}` as TranslationKey)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard?company=${encodeURIComponent(item.company_name)}`)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
                >
                  {t("watchlist.analyze")}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--destructive)] transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {t("watchlist.remove")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
