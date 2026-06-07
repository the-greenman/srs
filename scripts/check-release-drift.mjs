#!/usr/bin/env node
import { createHash } from "crypto";
import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { spawn } from "child_process";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs");
const SPEC_ROOT = join(ROOT, "docs", "spec");
const SCHEMA_SRC = join(ROOT, "docs", "schema", "2.0");
const RUST_SCHEMA_DST = join(ROOT, "..", "srs-rust", "crates", "srs-schema", "schemas", "2.0");
const VSCODE_SCHEMA_DST = join(ROOT, "..", "srs-vscode", "schemas", "2.0");
const SRS_CLI = process.env.SRS_CLI_PATH || "/home/greenman/.cargo/bin/srs";

const VIEW_EXPORTS = [
  { id: "3a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "srs-spec.md") },
  { id: "3a000003-0000-4000-a000-000000000003", output: join(SPEC_ROOT, "srs-rationale.md") },
  { id: "3a000004-0000-4000-a000-000000000004", output: join(SPEC_ROOT, "srs-unified.md") },
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

function sha256Hex(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function assertFileMatches(expectedPath, actualPath, label) {
  const [expected, actual] = await Promise.all([
    readFile(expectedPath, "utf8"),
    readFile(actualPath, "utf8"),
  ]);
  if (normalizeMarkdownForComparison(expected) !== normalizeMarkdownForComparison(actual)) {
    throw new Error(`${label} drift: ${actualPath} differs from rendered output`);
  }
}

function normalizeMarkdownForComparison(text) {
  // Current renderer can emit unstable order for same-level "###" sections.
  // Compare on canonicalized block order so drift checks fail only for content deltas.
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const head = [];
  const sections = [];
  let current = [];
  let seenSection = false;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (!seenSection) {
        seenSection = true;
      } else {
        sections.push(current.join("\n"));
      }
      current = [line];
      continue;
    }
    if (seenSection) {
      current.push(line);
    } else {
      head.push(line);
    }
  }

  if (seenSection) {
    sections.push(current.join("\n"));
  }
  if (sections.length === 0) {
    return normalized.trimEnd();
  }
  return `${head.join("\n")}\n${sections.sort().join("\n")}`.trimEnd();
}

async function checkRenderedDocsDrift() {
  const tempDir = await mkdtemp(join(tmpdir(), "srs-render-check-"));
  try {
    for (const entry of VIEW_EXPORTS) {
      const outPath = join(tempDir, basename(entry.output));
      await run(SRS_CLI, [
        "--repo",
        REPO_ROOT,
        "render",
        "document-view",
        "--view",
        entry.id,
        "--output",
        outPath,
      ]);
      await assertFileMatches(outPath, entry.output, "rendered document");
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function checkSchemaMirror(dst, label) {
  const [srcFiles, dstFiles] = await Promise.all([listJsonFiles(SCHEMA_SRC), listJsonFiles(dst)]);
  const srcSet = new Set(srcFiles);
  const dstSet = new Set(dstFiles);

  for (const filename of srcFiles) {
    if (!dstSet.has(filename)) {
      throw new Error(`${label} schema drift: missing file ${filename}`);
    }
    const [srcContent, dstContent] = await Promise.all([
      readFile(join(SCHEMA_SRC, filename), "utf8"),
      readFile(join(dst, filename), "utf8"),
    ]);
    if (srcContent !== dstContent) {
      throw new Error(`${label} schema drift: file content differs for ${filename}`);
    }
  }

  for (const filename of dstFiles) {
    if (!srcSet.has(filename)) {
      throw new Error(`${label} schema drift: extra file ${filename}`);
    }
  }
}

async function checkRustChecksums() {
  const files = await listJsonFiles(RUST_SCHEMA_DST);
  const lines = [];
  for (const filename of files) {
    const content = await readFile(join(RUST_SCHEMA_DST, filename));
    lines.push(`${sha256Hex(content)}  ${filename}`);
  }
  lines.sort();
  const actual = `${lines.join("\n")}\n`;
  const expected = await readFile(join(RUST_SCHEMA_DST, "SHA256SUMS"), "utf8");
  if (actual !== expected) {
    throw new Error("Rust schema drift: SHA256SUMS does not match current JSON schema files");
  }
}

async function step(label, fn) {
  process.stdout.write(`Checking ${label}... `);
  await fn();
  console.log("OK");
}

async function main() {
  await step("package/instance validation", async () => {
    await run("node", ["scripts/validate-all.mjs"]);
    await run(SRS_CLI, ["--repo", REPO_ROOT, "repo", "validate"]);
  });
  await step("rendered docs", checkRenderedDocsDrift);
  await step("srs-rust schema mirror", () => checkSchemaMirror(RUST_SCHEMA_DST, "srs-rust"));
  await step("srs-vscode schema mirror", () => checkSchemaMirror(VSCODE_SCHEMA_DST, "srs-vscode"));
  await step("Rust SHA256SUMS", checkRustChecksums);
  console.log("\nOK: release artifacts are in sync.");
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
