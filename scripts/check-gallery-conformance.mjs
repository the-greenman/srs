#!/usr/bin/env node
/**
 * check-gallery-conformance.mjs — recorded validation for the gallery corpus target (#345).
 *
 * `docs/spec/examples/gallery-project-v2/` became a conforming SRS repository in #313/PR #344:
 * `manifest.json` plus a `.srs/` *directory* marker (migrated from the legacy 1-byte file). Its
 * marker-directory survival depends entirely on the placeholder `.srs/README.md` that PR created —
 * a directory with no regular file inside it round-trips as an empty/absent marker. Nothing checked
 * this before: deleting the placeholder, or an archive pack/unpack that drops empty directories,
 * would silently return the gallery to a non-conforming marker with nothing going red.
 *
 * Two independent assertions, both required:
 *   1. The `.srs/` marker resolves as a directory beside `manifest.json`, and holds at least one
 *      regular file (CC-54: non-emptiness is a SHOULD, folded by #313 — this check enforces it, but
 *      never asserts a specific filename; `.srs/README.md` stays non-authoritative, owned by #340).
 *   2. `srs repo validate --repo docs/spec/examples/gallery-project-v2` reports zero errors, via the
 *      *pinned* binary (CC-37/CC-47) — diagnostics live in the payload, not the exit code, so this
 *      asserts on `payload.summary.errors`, never on process exit status alone.
 *
 * Requires the pinned `srs` CLI (see scripts/fetch-pinned-srs.mjs); this is binary-backed and is
 * deliberately NOT part of scripts/validate-all.mjs, which is kept Node-pipeline-only (ADR-004).
 * It is wired into .github/workflows/release-drift.yml, which already fetches that binary.
 *
 *   export $(node scripts/fetch-pinned-srs.mjs)
 *   node scripts/check-gallery-conformance.mjs
 */
import { readdir, stat } from "fs/promises";
import { join, resolve } from "path";
import { spawn } from "child_process";
import { logSrsCliProvenance, resolveSrsCli } from "./lib/pinned-srs.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const GALLERY_REPO = join(ROOT, "docs", "spec", "examples", "gallery-project-v2");
const MARKER_DIR = join(GALLERY_REPO, ".srs");
const MANIFEST_PATH = join(GALLERY_REPO, "manifest.json");

async function checkMarker() {
  const errors = [];

  let manifestStat;
  try {
    manifestStat = await stat(MANIFEST_PATH);
  } catch {
    manifestStat = null;
  }
  if (!manifestStat || !manifestStat.isFile()) {
    errors.push(`manifest.json missing: ${MANIFEST_PATH}`);
  }

  let markerStat;
  try {
    markerStat = await stat(MARKER_DIR);
  } catch {
    errors.push(`.srs marker missing: ${MARKER_DIR}`);
    return errors;
  }

  if (!markerStat.isDirectory()) {
    errors.push(
      `.srs marker has degraded to the legacy file form (must be a directory): ${MARKER_DIR}`,
    );
    return errors;
  }

  const entries = await readdir(MARKER_DIR, { withFileTypes: true });
  const hasRegularFile = entries.some((entry) => entry.isFile());
  if (!hasRegularFile) {
    errors.push(
      `.srs marker directory holds no regular file (degraded to an empty marker): ${MARKER_DIR}`,
    );
  }

  return errors;
}

function runRepoValidate(cliPath) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cliPath, ["repo", "validate", "--repo", GALLERY_REPO], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) =>
      rejectPromise(new Error(`srs repo validate failed to start: ${error.message}`)),
    );
    child.on("close", () => {
      // Diagnostics live in the payload, not the exit code (CC-37) — parse regardless of the
      // process exit status and let the payload decide pass/fail.
      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (error) {
        rejectPromise(
          new Error(
            `srs repo validate did not return parseable JSON: ${error.message}\nstdout: ${stdout}\nstderr: ${stderr}`,
          ),
        );
        return;
      }
      resolvePromise(parsed);
    });
  });
}

async function main() {
  const cliPath = await resolveSrsCli();
  await logSrsCliProvenance(cliPath);

  const markerErrors = await checkMarker();
  for (const error of markerErrors) {
    console.error(`✗ ${error}`);
  }

  const result = await runRepoValidate(cliPath);
  const summary = result?.payload?.summary;
  const diagnostics = result?.payload?.diagnostics ?? [];

  if (!summary || typeof summary.errors !== "number") {
    throw new Error(`srs repo validate returned an unexpected payload shape: ${JSON.stringify(result)}`);
  }

  const errorDiagnostics = diagnostics.filter((d) => d.severity === "error");
  for (const diagnostic of errorDiagnostics) {
    console.error(`✗ [error] ${diagnostic.path}: ${diagnostic.message}`);
  }

  const ok = markerErrors.length === 0 && summary.errors === 0;

  console.log(
    `gallery-project-v2: srs repo validate — checked ${summary.checked}, ` +
      `${summary.errors} errors, ${summary.warnings} warnings; .srs marker: ${markerErrors.length === 0 ? "OK (directory, non-empty)" : "DEGRADED"}`,
  );

  if (!ok) {
    console.error("\n✗ Gallery repository conformance check failed");
    process.exit(1);
  }

  console.log("✓ Gallery repository conformance check passed");
}

main().catch((error) => {
  console.error(`FAILED: ${error.message}`);
  process.exit(1);
});
