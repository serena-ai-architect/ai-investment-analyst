"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./providers";

const POPULAR_TICKERS = [
  { name: "NVIDIA", ticker: "NVDA", exchange: "US" },
  { name: "Apple", ticker: "AAPL", exchange: "US" },
  { name: "Google", ticker: "GOOGL", exchange: "US" },
  { name: "AMD", ticker: "AMD", exchange: "US" },
  { name: "Amazon", ticker: "AMZN", exchange: "US" },
  { name: "Tencent", ticker: "0700.HK", exchange: "HK" },
  { name: "BYD", ticker: "1211.HK", exchange: "HK" },
  { name: "Xiaomi", ticker: "1810.HK", exchange: "HK" },
];

export function NewAnalysisForm({ demoReportIds }: { demoReportIds?: string[] }) {
  const { t } = useLang();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState<"quick" | "full">("full");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);

    // In demo mode (no Supabase), navigate to a demo report
    if (demoReportIds && demoReportIds.length > 0) {
      const randomId = demoReportIds[Math.floor(Math.random() * demoReportIds.length)];
      await new Promise((r) => setTimeout(r, 800)); // Brief loading animation
      router.push(`/dashboard/reports/${randomId}`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim(), mode }),
      });
      const data = await res.json();
      if (data.reportId) {
        router.push(`/dashboard/reports/${data.reportId}`);
      }
    } catch {
      alert("Failed to start analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium">{t("form.companyName")}</label>
          <input
            type="text"
            placeholder={t("form.companyPlaceholder")}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("form.mode")}</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "quick" | "full")}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--primary)]"
          >
            <option value="full">{t("form.modeFull")}</option>
            <option value="quick">{t("form.modeQuick")}</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !company.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] px-6 py-2.5 text-sm font-medium text-white shadow-[var(--shadow)] transition-all hover:opacity-90 hover:shadow-[var(--shadow-md)] disabled:opacity-50"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? t("form.analyzing") : t("form.analyze")}
        </button>
      </form>

      {/* Quick picks */}
      <div className="mt-4 flex flex-wrap gap-2">
        {POPULAR_TICKERS.map((t) => (
          <button
            key={t.ticker}
            onClick={() => setCompany(t.name)}
            className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            {t.name}
            <span className="ml-1.5 opacity-50">{t.ticker}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
