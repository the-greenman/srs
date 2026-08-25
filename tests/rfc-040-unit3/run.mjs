#!/usr/bin/env node
/**
 * tests/rfc-040-unit3/run.mjs — RFC-040 Unit 3 (srs#479) Change G golden fixtures.
 *
 * Proves, on domain (non-meta-model) Types — not the frozen `field`/`type` entities, which the
 * regenerate-and-diff gate already covers — the three mechanisms Unit 3 adds to real emission:
 *
 *   1. Effective-Type resolution (`resolveEffectiveType`, I-39..43): `gadget` extends `widget`,
 *      overrides `status` (tighten-only, I-42), and pins a `fieldOrder` (I-41) — proving the STANDARD
 *      single-ancestor merge direction, distinct from the metamodel's own sibling-merge bootstrap case
 *      (schema-emitter.mjs `withEffectiveType`, exercised by the frozen `type` entity instead).
 *   2. The facing distinction (rfc-decision-2e0cd70a): the same `gadget` schema emitted
 *      definition-facing (fully closed) vs instance-facing (closed except `meta`).
 *   3. Conditional projection (Change F): `ticket`'s own `validationRules` — conditional-required,
 *      conditional-forbidden, mutual-exclusion — project to real `allOf`/`if`/`then` guards.
 *
 * Fixture package: tests/rfc-040-unit3/fixture-package/ (test-only; outside srs/package/** and
 * packages/**, so scripts/validate-all.mjs's package walker never discovers it as a live package).
 * Node pipeline only (ADR-004 discipline, though nothing here touches the metamodel package).
 */
import assert from "node:assert/strict";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadPackage, emitEntity, resolveEffectiveType, withEffectiveType } from "../../scripts/lib/schema-emitter.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "fixture-package");
let pass = 0;
function check(label, cond) {
  assert.ok(cond, label);
  pass++;
  console.log(`  ✓ ${label}`);
}

const ctx = loadPackage(FIXTURE);

// --- widget: emitting a BASE Type directly must show ITS OWN contract, never a child's -------------
// `gadget` extends `widget` below; `widget` itself is not one of the frozen field/type bootstrap
// entities, so emitting it must NOT trigger the sibling-merge (that direction is reserved for `field`/
// `type` specifically — see resolveForEmission's docstring). A regression here would silently fold a
// child's own fields into its base's standalone schema whenever any child of a base Type existed.
const widgetDef = emitEntity(ctx, "widget");
check("widget: emitting a base Type directly shows only ITS OWN fields, not a child's (gadget's `serial`)",
  Object.keys(widgetDef.properties).join(",") === "name,status" && !("serial" in widgetDef.properties));

// --- 1. Effective-Type resolution + 2. facing distinction, both on `gadget` -----------------------
const gadgetDef = emitEntity(ctx, "gadget"); // facing defaults to "definition"
check("gadget: effective fields follow the pinned fieldOrder (serial, name, status)",
  Object.keys(gadgetDef.properties).join(",") === "serial,name,status");
check("gadget: inherited `status` is tightened to required by the fieldAssignmentOverride (I-42)",
  gadgetDef.required.includes("status"));
check("gadget: own field `serial` is required (own FieldAssignment, unaffected by the override)",
  gadgetDef.required.includes("name") && gadgetDef.required.includes("serial"));
check("gadget: inherited `status`'s FieldAssignment.displayLabel still projects to title",
  gadgetDef.properties.status.title === "Status");
check("gadget: definition-facing is fully closed — no `meta` escape",
  gadgetDef.additionalProperties === false && !("meta" in gadgetDef.properties));

const gadgetInstance = emitEntity(ctx, "gadget", { facing: "instance" });
check("gadget: instance-facing declares `meta` as an open escape property",
  gadgetInstance.properties.meta && gadgetInstance.properties.meta.type === "object");
check("gadget: instance-facing is still closed-except-meta (additionalProperties:false)",
  gadgetInstance.additionalProperties === false);
check("gadget: instance-facing keeps every definition-facing property unchanged",
  ["serial", "name", "status"].every((k) => k in gadgetInstance.properties));

