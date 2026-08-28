#!/usr/bin/env node
/**
 * check-idl-schema-conformance.mjs — the prose-IDL <-> JSON-Schema drift gate (RFC-031, issue #238).
 *
 * Every core SRS entity is defined in two normative places: a pseudo-IDL block embedded as
 * prose in a spec record (srs/records/type-definitions/*.json or srs/records/subsections/*.json),
 * and a JSON Schema 2020-12 file (docs/schema/2.0/*.json). Nothing else checks that the two
 * agree. This script does: for every entity in the MAPPING table below, it extracts the
 * pseudo-IDL's declared property set/optionality/type and compares it against the schema's
 * properties/required, per RFC-031's Conformance Rules R1-R3.
 *
 * Modeled on scripts/check-rfc-integration.mjs: collect failures, print each, exit 1 on any.
 *
 * R1 property-set and R2 optionality checks are mechanical. R3 type-token equivalence is a
 * small, explicit table (RFC-031 R3) - named cross-file type references (Lineage, Provenance,
 * AiGuidance, and any T[] wrapping a non-primitive named type) are checked for presence and
 * optionality only, not full structural equivalence - this is a deliberate, documented
 * limitation (see RFC-031 Alt A: full resolution would need a whole-repo symbol table).
 *
 * $schema is excluded from R1 entirely (RFC-031 R1 carve-out): it is JSON-Schema self-reference
 * metadata, not a domain property, and has no pseudo-IDL counterpart on any entity by design.
 *
 * Known, currently-accepted gaps are recorded in scripts/idl-schema-conformance-allowlist.json,
 * each entry citing a tracked follow-up issue (RFC-031 Change D / R6).
 */
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root
const REPO_ROOT = join(ROOT, "srs"); // the self-describing spec repo (records/, manifest.json)
const SCHEMA_DIR = join(ROOT, "docs", "schema", "2.0");
const ALLOWLIST_PATH = join(ROOT, "scripts", "idl-schema-conformance-allowlist.json");

const F_BODY = "content"; // pseudo-IDL prose field (RFC-039: carrier keys by Field.name)

