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
 *   1. rfc-status is a legal enum value                    (catches the `in-progress` corruption)
 *   2. proposal-artifact-path is present and exists on disk
 *   3. the .md `**Status**:` line agrees with the record rfc-status
 *   4. for status in {accepted, implemented} and not grandfathered: the integration manifest is
 *      non-empty and every declared token resolves to an existing canonical record/schema.
 *
 * Plus a repo guard: the manifest instanceIndex must match the files on disk under records/.
 *
 * Grandfathered RFCs (rfcs/integration-allowlist.json) skip only check #4; #1–#3 stay live.
 *
 * Modeled on scripts/check-release-drift.mjs: collect failures, print each, exit 1 on any.
 */
import { readFile, readdir } from "fs/promises";
import { existsSync, statSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root
const REPO_ROOT = join(ROOT, "srs"); // the self-describing spec repo
const MANIFEST = join(REPO_ROOT, "manifest.json");
const SCHEMA_DIR = join(ROOT, "docs", "schema", "2.0");
const ALLOWLIST = join(ROOT, "rfcs", "integration-allowlist.json");

// --- entity + field ids (verified against records on disk) ---------------------------------
const RFC_TYPE_ID = "6a000001-0000-4000-a000-000000000001";
const F_RFC_NUMBER = "5a000001-0000-4000-a000-000000000001";
const F_STATUS = "5a000002-0000-4000-a000-000000000002";
const F_AFFECTED = "5a000009-0000-4000-a000-000000000009";
const F_ARTIFACT_PATH = "5a000016-0000-4000-a000-000000000016";

const INVARIANT_TYPE = "2a000006-0000-4000-a000-000000000006";
const F_INV_NUMBER = "1a000020-0000-4000-a000-000000000020";
const EXTENSION_TYPE = "2a000008-0000-4000-a000-000000000008";
const F_EXT_ID = "1a000018-0000-4000-a000-000000000018";
const TYPEDEF_TYPE = "2a000005-0000-4000-a000-000000000005";
const SECTION_TYPE = "2a000002-0000-4000-a000-000000000002";
const SUBSECTION_TYPE = "2a000003-0000-4000-a000-000000000003";
const F_TITLE = "1a000001-0000-4000-a000-000000000001";

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

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function fieldValue(record, fieldId) {
  return record.fieldValues?.find((f) => f.fieldId === fieldId)?.value;
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
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
  const manifest = await loadJson(MANIFEST);
  const entries = manifest.instanceIndex ?? [];

  const invariantNumbers = new Set();
  const extensionIds = new Set();
  const typeKeys = new Set(); // `${namespace}/${name}`
  const sectionSlugs = new Set();
  const subsectionSlugs = new Set();
  const indexedPaths = new Set();
  const rfcRecords = []; // { path, record } for every RFC-typed record, wherever it lives

  for (const entry of entries) {
    const relPath = typeof entry === "string" ? entry : entry.path;
    if (!relPath) continue;
    indexedPaths.add(relPath);
    let record;
    try {
      record = await loadJson(join(REPO_ROOT, relPath));
    } catch {
      continue; // structural load failures are validate-records.mjs's job
    }
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

  return { invariantNumbers, extensionIds, typeKeys, sectionSlugs, subsectionSlugs, schemaFiles, indexedPaths, rfcRecords };
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
  return null; // unrecognized token kind
}

// Normalize a markdown `**Status**:` line (e.g. "Accepted (Revision 5)") to an enum-style token.
function parseMdStatus(mdText) {
  const match = /^\s*(?:>?\s*)?\*\*Status\*\*:\s*([A-Za-z][A-Za-z -]*)/m.exec(mdText);
  if (!match) return null;
  return match[1].trim().toLowerCase().replace(/\s+/g, "-").replace(/-\(.*$/, "");
}

async function checkManifestSync(indexedPaths) {
  // Guard: every .json under records/ must be indexed, and every indexed record path must exist.
  const onDisk = new Set();
  async function walk(dir, base) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(abs, rel);
      else if (entry.name.endsWith(".json")) onDisk.add(`records/${rel}`);
    }
  }
  await walk(join(REPO_ROOT, "records"), "");
  for (const p of onDisk) {
    if (!indexedPaths.has(p)) fail(`manifest instanceIndex: on-disk record not indexed: ${p}`);
  }
  for (const p of indexedPaths) {
    if (p.startsWith("records/") && !existsSync(join(REPO_ROOT, p))) {
      fail(`manifest instanceIndex: indexed record missing on disk: ${p}`);
    }
  }
}

async function main() {
  const resolvers = await buildResolvers();

  let allowlist = {};
  if (existsSync(ALLOWLIST)) {
    allowlist = (await loadJson(ALLOWLIST)).grandfathered ?? {};
  }

  await checkManifestSync(resolvers.indexedPaths);

  // Every RFC-typed record in the repository (records/rfcs/, records/tier-2/, package/records/, …),
  // discovered via the manifest index — not just files under records/rfcs/.
  const rfcRecords = resolvers.rfcRecords;
  let rfcCount = 0;

  for (const { path: recPath, record } of rfcRecords) {
    rfcCount++;

    const num = fieldValue(record, F_RFC_NUMBER);
    const status = fieldValue(record, F_STATUS);
    const artifactPath = fieldValue(record, F_ARTIFACT_PATH);
    const label = `RFC-${num ?? `?(${recPath})`}`;

    // 1. status legality
    if (!LEGAL_STATUSES.has(status)) {
      fail(`${label}: illegal rfc-status "${status}" (legal: ${[...LEGAL_STATUSES].join(", ")})`);
    }
    if (!num) fail(`${label}: missing rfc-number (${recPath})`);

    // 2. proposal-artifact-path present + exists
    if (!artifactPath) {
      fail(`${label}: missing proposal-artifact-path — every RFC record must point at its rfcs/*.md proposal`);
    } else {
      const abs = join(ROOT, artifactPath);
      if (!existsSync(abs)) {
        fail(`${label}: proposal-artifact-path does not exist: ${artifactPath}`);
      } else if (artifactPath.endsWith(".md") && statSync(abs).isFile()) {
        // 3. .md status consistency
        const mdStatus = parseMdStatus(await readFile(abs, "utf8"));
        if (mdStatus && LEGAL_STATUSES.has(mdStatus) && mdStatus !== status) {
          fail(`${label}: .md status "${mdStatus}" != record rfc-status "${status}" (${artifactPath})`);
        }
        if (mdStatus && !LEGAL_STATUSES.has(mdStatus)) {
          fail(`${label}: .md **Status**: "${mdStatus}" is not a legal status (${artifactPath})`);
        }
      }
    }

    // 4. integration completeness (accepted/implemented, not grandfathered)
    if (REQUIRES_INTEGRATION.has(status) && !(num in allowlist)) {
      const tokens = parseIntegrationManifest(fieldValue(record, F_AFFECTED));
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
          fail(`${label}: unrecognized manifest token "${token}" (expected I-<n> | ext:<name> | schema:<file>.json | type:<ns>/<name> | section:<slug> | subsection:<slug>)`);
        } else if (resolved === false) {
          fail(`${label}: manifest token "${token}" does not resolve to any canonical record/schema — the change is not folded into the spec`);
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