// --- 3. Conditional projection on `ticket` ----------------------------------------------------
const ticket = emitEntity(ctx, "ticket");
const allOf = ticket.allOf || [];
check("ticket: conditional-required projects an if/then guard (kind==bug -> priority required)",
  allOf.some((c) => c.if?.properties?.kind?.const === "bug" && c.then?.required?.includes("priority")));
check("ticket: conditional-forbidden projects an if/then/not guard (kind==feature -> blocker_id forbidden)",
  allOf.some((c) => c.if?.properties?.kind?.const === "feature" && c.then?.not?.required?.includes("blocker_id")));
check("ticket: mutual-exclusion projects a pairwise not-required guard (priority, blocker_id)",
  allOf.some((c) => c.not?.required?.length === 2 && c.not.required.includes("priority") && c.not.required.includes("blocker_id")));
check("ticket: exactly 3 allOf clauses (one per validationRules entry — none dropped, none doubled)",
  allOf.length === 3);

// --- reserved-key collision: `gizmo` declares its OWN Field literally named `meta` ------------------
const gizmoDef = emitEntity(ctx, "gizmo"); // definition-facing: the Field's own (string) shape stands
check("gizmo: definition-facing keeps the Type's own `meta` Field as declared (string)",
  gizmoDef.properties.meta.type === "string");
assert.throws(() => emitEntity(ctx, "gizmo", { facing: "instance" }), /reserved instance-facing extension carrier/,
  "instance-facing a Type with its own `meta` Field throws (loud conflict), rather than silently overriding it");
pass++;
console.log("  ✓ gizmo: instance-facing a Type whose own Field collides with the reserved `meta` key throws, never silently overrides");

// --- I-41: a malformed fieldOrder (not an exact permutation) is a thrown error, never a silent drop --
{
  const base = ctx.typesByName.widget;
  const badCtx = { ...ctx, typesByName: { ...ctx.typesByName, widget: { ...base, fieldOrder: [base.fields[0].fieldId] } } };
  assert.throws(() => emitEntity(badCtx, "widget"), /I-41/, "a fieldOrder missing a field errors, not silently drops it");
  pass++;
  console.log("  ✓ I-41: a fieldOrder that omits an effective field throws rather than silently emitting fewer properties");
}

// --- I-42: an override naming the SPECIALIZING Type's OWN field (not an inherited one) is ignored ---
{
  const gadget = ctx.typesByName.gadget;
  const selfOverridingGadget = {
    ...gadget,
    fieldAssignmentOverrides: [{ fieldId: "f0000003-0000-4000-a000-000000000003", required: false }], // targets gadget's OWN `serial`, not an inherited field
  };
  const badCtx = { ...ctx, typesByName: { ...ctx.typesByName, gadget: selfOverridingGadget } };
  const resolved = resolveEffectiveType(badCtx, "gadget");
  const serialAssignment = resolved.fields.find((f) => f.fieldId === "f0000003-0000-4000-a000-000000000003");
  check("I-42: an override naming the specializing Type's own field is ignored (serial stays required)",
    serialAssignment.required === true);
}

// --- I-40: a fieldId declared by more than one of base/extenders in the sibling-merge is a thrown --
// error, never a silent duplicate (which would otherwise surface as an invalid duplicate entry in a
// `required[]` array — JSON Schema 2020-12's own `required` has `uniqueItems: true`).
{
  const base = ctx.typesByName.widget;
  const rogueExtender = { ...ctx.typesByName.gadget, extendsTypeId: base.id, fields: [base.fields[0]] }; // redeclares widget's own `name` fieldId
  const badCtx = { ...ctx, typesById: { ...ctx.typesById, [rogueExtender.id]: rogueExtender } };
  assert.throws(() => withEffectiveType(badCtx, "widget"), /I-40/, "a sibling extender redeclaring an existing fieldId errors, not silently duplicates it");
  pass++;
  console.log("  ✓ I-40: a fieldId declared twice across base + sibling extenders throws rather than silently duplicating");
}

