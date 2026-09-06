#!/usr/bin/env node
/**
 * check-rfc-integration.mjs — the RFC → canonical-spec drift gate (issue #204).
 *
 * The `srs` repo must hold the full, current, active specification as its canonical form:
 * the self-describing spec records under `srs/records/` plus the JSON schemas under
 * `docs/schema/2.0/`. An RFC's markdown under `rfcs/` is the proposal/design history; on
 * acceptance its normative changes MUST be folded into the canonical spec and declared, in a
 * machine-checkable way, on the RFC record.
 *
 * Declaration mechanism: a delimited token block appended to the RFC record's
 * `affected-components` field (5a000009), inside an HTML comment so it stays invisible in the
 * rendered RFC catalog:
 *
 *     <!-- srs-integration:v1
 *     ext:changelog
 *     schema:changelog.json
 *     type:com.semanticops.spec/changelog-entry
 *     I-90
 *     section:purpose-and-scope
 *     -->
 *
 * For every RFC record the gate checks:
 *   1. lifecycleState is a legal state key (ext:lifecycle, spec-rfc-process; srs#447)  (catches the `in-progress` corruption)
 *   2. proposal-artifact-path is present and exists on disk
 *   3. the .md `**Status**:` line agrees with the record's lifecycleState
 *   4. for status in {accepted, implemented} and not grandfathered: the integration manifest is
 *      non-empty and every declared token resolves to an existing canonical record/schema.
 *   5. (srs#462) for an RFC created on or after 2026-08-23: the manifest names at least one
 *      cell:<slug> token, from the Pattern Grid vocabulary (scripts/lib/pattern-grid-cells.json) —
 *      rfc-decision-cce3c00e's standing rule, "every new RFC and decision names its cell". The
 *      existing corpus is grandfathered by the date test itself, not by an allowlist entry.
 *   6. (srs#463) for an RFC created on or after 2026-08-23 (the same floor as #5 — one Charter
 *      Check rule, not two independent effective dates): the .md carries a `## Charter alignment`
 *      section, its `**Cell(s):**` line names the same cell:<slug> set as the manifest's cell:
 *      tokens, and it carries a `**Decision mode:**` line naming a legal decision_mode
 *      (rfc-decision-7caca3a1). Presence and cell-token consistency only — never prose quality,
 *      a guard cannot judge judgment. RFC-040 (created 2026-08-24) predated the Charter Check
 *      stage itself, which did not exist in written form until this rule landed on 2026-08-26; it
 *      was individually grandfathered until srs#498 backfilled its section, retiring the
 *      grandfather — no RFC is exempted from this check any more.
 *
 * Plus a repo guard: every discovered instance parses and is reachable under a reserved
 * instance root (RFC-038 [R1]/[R3] — the manifest no longer carries an instanceIndex).
 *
 * And (srs#519) a second cross-reference, independent of the manifest-token mechanism above:
 * any canonical record's prose may hold a heading annotated with an "(RFC-NNN)" banner (e.g.
 * "##### Conformance Rules (RFC-041)"). Every conformance-rule identifier *declared* under that
 * heading — a bold token at the start of a line, `**[R7]**` or an RFC-specific prefixed form
 * like `**[CR-036-1]**` — MUST also appear in that RFC's own `rfcs/rfc-NNN-*.md`. This is the
 * guard for the exact drift PR #517 produced: canonical records claimed RFC-041 defined [R7];
 * the RFC's own .md didn't, until Revision 3 amended it. Declaration (bold, line-initial) is
 * distinguished from mere citation (`... (RFC-038 [R2])` inline in prose) — only declarations are
 * checked, since a citation of another RFC's existing rule is not a claim about what the banner's
 * own RFC defines. See extractRfcBannerRuleTokens().
 *
 * Grandfathered RFCs (rfcs/integration-allowlist.json) skip only check #4; #1–#3 stay live. Every
 * allowlist entry MUST itself carry `issue`, `reason` and a `disposition` of `"permanent"` or
 * `"pending"` (srs#591, mirroring srs#590's identical fix to the sibling
 * publication-reachability-exclusions.json) — checked by checkAllowlistShape() independent of
 * which RFCs are actually grandfathered.
 *
 * Modeled on scripts/check-release-drift.mjs: collect failures, print each, exit 1 on any.
 */
