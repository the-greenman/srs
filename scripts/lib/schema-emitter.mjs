/**
 * schema-emitter.mjs — RFC-035 reference emitter: meta-model Type records -> neutral IR -> JSON Schema 2020-12.
 *
 * The whole-entity generalization of RFC-032's per-fieldType `projectField` (scripts/lib/rfc-032-fieldtype.mjs):
 * it walks a Type's FieldAssignments, projects each Field's `fieldType`, and assembles a complete
 * `{ $schema, $id, title, description, type:object, required, additionalProperties, properties, $defs }`
 * definition schema.
 *
 * Design (RFC-035, extended by RFC-040 Change F/G):
 *   - front half (package-resolving)  -> neutral IR  -> a JSON emitter (this file's only NOW emitter).
 *   - the IR node RETAINS the source `fieldType` verbatim, so the JSON emitter's per-node renderer is
 *     `projectField` run UNCHANGED (Change B). `kind` is a derived tag a non-JSON target would dispatch on.
 *   - `$defs` key is emitter-owned (Change D): `<ns>__<name>__v<version>`, spelled by resolving the record's
 *     ExactTypeRef.typeId -> (namespace, name) against the package. Injective on (ns, name, version).
 *   - snake_case Field.name -> lowerCamelCase JSON key, with a committed override table (Change E).
 *   - deterministic: fixed top-level key order + pre-order-DFS `$defs` order (Change B, [R6]).
 *   - RFC-040 Change A: the emitter always consumes the RESOLVED EFFECTIVE Type (ancestor chain per
 *     I-39..43+I-97), never a Type's own bare `fields[]` — see `resolveEffectiveType`/`withEffectiveType`.
 *   - RFC-040 Change G: the emitter knows what it is emitting FOR — `facing: "definition" | "instance"`
 *     (default "definition") — definitions are fully closed; instances are closed-except-`meta`.
 *   - RFC-040 Change F: a Type's own `validationRules` (CrossFieldRule[]) project to `allOf`/`if`/`then`
 *     guards on that Type's own entity schema (`projectValidationRules`); the FieldType entity itself
 *     carries a fixed, hand-mirrored co-occurrence envelope (R2/R3/R9/R10, `FIELD_TYPE_ENVELOPE`).
 *
 * Pure (no I/O beyond `loadPackage` reading the package dir). No clocks, no randomness. ADR-004: verified
 * through the Node pipeline, never the (pre-RFC-032) binary.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { projectField, rangeDefKey } from "./rfc-032-fieldtype.mjs";

// --- name projection (Change E) ------------------------------------------------------------------
/** Committed override table: metamodel Field.name -> JSON key, where lowerCamelCase is not the seed key.
 * RFC-040 Unit 1 (srs#477) Change D retires the pre-existing `assignment_default_value` entry (the
 * property is removed); Change B adds the two entries below for the new value-object Types. */
export const NAME_OVERRIDES = { kind: "type", transition_name: "name" };
/** snake_case -> lowerCamelCase, deterministic and injective over the in-scope metamodel field names. */
export function jsonKey(fieldName) {
  return NAME_OVERRIDES[fieldName] ?? fieldName.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}
/** The one package whose Field names the camelCase+override transform above applies to (Change E's
 * "in-scope meta-model Types"). Everything else is a domain Type: RFC-039 [R2a]/[R2b] project
 * `Field.name` VERBATIM as the JSON property key — no case transform, no override table — so a
 * domain Field literally named `kind` (this train's own `cross-field-rule.kind` metamodel field is
 * the one deliberate exception, hence the override) is not silently rewritten to `type`. */
const METAMODEL_NAMESPACE = "com.semanticops.srs";
/** Emit the wire key for a Field within `ctx`'s own package: the metamodel transform if `ctx.pkg` IS
 * the metamodel package, `Field.name` verbatim for every other (domain) package. */
