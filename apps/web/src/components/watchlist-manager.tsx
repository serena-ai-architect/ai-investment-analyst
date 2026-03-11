"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { WatchlistItem } from "@repo/db";

const EXCHANGES = [
  { value: "US", label: "US" },
  { value: "HK", label: "HK" },
  { value: "CN", label: "A-shares" },
] as const;

export function WatchlistManager({ initialItems }: { initialItems: WatchlistItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [exchange, setExchange] = useState<"US" | "HK" | "CN">("US");
  const [schedule, setSchedule] = useState<"manual" | "weekly" | "daily">("manual");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !ticker.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("watchlist_items")
      .insert({
        user_id: user.id,
        company_name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        exchange,
        schedule,
        mode: "full",
        is_active: true,
      })
      .select()
      .single();

    if (data) {
      setItems([data, ...items]);
      setName("");
      setTicker("");
      setShowAdd(false);
    }
    if (error) alert(error.message);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("watchlist_items").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
      >
        {showAdd ? "Cancel" : "+ Add Company"}
      </button>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
            <input
              placeholder="Ticker (e.g. NVDA)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value as "US" | "HK" | "CN")}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              {EXCHANGES.map((ex) => (
                <option key={ex.value} value={ex.value}>{ex.label}</option>
              ))}
            </select>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as "manual" | "weekly" | "daily")}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="manual">Manual</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            No companies in your watchlist yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4"
            >
              <div>
                <p className="font-medium">{item.company_name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {item.ticker} · {item.exchange} · {item.schedule}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard?company=${encodeURIComponent(item.company_name)}`)}
                  className="rounded-lg bg-[var(--muted)] px-3 py-1 text-sm transition-colors hover:bg-[var(--border)]"
                >
                  Analyze
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg px-3 py-1 text-sm text-[var(--destructive)] transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
