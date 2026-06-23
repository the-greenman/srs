#!/usr/bin/env node
import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { spawn } from "child_process";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs");
const SPEC_ROOT = join(ROOT, "docs", "spec");
const SRS_CLI = process.env.SRS_CLI_PATH || "/home/greenman/.cargo/bin/srs";

const VIEW_EXPORTS = [
  { id: "3a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "srs-spec.md") },
  { id: "3a000003-0000-4000-a000-000000000003", output: join(SPEC_ROOT, "srs-rationale.md") },
  { id: "3a000004-0000-4000-a000-000000000004", output: join(SPEC_ROOT, "srs-unified.md") },
];

function run(cmd, args, { cwd = ROOT, silent = false } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const stdio = silent ? ["inherit", "ignore", "inherit"] : "inherit";
    const child = spawn(cmd, args, { cwd, stdio });
    child.on("error", (err) => {
      rejectPromise(new Error(`command failed to start: ${cmd} ${args.join(" ")}: ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`command failed (${code}): ${cmd} ${args.join(" ")}`));
    });
  });
}

async function assertFileMatches(committedPath, renderedPath, label) {
  const [committed, rendered] = await Promise.all([
    readFile(committedPath, "utf8"),
    readFile(renderedPath, "utf8"),
  ]);
  if (normalizeMarkdownForComparison(committed) !== normalizeMarkdownForComparison(rendered)) {
    throw new Error(`${label} drift: ${committedPath} is stale — re-render to update`);
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
      ], { silent: true });
      await assertFileMatches(entry.output, outPath, "rendered document");
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
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
    await run(SRS_CLI, ["--repo", REPO_ROOT, "repo", "validate"], { silent: true });
  });
  await step("rendered docs", checkRenderedDocsDrift);
  console.log("\nOK: release artifacts are in sync.");
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
