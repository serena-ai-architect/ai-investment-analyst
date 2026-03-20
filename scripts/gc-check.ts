/**
 * Garbage Collection Check
 * =========================
 * Scans for documentation/code inconsistencies:
 *   1. AGENTS.md references files that actually exist
 *   2. AGENT_ROLES keys match actual instantiations in crews
 *   3. Tool getter functions are used somewhere
 *
 * Run: npx tsx scripts/gc-check.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CORE = path.join(ROOT, "packages/core/src");

let errors = 0;
let warnings = 0;

function error(msg: string) {
  console.error(`  ❌ ${msg}`);
  errors++;
}

function warn(msg: string) {
  console.warn(`  ⚠️  ${msg}`);
  warnings++;
}

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}

// ── Check 1: AGENTS.md file references ──────────────────────────────

function checkAgentsMdReferences() {
  console.log("\n📋 Check 1: AGENTS.md file references");

  const agentsMd = path.join(ROOT, "AGENTS.md");
  if (!fs.existsSync(agentsMd)) {
    error("AGENTS.md does not exist at repo root");
    return;
  }

  const content = fs.readFileSync(agentsMd, "utf-8");

  // Extract file paths from the table (backtick-wrapped paths)
  const pathPattern = /`(packages\/[^`]+|apps\/[^`]+|scripts\/[^`]+)`/g;
  let match;
  while ((match = pathPattern.exec(content)) !== null) {
    const refPath = match[1];
    const fullPath = path.join(ROOT, refPath);
    // Check if it's a file or directory
    if (fs.existsSync(fullPath)) {
      ok(`${refPath} exists`);
    } else {
      error(`${refPath} referenced in AGENTS.md but does not exist`);
    }
  }
}

// ── Check 2: AGENT_ROLES ↔ crew instantiation alignment ────────────

function checkAgentRolesAlignment() {
  console.log("\n📋 Check 2: AGENT_ROLES ↔ crew instantiation alignment");

  const configPath = path.join(CORE, "config.ts");
  const crewsPath = path.join(CORE, "crews/index.ts");

  if (!fs.existsSync(configPath) || !fs.existsSync(crewsPath)) {
    error("config.ts or crews/index.ts not found");
    return;
  }

  const configContent = fs.readFileSync(configPath, "utf-8");
  const crewsContent = fs.readFileSync(crewsPath, "utf-8");

  // Extract role keys from AGENT_ROLES
  const rolePattern = /^\s+(\w+):\s*\{/gm;
  const definedRoles: string[] = [];
  let roleMatch;
  // Find the AGENT_ROLES block
  const rolesBlock = configContent.match(/AGENT_ROLES\s*=\s*\{([\s\S]*?)\}\s*as\s*const/);
  if (rolesBlock) {
    while ((roleMatch = rolePattern.exec(rolesBlock[1])) !== null) {
      definedRoles.push(roleMatch[1]);
    }
  }

  // Extract role: "xxx" from buildReactAgent calls in crews
  const usedRoles: string[] = [];
  const usedPattern = /role:\s*"(\w+)"/g;
  let usedMatch;
  while ((usedMatch = usedPattern.exec(crewsContent)) !== null) {
    usedRoles.push(usedMatch[1]);
  }

  // Check: every used role is defined
  for (const role of usedRoles) {
    if (definedRoles.includes(role)) {
      ok(`Role "${role}" is defined and used`);
    } else {
      error(`Role "${role}" is used in crews but NOT defined in AGENT_ROLES`);
    }
  }

  // Check: every defined role is used
  for (const role of definedRoles) {
    if (!usedRoles.includes(role)) {
      warn(`Role "${role}" is defined in AGENT_ROLES but never instantiated in crews`);
    }
  }
}

// ── Check 3: Tool getter usage ──────────────────────────────────────

function checkToolGetterUsage() {
  console.log("\n📋 Check 3: Tool getter function usage");

  const toolGetters = [
    "getSearchTools",
    "getFinanceTools",
    "getMcpResearchTools",
    "getMcpDeliveryTools",
  ];

  const crewsPath = path.join(CORE, "crews/index.ts");
  if (!fs.existsSync(crewsPath)) {
    error("crews/index.ts not found");
    return;
  }

  const crewsContent = fs.readFileSync(crewsPath, "utf-8");

  for (const getter of toolGetters) {
    if (crewsContent.includes(getter)) {
      ok(`${getter}() is used in crews`);
    } else {
      warn(`${getter}() is defined but not used in crews/index.ts`);
    }
  }
}

// ── Run all checks ──────────────────────────────────────────────────

console.log("🔍 Garbage Collection Check — scanning for inconsistencies...");

checkAgentsMdReferences();
checkAgentRolesAlignment();
checkToolGetterUsage();

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${errors} errors, ${warnings} warnings`);

if (errors > 0) {
  console.log("💥 Fix the errors above before committing.");
  process.exit(1);
}

if (warnings > 0) {
  console.log("⚠️  Warnings found — review but not blocking.");
}

console.log("✅ All checks passed.\n");