function wireKey(ctx, fieldName) {
  return ctx.pkg.namespace === METAMODEL_NAMESPACE ? jsonKey(fieldName) : fieldName;
}

// --- $id / $comment / title policy (Change C, extended by Unit 3 for byte closure) ----------------
/** The two frozen meta-model ENTITIES keep their reserved 2.0/ data-model-line ids (RFC-033 Change C item 1). */
export const ENTITY_IDS = {
  field: "https://srs.semanticops.com/schema/2.0/field.json",
  type: "https://srs.semanticops.com/schema/2.0/type.json",
};
/** Domain (non-meta-model) Type -> RFC-004 generated-schema template (Change C item 2). */
export function domainId(ns, name, version) {
  return `https://srs.semanticops.com/schema/domain/${ns}/${name}/${version}.json`;
}
/** `title` is emitted uniformly (Change G) but has no modelled source for the frozen entities — this
 * is the same kind of fixed envelope constant as ENTITY_IDS, not a projected Field/Type value. */
export const ENTITY_TITLES = {
  field: "SRS Field Definition",
  type: "SRS Type Definition",
};
/** `$comment` on the two frozen entity files is hand-authored framing prose describing the file's own
 * bootstrap status — it has no record-level source (there is no Field for "$comment") and is excluded
 * from the Tier-2 closure test's subset comparison for exactly that reason. It is still reproduced here
 * verbatim so the Unit-3 byte-level regenerate-and-diff gate can pass: a fixed envelope constant, the
 * same role ENTITY_IDS/ENTITY_TITLES play, never a modelled/projected value. */
export const ENTITY_COMMENTS = {
  field: "RFC-033 frozen-seed fixed point: this hand-authored schema is the bootstrap base case, loaded as committed and never re-derived at runtime (a schema that defines Field cannot be parsed without the Field schema). Its record-level source is the com.semanticops.srs/metamodel package (the `field` Type + FieldType/ExactTypeRef/AiGuidance/AiGuidanceExample/Lineage/Provenance value-object Types); the #259 emitter regenerates this file from those records, and docs/schema/2.0/metamodel-fidelity.md declares which features round-trip authoritatively vs are approximated.",
  type: "RFC-033 frozen-seed fixed point: this hand-authored schema is the bootstrap base case, loaded as committed and never re-derived at runtime. Its record-level source is the com.semanticops.srs/metamodel package (the `type` + `field-assignment` Types; v1.0.0 covers the core definition facets, deferring lifecycle/type-inheritance/cross-field-validation/field-groups/identityFieldId). The #259 emitter regenerates this file from those records; docs/schema/2.0/metamodel-fidelity.md declares per-emitter fidelity.",
};

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

// --- effective-Type resolution (RFC-040 Change A; ratified invariants I-39..43 + I-97) -------------
/**
 * Applies a single extending Type's `fieldAssignmentOverrides` (I-42: only to inherited fields,
 * `required` tighten-only false->true, `displayLabel` override) to a merged field list, if declared.
 * Field SET composition only — order resolution (default `.order` sort, then `fieldOrder` override)
 * is centralized in `emitBody` so it runs exactly once regardless of merge direction (see
 * `withEffectiveType`/`resolveEffectiveType`, which propagate any declared `fieldOrder` onto the
 * returned merged Type for `emitBody` to apply — merging it in here too would double-apply once
 * `emitBody`'s own default sort ran over an already fieldOrder-permuted list). Shared by both merge
 * directions below.
 */
