#!/usr/bin/env node
/**
 * gen-type-reference-tables.mjs — the #274 reader-projection generator (RFC-040 Change J, train
 * unit 4a-5, srs#481).
 *
 * #274's ratified ledger (2026-07-31) chose, for every metamodel entity reachable from the
 * self-hosted `com.semanticops.srs/metamodel` package: a generated property table as the primary
 * reader surface (columns: property, type/cardinality, required, constraints/domain, extension
 * owner, contextual description), an optional compact pseudo-IDL appendix, and a link to the raw
 * JSON Schema — never the schema embedded as the main surface. Narrative stays hand-authored in
 * the surrounding subsection records; this generator owns only the `content` field of
 * `com.semanticops.spec/generated-type-reference` records — the typed generated-view slot that
 * names which Type (by stable identity+version) and which presentation profile to render. A slot
 * whose `referenced_type_id`/`referenced_type_version` does not resolve in the metamodel package is
 * a hard error (fail closed on an unrecognised target), never a silently empty render.
 *
 * This is a thin presentation layer over scripts/lib/schema-emitter.mjs's effective-Type
 * resolution (`resolveForEmission`, `fieldOwners`, `orderedFieldAssignments`) — it defines no new
 * modelling logic and duplicates none of the merge/override/ordering algorithms those helpers
 * already implement (consume, don't clone — layer rule 2). Scripts help, records define: which
 * Type gets a generated reference, and at which presentation profile, is data on the
 * generated-type-reference records this script reads, never a hardcoded list here.
 *
 * `srs/records/**` has no instanceIndex to consult (RFC-038: tree-authoritative, no manifest
 * index) so target records are discovered by walking the tree and filtering on typeId, the same
 * pattern scripts/migrate-sourceref-relationtype-to-sourcerole.mjs already uses. Writing the
 * regenerated `content` directly to the record's JSON file (rather than through `srs record
 * update`) matches every other generator in this family (gen-metamodel-package.mjs,
 * scripts/lib/schema-emitter.mjs's own callers): Node-only, ADR-004-safe, no CLI dependency.
 *
 *   node scripts/gen-type-reference-tables.mjs           # regenerate content in place
 *   node scripts/gen-type-reference-tables.mjs --check   # dry run: exit 1 if regenerating would change anything
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { loadPackage, resolveForEmission, fieldOwners, orderedFieldAssignments, ENTITY_IDS, jsonKey } from "./lib/schema-emitter.mjs";
import { rangeDefKey } from "./lib/rfc-032-fieldtype.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root
const REPO_ROOT = join(ROOT, "srs");
const RECORDS_ROOT = join(REPO_ROOT, "records");
const METAMODEL_DIR = join(REPO_ROOT, "package", "metamodel");
const CHECK = process.argv.includes("--check");

const GENERATED_TYPE_REFERENCE_TYPE_ID = "2a000014-0000-4000-a000-000000000014";

// The one metamodel entity (besides the two bootstrap entities) this generator additionally knows
// how to render as an appendix table alongside its owning entity: FieldAssignment, nested under
// `type` in the frozen seed (docs/schema/2.0/type.json#/$defs/...). Extending this generator to a
// new nested value-object Type means adding its appendix wiring here, not a new mechanism.
const FIELD_ASSIGNMENT_TYPE_NAME = "field-assignment";

// srs#527 (epic #256/#272 Task 4b/6): raw-schema links for the instance-layer entities modelled
// at srs#526 and their nested value-object Types. Each gets its OWN top-level generated-type-
// reference record (no appendix special-casing, unlike FieldAssignment/Type) because several of
// these are shared across more than one owning entity (SourceReference: Record/Note/Relation) -
// picking one "owner" to host an appendix would be arbitrary. These seed files are hand-authored
// (not emitter-owned), so their $defs keys are the ad hoc PascalCase spelling actually committed,
// never the emitter's own `<namespace>__<name>__v<version>` convention (that convention applies
// only to type.json's FieldAssignment nest, RFC-040 Unit 3) - hand-spelled here deliberately,
// verified against the committed files, not derived from rangeDefKey.
const RAW_SCHEMA_LINKS = {
  record: "https://srs.semanticops.com/schema/2.0/record.json",
  note: "https://srs.semanticops.com/schema/2.0/note.json",
  relation: "https://srs.semanticops.com/schema/2.0/relation.json",
  container: "https://srs.semanticops.com/schema/2.0/container.json",
  vocabulary: "https://srs.semanticops.com/schema/2.0/vocabulary.json",
  term: "https://srs.semanticops.com/schema/2.0/term.json",
  blueprint: "https://srs.semanticops.com/schema/2.0/blueprint.json",
  lifecycle: "https://srs.semanticops.com/schema/2.0/lifecycle.json",
  "source-document-meta": "https://srs.semanticops.com/schema/2.0/source-document-meta.json",
  "note-section": "https://srs.semanticops.com/schema/2.0/note.json#/$defs/NoteSection",
  "source-reference": "https://srs.semanticops.com/schema/2.0/record.json#/$defs/SourceReference",
  "relation-spec": "https://srs.semanticops.com/schema/2.0/blueprint.json#/$defs/RelationSpec",
  // srs#541 (Task 4b/6 residual): the six entities srs#526/PR#533 parked, plus their nested value
  // objects. Same discipline: top-level entities link their own file; nested value objects link
  // into their owning file's `$defs` (hand-spelled PascalCase, verified against the committed file
  // — these seed files are not emitter-owned).
  "relation-type-definition": "https://srs.semanticops.com/schema/2.0/relation-type.json",
  manifest: "https://srs.semanticops.com/schema/2.0/manifest.json",
  composition: "https://srs.semanticops.com/schema/2.0/composition.json",
  view: "https://srs.semanticops.com/schema/2.0/view.json",
  "discovery-query": "https://srs.semanticops.com/schema/2.0/discovery.json#/$defs/DiscoveryQuery",
  "export-config": "https://srs.semanticops.com/schema/2.0/composition.json#/$defs/ExportConfig",
  "field-view": "https://srs.semanticops.com/schema/2.0/view.json#/$defs/FieldView",
  "record-property-view": "https://srs.semanticops.com/schema/2.0/view.json#/$defs/RecordPropertyView",
};

async function findJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findJsonFiles(abs)));
    else if (e.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

async function findGeneratedTypeReferenceRecords() {
  const files = await findJsonFiles(RECORDS_ROOT);
  const out = [];
  for (const path of files) {
    const doc = JSON.parse(await readFile(path, "utf8"));
    if (doc.typeId === GENERATED_TYPE_REFERENCE_TYPE_ID) out.push({ path, doc });
  }
  out.sort((a, b) => a.path.localeCompare(b.path)); // deterministic processing/reporting order
  return out;
}

// --- human-readable presentation (new: no existing function renders these as prose) -----------

/** A compact, reader-facing rendering of one Field's fieldType — NOT the JSON Schema projection
 * (projectField answers a different question: what does this look like as a schema fragment). */
