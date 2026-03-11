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

export function NewAnalysisForm() {
  const { t } = useLang();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [mode, setMode] = useState<"quick" | "full">("full");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">{t("form.companyName")}</label>
          <input
            type="text"
            placeholder={t("form.companyPlaceholder")}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("form.mode")}</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "quick" | "full")}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 outline-none"
          >
            <option value="full">{t("form.modeFull")}</option>
            <option value="quick">{t("form.modeQuick")}</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !company.trim()}
          className="rounded-lg bg-[var(--primary)] px-6 py-2.5 font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("form.starting") : t("form.analyze")}
        </button>
      </form>

      {/* Quick picks */}
      <div className="mt-4 flex flex-wrap gap-2">
        {POPULAR_TICKERS.map((t) => (
          <button
            key={t.ticker}
            onClick={() => setCompany(t.name)}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          >
            {t.name}
            <span className="ml-1 opacity-50">{t.ticker}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