function applyOverrides(fields, extenders) {
  // I-42: "must not reference fields declared in the specializing Type's own fields[]" — an override
  // may only target a field INHERITED from the base (or an ancestor), never any extender's own. In
  // the sibling-merge direction (multiple extenders of one base, `withEffectiveType`) no sibling is an
  // ancestor of another, so this protects the union of every extender's own fields — not just the
  // issuing extender's — closing the cross-sibling gap the single-extender check would miss. In the
  // child-perspective direction (`resolveEffectiveType`) there is exactly one extender (`t` itself), so
  // this is identical to the narrower check.
  const allOwnIds = new Set(extenders.flatMap((e) => (e.fields || []).map((f) => f.fieldId)));
  const overridesByFieldId = {};
  for (const ext of extenders) {
    for (const o of ext.fieldAssignmentOverrides || []) {
      if (allOwnIds.has(o.fieldId)) continue;
      // Two different extenders both overriding the same inherited base field would silently
      // last-extender-wins here (object-iteration order) — unreachable today (no metamodel facet
      // declares any override), flagged rather than built out into a conflict-diagnostic for a case
      // nothing currently exercises.
      overridesByFieldId[o.fieldId] = o;
    }
  }
  return fields.map((f) => {
    const o = overridesByFieldId[f.fieldId];
    if (!o) return f;
    const patched = { ...f };
    if (o.required === true) patched.required = true; // I-42: tighten-only
    if (o.displayLabel !== undefined) patched.displayLabel = o.displayLabel;
    return patched;
  });
}

/**
 * Sibling-merge effective resolution, queried from a BASE Type's name: unions the base's own fields
 * with every Type that declares `extendsTypeId === base.id` (I-39/I-40; I-97: none of validationRules
 * is ever unioned in — each extender's field list is its OWN contributed properties, so a facet that
 * only contributes `validationRules` correctly adds that one property, not an inherited copy of
 * anything). This is the query direction the frozen `type`/`field` entities need: v1.1.0 models the
 * extension-owned Type facets (lifecycle, inheritance, cross-field-validation) as three SEPARATE
 * sibling Types each independently extending core `type` (RFC-040 Change A), and the frozen seed is
 * one flat object carrying core + all three simultaneously — reconstituting that flat shape means
 * merging ALL of a base's extenders at once, not walking one child's single ancestor chain.
 *
 * Exported for direct use by the closure tests (which need the merged field SET, not a full emitted
 * schema) — real emission never calls this for an arbitrary base Type: `resolveForEmission` gates the
 * sibling-merge to the frozen `field`/`type` entities specifically (`typeName in ENTITY_IDS`), because
 * unioning in every child unconditionally is only correct for THAT bootstrap reconstruction, not as a
 * general "show me this base Type" query. A caller reaching for this function directly should be
 * doing exactly the bootstrap-reconstruction thing, not treating it as effective-Type resolution for
 * an arbitrary base Type with children.
 */
export function effectiveFields(ctx, typeName) {
  const base = ctx.typesByName[typeName];
  const extenders = Object.values(ctx.typesById).filter((t) => t.extendsTypeId === base.id);
  if (extenders.length === 0) return base.fields;
  const merged = [...base.fields, ...extenders.flatMap((t) => t.fields)];
  // I-40: "must not declare a fieldId ... that duplicates any fieldId inherited from its base Type or
  // any ancestor Type" — across base + every sibling extender here (no two of base/extender1/.../
  // extenderN may declare the same fieldId). A silent duplicate would double-count that property
  // (visible as a duplicate `required[]` entry, invalid against the JSON Schema meta-schema itself).
  const seen = new Set();
  for (const f of merged) {
    if (seen.has(f.fieldId)) {
      throw new Error(`schema-emitter: ${typeName}'s effective field set declares fieldId ${f.fieldId} more than once across base + extenders (I-40)`);
    }
    seen.add(f.fieldId);
  }
  return applyOverrides(merged, extenders);
}

/** Any extender's own declared `fieldOrder` (I-41) — order resolution is `emitBody`'s job; this just
 * finds the declaration to propagate onto the merged Type object. If more than one sibling extender
 * declared a `fieldOrder`, `.find()` silently picks the first in `extenders`' (deterministic — package
 * load order, `TYPE_ORDER`'s fixed array position for the metamodel) iteration order — the same
 * unreachable-today, flagged-rather-than-built-out residual `applyOverrides` documents for its own
 * last-extender-wins case; only one metamodel facet (`inheritance-facet`) currently declares one. */