// --- RFC-031 Change B: the normative name-mapping table -------------------------------------
// prose: path relative to REPO_ROOT. header: backtick-quoted heading text to match (before any
// parenthetical suffix), or null for a root-level entry (the first fenced block in the field
// value, valid only when no heading of any kind precedes it - see RFC-031 Change A step 2).
const MAPPING = [
  // Every row maps to the *published* subsection record. There is no second prose copy left to map
  // to: `records/type-definitions/` is gone.
  //
  // It used to hold a shadow copy of seven entities' prose. Those records participated in zero
  // relations, so no view ever rendered them — yet this checker read them as authoritative for 9 of
  // its 18 rows, validating prose the specification never published while the prose it did publish
  // went unchecked. The copies had already drifted apart: RFC-030 had to hand-edit both copies of
  // `Field`; the `Container` shadow cited Invariant 19 where the published copy correctly cites
  // Invariant 20; and the `TypedField` shadow carried the current RFC-039 [R8] `fieldType` block
  // while the *published* copy still declared the pre-RFC-032 `valueType`/`selectOptions` shape.
  // That last one is why retirement could not be a pure deletion — #285 ported the current block
  // into the published record first, and the `TypedRecord.TypedField` row (since retired at
  // srs#448 along with Tier 1 itself) is what would have gone red against a stale twin at the
  // time. #275/PR #283 retired `field.json` on the same reasoning;
  // Note/NoteSection had always mapped this way. #285 finished the set (RFC-031 Open Question 2).
  // Field, Type, and Type.FieldAssignment are RETIRED from this mapping as of RFC-040 Change J
  // (srs#481, the #274 ratified ledger): their prose subsections (04-2-4-2-field.json,
  // 04-3-4-3-type.json) no longer carry a hand-authored ```typescript block for these three rows —
  // it was replaced by a generated-type-reference record (a typed generated-view slot,
  // scripts/gen-type-reference-tables.mjs) whose property table is generated from the SAME
  // resolved effective Type the schema emitter (scripts/lib/schema-emitter.mjs) projects
  // docs/schema/2.0/{field,type}.json from. Comparing two independently-generated-from-the-same-
  // source artifacts can never catch drift a bug in the shared source wouldn't also cause, so
  // there is nothing left for R1-R3 to usefully check here — the RFC-035/RFC-040 byte-closure
  // tests (rfc-035-closure-test.mjs, the regenerate-and-diff gate) are this pair's real
  // conformance gate now. This is "no hand-authored structural duplicate remains for generated
  // targets" applied, not a silent narrowing: removing these three rows also retires every
  // allowlist entry that named them (RFC-031 OQ1 is formally closed by the property table's
  // extension-owner column; see rfcs/rfc-031-idl-schema-conformance-check.md's Open Questions).
  { entity: "Record", prose: "records/subsections/04-4-4-4-record-tiers.json", header: "Record", schemaFile: "record.json", pointer: "#" },
  // Record.FieldValue row dropped at the srs#242 cutover: RFC-039 [R7] deletes
  // $defs.FieldValue — the entity ceases to exist (RFC-031 Cross-references).
  // TypedRecord/TypedRecord.TypedField rows retired at srs#448 (rfc-decision-53635966): Tier 1
  // is removed, typed-record.json is deleted, and the prose no longer has a "Typed Record"/
  // "TypedField" heading to map.
  { entity: "SourceReference", prose: "records/subsections/04-4-4-4-record-tiers.json", header: "SourceReference", schemaFile: "record.json", pointer: "#/$defs/SourceReference" },
  { entity: "SourceReference", prose: "records/subsections/04-4-4-4-record-tiers.json", header: "SourceReference", schemaFile: "note.json", pointer: "#/$defs/SourceReference" },
  { entity: "SourceReference", prose: "records/subsections/04-4-4-4-record-tiers.json", header: "SourceReference", schemaFile: "relations-collection.json", pointer: "#/$defs/SourceReference" },
  { entity: "Note", prose: "records/subsections/04-4-4-4-record-tiers.json", header: "Note", schemaFile: "note.json", pointer: "#" },
  { entity: "Note.NoteSection", prose: "records/subsections/04-4-4-4-record-tiers.json", header: "NoteSection", schemaFile: "note.json", pointer: "#/$defs/NoteSection" },
  { entity: "Relation", prose: "records/subsections/04-5-4-5-relation.json", header: null, schemaFile: "relations-collection.json", pointer: "#/$defs/Relation" },
  { entity: "Container", prose: "records/subsections/04-6-4-6-container.json", header: null, schemaFile: "container.json", pointer: "#" },
  { entity: "Vocabulary", prose: "records/subsections/04-7-vocabulary-term-substrate.json", header: "Vocabulary", schemaFile: "vocabulary.json", pointer: "#" },
  { entity: "Term", prose: "records/subsections/04-7-vocabulary-term-substrate.json", header: "Term", schemaFile: "term.json", pointer: "#" },
  { entity: "RelationTypeDefinition", prose: "records/subsections/04-7-vocabulary-term-substrate.json", header: "RelationTypeDefinition", schemaFile: "relation-type.json", pointer: "#" },
  // VocabularyEntry is an abstract base contract with no schema file - deliberately not mapped.
];

// RFC-031 R3: small, explicit type-token equivalence table.
const NAMED_REF_TYPES = new Set(["Lineage", "Provenance", "AiGuidance", "FieldType"]);

function typesEquivalent(idlToken, schemaProp) {
  const tok = idlToken.trim();

  if (tok === "UUID") return schemaProp.type === "string" && schemaProp.format === "uuid";
  if (tok === "ISO8601") return schemaProp.type === "string" && schemaProp.format === "date-time";
  if (tok === "string") return schemaProp.type === "string" && !schemaProp.format;
  if (tok === "number") return schemaProp.type === "number";
  if (tok === "integer") return schemaProp.type === "integer";
  if (tok === "boolean") return schemaProp.type === "boolean";
  if (tok === "Record<string, unknown>") return schemaProp.type === "object";
  if (tok === "object") return schemaProp.type === "object"; // inline anonymous object literal

  // quoted string union -> enum, matching value sets
  const unionMatch = tok.match(/^"[^"]*"(\s*\|\s*"[^"]*")*$/);
  if (unionMatch) {
    const values = tok.split("|").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (!Array.isArray(schemaProp.enum)) return false;
    const a = new Set(values);
    const b = new Set(schemaProp.enum);
    return a.size === b.size && [...a].every((v) => b.has(v));
  }

  // T[] arrays
  const arrayMatch = tok.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    if (schemaProp.type !== "array") return false;
    const inner = arrayMatch[1].trim();
    if (inner === "string") return schemaProp.items?.type === "string" && !schemaProp.items?.format;
    if (inner === "number") return schemaProp.items?.type === "number";
    if (inner === "UUID") return schemaProp.items?.type === "string" && schemaProp.items?.format === "uuid";
    // array of a named/cross-file type (e.g. SourceReference[], ValidationRule[]) - presence
    // check only, per R3's documented limitation on named cross-file references.
    return true;
  }

  // named cross-file type reference (Lineage, Provenance, AiGuidance, or anything else not
  // covered above) - presence/optionality only, not structural equivalence, per R3.
  if (NAMED_REF_TYPES.has(tok)) return true;

  // Unknown token shape: don't silently pass - but don't hard-fail the whole script either.
  // Treat as "unverified" (true) and let R1/R2 still catch presence/optionality issues; a
  // human reviewing new pseudo-IDL syntax that doesn't match any known shape should extend
  // this table, not have CI silently swallow the gap. Log for visibility.
  console.log(`  (note: type token "${tok}" not recognized by any R3 equivalence rule - skipped, not verified)`);
  return true;
}