import { readFile, readdir } from "fs/promises";
import { existsSync, statSync } from "fs";
import { join, resolve } from "path";
import { instancePaths } from "./lib/rfc-038-tree.mjs";
import { loadCellSlugs, CELL_RULE_EFFECTIVE_DATE } from "./lib/pattern-grid-cells.mjs";
import { loadDecisionModes } from "./lib/decision-modes.mjs";

// Root defaults to the repo root; an explicit argument (used by tests/guards/run.mjs's fixture
// cases) points the whole check at a temporary fixture tree instead — the same convention the
// sibling guards (check-decision-compass-drift.mjs, check-field-name-convention.mjs, ...) use.
const ROOT = process.argv[2] ? resolve(process.argv[2]) : resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = join(ROOT, "srs"); // the self-describing spec repo
const MANIFEST = join(REPO_ROOT, "manifest.json");
const SCHEMA_DIR = join(ROOT, "docs", "schema", "2.0");
const ALLOWLIST = join(ROOT, "rfcs", "integration-allowlist.json");

// --- entity + field ids (verified against records on disk) ---------------------------------
const RFC_TYPE_ID = "6a000001-0000-4000-a000-000000000001";
const F_RFC_NUMBER = "rfc_number"; // RFC-039: carrier keys by Field.name
const F_AFFECTED = "affected_components";
const F_ARTIFACT_PATH = "proposal_artifact_path";

const INVARIANT_TYPE = "2a000006-0000-4000-a000-000000000006";
const F_INV_NUMBER = "invariant_number";
const EXTENSION_TYPE = "2a000008-0000-4000-a000-000000000008";
const F_EXT_ID = "extension_id";
const TYPEDEF_TYPE = "2a000005-0000-4000-a000-000000000005";
const SECTION_TYPE = "2a000002-0000-4000-a000-000000000002";
const SUBSECTION_TYPE = "2a000003-0000-4000-a000-000000000003";
const F_TITLE = "title";

const LEGAL_STATUSES = new Set([
  "draft",
  "proposed",
  "accepted",
  "implemented",
  "rejected",
  "superseded",
  "withdrawn",
]);
const REQUIRES_INTEGRATION = new Set(["accepted", "implemented"]);

// srs#462: rfc-decision-cce3c00e's standing rule ("every new RFC and decision names its cell")
// binds RFCs whose acceptance postdates the rule. RFC stub records carry no dedicated
// acceptance-date field, so the record's own `createdAt` — stamped once, at creation, and never
// bumped by later edits to unrelated fields — stands in for it: an RFC proposed and folded in from
// this date forward is bound; the existing corpus (all created earlier) is grandfathered by the
// date test itself, with no separate allowlist entry needed. The floor date itself lives in
// pattern-grid-cells.mjs, shared with check-decision-cell-tags.mjs's ENFORCEMENT_FLOOR, so the two
// checks cannot drift to different effective dates for one rule.
const CELL_RULE_FLOOR = CELL_RULE_EFFECTIVE_DATE;

// srs#463: the Charter Check's `## Charter alignment` section requirement shares the cell rule's
// floor date — one rule, not a second independently-tunable date.
const CHARTER_ALIGNMENT_FLOOR = CELL_RULE_EFFECTIVE_DATE;
// The mode vocabulary is loaded, not restated — see scripts/lib/decision-modes.mjs.

