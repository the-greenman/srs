#!/usr/bin/env node
/**
 * check-versioning-cell.mjs — a Field's value domain never changes without a version increase (srs#649).
 *
 * The grid census cycle-three read-out (`scripts/grid-census/readout-2026-09-06.md`, PR #645)
 * found the **versioning** cell carrying zero enforcement checks against two corpus statements:
 * `rfc-decision-2a1e1590` and `04-2-4-2-field#r2`. Their shared, narrow tradeoff: Field semantics
 * are immutable (CLAUDE.md), so widening or narrowing the value domain a Field's values are drawn
 * from (`fieldType.allowedValues`) is a semantic change and must be accompanied by a `version`
 * increase — silently editing the domain in place is exactly the "immutable, but not enforced"
 * gap the cell measured as thin *and* unguarded.
 *
 * The check is a structural diff over git history, not a live-tree scan: a single committed state
 * cannot show a *change*, only whatever the domain currently is. For every Field definition file
 * (a Field is any top-level JSON document carrying an `id` plus a `fieldType` or `valueType`;
 * `rfcs/rfc-004/`'s historical proposal package is excluded, matching check-field-name-convention.mjs),
 * this walks that file's own commit history in order and, for every consecutive pair of revisions
 * that still carry the same `id`, compares `fieldType.allowedValues` (order-independent — the
 * *domain* is a set, and the corpus statements are about the set, not its listed order) between the
 * two. If the domain differs, `version` must have increased; if it has not, that pair is a
 * violation. No semantic judgment beyond that: a domain that grows, shrinks, or is added/dropped
 * entirely all count as "differs".
 *
 * This needs real history to mean anything — a checkout that only has the tip commit (the default
 * `actions/checkout` shallow clone) can never see two revisions of the same file, so the check would
 * be silently unable to catch anything in CI. `.github/workflows/validate.yml`'s checkout step was
 * given `fetch-depth: 0` alongside adding this check to `scripts/checks.json`, for exactly that
 * reason — see that workflow's own comment.
 *
 * Measured against the corpus at HEAD (2026-09-06): 545 Field definition files, 0 violations. No
 * allowlist carried; if the corpus ever needs one, follow the disposition-field shape from
 * `carried-context-61cee7c6` (`"permanent" | "pending"`, each entry citing a live issue) rather than
 * a bare issue-citation list.
 *
 *   node scripts/check-versioning-cell.mjs [root]   # root defaults to the repo root
 */
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture git
// repository. `fileURLToPath`, not `new URL(..).pathname`: the latter is percent-encoded.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

// RFC-004's proposed package is a historical artifact, not a live package — same exclusion as
// check-field-name-convention.mjs (#308).
const EXCLUDED = ["rfcs/rfc-004"];

function isExcluded(relPath) {
  return EXCLUDED.some((e) => relPath === e || relPath.startsWith(`${e}/`));
}