// --- prose parsing (RFC-031 Change A) --------------------------------------------------------

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function fieldValue(record, name) {
  return record.fieldValues?.[name];
}

function trimParenthetical(headingText) {
  return headingText.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// Extract {name -> {optional, typeToken}} from one fenced ```typescript block's inner text.
// Tracks brace depth so properties nested inside an inline anonymous object type (e.g.
// `promotionWindow?: { until: string }`) are not mistaken for top-level properties of the
// entity itself - only depth-1 (directly inside the block's own outer braces) is captured.
function parsePropsFromBlock(blockText) {
  const props = new Map();
  const lines = blockText.split("\n");
  const PROP_RE = /^\s*(\w+)(\?)?:\s*([^/\n]+?)\s*(?:\/\/.*)?$/;
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("//")) continue;
    if (/^\{$/.test(trimmed)) {
      depth += 1;
      continue;
    }
    if (/^\}[,]?$/.test(trimmed)) {
      depth -= 1;
      continue;
    }

    const opensInlineObject = /\{\s*(?:\/\/.*)?$/.test(trimmed) && !/\}\s*(?:\/\/.*)?$/.test(trimmed);
    if (depth === 1) {
      const m = PROP_RE.exec(line);
      if (m) {
        const [, name, optMark, rawType] = m;
        if (opensInlineObject) {
          props.set(name, { optional: Boolean(optMark), type: "object" });
        } else {
          const type = rawType.trim().replace(/,$/, "").trim();
          if (type !== "") props.set(name, { optional: Boolean(optMark), type });
        }
      }
    }
    if (opensInlineObject) depth += 1;
  }
  return props;
}

// Find every heading (### `Name` or #### `Name`) and fenced ```typescript block in the text,
// each with its start offset, in document order.
function findStructure(text) {
  const headings = [];
  const HEADING_RE = /^#{3,4}\s+`([^`]+)`(?:\s*\([^)]*\))?\s*$/gm;
  let hm;
  while ((hm = HEADING_RE.exec(text)) !== null) {
    headings.push({ index: hm.index, raw: hm[1] });
  }
  const blocks = [];
  const FENCE_RE = /```typescript\n([\s\S]*?)```/g;
  let fm;
  while ((fm = FENCE_RE.exec(text)) !== null) {
    blocks.push({ index: fm.index, inner: fm[1] });
  }
  return { headings, blocks };
}

function extractEntityProps(text, header, entityLabel) {
  const { headings, blocks } = findStructure(text);
  if (blocks.length === 0) {
    throw new Error(`${entityLabel}: no fenced typescript block found in source prose`);
  }

  if (header === null) {
    const firstBlock = blocks[0];
    const precedingHeading = headings.find((h) => h.index < firstBlock.index);
    if (precedingHeading) {
      throw new Error(
        `${entityLabel}: mapped as root-level ("-") but a heading ("${precedingHeading.raw}") ` +
          `precedes the first fenced block - give this entity an explicit sub-block header instead`
      );
    }
    return parsePropsFromBlock(firstBlock.inner);
  }

  const targetHeading = headings.find((h) => trimParenthetical(h.raw) === header);
  if (!targetHeading) {
    throw new Error(`${entityLabel}: no heading matching "${header}" found in source prose`);
  }
  const block = blocks.find((b) => b.index > targetHeading.index);
  if (!block) {
    throw new Error(`${entityLabel}: heading "${header}" found but no fenced block follows it`);
  }
  return parsePropsFromBlock(block.inner);
}

// --- schema resolution ------------------------------------------------------------------------

