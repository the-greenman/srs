/**
 * view-exports.mjs — the DocumentViews this repository actually publishes, read from
 * `srs/manifest.json`'s `renderedPresentations` (RFC-015 [N+31]).
 *
 * Before #411 this was a hardcoded literal — the third of three inconsistent sources of "what is
 * rendered" (package `documentViews[]` declarations, this file's old literal, and a stale
 * `manifest.renderedPresentations` that declared one view while five were exported). #411 collapsed
 * them to one: `manifest.renderedPresentations` is now the authoritative declaration, and this file
 * is a thin reader over it, kept so `publish-spec.mjs`, `check-release-drift.mjs`, and
 * `check-publication-reachability.mjs` don't each parse the manifest themselves and risk drifting
 * on the shape again.
 *
 * `output` is repository-root-relative (`docs/spec/...`, no leading `../`), derived from each
 * entry's `outputPath` (stored relative to `srs/manifest.json`'s own directory, e.g.
 * `../docs/spec/srs-spec.md`) — consumers already expect this shape and join it onto their own
 * notion of root, so the resolution happens once, here, rather than in every consumer.
 *
 * `requiresKeyInvariants` is NOT part of RenderedPresentation (RFC-015's schema is `viewId`,
 * `isDefault`, `format`, `outputPath` — nothing else) — it is a distinct, RFC-016-scoped assertion
 * about which renders must carry the Key Invariants projection, defined once in
 * `render-invariants.mjs` and merged in here so consumers keep seeing one shape.
 *
 * Always reads THIS checkout's own `srs/manifest.json` — not root-parameterized. That is unchanged
 * from before #411: the old hardcoded literal was equally independent of whatever `[root]` a caller
 * passed to `check-publication-reachability.mjs`. Verified by running that guard against a synthetic
 * fixture repo on both sides of #411 — a fixture-declared view is reported "declared but never
 * exported" identically before and after, because `EXPORTED_VIEW_IDS` has never varied with `root`.
 * Making it root-aware is a real improvement but a separate change: `publish-spec.mjs` and
 * `check-release-drift.mjs` have no `root` concept at all (they always target this repository), so
 * threading one through would mean two different call shapes for the same module, not a one-line fix.
 */
import { readFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { REQUIRES_KEY_INVARIANTS_VIEW_IDS } from "../render-invariants.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(ROOT, "srs");
const MANIFEST_PATH = join(REPO_ROOT, "manifest.json");

function loadRenderedPresentations() {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch (error) {
    throw new Error(`view-exports: cannot read ${MANIFEST_PATH}: ${error.message}`);
  }
  const presentations = manifest.renderedPresentations;
  if (!Array.isArray(presentations) || presentations.length === 0) {
    throw new Error(
      `view-exports: ${MANIFEST_PATH} declares no renderedPresentations — nothing to publish`,
    );
  }
  return presentations.map((entry, i) => {
    const where = `${MANIFEST_PATH} renderedPresentations[${i}]`;
    if (typeof entry.viewId !== "string" || !entry.viewId) {
      throw new Error(`view-exports: ${where} is missing a string viewId`);
    }
    if (typeof entry.outputPath !== "string" || !entry.outputPath) {
      throw new Error(`view-exports: ${where} (${entry.viewId}) is missing a string outputPath`);
    }
    // outputPath is stored relative to the manifest's own directory (srs/); consumers expect
    // repository-root-relative paths (docs/spec/...), so resolve through REPO_ROOT and re-express
    // relative to ROOT here, once, instead of in every consumer.
    const output = relative(ROOT, resolve(REPO_ROOT, entry.outputPath));
    return {
      id: entry.viewId,
      output,
      ...(REQUIRES_KEY_INVARIANTS_VIEW_IDS.has(entry.viewId) ? { requiresKeyInvariants: true } : {}),
    };
  });
}

export const VIEW_EXPORTS = loadRenderedPresentations();

/** The exported view ids, for consumers that only need to ask "is this view published?". */
export const EXPORTED_VIEW_IDS = new Set(VIEW_EXPORTS.map((e) => e.id));
