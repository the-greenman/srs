/**
 * schema-emitter.mjs — RFC-035 reference emitter: meta-model Type records -> neutral IR -> JSON Schema 2020-12.
 *
 * The whole-entity generalization of RFC-032's per-fieldType `projectField` (scripts/lib/rfc-032-fieldtype.mjs):
 * it walks a Type's FieldAssignments, projects each Field's `fieldType`, and assembles a complete
 * `{ $schema, $id, type:object, required, additionalProperties:false, properties, $defs }` definition schema.
 *
 * Design (RFC-035):
 *   - front half (package-resolving)  -> neutral IR  -> a JSON emitter (this file's only NOW emitter).
 *   - the IR node RETAINS the source `fieldType` verbatim, so the JSON emitter's per-node renderer is
 *     `projectField` run UNCHANGED (Change B). `kind` is a derived tag a non-JSON target would dispatch on.
 *   - `$defs` key is emitter-owned (Change D): `<ns>__<name>__v<version>`, spelled by resolving the record's
 *     ExactTypeRef.typeId -> (namespace, name) against the package. Injective on (ns, name, version).
 *   - snake_case Field.name -> lowerCamelCase JSON key, with a committed override table (Change E).
 *   - deterministic: fixed top-level key order + pre-order-DFS `$defs` order (Change B, [R6]).
 *
 * Pure (no I/O beyond `loadPackage` reading the package dir). No clocks, no randomness. ADR-004: verified
 * through the Node pipeline, never the (pre-RFC-032) binary.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { projectField, rangeDefKey } from "./rfc-032-fieldtype.mjs";

// --- name projection (Change E) ------------------------------------------------------------------
/** Committed override table: metamodel Field.name -> JSON key, where lowerCamelCase is not the seed key.
 * RFC-040 Unit 1 (srs#477) Change B adds two entries for the new value-object Types; Change D later
 * retires the pre-existing `assignment_default_value` entry when that property is removed. */
