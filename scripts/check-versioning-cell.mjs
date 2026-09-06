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
 * Measured against the corpus's FULL history (this check is meaningless over a shallow clone — see
 * above): one genuine violation, `srs/package/metamodel/fields/value_range.json` (srs#534 added
 * "ref" to its allowedValues with no version bump; root cause is that the metamodel generator
 * hardcodes `version: 1` for every field it emits, so there is currently no way to bump just one).
 * Tracked, not fixed, in `scripts/versioning-cell-allowlist.json` (disposition "pending", srs#658).
 * Twelve more looked like violations before `hasCurrentShape` narrowed the check to the current
 * data model — those were migration commits changing where the domain lives, not what it is (see
 * `hasCurrentShape`'s own comment). The allowlist follows the disposition-field shape from
 * `carried-context-61cee7c6` (`"permanent" | "pending"`, each entry citing a live issue), same as
 * `scripts/spec-coherence-allowlist.json` and `scripts/publication-reachability-exclusions.json`:
 * shrinking it is the fix; growing it needs a live issue.
 *
 *   node scripts/check-versioning-cell.mjs [root]   # root defaults to the repo root
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture git
// repository. `fileURLToPath`, not `new URL(..).pathname`: the latter is percent-encoded.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWLIST = join(ROOT, "scripts/versioning-cell-allowlist.json");

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

// A revision is in scope for this check only once it carries the CURRENT (post-RFC-032) shape:
// `fieldType` as an object. Every revision before that point used one of at least three different
// historical key names for the same concept, discovered by walking this corpus's own full
// history: `selectOptions`, then a flat `allowedValues` alongside `valueType`, then today's nested
// `fieldType.allowedValues` (RFC-032, #257). Matching each of those in turn is open-ended
// archaeology with no natural stopping point, and none of it is what the versioning-cell rule is
// about — the corpus statements it guards (rfc-decision-2a1e1590; 04-2-4-2-field#r2) are about the
// CURRENT data model, not every renaming its storage has ever gone through. So a transition where
// either side lacks `fieldType` is skipped, never flagged: there is no reliable, non-judgment-call
// way to say two different historical shapes' domains are "the same" or "different" in general,
// and the migrations that moved between them are exactly the kind of shape-only change this check
// must not mistake for a semantic one.
function hasCurrentShape(doc) {
  return isObject(doc?.fieldType);
}

// The value domain, normalized to a comparable, order-independent form. Only `allowedValues` is in
// scope — the two corpus statements this check guards are both about that field specifically, not
// the wider fieldType shape (a `vocabularyRef`-domain Field's domain lives in package config, an
// orthogonal record this check does not reach). Callers only invoke this once hasCurrentShape has
// confirmed `fieldType` is present.
function valueDomainOf(doc) {
  const av = doc.fieldType.allowedValues;
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

// ---- allowlist reconciliation, same discipline as spec-coherence-allowlist.json and
// publication-reachability-exclusions.json --------------------------------------------------------

async function loadAllowlist() {
  if (!existsSync(ALLOWLIST)) return []; // the guard fixtures under tests/guards/run.mjs carry none
  const parsed = JSON.parse(await readFile(ALLOWLIST, "utf8"));
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

function allowlistEntryProblems(e, i) {
  const where = `${ALLOWLIST} entries[${i}]`;
  const problems = [];
  for (const key of ["path", "id", "fromCommit", "toCommit", "disposition", "issue"]) {
    if (typeof e?.[key] !== "string" || !e[key].trim()) problems.push(`${where} is missing "${key}"`);
  }
  if (e?.disposition !== "permanent" && e?.disposition !== "pending") {
    problems.push(`${where} disposition ${JSON.stringify(e?.disposition)} must be "permanent" or "pending"`);
  }
  if (typeof e?.issue !== "string" || !/^#[1-9]\d*$/.test(e.issue)) {
    problems.push(`${where} issue ${JSON.stringify(e?.issue)} is not a GitHub issue reference of the form #<number>`);
  }
  return problems;
}

// Matches on path + id + a commit-prefix pair, not just id: a Field that violates the rule TWICE
// across its history (once allowlisted, once new) must not have the new one silently absorbed by
// the old entry.
function matchesAllowlistEntry(violation, entry) {
  return (
    violation.path === entry.path &&
    violation.id === entry.id &&
    typeof entry.fromCommit === "string" &&
    typeof entry.toCommit === "string" &&
    violation.fromCommit.startsWith(entry.fromCommit) &&
    violation.toCommit.startsWith(entry.toCommit)
  );
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
      if (raw == null) {
        prev = null; // a gap breaks adjacency — the next hit is not "consecutive" with the last one
        continue;
      }
      let doc;
      try {
        doc = JSON.parse(raw);
      } catch (error) {
        unreadable.push({ path: relPath, commit, error: error.message });
        prev = null;
        continue;
      }
      if (!isFieldDefinition(doc) || !hasCurrentShape(doc)) {
        prev = null; // out of scope (not a Field, or a pre-RFC-032 shape) — see hasCurrentShape
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

  const allowlist = await loadAllowlist();
  const allowlistProblems = allowlist.flatMap((e, i) => allowlistEntryProblems(e, i));

  const matchedEntryIndices = new Set();
  const unallowlisted = [];
  for (const v of violations) {
    const idx = allowlist.findIndex((e) => matchesAllowlistEntry(v, e));
    if (idx === -1) unallowlisted.push(v);
    else matchedEntryIndices.add(idx);
  }
  const staleEntries = allowlist
    .map((e, i) => ({ entry: e, index: i }))
    .filter(({ index }) => !matchedEntryIndices.has(index));

  if (unallowlisted.length > 0) {
    console.log(
      `✗ versioning cell: ${unallowlisted.length} Field allowedValues change(s) with no version increase:`,
    );
    for (const v of unallowlisted) {
      console.log(
        `  - ${v.path} (${v.id}): ${v.fromCommit.slice(0, 8)} (v${v.fromVersion}) -> ` +
          `${v.toCommit.slice(0, 8)} (v${v.toVersion}) — allowedValues changed, no version increase`,
      );
    }
    console.log(`  Fix the field's version, or add an entry citing a live issue to ${ALLOWLIST}.`);
  }

  if (staleEntries.length > 0) {
    console.log(`✗ ${staleEntries.length} ${ALLOWLIST} entry/entries no longer match a violation:`);
    for (const { entry, index } of staleEntries) {
      console.log(`  - entries[${index}]: ${entry.path} (${entry.id ?? "?"}) — remove it (shrink discipline)`);
    }
  }

  if (allowlistProblems.length > 0) {
    console.log(`✗ ${allowlistProblems.length} problem(s) in ${ALLOWLIST}:`);
    for (const p of allowlistProblems) console.log(`  - ${p}`);
  }

  if (
    unreadable.length > 0 ||
    unallowlisted.length > 0 ||
    staleEntries.length > 0 ||
    allowlistProblems.length > 0
  ) {
    process.exit(1);
  }

  const allowlistNote = allowlist.length > 0 ? ` (${allowlist.length} known violation(s) allowlisted)` : "";
  console.log(
    `✓ versioning cell: ${checked} Field revision(s) across ${trackedFiles} tracked file(s) checked — every allowedValues change carries a version increase${allowlistNote}`,
  );
}

main();
