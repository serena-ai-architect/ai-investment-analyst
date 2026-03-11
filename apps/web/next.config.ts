import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/core", "@repo/db"],
  webpack: (config) => {
    // Resolve .js imports to .ts source files in workspace packages
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
  // Exclude heavy node-only packages from server bundle analysis warnings
  serverExternalPackages: [
    "@langchain/community",
    "@langchain/core",
    "@langchain/langgraph",
    "@langchain/openai",
    "@notionhq/client",
    "nodemailer",
    "undici",
  ],
};

export default nextConfig;
