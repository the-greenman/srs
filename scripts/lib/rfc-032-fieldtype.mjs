/**
 * rfc-032-fieldtype.mjs — the single source of truth for RFC-032's Field type model.
 *
 * Three pure, deterministic operations, shared by every RFC-032 tool so there is ONE
 * implementation of each (no drift between the migration, the proof, and the fixture runner):
 *
 *   migrateFieldType(oldField)        — Change H: legacy `valueType` (+ companions) -> `fieldType`.
 *   projectField(fieldType, $defs)    — Change G: a `fieldType` -> a JSON Schema fragment.
 *   validateFieldType(fieldType, ctx) — Conformance Rules R1-R11 over a `fieldType` object.
 *
 * No file I/O, no external deps — importable from Node scripts and testable in isolation.
 */

// ---------------------------------------------------------------------------------------------
// Change G — projection: a `fieldType` -> a JSON Schema 2020-12 fragment (within a Type's schema).
// Scalar/format/constraint/cardinality rows follow RFC-004 projection-rules.md; the ref/dependent/
// map rows are RFC-032 Change G. This mirrors the #259 emitter over exactly these shapes.
// ---------------------------------------------------------------------------------------------
const SCALAR = {
  string: () => ({ type: "string" }),
  number: () => ({ type: "number" }),
  integer: () => ({ type: "integer" }),
  boolean: () => ({ type: "boolean" }),
  date: () => ({ type: "string", format: "date" }),
  "date-time": () => ({ type: "string", format: "date-time" }),
};
const FORMAT = {
  plain: {},
  markdown: { contentMediaType: "text/markdown" },
  uri: { format: "uri" },
  uuid: { format: "uuid" },
  email: { format: "email" },
};
export const DATATYPES = new Set([...Object.keys(SCALAR), "ref", "dependent", "map"]);
const SCALAR_DATATYPES = new Set(Object.keys(SCALAR));
const STRING_CONSTRAINTS = new Set(["minLength", "maxLength", "pattern"]);
const NUMERIC_CONSTRAINTS = new Set(["minimum", "maximum"]);

/** Injective on (namespace, name, version) — the emitter-owned $defs key contract (Change G). */
export function rangeDefKey(ref) {
  return `${ref.namespace}__${ref.name}__v${ref.version}`;
}

function rangeRefParts(rangeType) {
  // Accept both the ExactTypeRef wire shape ({typeId, typeVersion} + resolved ns/name) and the
  // lightweight {namespace,name,version} used by the paper proof / fixture goldens.
  return {
    namespace: rangeType.namespace,
    name: rangeType.name,
    version: rangeType.version ?? rangeType.typeVersion,
  };
}

function projectScalar(ft) {
  let s = SCALAR[ft.datatype]();
  if (ft.datatype === "string" && ft.format && ft.format !== "plain") s = { ...s, ...FORMAT[ft.format] };
  if (ft.constraints) {
    for (const k of ["minLength", "maxLength", "pattern", "minimum", "maximum"]) {
      if (k in ft.constraints) s[k] = ft.constraints[k];
    }
  }
  if (ft.datatype === "string" && ft.valueDomain === "closed") {
    // Configurable data range -> pure enum (Change G): inline allowedValues, or the Vocabulary's
    // resolved effective Term keys (supplied by the caller as _resolvedVocabKeys at gen time).
    s = { type: "string", enum: ft.allowedValues ?? ft._resolvedVocabKeys ?? [] };
  }
  return s;
}

/** Change G. `$defs` is only consulted for `ref`/inline dangling-check by callers, not mutated. */
export function projectField(ft, $defs = {}) {
  let core;
  if (ft.datatype === "ref") {
    const parts = rangeRefParts(ft.rangeType);
    if (ft.mode === "reference") {
      core = { type: "string", format: "uuid", "x-srs-range-type": `${parts.namespace}/${parts.name}@${parts.version}` };
    } else {
      core = { $ref: `#/$defs/${rangeDefKey(parts)}` };
    }
  } else if (ft.datatype === "map") {
    core = { type: "object", additionalProperties: ft.valueRange === "open" ? true : projectScalar({ datatype: ft.valueRange }) };
  } else if (ft.datatype === "dependent") {
    core = {}; // broad permissible value; conformance is a validation obligation (deliberately lossy)
  } else {
    core = projectScalar(ft);
  }
  if (ft.cardinality === "list") {
    const arr = { type: "array", items: core };
    if (ft.minItems != null) arr.minItems = ft.minItems;
    if (ft.maxItems != null) arr.maxItems = ft.maxItems;
    return arr;
  }
  return core;
}

