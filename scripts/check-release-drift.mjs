#!/usr/bin/env node
import { mkdtemp, readFile, readdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { spawn } from "child_process";
import { renderInvariants } from "./render-invariants.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs");
const SPEC_ROOT = join(ROOT, "docs", "spec");
const SRS_CLI = process.env.SRS_CLI_PATH || "/home/greenman/.cargo/bin/srs";

const VIEW_EXPORTS = [
  { id: "3a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "srs-spec.md"), requiresKeyInvariants: true },
  { id: "3a000003-0000-4000-a000-000000000003", output: join(SPEC_ROOT, "srs-rationale.md") },
  { id: "3a000004-0000-4000-a000-000000000004", output: join(SPEC_ROOT, "srs-unified.md"), requiresKeyInvariants: true },
  { id: "7a000001-0000-4000-a000-000000000001", output: join(SPEC_ROOT, "rfcs", "rfc-catalog.md") },
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

async function applyInvariantInjection(entries, injectedContent) {
  for (const entry of entries) {
    const content = await readFile(entry.output, "utf8");
    const headingMatch = /^### Key Invariants$/m.exec(content);
    if (!headingMatch) continue;
    const headingEnd = headingMatch.index + headingMatch[0].length;
    const rest = content.slice(headingEnd);
    const closingMatch = /^---$/m.exec(rest);
    const beforeRegion = content.slice(0, headingEnd);
    const afterRegion = closingMatch ? rest.slice(closingMatch.index) : "";
    const newContent = `${beforeRegion}\n\n${injectedContent.trimEnd()}\n\n${afterRegion}`;
    await writeFile(entry.output, newContent, "utf8");
  }
}

async function checkRenderedDocsDrift() {
  const tempDir = await mkdtemp(join(tmpdir(), "srs-render-check-"));
  const tempEntries = VIEW_EXPORTS.map((e) => ({ ...e, output: join(tempDir, basename(e.output)) }));
  try {
    for (const entry of tempEntries) {
      await run(SRS_CLI, [
        "--repo",
        REPO_ROOT,
        "render",
        "document-view",
        "--view",
        entry.id,
        "--output",
        entry.output,
      ], { silent: true });
    }
    const injectedContent = await renderInvariants(REPO_ROOT);
    await applyInvariantInjection(tempEntries, injectedContent);
    for (let i = 0; i < VIEW_EXPORTS.length; i++) {
      await assertFileMatches(VIEW_EXPORTS[i].output, tempEntries[i].output, "rendered document");
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
  await step("RFC integration", () => run("node", ["scripts/check-rfc-integration.mjs"], { silent: true }));
  await step("rendered docs", checkRenderedDocsDrift);
  console.log("\nOK: release artifacts are in sync.");
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
