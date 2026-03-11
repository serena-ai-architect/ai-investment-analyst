/**
 * Multi-Agent Research & Analysis System — CLI
 * ==============================================
 * Usage:
 *   npm run start -- --company "NVIDIA" --mode full
 *   npm run demo
 *   npm run watchlist
 */

import "dotenv/config";
import {
  AGENT_ROLES,
  WATCHLIST,
  getSearchTools,
  getFinanceTools,
  getAllMcpTools,
  isNotionConfigured,
  isEmailConfigured,
  runWorkflow,
  ReportWriterAgent,
} from "@repo/core";

function printBanner() {
  console.log("\n" + "=".repeat(65));
  console.log("  Multi-Agent Research & Analysis System (TypeScript)");
  console.log("  LangGraph.js + LangChain.js + Vercel AI SDK + MCP");
  console.log("=".repeat(65) + "\n");
}

async function runFullPipeline(company: string, query: string, mode: "quick" | "full") {
  console.log(`Target: ${company}`);
  console.log(`Query: ${query}`);
  console.log(`Mode: ${mode}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log("-".repeat(65));

  const result = await runWorkflow({ company, query, mode, stream: true });

  if (result?.finalReport || result?.draftReport) {
    const report = result.finalReport || result.draftReport;
    console.log("\n" + "=".repeat(65));
    console.log("FINAL REPORT (English)");
    console.log("=".repeat(65));
    console.log(report);

    const fs = await import("fs");
    const slug = company.toLowerCase().replace(/\s+/g, "_");
    fs.mkdirSync("output", { recursive: true });

    const enFilename = `output/${slug}_report.md`;
    fs.writeFileSync(enFilename, report);
    console.log(`\nEnglish report saved to: ${enFilename}`);

    console.log("\nGenerating Chinese translation...");
    try {
      const writer = new ReportWriterAgent();
      const chineseReport = await writer.translate(report);
      const zhFilename = `output/${slug}_report_zh.md`;
      fs.writeFileSync(zhFilename, chineseReport);
      console.log(`Chinese report saved to: ${zhFilename}`);
    } catch (error) {
      console.log(`Chinese translation failed: ${error}`);
    }
  } else {
    console.log("No final report generated. Check logs above.");
  }
}

async function runDemo() {
  console.log("DEMO MODE — Architecture showcase (no API keys needed)\n");

  console.log("Agent Roles Configured:");
  for (const [, agent] of Object.entries(AGENT_ROLES)) {
    console.log(`  - ${agent.role}`);
    console.log(`    Goal: ${agent.goal.slice(0, 75)}...`);
  }

  console.log("\nTools Available:");
  const allTools = [...getSearchTools(), ...getFinanceTools(), ...getAllMcpTools()];
  for (const t of allTools) {
    console.log(`  - ${t.name}: ${t.description.slice(0, 65)}...`);
  }

  console.log("\nWorkflow Graph:");
  console.log(`
  START -> Planning -> NotionContext -> Research -> Analysis
  Analysis ->|full| Risk -> Report
  Analysis ->|quick| Report
  Report -> Reflexion
  Reflexion ->|score>=7| Delivery
  Reflexion ->|retry| Report
  Delivery -> Finalize -> END
  `);

  console.log("\nDemo complete! Set DEEPSEEK_API_KEY to run full pipeline.");
  console.log("   Usage: npm run start -- --company 'NVIDIA' --mode full");
}

async function runWatchlist(mode: "quick" | "full") {
  console.log("WATCHLIST MODE — Analyzing tracked companies\n");
  console.log(`  Notion: ${isNotionConfigured() ? "connected" : "not configured"}`);
  console.log(`  Email:  ${isEmailConfigured() ? "connected" : "not configured"}`);
  console.log(`  Mode:   ${mode}`);
  console.log(`  Companies: ${WATCHLIST.map((c) => c.name).join(", ")}\n`);
  console.log("-".repeat(65));

  const results: { company: string; status: string; duration: number }[] = [];

  for (let i = 0; i < WATCHLIST.length; i++) {
    const { name } = WATCHLIST[i];
    const start = Date.now();

    console.log(`\n${"=".repeat(65)}`);
    console.log(`  [${i + 1}/${WATCHLIST.length}] Analyzing ${name}...`);
    console.log("=".repeat(65));

    try {
      await runFullPipeline(name, `Comprehensive investment analysis of ${name}`, mode);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      results.push({ company: name, status: "completed", duration: Number(elapsed) });
    } catch (e) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      results.push({ company: name, status: `failed: ${String(e).slice(0, 50)}`, duration: Number(elapsed) });
      console.error(`  ${name} failed: ${e}`);
    }

    if (i < WATCHLIST.length - 1) {
      console.log("\n  Pausing 5s before next company...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log(`\n${"=".repeat(65)}`);
  console.log("  WATCHLIST SUMMARY");
  console.log("=".repeat(65));
  for (const r of results) {
    console.log(`  ${r.company.padEnd(15)} ${r.status.padEnd(30)} (${r.duration}s)`);
  }
  console.log("=".repeat(65));
}

async function main() {
  printBanner();

  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      if (key === "demo" || key === "v2" || key === "watchlist") {
        flags[key] = "true";
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[key] = args[i + 1];
        i++;
      }
    }
  }

  if (flags.demo) {
    await runDemo();
  } else if (flags.watchlist) {
    const mode = (flags.mode === "quick" ? "quick" : "full") as "quick" | "full";
    await runWatchlist(mode);
  } else if (flags.company) {
    const query = flags.query ?? `Comprehensive investment analysis of ${flags.company}`;
    const mode = (flags.mode === "quick" ? "quick" : "full") as "quick" | "full";
    await runFullPipeline(flags.company, query, mode);
  } else {
    console.log("No arguments. Running demo...\n");
    await runDemo();
  }
}

main().catch(console.error);