// ---------------------------------------------------------------------------------------------
// Conformance Rules R1-R11 over a `fieldType` object. Returns a (possibly empty) list of strings.
// This is the semantic validator the embedded-schema `srs` binary cannot yet run (ADR-004) and
// json-schema-lite cannot express (no if/then). It is the load-bearing correctness check.
// ---------------------------------------------------------------------------------------------
export function validateFieldType(ft, ctx = {}) {
  const where = ctx.where ? `${ctx.where}: ` : "";
  const errs = [];
  const push = (rule, msg) => errs.push(`${where}[${rule}] ${msg}`);

  if (ft == null || typeof ft !== "object" || Array.isArray(ft)) {
    push("R1", "fieldType must be an object");
    return errs;
  }
  // R1 — datatype in the enum; cardinality defaults single.
  if (!DATATYPES.has(ft.datatype)) push("R1", `datatype "${ft.datatype}" is not one of ${[...DATATYPES].join(", ")}`);
  if (ft.cardinality != null && ft.cardinality !== "single" && ft.cardinality !== "list") {
    push("R1", `cardinality "${ft.cardinality}" must be "single" or "list"`);
  }

  // R2 — ref requires rangeType (ExactTypeRef); mode defaults inline; rangeType/mode absent otherwise.
  if (ft.datatype === "ref") {
    const rt = ft.rangeType;
    const ok = rt && typeof rt === "object" && typeof rt.typeId === "string" && Number.isInteger(rt.typeVersion) && rt.typeVersion >= 1;
    if (!ok) push("R2", "datatype ref requires rangeType as a valid ExactTypeRef {typeId, typeVersion>=1}");
    if (ft.mode != null && ft.mode !== "inline" && ft.mode !== "reference") push("R2", `mode "${ft.mode}" must be "inline" or "reference"`);
  } else {
    if ("rangeType" in ft) push("R2", "rangeType is only permitted when datatype == ref");
    if ("mode" in ft) push("R2", "mode is only permitted when datatype == ref");
  }

  // R3 — valueDomain only for string; closed => exactly one of allowedValues/vocabularyRef.
  if (ft.valueDomain != null) {
    if (ft.datatype !== "string") push("R3", "valueDomain is meaningful only for datatype == string");
    if (ft.valueDomain !== "open" && ft.valueDomain !== "closed") push("R3", `valueDomain "${ft.valueDomain}" must be "open" or "closed"`);
    if (ft.valueDomain === "closed") {
      const hasInline = Array.isArray(ft.allowedValues) && ft.allowedValues.length > 0;
      const hasRef = typeof ft.vocabularyRef === "string" && ft.vocabularyRef.length > 0;
      if (hasInline === hasRef) push("R3", "valueDomain closed requires exactly one of allowedValues or vocabularyRef");
    }
  } else if (ft.allowedValues != null || ft.vocabularyRef != null) {
    push("R3", "allowedValues/vocabularyRef require valueDomain == closed");
  }

  // R4 — list may carry minItems/maxItems (0 <= minItems <= maxItems).
  const isList = ft.cardinality === "list";
  for (const k of ["minItems", "maxItems"]) {
    if (ft[k] != null) {
      if (!isList) push("R4", `${k} is only permitted when cardinality == list`);
      else if (!Number.isInteger(ft[k]) || ft[k] < 0) push("R4", `${k} must be an integer >= 0`);
    }
  }
  if (ft.minItems != null && ft.maxItems != null && ft.minItems > ft.maxItems) push("R4", "minItems must be <= maxItems");

  // R6 — dependent requires dependsOn (self | sibling field name).
  if (ft.datatype === "dependent") {
    if (typeof ft.dependsOn !== "string" || ft.dependsOn.length === 0) push("R6", "datatype dependent requires dependsOn (\"self\" or a sibling field name)");
  } else if ("dependsOn" in ft) {
    push("R6", "dependsOn is only permitted when datatype == dependent");
  }

  // R9 — map requires a scalar valueRange or "open".
  if (ft.datatype === "map") {
    if (!(ft.valueRange === "open" || SCALAR_DATATYPES.has(ft.valueRange))) {
      push("R9", `map valueRange "${ft.valueRange}" must be a scalar datatype or "open"`);
    }
  } else if ("valueRange" in ft) {
    push("R9", "valueRange is only permitted when datatype == map");
  }

  // R10 — constraints must be datatype-appropriate.
  if (ft.constraints != null) {
    if (typeof ft.constraints !== "object" || Array.isArray(ft.constraints)) {
      push("R10", "constraints must be an object");
    } else {
      for (const k of Object.keys(ft.constraints)) {
        if (STRING_CONSTRAINTS.has(k)) {
          if (ft.datatype !== "string") push("R10", `constraint ${k} applies only to datatype == string`);
        } else if (NUMERIC_CONSTRAINTS.has(k)) {
          if (ft.datatype !== "number" && ft.datatype !== "integer") push("R10", `constraint ${k} applies only to number/integer`);
        } else {
          push("R10", `unknown constraint "${k}"`);
        }
      }
    }
  }

  return errs;
}

