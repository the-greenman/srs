#!/usr/bin/env node
/**
 * check-programme-conformance.mjs — the spec-rework programme repository stays conforming (srs#580).
 *
 * `programme/` is its own SRS repository, the same way `docs/spec/examples/gallery-project-v2/` and
 * `conformance/discovery/fixture-repo/` are. It holds the programme that reworks the specification:
 * its phases, units, findings and carried context, plus the Protocol the master thread walks. It is
 * also the pilot for the concept-tree pattern before that pattern touches the 433-record spec corpus.
 *
 * Two independent assertions, both required:
 *   1. The `.srs/` marker resolves as a directory beside `manifest.json` and holds at least one
 *      regular file. A marker directory with no regular file inside it round-trips as absent — git
 *      does not track empty directories — so the repository would silently stop being one on its
 *      first commit. `srs repo create` still produces exactly that defect (srs-rust#959), which is
 *      why this assertion is not redundant with `repo validate`.
 *   2. `srs repo validate --repo programme` reports zero errors, via the PINNED binary. Diagnostics
 *      live in the payload, not the exit code, so this asserts on `payload.summary.errors` and never
 *      on process exit status alone.
 *
 * Requires the pinned `srs` CLI, so it is deliberately NOT part of validate-all.mjs, which stays
 * Node-pipeline-only (ADR-004). Wired into .github/workflows/release-drift.yml, which already
 * fetches and checksum-verifies that binary. Same shape and reasoning as
 * check-gallery-conformance.mjs — consume the pattern, do not clone the file.
 *
 *   export $(node scripts/fetch-pinned-srs.mjs)
 *   node scripts/check-programme-conformance.mjs [root]   # root defaults to the repo root
 */
import { readdir, stat } from "fs/promises";
import { join, resolve } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { logSrsCliProvenance, resolveSrsCli } from "./lib/pinned-srs.mjs";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree,
// same shape as check-repository-cell.mjs and check-versioning-cell.mjs.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_REL = "programme";
const REPO_ABS = join(ROOT, REPO_REL);

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

async function assertMarker() {
  const marker = join(REPO_ABS, ".srs");
  let st;
  try {
    st = await stat(marker);
  } catch {
    fail(`${REPO_REL}/.srs does not exist. The marker directory is what makes ${REPO_REL}/ an SRS repository; manifest.json alone does not.`);
  }
  if (!st.isDirectory()) fail(`${REPO_REL}/.srs is not a directory. The marker is a directory, never a file (the legacy 1-byte-file form was migrated in srs#313).`);

  const entries = await readdir(marker, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile());
  if (files.length === 0) {
    fail(
      `${REPO_REL}/.srs holds no regular file. An empty marker directory round-trips as absent — git does not track empty directories, and archive pack/unpack drops them — so the repository would silently stop being one. Add a placeholder; its filename is not authoritative and nothing reads it.`,
    );
  }
  console.log(`✓ ${REPO_REL}/.srs resolves as a directory holding ${files.length} regular file(s).`);
}

function runValidate(cli) {
  return new Promise((resolvePromise) => {
    const child = spawn(cli, ["repo", "validate", "--repo", REPO_ABS, "--format", "json"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", () => resolvePromise(out));
  });
}

async function assertValidates(cli) {
  const raw = await runValidate(cli);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    fail(`srs repo validate --repo ${REPO_REL} did not return parseable JSON. Raw output:\n${raw.slice(0, 800)}`);
  }
  // A load failure returns ok:false with top-level diagnostics and no payload.summary at all.
  // Report those rather than the missing-summary shape, or the gate names the wrong culprit.
  if (payload?.ok === false) {
    const top = (payload.diagnostics || []).slice(0, 10);
    fail(
      `srs repo validate --repo ${REPO_REL} could not load the repository.\n` +
        (top.length
          ? top.map((d) => `    - ${d.message || JSON.stringify(d)}`).join("\n")
          : "    (no diagnostics returned)"),
    );
  }
  const summary = payload?.payload?.summary;
  if (!summary) fail(`srs repo validate --repo ${REPO_REL} returned no payload.summary. Exit status alone is not the contract — diagnostics live in the payload.`);
  const errors = summary.errors ?? 0;
  if (errors !== 0) {
    const diags = (payload.payload.diagnostics || []).slice(0, 10);
    fail(
      `srs repo validate --repo ${REPO_REL} reports ${errors} error(s).\n` +
        diags.map((d) => `    - ${d.message || JSON.stringify(d)}`).join("\n"),
    );
  }
  console.log(`✓ ${REPO_REL} validates: ${summary.checked} checked, 0 errors, ${summary.warnings ?? 0} warning(s).`);
}

async function main() {
  const cli = await resolveSrsCli();
  await logSrsCliProvenance(cli);
  await assertMarker();
  await assertValidates(cli);
  console.log(`\n✓ ${REPO_REL} is a conforming SRS repository.`);
}

main();
