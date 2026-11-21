import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(webRoot, "../..");
const generatedClient = path.join(
  repositoryRoot,
  "packages",
  "db",
  "src",
  "generated",
  "prisma",
);
const runtimeDirectory = path.join(webRoot, "src", "generated", "prisma");

await mkdir(runtimeDirectory, { recursive: true });
await copyFile(
  path.join(generatedClient, "query_compiler_bg.wasm"),
  path.join(runtimeDirectory, "query_compiler_bg.wasm"),
);
