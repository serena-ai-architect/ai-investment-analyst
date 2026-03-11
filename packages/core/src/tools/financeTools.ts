/**
 * Financial Data Tools
 * =====================
 * Real-time financial data via Yahoo Finance APIs (free, proxy-aware).
 * Uses fc.yahoo.com consent flow for crumb auth + quoteSummary for full data.
 * Falls back to chart API if quoteSummary is unavailable.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ProxyAgent, fetch as undiciFetch } from "undici";

function getProxyDispatcher() {
  const proxy = process.env.https_proxy || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return proxy ? new ProxyAgent(proxy) : undefined;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// Cached Yahoo auth (crumb + cookie), refreshed per session
let cachedAuth: { crumb: string; cookie: string } | null = null;

async function getYahooAuth() {
  if (cachedAuth) return cachedAuth;
  const dispatcher = getProxyDispatcher();
  const consentRes = await undiciFetch("https://fc.yahoo.com", {
    dispatcher,
    headers: { "User-Agent": UA },
    redirect: "manual",
  });
  const cookies = consentRes.headers.getSetCookie();
  const cookie = cookies?.map(c => c.split(";")[0]).join("; ") || "";
  const crumbRes = await undiciFetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    dispatcher,
    headers: { "User-Agent": UA, "Cookie": cookie },
  });
  if (!crumbRes.ok) throw new Error(`Failed to get Yahoo crumb: ${crumbRes.status}`);
  const crumb = await crumbRes.text();
  cachedAuth = { crumb, cookie };
  return cachedAuth;
}

async function yahooQuoteSummary(ticker: string) {
  const { crumb, cookie } = await getYahooAuth();
  const dispatcher = getProxyDispatcher();
  const modules = "price,summaryDetail,defaultKeyStatistics,financialData";
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
  const res = await undiciFetch(url, {
    dispatcher,
    headers: { "User-Agent": UA, "Cookie": cookie },
  });
  if (!res.ok) throw new Error(`Yahoo quoteSummary ${res.status}`);
  const data = (await res.json()) as any;
  const result = data.quoteSummary?.result?.[0];
  if (!result) throw new Error(`No data for ${ticker}`);
  return result;
}

/** Fetch monthly historical prices from Yahoo Finance chart API. */
async function yahooChartHistory(ticker: string, range: string) {
  const dispatcher = getProxyDispatcher();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=${range}`;
  const res = await undiciFetch(url, {
    dispatcher,
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Yahoo chart API ${res.status}`);
  const data = (await res.json()) as any;
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No history for ${ticker}`);
  return result;
}

function fmt(obj: any): string {
  if (!obj) return "N/A";
  return obj.fmt ?? obj.raw?.toString() ?? "N/A";
}

export const getStockInfo = tool(
  async ({ ticker }): Promise<string> => {
    try {
      const r = await yahooQuoteSummary(ticker);
      const p = r.price;
      const s = r.summaryDetail;
      const f = r.financialData;
      const k = r.defaultKeyStatistics;

      const metrics: Record<string, string> = {
        Company: p?.longName ?? p?.shortName ?? ticker,
        "Current Price": fmt(p?.regularMarketPrice),
        "Market Cap": fmt(p?.marketCap),
        "P/E Ratio (TTM)": fmt(s?.trailingPE),
        "Forward P/E": fmt(s?.forwardPE),
        "EPS (TTM)": fmt(k?.trailingEps),
        "Revenue (TTM)": fmt(f?.totalRevenue),
        "Gross Margin": fmt(f?.grossMargins),
        "Profit Margin": fmt(f?.profitMargins),
        "ROE": fmt(f?.returnOnEquity),
        "52-Week High": fmt(s?.fiftyTwoWeekHigh),
        "52-Week Low": fmt(s?.fiftyTwoWeekLow),
        "Dividend Yield": fmt(s?.dividendYield),
        "Beta": fmt(s?.beta),
        "Shares Outstanding": fmt(k?.sharesOutstanding),
        "Data Timestamp": new Date().toISOString(),
      };

      return JSON.stringify(metrics, null, 2);
    } catch (error) {
      return `Error fetching stock data for ${ticker}: ${String(error)}`;
    }
  },
  {
    name: "get_stock_info",
    description:
      "Get comprehensive real-time stock information including price, market cap, " +
      "P/E ratio, EPS, revenue, margins, and other key financial metrics.",
    schema: z.object({
      ticker: z
        .string()
        .describe("Stock ticker symbol (e.g., 'NVDA', 'AAPL')"),
    }),
  }
);

export const getFinancialHistory = tool(
  async ({ ticker, period }): Promise<string> => {
    try {
      const range = period === "5y" ? "5y" : "2y";
      const result = await yahooChartHistory(ticker, range);
      const timestamps: number[] = result.timestamp ?? [];
      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
      const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? [];

      const recent = timestamps.slice(-12).map((ts: number, i: number) => {
        const idx = timestamps.length - 12 + i;
        return {
          date: new Date(ts * 1000).toISOString().split("T")[0],
          close: closes[idx] != null ? `$${closes[idx].toFixed(2)}` : "N/A",
          volume: volumes[idx]?.toLocaleString() ?? "N/A",
        };
      });

      return JSON.stringify({ ticker, range, monthlyHistory: recent }, null, 2);
    } catch (error) {
      return `Error fetching history for ${ticker}: ${String(error)}`;
    }
  },
  {
    name: "get_financial_history",
    description: "Get historical monthly price data for a stock.",
    schema: z.object({
      ticker: z.string().describe("Stock ticker symbol"),
      period: z
        .enum(["2y", "5y"])
        .optional()
        .default("2y")
        .describe("Time period"),
    }),
  }
);

export function getFinanceTools() {
  return [getStockInfo, getFinancialHistory];
}