// --- resolveForEmission: a frozen bootstrap entity (ENTITY_IDS) that ALSO declares its own --------
// extendsTypeId is an unsupported, ambiguous combination — thrown, never silently resolved one way.
{
  // isBootstrapEntity requires BOTH the name AND the metamodel package namespace — simulate the real
  // scenario (the actual metamodel package's own "type" gaining an extendsTypeId), not just a
  // same-named domain Type (which, correctly, no longer triggers this check post round-5's fix).
  const gizmoRenamedAsType = { ...ctx.typesByName.gizmo, name: "type", extendsTypeId: ctx.typesByName.widget.id, extendsTypeVersion: 1 };
  const badCtx = {
    ...ctx,
    pkg: { ...ctx.pkg, namespace: "com.semanticops.srs" },
    typesByName: { ...ctx.typesByName, type: gizmoRenamedAsType },
  };
  assert.throws(() => emitEntity(badCtx, "type"), /unsupported combination/,
    "a frozen entity name (ENTITY_IDS) that also declares extendsTypeId errors, not silently picks a direction");
  pass++;
  console.log("  ✓ resolveForEmission: an ENTITY_IDS entity with its own extendsTypeId throws (ambiguous merge direction)");
}

// --- a domain Type literally named "field"/"type" must NOT hijack the frozen bootstrap identity ----
// (ENTITY_IDS/ENTITY_TITLES/ENTITY_COMMENTS and the sibling-merge are gated by NAME + the metamodel
// package's namespace together, not name alone — a domain package's own "field"/"type" Type is a
// plausible name collision in any schema-authoring domain and must get an ordinary domain schema).
{
  const widgetAsField = { ...ctx.typesByName.widget, name: "field" };
  const badCtx = { ...ctx, typesByName: { ...ctx.typesByName, field: widgetAsField } };
  const out = emitEntity(badCtx, "field");
  check("a domain Type named \"field\" gets an ordinary domainId, not the frozen entity's reserved $id",
    out.$id === `https://srs.semanticops.com/schema/domain/${widgetAsField.namespace}/field/${widgetAsField.version}.json`);
  check("a domain Type named \"field\" gets no title/$comment/synthetic $schema property (those are metamodel-only)",
    !out.title && !out.$comment && !("$schema" in out.properties));
}

// --- a domain Type literally named "field-type" must NOT get the metamodel's hand-mirrored envelope
// (that envelope is entity-specific to the METAMODEL's OWN field-type, gated by isMetamodelPackage —
// not the bare name; a domain Type sharing that name projects its OWN validationRules like any other).
{
  const domainFieldType = {
    ...ctx.typesByName.ticket,
    id: "t0000099-0000-4000-a000-000000000099",
    name: "field-type",
    validationRules: [{
      kind: "mutual-exclusion",
      fieldIds: ["f0000005-0000-4000-a000-000000000005", "f0000006-0000-4000-a000-000000000006"],
    }],
  };
  const badCtx = { ...ctx, typesByName: { ...ctx.typesByName, "field-type": domainFieldType } };
  const out = emitEntity(badCtx, "field-type");
  check("a domain Type named \"field-type\" projects its OWN validationRules, not the metamodel's FIELD_TYPE_ENVELOPE",
    (out.allOf || []).some((c) => c.not?.required?.includes("priority")) &&
    !(out.allOf || []).some((c) => c.if?.properties?.datatype));
}

// --- a domain Type literally named "lineage" (one of DEF_DESCRIPTION_SUPPRESSED's 7 names) keeps ---
// its own genuine description — suppression is metamodel-only, gated by isMetamodelPackage.
{
  const domainLineage = { ...ctx.typesByName.widget, name: "lineage", description: "A domain Type that happens to share a name with a suppressed metamodel value-object." };
  const badCtx = { ...ctx, typesByName: { ...ctx.typesByName, lineage: domainLineage } };
  const out = emitEntity(badCtx, "lineage");
  check("a domain Type named \"lineage\" keeps its own description (suppression is metamodel-only)",
    out.description === domainLineage.description);
}

console.log(`\n✓ RFC-040 Unit 3 golden fixtures: ${pass} checks passed (effective-Type resolution, facing distinction, conditional projection).`);
