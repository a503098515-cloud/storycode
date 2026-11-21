import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM; let Node load it directly instead of bundling.
  serverExternalPackages: ["@electric-sql/pglite", "pglite-prisma-adapter"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/**": [
      "../../packages/db/src/generated/prisma/**/*",
      "src/generated/prisma/query_compiler_bg.wasm",
    ],
  },
};

export default nextConfig;