function declaredFieldOrder(extenders) {
  return extenders.map((e) => e.fieldOrder).find((fo) => fo && fo.length);
}

/** A ctx whose `typesByName[typeName]` carries the merged effective fields (see `effectiveFields`),
 * and a declared `fieldOrder` (for `emitBody` to apply) — the BASE's own, if it declares one (I-41
 * applies to any Type, extended or not), else the first extender's. */
export function withEffectiveType(ctx, typeName) {
  const base = ctx.typesByName[typeName];
  const extenders = Object.values(ctx.typesById).filter((t) => t.extendsTypeId === base.id);
  const fieldOrder = base.fieldOrder ?? declaredFieldOrder(extenders);
  const merged = { ...base, fields: effectiveFields(ctx, typeName), fieldOrder };
  return { ...ctx, typesByName: { ...ctx.typesByName, [typeName]: merged } };
}

/**
 * Standard child-perspective effective-Type resolution (I-39..43): given a Type T that declares its
 * OWN `extendsTypeId`, walk up the (acyclic, per I-39) ancestor chain, and merge each ancestor's
 * effective fields with T's own, applying T's own `fieldAssignmentOverrides`/`fieldOrder`. Returns a
 * Type shaped like T (T's own identity/$id/name/namespace/description), with `.fields` replaced by
 * the effective merged list. This is the general Change-A case (one Type extends one base Type) —
 * distinct from `withEffectiveType`'s sibling-merge, which is specific to reconstituting the frozen
 * `type`/`field` entities from their multiple independent extension facets.
 */
export function resolveEffectiveType(ctx, typeName, seen = new Set()) {
  const t = ctx.typesByName[typeName];
  if (!t) throw new Error(`schema-emitter: unknown type ${typeName}`);
  if (!t.extendsTypeId) return t;
  if (seen.has(t.id)) throw new Error(`schema-emitter: cyclic extendsTypeId chain at ${typeName}`); // I-39
  const base = ctx.typesById[t.extendsTypeId];
  if (!base) throw new Error(`schema-emitter: unresolved extendsTypeId on ${typeName}`);
  const baseCtx = { ...ctx, typesByName: { ...ctx.typesByName, [base.name]: base } };
  const effectiveBase = resolveEffectiveType(baseCtx, base.name, new Set([...seen, t.id]));
  const ownFieldIds = new Set(t.fields.map((f) => f.fieldId)); // I-40 defensive de-dup
  const inherited = effectiveBase.fields.filter((f) => !ownFieldIds.has(f.fieldId));
  const merged = applyOverrides([...inherited, ...t.fields], [t]);
  return { ...t, fields: merged, fieldOrder: declaredFieldOrder([t]) };
}

/**
 * Resolve `typeName`'s effective Type by whichever direction applies:
 *   - a Type that declares its own `extendsTypeId` resolves via its ancestor chain
 *     (`resolveEffectiveType`) — the general Change-A case (a domain Type extending a base).
 *   - the frozen `field`/`type` entities (named in `ENTITY_IDS`) resolve via the sibling-merge
 *     (`withEffectiveType`) — the bootstrap-specific case reconstituting their flattened seed shape
 *     from multiple independent facet Types.
 *   - anything else (an ordinary base Type with no `extendsTypeId` of its own, whether or not OTHER
 *     Types happen to extend it) resolves to ITSELF, unchanged. Emitting a base Type directly must
 *     show that Type's OWN contract, not silently absorb whatever children it happens to have — the
 *     sibling-merge is reserved for the two entities that specifically need it, not applied to every
 *     base Type as an automatic fallback (which would make e.g. `emitEntity(ctx, "widget")` include a
 *     child `gadget`'s own fields whenever any child of `widget` existed in the package at all).
 */