// RFC-040's individual grandfather (createdAt 2026-08-24, postdating CHARTER_ALIGNMENT_FLOOR but
// predating the Charter Check stage's own existence, srs#463 landed 2026-08-26) retired here:
// srs#498 backfilled its `## Charter alignment` section to the machine-checkable format, so
// RFC-040 is now checked like any post-floor RFC — no allowlist entry needed.

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function fieldValue(record, name) {
  return record.fieldValues?.[name];
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

// #591: an allowlist entry's `issue` can go stale exactly like the sibling exclusions file's did
// (srs#590, check-publication-reachability.mjs) — an entry whose citation now reads closed does
// not by itself say whether that is a settled ruling (expected) or a dead pointer to follow-up
// work that never happened (a regression). `disposition` names which shape an entry is, mirroring
// #590's fix for the identical problem: `"permanent"` cites the (possibly closed) issue whose
// ruling settled the deferral for good; `"pending"` cites the still-live issue that owns the real
// fold. This guard cannot check GitHub issue state itself — `validate-all` is deliberately
// dependency-free and network-free (validate.yml) — so a `pending` issue going stale is still
// caught by re-audit, not by this script; what disposition fixes is that closure of a `permanent`
// entry's issue stops reading as a regression waiting to be "fixed" by reopening a settled ruling.
function checkAllowlistShape(allowlist) {
  for (const [num, entry] of Object.entries(allowlist)) {
    const where = `rfcs/integration-allowlist.json grandfathered["${num}"]`;
    const missing = ["issue", "reason", "disposition"].filter(
      (k) => typeof entry?.[k] !== "string" || !entry[k].trim(),
    );
    if (missing.length) {
      fail(`${where} is missing required properties: ${missing.join(", ")}`);
      continue;
    }
    if (entry.disposition !== "permanent" && entry.disposition !== "pending") {
      fail(`${where} disposition "${entry.disposition}" must be "permanent" or "pending"`);
    }
  }
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The invariant-number field is declared valueType:number but records store a mix of bare
// numbers (79) and prefixed strings ("I-79"). Normalize both sides to a bare integer string.
function normInvariantNumber(value) {
  const s = String(value).trim().replace(/^i-/i, "");
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
}

// srs#519: a heading line carrying an "(RFC-NNN)" (or "(RFC-NNN Revision M)") banner, at any
// heading depth. Capture group 2 is the bare RFC number, unpadded.
const RFC_BANNER_HEADING_RE = /^(#{1,6})\s+.*\(RFC-(\d+)[^)]*\)\s*$/;
// A conformance-rule token *declared* (not merely cited) at the start of a line: `**[R7]**`,
// `**[CR-036-1]**`, `**[FR-037-12]**`. Requires the bold-then-bracket idiom every declaration in
// the corpus uses; an inline citation like "(RFC-038 [R2])" never starts a line this way.
const RULE_DECLARATION_RE = /^\*\*\[((?:R\d+)|(?:[A-Z]{1,6}(?:-\d+){1,3}))\]\*\*/;

/**
 * Scan one record field's markdown text for "(RFC-NNN)" banner headings and, within each
 * heading's own section (up to the next heading of equal-or-shallower depth), the conformance-
 * rule tokens declared there. Returns a Map<rfcNumber, Set<token>>; empty when the text has no
 * banner heading. Exported for reuse/testing.
 */
export function extractRfcBannerRuleTokens(text) {
  const out = new Map();
  if (typeof text !== "string" || !text.includes("(RFC-")) return out;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const heading = RFC_BANNER_HEADING_RE.exec(lines[i]);
    if (!heading) continue;
    const level = heading[1].length;
    const rfcNumber = String(parseInt(heading[2], 10));
    const tokens = out.get(rfcNumber) ?? new Set();
    for (let j = i + 1; j < lines.length; j++) {
      const nextHeading = /^(#{1,6})\s+/.exec(lines[j]);
      if (nextHeading && nextHeading[1].length <= level) break;
      const decl = RULE_DECLARATION_RE.exec(lines[j]);
      if (decl) tokens.add(decl[1]);
    }
    if (tokens.size > 0) out.set(rfcNumber, tokens);
  }
  return out;
}

let rfcMdFilesCache = null;
async function findRfcMdFile(rfcNumber) {
  if (!rfcMdFilesCache) {
    rfcMdFilesCache = (await readdir(join(ROOT, "rfcs"))).filter((f) => f.endsWith(".md"));
  }
  const re = new RegExp(`^rfc-0*${rfcNumber}(?:-.*)?\\.md$`);
  return rfcMdFilesCache.find((f) => re.test(f)) ?? null;
}

/**
 * Extract the srs-integration token list from an affected-components field value.
 * Tokens live inside `<!-- srs-integration:v1 ... -->`, one per line; `;`-separated on a line
 * is also accepted. Blank lines and `#` comment lines are ignored. Exported for reuse.
 */
export function parseIntegrationManifest(affectedComponents) {
  if (!affectedComponents) return [];
  const match = /<!--\s*srs-integration:v1\s*([\s\S]*?)-->/i.exec(affectedComponents);
  if (!match) return [];
  return match[1]
    .split(/[\n;]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

async function buildResolvers() {
  // RFC-038 [R1]: the tree is membership authority; there is no instanceIndex to read.
  const entries = await instancePaths(REPO_ROOT);

  const invariantNumbers = new Set();
  const extensionIds = new Set();
  const typeKeys = new Set(); // `${namespace}/${name}`
  const sectionSlugs = new Set();
  const subsectionSlugs = new Set();
  const indexedPaths = new Set();
  const rfcRecords = []; // { path, record } for every RFC-typed record, wherever it lives
  const allRecords = []; // { path, record } for every instance, any type (srs#519 banner scan)

  for (const relPath of entries) {
    indexedPaths.add(relPath);
    let record;
    try {
      record = await loadJson(join(REPO_ROOT, relPath));
    } catch {
      continue; // structural load failures are validate-records.mjs's job
    }
    allRecords.push({ path: relPath, record });
    if (record.typeId === RFC_TYPE_ID) rfcRecords.push({ path: relPath, record });
    switch (record.typeId) {
      case INVARIANT_TYPE: {
        const n = fieldValue(record, F_INV_NUMBER);
        if (n !== undefined && n !== null && n !== "") invariantNumbers.add(normInvariantNumber(n));
        break;
      }
      case EXTENSION_TYPE: {
        const id = fieldValue(record, F_EXT_ID);
        if (id) extensionIds.add(String(id).trim());
        break;
      }
      case TYPEDEF_TYPE: {
        const name = fieldValue(record, F_TITLE);
        if (name && record.typeNamespace) typeKeys.add(`${record.typeNamespace}/${name}`);
        break;
      }
      case SECTION_TYPE: {
        const t = fieldValue(record, F_TITLE);
        if (t) sectionSlugs.add(slugify(t));
        break;
      }
      case SUBSECTION_TYPE: {
        const t = fieldValue(record, F_TITLE);
        if (t) subsectionSlugs.add(slugify(t));
        // A retired extension shadow's `ext:<name>` token now resolves only through its
        // published subsection twin (#406/#285) — the twin carries the same `ext:<name>`
        // title, so an `ext:` token is canonical here too, not just via records/extensions/.
        if (t && /^ext:/i.test(t)) extensionIds.add(t.trim());
        break;
      }
      default:
        break;
    }
  }

  // Also index installed package Types (a type: token may point at a package Type, not a
  // type-definition record). Scan every package.json under package/ (any depth) and index the
  // types each declares — this covers spec-authoring-core, spec-rfc-process, core, etc.
  for (const pkgManifestPath of await findPackageManifests(join(REPO_ROOT, "package"))) {
    let pkg;
    try {
      pkg = await loadJson(pkgManifestPath);
    } catch {
      continue;
    }
    const pkgDir = pkgManifestPath.slice(0, -"/package.json".length);
    for (const rel of pkg.types ?? []) {
      try {
        const type = await loadJson(join(pkgDir, rel));
        if (type.namespace && type.name) typeKeys.add(`${type.namespace}/${type.name}`);
      } catch {
        /* ignore */
      }
    }
  }

  const schemaFiles = new Set(
    (await readdir(SCHEMA_DIR)).filter((f) => f.endsWith(".json"))
  );

  const cellSlugs = await loadCellSlugs();
  const decisionModes = await loadDecisionModes();

  return { invariantNumbers, extensionIds, typeKeys, sectionSlugs, subsectionSlugs, schemaFiles, indexedPaths, rfcRecords, allRecords, cellSlugs, decisionModes };
}

// Recursively find every package.json under a directory.
async function findPackageManifests(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findPackageManifests(abs)));
    else if (entry.name === "package.json") out.push(abs);
  }
  return out;
}

// Resolve a single manifest token to true (exists) / false (missing). Unknown token kinds fail.
function resolveToken(token, r) {
  let m;
  // Explicit declaration that the RFC folds NO record/schema artifact into the canonical spec —
  // its normative effect is tooling/rendering/CLI/process or a downstream package only. Auditable:
  // a reviewer verifies the RFC touches no srs/records or docs/schema entity.
  if (/^(tooling-only|process-only|package-only)$/i.test(token)) return true;
  if ((m = /^I-?(\d+)$/i.exec(token))) return r.invariantNumbers.has(String(parseInt(m[1], 10)));
  if ((m = /^ext:(.+)$/i.exec(token))) return r.extensionIds.has(`ext:${m[1].trim()}`);
  if ((m = /^schema:(.+)$/i.exec(token))) return r.schemaFiles.has(m[1].trim());
  if ((m = /^type:(.+)$/i.exec(token))) return r.typeKeys.has(m[1].trim());
  if ((m = /^section:(.+)$/i.exec(token))) return r.sectionSlugs.has(slugify(m[1].trim()));
  if ((m = /^subsection:(.+)$/i.exec(token))) return r.subsectionSlugs.has(slugify(m[1].trim()));
  if ((m = /^cell:(.+)$/i.exec(token))) return r.cellSlugs.has(m[1].trim().toLowerCase());
  return null; // unrecognized token kind
}

// Normalize a markdown `**Status**:` line (e.g. "Accepted (Revision 5)") to an enum-style token.
function parseMdStatus(mdText) {
  const match = /^\s*(?:>?\s*)?\*\*Status\*\*:\s*([A-Za-z][A-Za-z -]*)/m.exec(mdText);
  if (!match) return null;
  return match[1].trim().toLowerCase().replace(/\s+/g, "-").replace(/-\(.*$/, "");
}

// srs#463: extract the body of a level-2 markdown section by heading text (e.g. "Charter
// alignment"), stopping at the next level-2 heading or end of file. Returns null if the heading
// itself is absent — distinct from an empty-but-present section. A line-based scan, not a single
// regex: a naive "next ## " lookahead is fragile against "### " subheadings inside the section,
// which must stay part of the body, not end it.
function extractSection(mdText, heading) {
  const lines = mdText.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (idx === -1) return null;
  const body = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    body.push(lines[i]);
  }
  return body.join("\n");
}

// A `**Label:** value` line within a section body, e.g. `**Decision mode:** complicated`.
function parseLabelLine(sectionBody, label) {
  const re = new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, "im");
  const match = re.exec(sectionBody);
  return match ? match[1].trim() : null;
}

// The set of `cell:<slug>` tokens named on a `**Cell(s):**` line, or null if the line is absent.
function parseCellsLine(sectionBody) {
  const line = parseLabelLine(sectionBody, "Cell\\(s\\)");
  if (line === null) return null;
  return new Set([...line.matchAll(/cell:([a-z-]+)/gi)].map((m) => m[1].toLowerCase()));
}

function sameSet(a, b) {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

async function checkManifestSync(indexedPaths) {
  // Guard: every .json under records/ must be indexed, and every indexed record path must exist.
  // Discovery is now the authority, so "indexed but missing" cannot arise. What can is a
  // discovered file that fails to parse — [R5] makes that fatal under a reserved location.
  for (const p of indexedPaths) {
    if (!existsSync(join(REPO_ROOT, p))) fail(`discovered instance vanished mid-run: ${p}`);
  }
}

async function main() {
  const resolvers = await buildResolvers();

  let allowlist = {};
  if (existsSync(ALLOWLIST)) {
    allowlist = (await loadJson(ALLOWLIST)).grandfathered ?? {};
  }
  checkAllowlistShape(allowlist);

  await checkManifestSync(resolvers.indexedPaths);

  // Every RFC-typed record in the repository (records/rfcs/, records/tier-2/, …), discovered via
  // the tree walk (RFC-038 [R3], Revision 12: `records/` at the repository root only — a package
  // root does not anchor an instance root) — not just files under records/rfcs/.
  const rfcRecords = resolvers.rfcRecords;
  let rfcCount = 0;

  for (const { path: recPath, record } of rfcRecords) {
    rfcCount++;

    const num = fieldValue(record, F_RFC_NUMBER);
    const status = record.lifecycleState; // srs#447: rfc_status retired — the spec-rfc-process Lifecycle owns this now
    const artifactPath = fieldValue(record, F_ARTIFACT_PATH);
    const label = `RFC-${num ?? `?(${recPath})`}`;

    // 1. status legality
    if (!LEGAL_STATUSES.has(status)) {
      fail(`${label}: illegal lifecycleState "${status}" (legal: ${[...LEGAL_STATUSES].join(", ")})`);
    }
    if (!num) fail(`${label}: missing rfc-number (${recPath})`);

    // 2. proposal-artifact-path present + exists
    let mdText = null;
    if (!artifactPath) {
      fail(`${label}: missing proposal-artifact-path — every RFC record must point at its rfcs/*.md proposal`);
    } else {
      const abs = join(ROOT, artifactPath);
      if (!existsSync(abs)) {
        fail(`${label}: proposal-artifact-path does not exist: ${artifactPath}`);
      } else if (artifactPath.endsWith(".md") && statSync(abs).isFile()) {
        mdText = await readFile(abs, "utf8");
        // 3. .md status consistency
        const mdStatus = parseMdStatus(mdText);
        if (mdStatus && LEGAL_STATUSES.has(mdStatus) && mdStatus !== status) {
          fail(`${label}: .md status "${mdStatus}" != record lifecycleState "${status}" (${artifactPath})`);
        }
        if (mdStatus && !LEGAL_STATUSES.has(mdStatus)) {
          fail(`${label}: .md **Status**: "${mdStatus}" is not a legal status (${artifactPath})`);
        }
      }
    }

    // 4. integration completeness (accepted/implemented, not grandfathered)
    const tokens = parseIntegrationManifest(fieldValue(record, F_AFFECTED));
    if (REQUIRES_INTEGRATION.has(status) && !(num in allowlist)) {
      if (tokens.length === 0) {
        fail(
          `${label}: status "${status}" but no integration manifest. Fold the RFC's normative ` +
            `changes into srs/srs records + docs/schema, then declare them in the ` +
            `affected-components field as a <!-- srs-integration:v1 ... --> block; or grandfather ` +
            `RFC-${num} in rfcs/integration-allowlist.json with a follow-up issue.`
        );
      }
      for (const token of tokens) {
        const resolved = resolveToken(token, resolvers);
        if (resolved === null) {
          fail(`${label}: unrecognized manifest token "${token}" (expected I-<n> | ext:<name> | schema:<file>.json | type:<ns>/<name> | section:<slug> | subsection:<slug> | cell:<slug>)`);
        } else if (resolved === false) {
          fail(`${label}: manifest token "${token}" does not resolve to any canonical record/schema — the change is not folded into the spec`);
        }
      }
    }

    // 5. (srs#462) an RFC created after the cell-naming rule took effect must name its cell.
    // Deliberately OUTSIDE the allowlist gate above: allowlisting an RFC skips only the
    // integration-completeness check (the allowlist file's own documented contract), never this
    // one — the existing corpus is grandfathered by the createdAt test itself, not by an allowlist
    // entry. Also independent of REQUIRES_INTEGRATION's allowlist check, though still scoped to
    // accepted/implemented status, since only an RFC that has actually been accepted has "named
    // its cell" to check. Gated on createdAt, not lifecycleState, so a pre-existing RFC that is merely
    // re-edited today does not retroactively acquire the requirement — createdAt is stamped once
    // and does not move when unrelated fields change.
    const manifestCellTokens = new Set(
      tokens.filter((t) => /^cell:/i.test(t)).map((t) => t.slice("cell:".length).trim().toLowerCase()),
    );
    if (REQUIRES_INTEGRATION.has(status) && record.createdAt && record.createdAt >= CELL_RULE_FLOOR) {
      if (manifestCellTokens.size === 0) {
        fail(
          `${label}: created ${record.createdAt}, on or after ${CELL_RULE_FLOOR} — the integration ` +
            `manifest names no cell:<slug> token. rfc-decision-cce3c00e's standing rule requires ` +
            `every new RFC to name its cell.`,
        );
      }
    }

    // 6. (srs#463) the Charter Check's `## Charter alignment` section — presence and cell-token
    // consistency with the integration manifest, plus presence of a legal decision_mode token.
    // Same floor shape as #5: gated on createdAt (never retroactive on unrelated edits),
    // independent of the check-#4 completeness allowlist. RFC-040's individual grandfather
    // retired (srs#498, its section backfilled) — no allowlist carve-out remains.
    if (
      REQUIRES_INTEGRATION.has(status) &&
      record.createdAt &&
      record.createdAt >= CHARTER_ALIGNMENT_FLOOR
    ) {
      if (mdText === null) {
        fail(
          `${label}: created ${record.createdAt}, on or after ${CHARTER_ALIGNMENT_FLOOR} — no ` +
            `readable .md proposal to check for a Charter alignment section (see check #2/#3 above).`,
        );
      } else {
        const section = extractSection(mdText, "Charter alignment");
        if (section === null) {
          fail(
            `${label}: created ${record.createdAt}, on or after ${CHARTER_ALIGNMENT_FLOOR} — the ` +
              `.md carries no "## Charter alignment" section. The Charter Check (.claude/commands/` +
              `rfc.md Stage 1.5) is mandatory before drafting; its output is this section.`,
          );
        } else {
          const mdCellTokens = parseCellsLine(section);
          if (mdCellTokens === null || mdCellTokens.size === 0) {
            fail(`${label}: Charter alignment section has no "**Cell(s):**" line naming a cell:<slug> token.`);
          } else if (!sameSet(mdCellTokens, manifestCellTokens)) {
            fail(
              `${label}: Charter alignment section's Cell(s) (${[...mdCellTokens].join(", ")}) does ` +
                `not match the integration manifest's cell:<slug> tokens (${[...manifestCellTokens].join(", ") || "none"}).`,
            );
          }

          const mode = parseLabelLine(section, "Decision mode");
          if (mode === null) {
            fail(`${label}: Charter alignment section has no "**Decision mode:**" line.`);
          } else if (!resolvers.decisionModes.has(mode.toLowerCase())) {
            fail(
              `${label}: Charter alignment section names decision mode "${mode}", not one of ` +
                `${[...resolvers.decisionModes].join(", ")} (rfc-decision-7caca3a1).`,
            );
          }
        }
      }
    }
  }

  // 7. (srs#519) conformance-rule identifiers declared under an "(RFC-NNN)" banner in ANY
  // canonical record's prose (not just RFC stub records themselves) must exist in that RFC's own
  // rfcs/rfc-NNN-*.md. Independent of the manifest-token / status checks above — this catches the
  // record and the RFC document disagreeing about what the RFC defines, which #4's manifest-token
  // resolution never reads the RFC .md at all to notice.
  for (const { path: recPath, record } of resolvers.allRecords) {
    for (const value of Object.values(record.fieldValues ?? {})) {
      if (typeof value !== "string") continue;
      const byRfc = extractRfcBannerRuleTokens(value);
      for (const [rfcNumber, tokens] of byRfc) {
        const mdFile = await findRfcMdFile(rfcNumber);
        if (!mdFile) {
          for (const token of tokens) {
            fail(
              `${recPath}: declares conformance rule [${token}] under an "(RFC-${rfcNumber})" ` +
                `banner, but no rfcs/rfc-${rfcNumber}-*.md exists`,
            );
          }
          continue;
        }
        const mdText = await readFile(join(ROOT, "rfcs", mdFile), "utf8");
        for (const token of tokens) {
          if (!mdText.includes(`[${token}]`)) {
            fail(
              `${recPath}: declares conformance rule [${token}] under an "(RFC-${rfcNumber})" ` +
                `banner, but rfcs/${mdFile} does not contain [${token}] — the record and the RFC ` +
                `document disagree about what RFC-${rfcNumber} defines`,
            );
          }
        }
      }
    }
  }

  if (failures.length > 0) {
    console.log(`Checking RFC integration... FAILED`);
    for (const f of failures) console.log(`  ✗ ${f}`);
    console.log(`\nFAILED: ${failures.length} RFC integration problem(s) across ${rfcCount} RFC record(s).`);
    process.exit(1);
  }
  console.log(`Checking RFC integration... OK (${rfcCount} RFC records; accepted/implemented RFCs are folded into the canonical spec)`);
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