// ---------------------------------------------------------------------------------------------
// Change H — migrate a legacy Field definition (valueType + companions) to the fieldType model.
// Pure: returns { fieldType, absorbed[] }. The caller rebuilds the field object (preserving key
// order) so diffs stay minimal. Reproducible: no clocks, no randomness, no ordering ambiguity.
// ---------------------------------------------------------------------------------------------

/** The legacy properties this migration folds into `fieldType` and removes from the Field. */
export const ABSORBED_KEYS = ["valueType", "contentFormat", "allowedValues", "vocabularyRef", "validationRules"];

/** Map a legacy `validationRules[]` entry onto `fieldType` facets (Change F). Mutates `ft`. */
function applyValidationRule(ft, rule) {
  const c = () => (ft.constraints ??= {});
  switch (rule.type) {
    case "minLength": c().minLength = Number(rule.value); break;
    case "maxLength": c().maxLength = Number(rule.value); break;
    case "pattern": c().pattern = String(rule.value); break;
    case "enum":
      ft.valueDomain = "closed";
      if (Array.isArray(rule.value)) ft.allowedValues = rule.value.map(String);
      break;
    case "required": break; // -> FieldAssignment.required (not a fieldType facet); dropped here.
    default: break;
  }
}

/**
 * Compute the `fieldType` object for a legacy field per Change H. Deterministic and total over the
 * eight legacy valueType values; throws on an unknown valueType so a stray value can never pass
 * silently.
 */
export function migrateFieldType(field) {
  const vt = field.valueType;
  const contentFormat = field.contentFormat; // "plain" | "markdown"
  const ft = {};

  switch (vt) {
    case "string":
      ft.datatype = "string";
      if (contentFormat === "markdown") ft.format = "markdown";
      break;
    case "text":
      // Multi-line prose collapses to string; markdown|plain is carried on `format` (Change H).
      ft.datatype = "string";
      ft.format = contentFormat === "markdown" ? "markdown" : "plain";
      break;
    case "number":
      ft.datatype = "number";
      break;
    case "boolean":
      ft.datatype = "boolean";
      break;
    case "date":
      ft.datatype = "date";
      break;
    case "url":
      ft.datatype = "string";
      ft.format = "uri";
      break;
    case "select":
      ft.datatype = "string";
      ft.valueDomain = "closed"; // cardinality single is the default -> omitted
      break;
    case "multiselect":
      ft.datatype = "string";
      ft.cardinality = "list";
      ft.valueDomain = "closed";
      break;
    default:
      throw new Error(`migrateFieldType: unknown legacy valueType "${vt}" on field ${field.namespace}/${field.name}`);
  }

  // Closed-domain source set: exactly one of allowedValues (inline) or vocabularyRef (Change A/R3).
  if (ft.valueDomain === "closed") {
    if (Array.isArray(field.allowedValues) && field.allowedValues.length > 0) {
      ft.allowedValues = field.allowedValues.slice();
    } else if (typeof field.vocabularyRef === "string" && field.vocabularyRef.length > 0) {
      ft.vocabularyRef = field.vocabularyRef;
    }
    // (A closed select with neither is a pre-existing data defect; validateFieldType flags it.)
  }

  // validationRules[] -> constraints / valueDomain (Change F). None exist in the current repo, but
  // the transform is total so a downstream package migrates identically.
  if (Array.isArray(field.validationRules)) {
    for (const rule of field.validationRules) applyValidationRule(ft, rule);
  }

  const absorbed = ABSORBED_KEYS.filter((k) => k in field);
  return { fieldType: ft, absorbed };
}

/**
 * Rebuild a legacy field object into its migrated form, preserving original key order for a clean
 * diff: `fieldType` takes the slot the first absorbed key occupied; the other absorbed keys drop.
 */
export function migrateFieldObject(field) {
  // Idempotent: an already-migrated field (no legacy `valueType`) is returned untouched, never
  // re-run through the transform (which would throw on the absent valueType).
  if (field == null || typeof field !== "object" || typeof field.valueType !== "string") {
    return { field, changed: false, fieldType: field?.fieldType };
  }
  const { fieldType, absorbed } = migrateFieldType(field);
  if (absorbed.length === 0) return { field, changed: false, fieldType };
  const out = {};
  let placed = false;
  for (const [k, v] of Object.entries(field)) {
    if (ABSORBED_KEYS.includes(k)) {
      if (!placed) {
        out.fieldType = fieldType;
        placed = true;
      }
      continue; // drop absorbed keys
    }
    out[k] = v;
  }
  if (!placed) out.fieldType = fieldType; // no absorbed key present (shouldn't happen); append
  return { field: out, changed: true, fieldType };
}