export const NAME_OVERRIDES = { assignment_default_value: "defaultValue", kind: "type", transition_name: "name" };
/** snake_case -> lowerCamelCase, deterministic and injective over the in-scope metamodel field names. */
export function jsonKey(fieldName) {
  return NAME_OVERRIDES[fieldName] ?? fieldName.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// --- $id policy (Change C) -----------------------------------------------------------------------
/** The two frozen meta-model ENTITIES keep their reserved 2.0/ data-model-line ids (RFC-033 Change C item 1). */
export const ENTITY_IDS = {
  field: "https://srs.semanticops.com/schema/2.0/field.json",
  type: "https://srs.semanticops.com/schema/2.0/type.json",
};
/** Domain (non-meta-model) Type -> RFC-004 generated-schema template (Change C item 2). */
export function domainId(ns, name, version) {
  return `https://srs.semanticops.com/schema/domain/${ns}/${name}/${version}.json`;
}

// --- package loading -----------------------------------------------------------------------------
/** Load a metamodel package dir into a resolver: fields/types indexed by id and name. */
export function loadPackage(mmDir) {
  const pkg = JSON.parse(readFileSync(join(mmDir, "package.json"), "utf8"));
  const fieldsById = {}, typesById = {}, typesByName = {};
  for (const rel of pkg.fields) {
    const f = JSON.parse(readFileSync(join(mmDir, rel), "utf8"));
    fieldsById[f.id] = f;
  }
  for (const rel of pkg.types) {
    const t = JSON.parse(readFileSync(join(mmDir, rel), "utf8"));
    typesById[t.id] = t;
    typesByName[t.name] = t;
  }
  return { pkg, mmDir, fieldsById, typesById, typesByName };
}

/** Resolve an ExactTypeRef {typeId, typeVersion} -> {namespace, name, version} against the package (Change D). */
function resolveRange(ctx, rangeType) {
  const t = ctx.typesById[rangeType.typeId];
  if (!t) throw new Error(`schema-emitter: unresolved rangeType typeId ${rangeType.typeId}`);
  return { namespace: t.namespace, name: t.name, version: rangeType.typeVersion };
}

// --- effective-Type resolution, bounded to what Unit 1's closure tests need -----------------------
/**
 * RFC-040 Unit 1 (srs#477) Change A models extension-owned Type facets as SEPARATE metamodel Types
 * extending core `type` via ext:type-inheritance (single-level, I-39/I-40) rather than flattened onto
 * it. The frozen seed's `type.json` is one flat object, so the closure tests need the MERGED effective
 * field list (base + every Type whose extendsTypeId names it) to compare against it. This is
 * deliberately NOT wired into `emitEntity`/`emitBody` — that full effective-Type resolution, with the
 * facing distinction and conditional projection, is Unit 3's Change G. This helper is bounded to what
 * Unit 1's closure tests need: a single-level union of FieldAssignments for comparison purposes only.
 */
export function effectiveFields(ctx, typeName) {
  const base = ctx.typesByName[typeName];
  const extenders = Object.values(ctx.typesById).filter((t) => t.extendsTypeId === base.id);
  if (extenders.length === 0) return base.fields;
  return [...base.fields, ...extenders.flatMap((t) => t.fields)];
}

/** A ctx whose `typesByName[typeName]` carries the merged effective fields (see `effectiveFields`). */
export function withEffectiveType(ctx, typeName) {
  const base = ctx.typesByName[typeName];
  const merged = { ...base, fields: effectiveFields(ctx, typeName) };
  return { ...ctx, typesByName: { ...ctx.typesByName, [typeName]: merged } };
}

// --- the JSON emitter (Change B) -----------------------------------------------------------------
/**
 * Render one Field's `fieldType` to a JSON Schema fragment via `projectField` (unchanged). For an inline
 * `ref`, the range's `$def` is ensured in `defs` first (pre-order DFS); a `reference` ref emits the id shape
 * and contributes no `$def`. The IR node = { kind: derived, fieldType: verbatim, range?: resolved }.
 */
function renderNode(ctx, ft, defs) {
  if (ft.datatype === "ref") {
    const parts = resolveRange(ctx, ft.rangeType);
    const resolvedFt = { ...ft, rangeType: { ...ft.rangeType, ...parts } };
    if (ft.mode !== "reference") ensureDef(ctx, parts, defs); // inline -> a $def; reference -> none
    return projectField(resolvedFt, defs);
  }
  return projectField(ft, defs);
}

/** Ensure the inline range's `$def` body exists in `defs`, reserving its slot first for pre-order DFS order. */
function ensureDef(ctx, parts, defs) {
  const key = rangeDefKey(parts);
  if (key in defs) return key;
  defs[key] = null;                                  // reserve slot at first reference (parent before nested)
  defs[key] = emitBody(ctx, parts.name, defs);       // then fill; nested refs insert after this slot
  return key;
}

/** Emit a Type's object body (no $schema/$id/title) — used for both entities and their value-object $defs. */
function emitBody(ctx, typeName, defs) {
  const t = ctx.typesByName[typeName];
  if (!t) throw new Error(`schema-emitter: unknown type ${typeName}`);
  const properties = {};
  const required = [];
  for (const a of [...t.fields].sort((x, y) => x.order - y.order)) {
    const f = ctx.fieldsById[a.fieldId];
    const key = jsonKey(f.name);
    const frag = renderNode(ctx, f.fieldType, defs);
    if (a.displayLabel) frag.title = a.displayLabel; // FieldAssignment.displayLabel -> title (presentation)
    properties[key] = frag;
    if (a.required) required.push(key);
  }
  const body = { type: "object" };
  if (required.length) body.required = required;
  body.additionalProperties = false;
  body.properties = properties;
  return body;
}

/** Emit one meta-model entity as a full JSON Schema 2020-12 definition schema (fixed top-level key order). */
export function emitEntity(ctx, typeName) {
  const t = ctx.typesByName[typeName];
  const defs = {};
  const bodyProps = emitBody(ctx, typeName, defs); // walking the entity fills `defs` in pre-order DFS
  const out = {};
  out.$schema = "https://json-schema.org/draft/2020-12/schema";
  out.$id = ENTITY_IDS[typeName] ?? domainId(t.namespace, t.name, t.version);
  if (t.description) out.description = t.description;
  out.type = "object";
  if (bodyProps.required) out.required = bodyProps.required;
  out.additionalProperties = false;
  out.properties = bodyProps.properties;
  if (Object.keys(defs).length) out.$defs = defs;
  return out;
}

/**
 * Emit the generated-schema bundle envelope (Change H): the two entity schemas + the `dataModelRevision`
 * stamp read from the source manifest (absent => 0). Distinct artifact from RFC-033's package-bundle.json.
 * Fixed key order so the #260 binding byte-matches.
 */
export function emitBundle(ctx, { entities = ["field", "type"], dataModelRevision = 0 } = {}) {
  const schemas = {};
  for (const e of entities) schemas[e] = emitEntity(ctx, e);
  return { dataModelRevision, schemas };
}

/** The source dataModelRevision for the bundle stamp (absent => 0). */
export function readDataModelRevision(manifestPath) {
  try {
    const m = JSON.parse(readFileSync(manifestPath, "utf8"));
    return Number.isInteger(m.dataModelRevision) ? m.dataModelRevision : 0;
  } catch {
    return 0;
  }
}