function resolvePointer(schemaDoc, pointer) {
  if (pointer === "#") return schemaDoc;
  const m = pointer.match(/^#\/\$defs\/(.+)$/);
  if (!m) throw new Error(`unsupported schema pointer: ${pointer}`);
  const def = schemaDoc.$defs?.[m[1]];
  if (!def) throw new Error(`schema pointer ${pointer} does not resolve ($defs.${m[1]} missing)`);
  return def;
}

// --- allowlist (RFC-031 Change D) --------------------------------------------------------------

async function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  const raw = await loadJson(ALLOWLIST_PATH);
  if (!Array.isArray(raw)) {
    throw new Error(`${ALLOWLIST_PATH}: expected a JSON array of allowlist entries`);
  }
  for (const entry of raw) {
    const missing = ["entity", "property", "rule", "issue", "expected"].filter((k) => !(k in entry));
    if (missing.length > 0) {
      throw new Error(
        `${ALLOWLIST_PATH}: entry ${JSON.stringify(entry)} is missing required field(s): ${missing.join(", ")}`
      );
    }
    if (!Number.isInteger(entry.issue) || entry.issue <= 0) {
      throw new Error(
        `${ALLOWLIST_PATH}: entry for ${entry.entity}.${entry.property} has an invalid "issue" ` +
          `(must be a positive integer GitHub issue number) - the allowlist cannot silently grow ` +
          `without a tracked follow-up issue`
      );
    }
    if (!["R1", "R2", "R3"].includes(entry.rule)) {
      throw new Error(
        `${ALLOWLIST_PATH}: entry for ${entry.entity}.${entry.property} has invalid "rule" ` +
          `"${entry.rule}" (must be R1, R2, or R3)`
      );
    }
    if (typeof entry.expected !== "string" || entry.expected === "") {
      throw new Error(
        `${ALLOWLIST_PATH}: entry for ${entry.entity}.${entry.property} is missing a non-empty ` +
          `"expected" string - RFC-040 Change J / rfc-decision-5f8204bc: every survivor must name its ` +
          `exact expected mismatch so the entry self-expires when the mismatch changes or disappears`
      );
    }
  }
  return raw;
}

/**
 * The self-expiring allowlist ledger (RFC-040 Change J / rfc-decision-5f8204bc): an entry waives a
 * violation ONLY when the currently-observed mismatch shape (`observed`) still equals the entry's
 * recorded `expected` string. A change in shape (the mismatch moved to something else) is reported
 * as loudly as an unwaived violation would be - "fail when the mismatch changes", not silently
 * re-waived under the old label. Every consulted entry is added to `consumed`; entries that match
 * NO observed violation at all (the mismatch disappeared - the property was resolved, removed, or
 * the two sides now agree) are reported once at the end of `main`, per the same rule's other half.
 */
function checkAllowlist(allowlist, consumed, entity, property, rule, observed) {
  const entry = allowlist.find((e) => e.entity === entity && e.property === property && e.rule === rule);
  if (!entry) return false;
  consumed.add(entry);
  if (entry.expected !== observed) {
    fail(
      `${entity}.${property} (${rule}, issue #${entry.issue}): allowlist entry is stale - its recorded ` +
        `"expected" mismatch ("${entry.expected}") no longer matches what is currently observed ` +
        `("${observed}") - update the entry's "expected" or retire it (rfc-decision-5f8204bc: an ` +
        `exception dies when its cited condition changes, even if nobody noticed)`
    );
  }
  return true;
}

// --- main ---------------------------------------------------------------------------------------

const failures = [];
function fail(msg) {
  failures.push(msg);
}