function typeCardinalityToken(ctx, ft) {
  let base;
  switch (ft.datatype) {
    case "ref": {
      const target = ctx.typesById[ft.rangeType.typeId];
      const name = target ? `\`${target.name}\`` : ft.rangeType.typeId;
      base = ft.mode === "reference" ? `ref → ${name} (id)` : `ref → ${name} (inline)`;
      break;
    }
    case "dependent":
      base = `dependent → ${ft.dependsOn ?? "?"}`;
      break;
    case "map":
      base = `map<string, ${ft.valueRange ?? "?"}>`;
      break;
    default:
      base = ft.datatype;
  }
  return ft.cardinality === "list" ? `${base}[]` : base;
}

function constraintsDomainToken(ft) {
  const parts = [];
  if (ft.format) parts.push(`format: ${ft.format}`);
  if (ft.valueDomain === "closed") {
    // Join with a plain " | " - mdEscape() is the table's ONE escaper, applied by the caller to
    // the whole rendered string; pre-escaping the pipe here too double-escapes it to "\\|", which
    // GFM reads as a literal backslash followed by an UNESCAPED pipe - the cell-split corruption
    // this was meant to prevent, reproduced instead.
    if (ft.allowedValues) parts.push(`enum: ${ft.allowedValues.map((v) => `"${v}"`).join(" | ")}`);
    if (ft.vocabularyRef) parts.push("vocabularyRef (LINEAGE)");
  }
  if (ft.constraints && Object.keys(ft.constraints).length) {
    parts.push(Object.entries(ft.constraints).map(([k, v]) => `${k}: ${v}`).join(", "));
  }
  if (ft.minItems != null) parts.push(`minItems: ${ft.minItems}`);
  if (ft.maxItems != null) parts.push(`maxItems: ${ft.maxItems}`);
  return parts.length ? parts.join("; ") : "—";
}