// Whole-repo walk, not a fixed list of package roots — the same reasoning as check-field-name-
// convention.mjs: a list silently excludes whatever tree is added next. Scoped to plain `.json`
// carriers only (not `.srsj`/`.srspkg` bundles): a bundle's embedded Field fragments do not have
// their own path in git history to diff — that is a materially bigger unit than "the smallest
// honest check" this issue asked for.
async function findFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const abs = join(dir, e.name);
    const rel = relative(ROOT, abs);
    if (isExcluded(rel)) continue;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      out.push(...(await findFiles(abs)));
      continue;
    }
    if (e.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

const isObject = (o) => o != null && typeof o === "object" && !Array.isArray(o);

// Same test as check-field-name-convention.mjs's isFieldDefinition: an `id` plus a `fieldType`
// (post-RFC-032) or `valueType` (pre-) carrier. Restricted to the document root here — a Field
// *definition file*, not any candidate object nested inside one.
function isFieldDefinition(doc) {
  return isObject(doc) && typeof doc.id === "string" && (typeof doc.valueType === "string" || isObject(doc.fieldType));
}

// The value domain, normalized to a comparable, order-independent form. Only `allowedValues` is in
// scope — the two corpus statements this check guards are both about that field specifically, not
// the wider fieldType shape (a `vocabularyRef`-domain Field's domain lives in package config, an
// orthogonal record this check does not reach).
function valueDomainOf(doc) {
  const av = doc?.fieldType?.allowedValues;
  if (!Array.isArray(av)) return null;
  return JSON.stringify([...av].sort());
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

// [{ commit, path }] oldest to newest. `--follow` tracks the file across renames, matching the
// corpus rule's own framing ("the same `id`", not "the same path") — the `id` equality check below
// is what actually guards against a path being reused for an unrelated Field after a rename.
function historyOf(relPath) {
  let raw;
  try {
    raw = git(["log", "--follow", "--name-only", "--format=COMMIT:%H", "--", relPath]);
  } catch {
    return [];
  }
  const entries = [];
  let commit = null;
  for (const line of raw.split("\n")) {
    if (line.startsWith("COMMIT:")) {
      commit = line.slice("COMMIT:".length);
    } else if (line.trim() !== "" && commit != null) {
      entries.push({ commit, path: line.trim() });
      commit = null;
    }
  }
  return entries.reverse();
}

function readAt(commit, path) {
  try {
    return git(["show", `${commit}:${path}`]);
  } catch {
    return null; // not present at this revision (deleted, or path did not exist yet)
  }
}

async function main() {
  const files = (await findFiles(ROOT)).sort();

  const violations = [];
  const unreadable = [];
  let checked = 0;
  let trackedFiles = 0;

  for (const abs of files) {
    const relPath = relative(ROOT, abs);
    const history = historyOf(relPath);
    if (history.length === 0) continue; // untracked, or this file is not a Field at all
    trackedFiles += 1;

    let prev = null; // { doc, domain, version, commit }
    for (const { commit, path } of history) {
      const raw = readAt(commit, path);
      if (raw == null) continue;
      let doc;
      try {
        doc = JSON.parse(raw);
      } catch (error) {
        unreadable.push({ path: relPath, commit, error: error.message });
        prev = null;
        continue;
      }
      if (!isFieldDefinition(doc)) {
        prev = null;
        continue;
      }
      checked += 1;
      const domain = valueDomainOf(doc);
      const version = typeof doc.version === "number" ? doc.version : null;
      if (prev != null && prev.doc.id === doc.id && domain !== prev.domain) {
        if (version == null || prev.version == null || !(version > prev.version)) {
          violations.push({
            path: relPath,
            id: doc.id,
            fromCommit: prev.commit,
            fromVersion: prev.version,
            toCommit: commit,
            toVersion: version,
          });
        }
      }
      prev = { doc, domain, version, commit };
    }
  }

  if (unreadable.length > 0) {
    console.log(`✗ ${unreadable.length} historical revision(s) could not be parsed as JSON:`);
    for (const u of unreadable) {
      console.log(`  - ${u.path} @ ${u.commit.slice(0, 8)}: ${u.error}`);
    }
  }

  if (violations.length > 0) {
    console.log(
      `✗ versioning cell: ${violations.length} Field allowedValues change(s) with no version increase:`,
    );
    for (const v of violations) {
      console.log(
        `  - ${v.path} (${v.id}): ${v.fromCommit.slice(0, 8)} (v${v.fromVersion}) -> ` +
          `${v.toCommit.slice(0, 8)} (v${v.toVersion}) — allowedValues changed, no version increase`,
      );
    }
  }

  if (violations.length > 0 || unreadable.length > 0) {
    process.exit(1);
  }

  console.log(
    `✓ versioning cell: ${checked} Field revision(s) across ${trackedFiles} tracked file(s) checked — every allowedValues change carries a version increase`,
  );
}

main();
