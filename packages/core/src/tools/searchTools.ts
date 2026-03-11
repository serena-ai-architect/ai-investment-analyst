/**
 * Search & Web Research Tools
 * =============================
 * Uses DuckDuckGo HTML search for real-time web results (free, no API key).
 * Automatically uses HTTP proxy from environment (https_proxy / http_proxy).
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ProxyAgent, fetch as undiciFetch } from "undici";

function getProxyDispatcher() {
  const proxy = process.env.https_proxy || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return proxy ? new ProxyAgent(proxy) : undefined;
}

async function ddgSearch(query: string, count = 8): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const dispatcher = getProxyDispatcher();
  const response = await undiciFetch(url, {
    dispatcher,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }

  const html = await response.text();

  // Parse search results from HTML
  const results: string[] = [];
  const resultRegex =
    /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < count) {
    const rawUrl = match[1];
    const title = match[2].replace(/<[^>]*>/g, "").trim();
    const snippet = match[3].replace(/<[^>]*>/g, "").trim();

    // DDG wraps URLs in a redirect; extract the real URL
    let finalUrl = rawUrl;
    const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
    if (uddgMatch) {
      finalUrl = decodeURIComponent(uddgMatch[1]);
    }

    if (title && snippet) {
      results.push(`**${title}**\n${snippet}\nSource: ${finalUrl}`);
    }
  }

  return results.join("\n\n");
}

export const webSearch = tool(
  async ({ query }): Promise<string> => {
    try {
      const results = await ddgSearch(query);
      return results || `No search results found for "${query}". Do not fabricate data.`;
    } catch (error) {
      return `Search failed for "${query}". No data is available. Do not fabricate or estimate data.`;
    }
  },
  {
    name: "web_search",
    description:
      "Search the web for information about a company or topic. " +
      "Returns top results with snippets.",
    schema: z.object({
      query: z.string().describe("Search query string"),
    }),
  }
);

export const newsSearch = tool(
  async ({ company }): Promise<string> => {
    try {
      const query = `${company} latest news financial earnings ${new Date().getFullYear()}`;
      const results = await ddgSearch(query);
      return (
        results ||
        `No recent news found for ${company}. Do not fabricate news.`
      );
    } catch {
      return `News search failed for ${company}. No news data is available.`;
    }
  },
  {
    name: "news_search",
    description: "Search for recent news about a company.",
    schema: z.object({
      company: z.string().describe("Company name to search news for"),
    }),
  }
);

export const competitorSearch = tool(
  async ({ company, industry }): Promise<string> => {
    try {
      const query = `${company} competitors market share ${industry || ""} analysis`;
      const results = await ddgSearch(query);
      return (
        results ||
        `No competitor data found for ${company}. Do not invent competitor information.`
      );
    } catch {
      return `Competitor search failed for ${company}. No data is available.`;
    }
  },
  {
    name: "competitor_search",
    description: "Find competitors and market landscape for a company.",
    schema: z.object({
      company: z.string().describe("Target company name"),
      industry: z.string().optional().describe("Industry context"),
    }),
  }
);

export function getSearchTools() {
  return [webSearch, newsSearch, competitorSearch];
}