/** #274's extension-owner column: "core" when the field is declared on the base Type itself,
 * else the owning extension parsed from the extender Type's own `ext:<name>` description prefix
 * (the convention RFC-040 Change A's facet Types already follow — see lifecycle-facet.json etc.).
 * Never re-derives extension membership; reads what train unit 4a-1 already recorded. */
function extensionOwnerToken(base, owner) {
  if (owner === base) return "core";
  const m = /^ext:([\w-]+)/.exec(owner.description || "");
  return m ? `ext:${m[1]}` : owner.name;
}

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

/** One property table (#274 columns) for `typeName`'s effective field set. */
function propertyTable(ctx, typeName) {
  const resolvedCtx = resolveForEmission(ctx, typeName);
  const base = resolvedCtx.typesByName[typeName];
  const owners = fieldOwners(resolvedCtx, typeName);
  const ordered = orderedFieldAssignments(resolvedCtx, typeName);

  const header = "| Property | Type / cardinality | Required | Constraints / domain | Extension owner | Description |\n" +
    "|---|---|---|---|---|---|";
  const rows = ordered.map((a) => {
    const f = resolvedCtx.fieldsById[a.fieldId];
    const owner = owners.get(a.fieldId) ?? base;
    const description = a.description || f.description || "";
    return `| \`${jsonKey(f.name)}\` | ${mdEscape(typeCardinalityToken(resolvedCtx, f.fieldType))} | ${a.required ? "yes" : "no"} | ${mdEscape(constraintsDomainToken(f.fieldType))} | ${extensionOwnerToken(base, owner)} | ${mdEscape(description)} |`;
  });
  return [header, ...rows].join("\n");
}

/** The optional compact pseudo-IDL appendix — same information as the table, TypeScript-literal
 * shape, generated (never hand-authored) so it cannot drift from the table it mirrors. */
function pseudoIdl(ctx, typeName) {
  const resolvedCtx = resolveForEmission(ctx, typeName);
  const base = resolvedCtx.typesByName[typeName];
  const ordered = orderedFieldAssignments(resolvedCtx, typeName);
  const lines = ordered.map((a) => {
    const f = resolvedCtx.fieldsById[a.fieldId];
    const opt = a.required ? "" : "?";
    const comment = a.description || f.description;
    return `  ${jsonKey(f.name)}${opt}: ${typeCardinalityToken(resolvedCtx, f.fieldType)}${comment ? ` // ${comment}` : ""}`;
  });
  return "```typescript\n" + `${base.name} {\n${lines.join("\n")}\n}\n` + "```";
}

