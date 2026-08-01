// Resolution of the pinned `srs` CLI, shared by the scripts that render or
// verify `docs/spec/**`.
//
// The committed exports correspond to exactly one `srs-rust` build. That build
// is declared once, as SRS_RUST_CLI_TAG in `.github/workflows/release-drift.yml`,
// and is read from there — never restated here. A second copy of the tag is a
// second thing to forget to update, which is the defect class this module
// exists to close (issue #337).

import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

export const ROOT = resolve(new URL("../..", import.meta.url).pathname);
export const WORKFLOW_PATH = join(ROOT, ".github", "workflows", "release-drift.yml");

// Matches the `SRS_RUST_CLI_TAG: <tag>` mapping entry. Comment lines start with
// `#`, so the prose in the workflow header that mentions the variable by name
// cannot match.
const TAG_LINE = /^\s*SRS_RUST_CLI_TAG:\s*["']?([^"'#\s]+)/;

/**
 * Read the pinned `srs-rust` release tag out of the release-drift workflow.
 * Throws if it is missing, or declared more than once.
 */
export async function readPinnedTag(workflowPath = WORKFLOW_PATH) {
  let text;
  try {
    text = await readFile(workflowPath, "utf8");
  } catch (error) {
    throw new Error(`cannot read the pinned tag: ${workflowPath}: ${error.message}`);
  }

  const found = [];
  for (const line of text.split("\n")) {
    const match = TAG_LINE.exec(line);
    if (match) found.push(match[1]);
  }

  if (found.length === 0) {
    throw new Error(`no SRS_RUST_CLI_TAG declaration found in ${workflowPath}`);
  }
  if (found.length > 1) {
    throw new Error(
      `SRS_RUST_CLI_TAG is declared ${found.length} times in ${workflowPath} (${found.join(", ")}). ` +
        `It must be declared exactly once — a second copy of the pin is a new drift source.`,
    );
  }
  return found[0];
}

export async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

/**
 * Resolve the `srs` binary to render with, failing fast when SRS_CLI_PATH is
 * unset. There is deliberately no fallback: a default would silently pick some
 * other build, and the resulting drift failure names the records as the
 * culprit rather than the binary.
 */
export async function resolveSrsCli() {
  const raw = process.env.SRS_CLI_PATH;
  if (raw && raw.trim() !== "") return resolve(raw.trim());

  let pinned = "the tag declared there";
  try {
    pinned = await readPinnedTag();
  } catch {
    // Reporting the unset variable matters more than the tag lookup failing.
  }

  throw new Error(
    [
      "SRS_CLI_PATH is not set, and there is no default.",
      "",
      "`docs/spec/**` is rendered by exactly one `srs-rust` build — the one named by",
      `SRS_RUST_CLI_TAG in .github/workflows/release-drift.yml (currently ${pinned}).`,
      "Any other build renders the same records differently, and the resulting",
      "`check-release-drift` failure reads as though the records are stale.",
      "",
      "Fetch that exact build and point SRS_CLI_PATH at it:",
      "",
      "  export $(node scripts/fetch-pinned-srs.mjs)",
      "",
      "Do not use `which srs`: the binary on PATH is whichever was installed last, and",
      '`srs --version` prints "srs 0.1.0" for every build, so it cannot tell you which.',
    ].join("\n"),
  );
}

/**
 * Print which binary is about to be used. Mirrors the provenance echo in
 * release-drift.yml so a local failure is attributable from the console
 * without re-running anything.
 */
export async function logSrsCliProvenance(cliPath) {
  const digest = await sha256File(cliPath).catch(() => null);
  let pinned = null;
  try {
    pinned = await readPinnedTag();
  } catch {
    // Provenance logging must never be the thing that fails a render.
  }

  console.log(`srs binary:        ${cliPath}`);
  console.log(`srs sha256:        ${digest ?? "(unreadable)"}`);
  console.log(`srs-rust release:  ${pinned ?? "(unknown)"} (pinned by SRS_RUST_CLI_TAG)`);
  console.log(
    "  `srs --version` cannot identify a build — compare the sha256 above if a render looks wrong.",
  );
}
