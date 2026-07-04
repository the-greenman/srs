#!/usr/bin/env node
import { createHash } from "crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { spawn } from "child_process";
import { renderInvariants } from "./render-invariants.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs");
const SPEC_ROOT = join(ROOT, "docs", "spec");
const SCHEMA_SRC = join(ROOT, "docs", "schema", "2.0");
const RUST_SCHEMA_DST = join(ROOT, "..", "srs-rust", "crates", "srs-schema", "schemas", "2.0");
const VSCODE_SCHEMA_DST = join(ROOT, "..", "srs-vscode", "schemas", "2.0");
const SRS_CLI = process.env.SRS_CLI_PATH || "/home/greenman/.cargo/bin/srs";

const VIEW_EXPORTS = [
  { id: "3a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "srs-spec.md"), requiresKeyInvariants: true },
  { id: "3a000003-0000-4000-a000-000000000003", output: join(SPEC_ROOT, "srs-rationale.md") },
  { id: "3a000004-0000-4000-a000-000000000004", output: join(SPEC_ROOT, "srs-unified.md"), requiresKeyInvariants: true },
  { id: "7a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "rfcs", "rfc-catalog.md") },
];

function run(cmd, args, cwd = ROOT) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`command failed (${code}): ${cmd} ${args.join(" ")}`));
    });
  });
}

async function listJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

async function syncSchemas(dst) {
  await mkdir(dst, { recursive: true });
  const srcFiles = await listJsonFiles(SCHEMA_SRC);
  const dstFiles = await listJsonFiles(dst);
  const srcSet = new Set(srcFiles);

  for (const filename of dstFiles) {
    if (!srcSet.has(filename)) {
      await rm(join(dst, filename), { force: true });
    }
  }

  for (const filename of srcFiles) {
    await copyFile(join(SCHEMA_SRC, filename), join(dst, filename));
  }
}

function sha256Hex(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function writeRustChecksums() {
  const files = await listJsonFiles(RUST_SCHEMA_DST);
  const lines = [];
  for (const filename of files) {
    const content = await readFile(join(RUST_SCHEMA_DST, filename));
    lines.push(`${sha256Hex(content)}  ${filename}`);
  }
  lines.sort();
  await writeFile(join(RUST_SCHEMA_DST, "SHA256SUMS"), `${lines.join("\n")}\n`, "utf8");
}

async function injectInvariants() {
  const injectedContent = await renderInvariants(REPO_ROOT);
  for (const entry of VIEW_EXPORTS) {
    const content = await readFile(entry.output, "utf8");
    const headingMatch = /^### Key Invariants$/m.exec(content);
    if (!headingMatch) {
      if (entry.requiresKeyInvariants) {
        throw new Error(`${entry.output} is marked requiresKeyInvariants but has no ### Key Invariants heading`);
      }
      continue;
    }
    const headingEnd = headingMatch.index + headingMatch[0].length;
    const rest = content.slice(headingEnd);
    const closingMatch = /^---$/m.exec(rest);
    const beforeRegion = content.slice(0, headingEnd);
    const afterRegion = closingMatch ? rest.slice(closingMatch.index) : "";
    const newContent = `${beforeRegion}\n\n${injectedContent.trimEnd()}\n\n${afterRegion}`;
    await writeFile(entry.output, newContent, "utf8");
  }
}

async function renderDocumentViews() {
  for (const entry of VIEW_EXPORTS) {
    await mkdir(dirname(entry.output), { recursive: true });
    await run(SRS_CLI, [
      "--repo",
      REPO_ROOT,
      "render",
      "document-view",
      "--view",
      entry.id,
      "--output",
      entry.output,
    ]);
  }
}

async function main() {
  await run("node", ["scripts/validate-all.mjs"]);
  await run(SRS_CLI, ["--repo", REPO_ROOT, "repo", "validate"]);
  await renderDocumentViews();
  await injectInvariants();
  await syncSchemas(RUST_SCHEMA_DST);
  await syncSchemas(VSCODE_SCHEMA_DST);
  await writeRustChecksums();
  await run("node", ["scripts/check-release-drift.mjs"]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