/** The raw-schema link: the canonical published URL, never the schema embedded inline. Reuses
 * ENTITY_IDS for the two bootstrap entities; a nested value-object Type (FieldAssignment today)
 * links into its owning entity's $defs via the same emitter-owned key the schema itself uses
 * (rangeDefKey) — never a hand-spelled fragment that could drift from the emitter's own naming. */
function rawSchemaLink(typeName) {
  if (ENTITY_IDS[typeName]) return ENTITY_IDS[typeName];
  if (typeName === FIELD_ASSIGNMENT_TYPE_NAME) {
    return `${ENTITY_IDS.type}#/$defs/${rangeDefKey({ namespace: "com.semanticops.srs", name: "field-assignment", version: 1 })}`;
  }
  if (RAW_SCHEMA_LINKS[typeName]) return RAW_SCHEMA_LINKS[typeName];
  throw new Error(`gen-type-reference-tables: no raw-schema link known for "${typeName}" — extend rawSchemaLink`);
}

/** The full generated `content` for one generated-type-reference record. Each rendered entity
 * (the base Type, and the FieldAssignment appendix when present) carries its OWN raw-schema link
 * right after its own table - never one link at the end covering only the base, which would leave
 * the appendix table with no pointer into its own schema fragment. */
function renderContent(ctx, typeName, profile) {
  const sections = [
    `Generated from the resolved effective \`${typeName}\` Type — regenerate with \`node scripts/gen-type-reference-tables.mjs\` (RFC-040 Change J, #274 ratified ledger). Do not hand-edit.`,
    propertyTable(ctx, typeName),
    `Raw JSON Schema: <${rawSchemaLink(typeName)}>`,
  ];
  if (typeName === "type") {
    sections.push(
      `#### \`FieldAssignment\` (appendix)\n\n${propertyTable(ctx, FIELD_ASSIGNMENT_TYPE_NAME)}`,
      `Raw JSON Schema: <${rawSchemaLink(FIELD_ASSIGNMENT_TYPE_NAME)}>`
    );
  }
  if (profile === "property-table-and-pseudo-idl") {
    sections.push(`#### Compact pseudo-IDL\n\n${pseudoIdl(ctx, typeName)}`);
    if (typeName === "type") {
      sections.push(pseudoIdl(ctx, FIELD_ASSIGNMENT_TYPE_NAME));
    }
  }
  return sections.join("\n\n");
}

async function main() {
  const ctx = loadPackage(METAMODEL_DIR);
  const targets = await findGeneratedTypeReferenceRecords();
  if (targets.length === 0) {
    throw new Error("gen-type-reference-tables: no com.semanticops.spec/generated-type-reference records found — nothing to generate");
  }

  let drift = false;
  for (const { path, doc } of targets) {
    const fv = doc.fieldValues;
    const typeId = fv.referenced_type_id;
    const version = fv.referenced_type_version;
    const profile = fv.presentation_profile;
    const t = ctx.typesById[typeId];
    if (!t) {
      throw new Error(`gen-type-reference-tables: ${path} names referenced_type_id ${typeId}, unresolved in the metamodel package — fail closed on an unrecognised target`);
    }
    if (t.version !== version) {
      throw new Error(`gen-type-reference-tables: ${path} names ${t.name}@${version}, but the metamodel package has ${t.name}@${t.version} — retarget referenced_type_version`);
    }
    const expected = renderContent(ctx, t.name, profile);
    if (fv.content === expected) continue;
    if (CHECK) {
      console.log(`  drift: ${path} (${t.name}@${t.version})`);
      drift = true;
      continue;
    }
    fv.content = expected;
    await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    console.log(`  regenerated: ${path} (${t.name}@${t.version})`);
  }

  if (CHECK && drift) {
    console.log("\nFAILED: generated-type-reference content is stale — run scripts/gen-type-reference-tables.mjs to regenerate.");
    process.exit(1);
  }
  console.log(CHECK ? "gen-type-reference-tables --check: OK, no drift" : "gen-type-reference-tables: OK");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