function resolveForEmission(ctx, typeName) {
  const t = ctx.typesByName[typeName];
  if (!t) throw new Error(`schema-emitter: unknown type ${typeName}`);
  if (typeName in ENTITY_IDS && t.extendsTypeId) {
    // A frozen bootstrap entity declaring its OWN extendsTypeId is an unsupported combination this
    // resolver was never designed for: which direction wins is genuinely ambiguous (child-perspective
    // would silently skip the sibling-merge these two entities exist to reconstitute). Loud, not a
    // silent pick — the same "silent-drop -> throw" treatment already given to I-40/I-41/I-42 and the
    // meta-key collision elsewhere in this file.
    throw new Error(`schema-emitter: ${typeName} is a frozen bootstrap entity (ENTITY_IDS) AND declares its own extendsTypeId — unsupported combination, ambiguous merge direction`);
  }
  if (t.extendsTypeId) {
    return { ...ctx, typesByName: { ...ctx.typesByName, [typeName]: resolveEffectiveType(ctx, typeName) } };
  }
  if (typeName in ENTITY_IDS) return withEffectiveType(ctx, typeName);
  return ctx;
}

// --- RFC-040 Change F: conditional projection ------------------------------------------------------
/**
 * The FieldType entity-level co-occurrence envelope (R2/R3/R9/R10 in rfc-032-fieldtype.mjs's
 * validateFieldType). Entity-specific and hand-mirrored — these are fixed structural rules over
 * FieldType's OWN properties, not a generic CrossFieldRule projection; rfc-032-fieldtype.mjs's
 * validateFieldType is the semantic source of truth, this is its JSON Schema shape. Matches the
 * frozen seed's `field.json` `$defs.FieldType.allOf` byte-for-byte.
 */
const FIELD_TYPE_ENVELOPE = [
  {
    if: { properties: { datatype: { const: "ref" } }, required: ["datatype"] },
    then: { required: ["rangeType"] },
    else: { not: { anyOf: [{ required: ["rangeType"] }, { required: ["mode"] }] } },
  },
  {
    if: { properties: { datatype: { const: "dependent" } }, required: ["datatype"] },
    then: { required: ["dependsOn"] },
    else: { not: { required: ["dependsOn"] } },
  },
  {
    if: { properties: { datatype: { const: "map" } }, required: ["datatype"] },
    then: { required: ["valueRange"] },
    else: { not: { required: ["valueRange"] } },
  },
  {
    if: { properties: { valueDomain: { const: "closed" } }, required: ["valueDomain"] },
    then: {
      oneOf: [
        { required: ["allowedValues"], not: { required: ["vocabularyRef"] } },
        { required: ["vocabularyRef"], not: { required: ["allowedValues"] } },
      ],
    },
  },
];

/**
 * Project one Type's own `validationRules` (CrossFieldRule[], I-97 — never inherited, always the
 * Type's own complete set) to `allOf` guard clauses on THAT Type's own entity schema.
 * `conditional-required`/`conditional-forbidden` share the predicate/target shape (`if` guards on the
 * predicate's projected JSON key equalling `predicateValue`); `mutual-exclusion` projects as pairwise
 * `not` guards over the `fieldIds` set (the "at most one of N" reading — correct and simple for any
 * N, unlike a single combinatorial `oneOf`). `field-ordering` has no JSON Schema construct (document
 * order is not schema-checkable) and is intentionally left unprojected — still approximated, per the
 * fidelity dashboard; a rule of that kind is silently skipped here, never dropped without record (the
 * dashboard documents the gap).
 */