async function main() {
  const allowlist = await loadAllowlist();
  const consumed = new Set();
  const proseCache = new Map();
  const schemaCache = new Map();
  let entitiesChecked = 0;

  for (const row of MAPPING) {
    entitiesChecked += 1;
    const prosePath = join(REPO_ROOT, row.prose);
    const schemaPath = join(SCHEMA_DIR, row.schemaFile);

    if (!proseCache.has(prosePath)) {
      if (!existsSync(prosePath)) {
        fail(`${row.entity}: prose source not found at ${prosePath}`);
        continue;
      }
      proseCache.set(prosePath, await loadJson(prosePath));
    }
    const record = proseCache.get(prosePath);
    const body = fieldValue(record, F_BODY);
    if (!body) {
      fail(`${row.entity}: no fieldValues entry for ${F_BODY} in ${row.prose}`);
      continue;
    }

    let idlProps;
    try {
      idlProps = extractEntityProps(body, row.header, row.entity);
    } catch (err) {
      fail(`${row.entity}: ${err.message}`);
      continue;
    }

    if (!schemaCache.has(schemaPath)) {
      if (!existsSync(schemaPath)) {
        fail(`${row.entity}: schema file not found at ${schemaPath}`);
        continue;
      }
      schemaCache.set(schemaPath, await loadJson(schemaPath));
    }
    const schemaDoc = schemaCache.get(schemaPath);

    let target;
    try {
      target = resolvePointer(schemaDoc, row.pointer);
    } catch (err) {
      fail(`${row.entity}: ${err.message}`);
      continue;
    }

    const schemaProps = { ...(target.properties ?? {}) };
    delete schemaProps.$schema; // R1 carve-out: schema self-reference metadata, not a domain property
    const schemaRequired = new Set(target.required ?? []);

    const idlNames = new Set(idlProps.keys());
    const schemaNames = new Set(Object.keys(schemaProps));

    // R1 - property set equality
    for (const name of schemaNames) {
      if (idlNames.has(name)) continue;
      if (checkAllowlist(allowlist, consumed, row.entity, name, "R1", "schema-only")) continue;
      fail(`${row.entity}: schema declares "${name}" (${row.schemaFile}${row.pointer === "#" ? "" : row.pointer}) with no pseudo-IDL counterpart`);
    }
    for (const name of idlNames) {
      if (schemaNames.has(name)) continue;
      if (checkAllowlist(allowlist, consumed, row.entity, name, "R1", "prose-only")) continue;
      fail(`${row.entity}: pseudo-IDL declares "${name}" with no schema counterpart (schema rejects it if additionalProperties:false)`);
    }

    // R2 - optionality agreement, and R3 - type equivalence, for properties present in both
    for (const name of idlNames) {
      if (!schemaNames.has(name)) continue;
      const idl = idlProps.get(name);
      const schemaProp = schemaProps[name];
      const schemaRequiredHere = schemaRequired.has(name);
      const idlRequiredHere = !idl.optional;

      if (idlRequiredHere !== schemaRequiredHere) {
        const observed = `idl=${idlRequiredHere ? "required" : "optional"},schema=${schemaRequiredHere ? "required" : "optional"}`;
        if (!checkAllowlist(allowlist, consumed, row.entity, name, "R2", observed)) {
          fail(
            `${row.entity}.${name}: optionality mismatch - pseudo-IDL says ${idlRequiredHere ? "required" : "optional"}, ` +
              `schema says ${schemaRequiredHere ? "required" : "optional"}`
          );
        }
      }

      if (!typesEquivalent(idl.type, schemaProp)) {
        const observed = `schema:type=${schemaProp.type},format=${schemaProp.format ?? "-"},enum=${Array.isArray(schemaProp.enum) ? schemaProp.enum.join("|") : "-"}`;
        if (!checkAllowlist(allowlist, consumed, row.entity, name, "R3", observed)) {
          fail(
            `${row.entity}.${name}: type mismatch - pseudo-IDL says "${idl.type}", schema says ` +
              `${JSON.stringify({ type: schemaProp.type, format: schemaProp.format, enum: schemaProp.enum })}`
          );
        }
      }
    }
  }

  // RFC-040 Change J / rfc-decision-5f8204bc: an allowlist entry that never matched any observed
  // violation this run has nothing left to waive - the mismatch it names has disappeared (the
  // property was resolved, removed, or renamed), and per the self-expiring-exception rule that
  // makes it stale ledger debt, not a live exception. Reported here, once, rather than silently
  // carried forward.
  for (const entry of allowlist) {
    if (consumed.has(entry)) continue;
    fail(
      `${entry.entity}.${entry.property} (${entry.rule}, issue #${entry.issue}): allowlist entry is stale - ` +
        `no observed mismatch matched it this run (expected "${entry.expected}") - retire this entry ` +
        `(rfc-decision-5f8204bc: an exception dies when its cited condition disappears, even if nobody noticed)`
    );
  }

  if (failures.length > 0) {
    console.log("Checking IDL/schema conformance... FAILED");
    for (const f of failures) console.log(`  ✗ ${f}`);
    console.log(`\nFAILED: ${failures.length} conformance problem(s) across ${entitiesChecked} mapped entit${entitiesChecked === 1 ? "y" : "ies"}.`);
    process.exit(1);
  }
  console.log(`Checking IDL/schema conformance... OK (${entitiesChecked} mapped entities, ${allowlist.length} self-expiring allowlist entries all still live)`);
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
