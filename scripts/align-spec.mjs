#!/usr/bin/env node
/**
 * align-spec.mjs — Full spec alignment workflow.
 *
 * Validates records, renders document views, syncs JSON schemas to srs-rust
 * and srs-vscode, writes checksums, then verifies all drift checks pass.
 * Finishes by reporting which files changed in each repo so you know exactly
 * what to stage and commit.
 *
 * Usage (from srs/ repo root):
 *   node scripts/align-spec.mjs
 *
 * Environment:
 *   SRS_CLI_PATH  path to the srs binary (default: ~/.cargo/bin/srs)
 */
import { createHash } from "crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { spawn } from "child_process";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs");
const SPEC_ROOT = join(ROOT, "docs", "spec");
const SCHEMA_SRC = join(ROOT, "docs", "schema", "2.0");
const RUST_ROOT = resolve(join(ROOT, "..", "srs-rust"));
const VSCODE_ROOT = resolve(join(ROOT, "..", "srs-vscode"));
const RUST_SCHEMA_DST = join(RUST_ROOT, "crates", "srs-schema", "schemas", "2.0");
const VSCODE_SCHEMA_DST = join(VSCODE_ROOT, "schemas", "2.0");
const SRS_CLI = process.env.SRS_CLI_PATH || `${process.env.HOME}/.cargo/bin/srs`;

const VIEW_EXPORTS = [
  { id: "3a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "srs-spec.md") },
  { id: "3a000003-0000-4000-a000-000000000003", output: join(SPEC_ROOT, "srs-rationale.md") },
  { id: "3a000004-0000-4000-a000-000000000004", output: join(SPEC_ROOT, "srs-unified.md") },
  { id: "7a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "rfcs", "rfc-catalog.md") },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function hr() {
  return "─".repeat(60);
}

async function step(n, label, fn) {
  console.log(`\n${hr()}`);
  console.log(`Step ${n}: ${label}`);
  console.log(hr());
  await fn();
}

function run(cmd, args, cwd = ROOT) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`command failed (${code}): ${cmd} ${args.join(" ")}`));
    });
    child.on("error", reject);
  });
}

function capture(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    let out = "";
    const child = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "inherit"] });
    child.stdout.on("data", (d) => { out += d; });
    child.on("close", (code) => resolve({ code, stdout: out }));
    child.on("error", reject);
  });
}

async function listJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();
}

function sha256Hex(content) {
  return createHash("sha256").update(content).digest("hex");
}

// ─── sync ────────────────────────────────────────────────────────────────────

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

  return srcFiles.length;
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

async function renderDocumentViews() {
  for (const entry of VIEW_EXPORTS) {
    await mkdir(dirname(entry.output), { recursive: true });
    await run(SRS_CLI, [
      "--repo", REPO_ROOT,
      "render", "document-view",
      "--view", entry.id,
      "--output", entry.output,
    ]);
  }
}

// ─── report ──────────────────────────────────────────────────────────────────

async function collectChanges(dir) {
  const { stdout: unstaged } = await capture("git", ["diff", "--name-only"], dir);
  const { stdout: staged } = await capture("git", ["diff", "--name-only", "--staged"], dir);
  const { stdout: untracked } = await capture(
    "git", ["ls-files", "--others", "--exclude-standard"], dir
  );
  const files = [
    ...unstaged.trim().split("\n"),
    ...staged.trim().split("\n"),
    ...untracked.trim().split("\n"),
  ].filter(Boolean);
  return [...new Set(files)];
}

async function reportChanges() {
  const repos = [
    { label: "srs", dir: ROOT, note: "rendered docs + synced schema copies" },
    { label: "srs-rust", dir: RUST_ROOT, note: "synced schemas + SHA256SUMS" },
    { label: "srs-vscode", dir: VSCODE_ROOT, note: "synced schemas" },
  ];

  const pending = [];
  for (const repo of repos) {
    const files = await collectChanges(repo.dir);
    if (files.length > 0) pending.push({ ...repo, files });
  }

  if (pending.length === 0) {
    console.log("\nNothing to commit — all repos are already in sync.");
    return;
  }

  console.log("\nChanged files:\n");
  for (const { label, dir, note, files } of pending) {
    console.log(`  ${label}  [${note}]`);
    console.log(`  ${dir}`);
    for (const f of files) console.log(`    ${f}`);
    console.log();
  }

  console.log("Commit in this order:\n");
  for (const { label, dir } of pending) {
    console.log(`  # ${label}`);
    console.log(`  cd ${dir}`);
    console.log(`  git add <files above>`);
    console.log(`  git commit -m "chore: sync release artifacts"`);
    console.log();
  }

  console.log(
    "Then open PRs (or push) for each repo that changed.\n" +
    "Tip: land srs-rust and srs-vscode schema updates before the srs PR\n" +
    "     to keep drift checks green throughout.\n"
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  await step(1, "Validate packages and records", async () => {
    await run("node", ["scripts/validate-all.mjs"]);
    await run(SRS_CLI, ["--repo", REPO_ROOT, "repo", "validate"]);
  });

  await step(2, "Render document views", async () => {
    await renderDocumentViews();
    for (const v of VIEW_EXPORTS) console.log(`  rendered: ${v.output}`);
  });

  await step(3, "Sync schemas to srs-rust and srs-vscode", async () => {
    const n = await syncSchemas(RUST_SCHEMA_DST);
    await syncSchemas(VSCODE_SCHEMA_DST);
    await writeRustChecksums();
    console.log(`  synced ${n} schemas → srs-rust`);
    console.log(`  synced ${n} schemas → srs-vscode`);
    console.log("  SHA256SUMS written");
  });

  await step(4, "Verify all drift checks pass", async () => {
    await run("node", ["scripts/check-release-drift.mjs"]);
  });

  await step(5, "Report changes and commit instructions", reportChanges);
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
});