export function projectValidationRules(ctx, rules) {
  const keyOf = (fieldId) => wireKey(ctx, ctx.fieldsById[fieldId].name);
  const out = [];
  for (const rule of rules || []) {
    switch (rule.kind ?? rule.type) {
      case "conditional-required": {
        const p = keyOf(rule.predicateFieldId), t = keyOf(rule.targetFieldId);
        out.push({ if: { properties: { [p]: { const: rule.predicateValue } }, required: [p] }, then: { required: [t] } });
        break;
      }
      case "conditional-forbidden": {
        const p = keyOf(rule.predicateFieldId), t = keyOf(rule.targetFieldId);
        out.push({ if: { properties: { [p]: { const: rule.predicateValue } }, required: [p] }, then: { not: { required: [t] } } });
        break;
      }
      case "mutual-exclusion": {
        const keys = (rule.fieldIds || []).map(keyOf);
        for (let i = 0; i < keys.length; i++) {
          for (let j = i + 1; j < keys.length; j++) out.push({ not: { required: [keys[i], keys[j]] } });
        }
        break;
      }
      default:
        break; // field-ordering: no JSON Schema equivalent — approximated by design
    }
  }
  return out;
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

/**
 * Emit a Type's object body (no $schema/$id/title) — used for both entities and their value-object $defs.
 * Key order: `type`, `required`, `additionalProperties`, `description`, `properties`, `allOf` — one
 * fixed order for every entity/$def (the frozen seed's pre-RFC-040 `FieldType` def, whose hand-authored
 * key order once differed, is normalized to this same order as part of Unit 3's byte-closure work).
 * RFC-040 Change C: `FieldAssignment.description` projects to the property's own `description`
 * (documentation-only, annotation position only — never a constraint keyword); RFC-035/RFC-040:
 * `FieldAssignment.displayLabel` projects to the property's `title`. RFC-040 Change F: a Type's own
 * `validationRules` project to `allOf` guards on this same body; `field-type` carries its own fixed
 * `allOf` envelope instead (R2/R3/R9/R10 — no Type carries both mechanisms).
 */
function emitBody(ctx, typeName, defs) {
  const t = ctx.typesByName[typeName];
  if (!t) throw new Error(`schema-emitter: unknown type ${typeName}`);
  // Default composition order is FieldAssignment.order (ties broken by declaration position); an
  // explicit Type.fieldOrder (I-41: an exact permutation of the effective fieldId set) overrides it.
  // Centralized here (not in the merge helpers) so it runs exactly once regardless of merge direction.
  let orderedFields = [...t.fields].sort((x, y) => x.order - y.order);
  if (t.fieldOrder && t.fieldOrder.length) {
    const byId = new Map(orderedFields.map((f) => [f.fieldId, f]));
    const effectiveIds = new Set(byId.keys());
    const orderIds = new Set(t.fieldOrder);
    // I-41: fieldOrder MUST contain exactly the effective fieldId set — no duplicate, none absent.
    // A violation is a data error, not a silent property drop: `.filter(Boolean)` over an unresolved
    // id would otherwise make a required property vanish from the emitted schema with no diagnostic.
    if (orderIds.size !== t.fieldOrder.length || orderIds.size !== effectiveIds.size || [...orderIds].some((id) => !effectiveIds.has(id))) {
      throw new Error(`schema-emitter: ${typeName}.fieldOrder is not an exact permutation of its effective field set (I-41)`);
    }
    orderedFields = t.fieldOrder.map((id) => byId.get(id));
  }
  const properties = {};
  const required = [];
  for (const a of orderedFields) {
    const f = ctx.fieldsById[a.fieldId];
    const key = wireKey(ctx, f.name);
    const frag = renderNode(ctx, f.fieldType, defs);
    if (a.description) frag.description = a.description; // Change C: documentation-only annotation
    if (a.displayLabel) frag.title = a.displayLabel;
    properties[key] = frag;
    if (a.required) required.push(key);
  }
  const allOf = typeName === "field-type" ? FIELD_TYPE_ENVELOPE : projectValidationRules(ctx, t.validationRules);

  const body = { type: "object" };
  if (required.length) body.required = required;
  body.additionalProperties = false;
  if (t.description && !DEF_DESCRIPTION_SUPPRESSED.has(typeName)) body.description = t.description;
  body.properties = properties;
  if (allOf.length) body.allOf = allOf;
  return body;
}

/**
 * A handful of value-object Types carry a modelled `Type.description` (a genuinely required field on
 * every Type record — RFC-033) that is never meant to surface on the $def itself: their meaning is
 * fully contextual, expressed per use-site via the referencing `FieldAssignment.description` instead
 * (e.g. `type-lifecycle`'s own contextual text lives on `type.lifecycle`'s property fragment, sibling
 * to its `$ref` — see `lifecycle-facet`'s assignment in gen-metamodel-package.mjs). Contrast
 * `field-type`/`lifecycle-state`/`requires-relation`/`field-assignment-override`/`cross-field-rule`,
 * whose standalone meaning IS worth documenting at the object level and which the frozen seed does
 * carry a description for. A committed, targeted table — the same role NAME_OVERRIDES plays for key
 * spelling — rather than silently guessing a rule the data doesn't uniformly follow.
 */
const DEF_DESCRIPTION_SUPPRESSED = new Set([
  "ai-guidance", "ai-guidance-example", "lineage", "provenance", "type-lifecycle", "lifecycle-transition", "field-assignment",
]);

/** Emit one meta-model entity as a full JSON Schema 2020-12 definition schema (fixed top-level key order).
 * `opts.facing`: "definition" (default) — fully closed; "instance" — closed except `meta` (RFC-040
 * Change G / rfc-decision-2e0cd70a): the emitted schema is the production contract for validating a
 * Record's `fieldValues` interior, and a carried `meta` key is the one sanctioned escape — declared
 * here as an open property so `additionalProperties: false` still rejects everything else. */
export function emitEntity(ctx, typeName, opts = {}) {
  const { facing = "definition" } = opts;
  const resolvedCtx = resolveForEmission(ctx, typeName);
  const t = resolvedCtx.typesByName[typeName];
  const defs = {};
  const bodyProps = emitBody(resolvedCtx, typeName, defs); // walking the entity fills `defs` in pre-order DFS
  const out = {};
  out.$schema = "https://json-schema.org/draft/2020-12/schema";
  out.$id = ENTITY_IDS[typeName] ?? domainId(t.namespace, t.name, t.version);
  if (ENTITY_TITLES[typeName]) out.title = ENTITY_TITLES[typeName];
  if (t.description) out.description = t.description;
  if (ENTITY_COMMENTS[typeName]) out.$comment = ENTITY_COMMENTS[typeName];
  out.type = "object";
  if (bodyProps.required) out.required = bodyProps.required;
  out.additionalProperties = false;
  const properties = {};
  // The two frozen entities' OWN instance files (Field/Type records) carry a literal `$schema`
  // self-reference data property (RFC-031 R1 carve-out) that has no modelled counterpart — it is
  // structural framing, the same role as ENTITY_IDS/ENTITY_COMMENTS, never a FieldAssignment walked
  // above. It is placed first to match the frozen seed's property order.
  if (typeName in ENTITY_IDS) properties.$schema = { type: "string" };
  Object.assign(properties, bodyProps.properties);
  if (facing === "instance") {
    // rfc-decision-2e0cd70a: `meta` is the sanctioned extension carrier and MUST stay the open
    // escape — never silently narrowed by a Type's own Field of the same name. A Type declaring its
    // own Field literally named `meta` is a genuine modelling conflict with this reserved
    // instance-facing key (2e0cd70a's own standard: silent tolerance of a defect is itself a defect —
    // "the fix to Postel's law is not less tolerance but mandatory naming of what was tolerated").
    // Loud and immediate, matching this unit's I-41 precedent (silent-drop -> throw): rename the
    // colliding Field rather than let it be silently overridden or silently kept undersized.
    if ("meta" in properties) {
      throw new Error(`schema-emitter: ${typeName} declares its own Field named "meta", which collides with the reserved instance-facing extension carrier (rfc-decision-2e0cd70a) — rename the Field`);
    }
    properties.meta = { type: "object" };
  }
  out.properties = properties;
  if (bodyProps.allOf) out.allOf = bodyProps.allOf;
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
