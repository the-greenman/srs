#!/usr/bin/env node
import { mkdtemp, readFile, readdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";
import { spawn } from "child_process";
import { renderInvariants } from "./render-invariants.mjs";
import { logSrsCliProvenance, resolveSrsCli } from "./lib/pinned-srs.mjs";
import { viewExports } from "./lib/view-exports.mjs";
import { injectKeyInvariants } from "./lib/invariant-region.mjs";
import { checkPublishCompleteness, keyInvariantsExemptTitleCounts } from "./lib/publish-completeness.mjs";
import { testPublishCompletenessGuard } from "../tests/guards/check-publish-completeness.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs");
const SPEC_ROOT = join(ROOT, "docs", "spec");
// Assigned in main() so a missing SRS_CLI_PATH is reported by the error
// handler as a message rather than a module-load stack trace.
let SRS_CLI;

const VIEW_EXPORTS = viewExports(SPEC_ROOT);

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
    const newContent = injectKeyInvariants(content, injectedContent);
    if (newContent === null) continue;
    await writeFile(entry.output, newContent, "utf8");
  }
}

async function renderFreshViews(tempDir) {
  const tempEntries = VIEW_EXPORTS.map((e) => ({ ...e, output: join(tempDir, basename(e.output)) }));
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
  return tempEntries;
}

async function checkRenderedDocsDrift(tempEntries, injectedContent) {
  await applyInvariantInjection(tempEntries, injectedContent);
  for (let i = 0; i < VIEW_EXPORTS.length; i++) {
    await assertFileMatches(VIEW_EXPORTS[i].output, tempEntries[i].output, "rendered document");
  }
}

async function step(label, fn) {
  process.stdout.write(`Checking ${label}... `);
  await fn();
  console.log("OK");
}

async function main() {
  SRS_CLI = await resolveSrsCli();
  await logSrsCliProvenance(SRS_CLI);
  await step("package/instance validation", async () => {
    await run("node", ["scripts/validate-all.mjs"]);
    await run(SRS_CLI, ["--repo", REPO_ROOT, "repo", "validate"], { silent: true });
  });
  await step("IDL/schema conformance", () => run("node", ["scripts/check-idl-schema-conformance.mjs"], { silent: true }));
  await step("RFC integration", () => run("node", ["scripts/check-rfc-integration.mjs"], { silent: true }));

  const tempDir = await mkdtemp(join(tmpdir(), "srs-render-check-"));
  try {
    const tempEntries = await renderFreshViews(tempDir);
    // Captured before injection overwrites the temp files in place — the completeness guard (srs#396)
    // needs the raw, un-injected render to know everything the CLI actually emitted for each view.
    const rawContentsById = {};
    for (const entry of tempEntries) {
      rawContentsById[entry.id] = await readFile(entry.output, "utf8");
    }
    const injectedContent = await renderInvariants(REPO_ROOT);
    await step("rendered docs", () => checkRenderedDocsDrift(tempEntries, injectedContent));

    // Computed once: it's a full walk + parse of records/ and relations/, and the completeness
    // check and its self-test below both want the answer for the same repository state.
    const exemptCounts = await keyInvariantsExemptTitleCounts(REPO_ROOT);
    await step("publish completeness", () => checkPublishCompleteness(VIEW_EXPORTS, rawContentsById, exemptCounts));
    // A guard nobody has watched fail is indistinguishable from a guard that cannot fail (#308/#311/
    // #383/#391's lesson, per srs#396's disposition). Proves the check above actually bites.
    await step("publish completeness guard self-test", () =>
      testPublishCompletenessGuard(VIEW_EXPORTS, rawContentsById, exemptCounts)
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  console.log("\nOK: release artifacts are in sync.");
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
