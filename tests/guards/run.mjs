#!/usr/bin/env node
/**
 * tests/guards/run.mjs — the negative tests for the enforcement checks (#308, #311, #391, #522).
 *
 * All three pass over the live tree today, which is the whole problem with trusting them: a check
 * that has never been watched fail is indistinguishable from one that cannot fail. Each case
 * below drives the real check script against a fixture tree (the scripts take an optional root
 * argument for exactly this) and asserts BOTH halves — that the violating fixture is rejected with a
 * message naming the offender, and that the same fixture minus the violation passes. Asserting on
 * the message, not just the exit code, is what stops a check that fails for an unrelated reason
 * (a crash, a missing directory) from reading as a working guard.
 *
 *   node tests/guards/run.mjs
 */
import { mkdtemp, mkdir, writeFile, rm, readFile, cp } from "fs/promises";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// `fileURLToPath`, not `new URL(..).pathname` — the same percent-encoding trap both guards document
// against. Getting it wrong here breaks every case under a checkout path containing a space.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

let failures = 0;

/** Run a check script with explicit args; returns {code, out}. */
function runScript(script, ...args) {
  const r = spawnSync("node", [join(REPO, "scripts", script), ...args], { encoding: "utf8" });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/** Run a check script against a fixture root; returns {code, out}. */
const runCheck = (script, root) => runScript(script, root);

function expect(label, { code, out }, { exit, contains = [] }) {
  const problems = [];
  if (code !== exit) problems.push(`exit ${code}, expected ${exit}`);
  for (const needle of contains) {
    if (!out.includes(needle)) problems.push(`output does not mention ${JSON.stringify(needle)}`);
  }
  if (problems.length === 0) {
    console.log(`  ✓ ${label}`);
    return;
  }
  failures++;
  console.error(`  ✗ ${label}: ${problems.join("; ")}`);
  console.error(out.split("\n").map((l) => `      ${l}`).join("\n"));
}

const writeJson = async (path, doc) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`);
};

const writeText = async (path, text) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
};

const field = (name) => ({
  id: "00000000-0000-4000-8000-00000000f001",
  namespace: "com.example.fixture",
  name,
  version: 1,
  description: "fixture field",
  aiGuidance: "fixture",
  fieldType: { datatype: "string" },
  createdAt: "2026-08-15T00:00:00Z",
});

// ---- #308 — Field.name is snake_case ------------------------------------------------------------
async function fieldNameCases(root) {
  console.log("#308 — Field.name snake_case guard");

  // The violation: one kebab-case Field in a live package tree.
  await writeJson(join(root, "srs/package/fields/bad.json"), field("kebab-case-name"));
  expect("rejects a kebab-case Field.name", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["srs/package/fields/bad.json", "kebab-case-name", "not snake_case"],
  });

  // Same tree, snake_case: the guard is not simply always red.
  await writeJson(join(root, "srs/package/fields/bad.json"), field("snake_case_name"));
  expect("accepts a snake_case Field.name", runCheck("check-field-name-convention.mjs", root), {
    exit: 0,
    contains: ["✓ Every Field definition name is snake_case"],
  });

  // The one exclusion #308 grants: RFC-004's historical proposed package.
  await writeJson(join(root, "rfcs/rfc-004/proposed-package/fields/historical.json"), field("kebab-case-name"));
  expect("excludes rfcs/rfc-004/**", runCheck("check-field-name-convention.mjs", root), {
    exit: 0,
    contains: ["✓ Every Field definition name is snake_case"],
  });

  // ...and the exclusion is scoped to that tree, not to `rfcs/` at large.
  await writeJson(join(root, "rfcs/rfc-999/proposed-package/fields/live.json"), field("kebab-case-name"));
  expect("does not exclude other rfcs/ trees", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["rfcs/rfc-999/proposed-package/fields/live.json"],
  });
  await rm(join(root, "rfcs/rfc-999"), { recursive: true });

  // A Field inside a `.srsj` bundle is a Field. `docs/spec/examples/gallery.srsj` keys 84 definitions
  // under `data`, none of which a `.json`-only walk would see.
  const bundle = join(root, "packages/com.example/1.0.0/bundle.srsj");
  await writeJson(bundle, { srsj: "2", data: { "package/fields/bad.json": field("kebab-case-name") } });
  expect("rejects a kebab-case Field.name inside a repository .srsj bundle", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["packages/com.example/1.0.0/bundle.srsj#data#package/fields/bad.json", "kebab-case-name"],
  });

  // The other bundle shape: a package bundle inlines definitions in top-level arrays with no `data`
  // map at all (docs/schema/2.0/package-bundle.json), as the shipped
  // `packages/com.semanticops.core/1.0.0/core-bundle.srsj` does. Reading only `data` skips it in
  // silence — which is why the walk recurses over the document instead of enumerating carriers.
  await writeJson(bundle, { mode: "bundled", fields: [field("kebab-case-name")], types: [] });
  expect("rejects a kebab-case Field.name inlined in a package .srsj bundle", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["packages/com.example/1.0.0/bundle.srsj#fields[0]", "kebab-case-name"],
  });
  await rm(bundle);

  // RFC-003's package-bundle extension. Nothing is committed in it yet, so a typo in CARRIERS would
  // leave every other case green.
  const srspkg = join(root, "packages/com.example/1.0.0/bundle.srspkg");
  await writeJson(srspkg, { mode: "bundled", fields: [field("kebab-case-name")] });
  expect("rejects a kebab-case Field.name inside a .srspkg bundle", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["bundle.srspkg#fields[0]", "kebab-case-name"],
  });
  await rm(srspkg);

  // The pre-RFC-032 carrier. `core-bundle.srsj` still ships two `valueType` Fields, so dropping that
  // disjunct from `isFieldDefinition` would silently stop checking them.
  const { fieldType: _unused, ...legacy } = field("kebab-case-name");
  await writeJson(join(root, "srs/package/fields/legacy.json"), { ...legacy, valueType: "string" });
  expect("rejects a kebab-case Field.name on the legacy valueType carrier", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["srs/package/fields/legacy.json", "kebab-case-name"],
  });
  await rm(join(root, "srs/package/fields/legacy.json"));

  // The Field most obviously in breach of a rule about names is the one with no name. Making `name`
  // part of the "is this a Field definition" test would drop it from the walk and report success.
  const nameless = join(root, "srs/package/fields/nameless.json");
  const { name: _dropped, ...noName } = field("unused");
  await writeJson(nameless, noName);
  expect("rejects a Field definition with no name at all", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["srs/package/fields/nameless.json", "(absent)"],
  });
  await writeJson(nameless, { ...noName, name: 42 });
  expect("rejects a non-string Field.name", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["srs/package/fields/nameless.json", "(42)"],
  });
  await rm(nameless);

  // A definition file with no `id` would not match `isFieldDefinition` at all. At a document root
  // that is a malformed definition, not a nested fragment, so its name is still checked.
  const idless = join(root, "srs/package/fields/idless.json");
  const { id: _noId, ...withoutId } = field("kebab-case-name");
  await writeJson(idless, withoutId);
  expect("rejects a kebab-case name in a root definition with no id", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["srs/package/fields/idless.json", "kebab-case-name"],
  });
  await rm(idless);

  // ...but a Tier-1 TypedRecord's `fields[]` values legitimately carry a fieldType and no id, and
  // are not roots. Treating them as definitions would fail the corpus on valid data.
  await writeJson(join(root, "srs/records/typed-record.json"), {
    instanceId: "00000000-0000-4000-8000-00000000e001",
    tier: 1,
    // Kebab-case on purpose: with a snake_case key this case passes whether or not the exclusion
    // exists, which is a test that cannot fail.
    fields: [{ name: "kebab-case-key", label: "Agenda", fieldType: { datatype: "string" }, value: "x" }],
  });
  expect("does not treat Tier-1 field values as definitions", runCheck("check-field-name-convention.mjs", root), {
    exit: 0,
    contains: ["✓ Every Field definition name is snake_case"],
  });

  // A file the guard cannot read defeats its own claim, so it fails rather than skipping.
  const broken = join(root, "srs/package/fields/broken.json");
  await writeFile(broken, "{ not json");
  expect("fails on an unparseable file in a walked tree", runCheck("check-field-name-convention.mjs", root), {
    exit: 1,
    contains: ["srs/package/fields/broken.json", "could not be parsed"],
  });
  await rm(broken);

  // A walk that read nothing is not a corpus that is clean.
  const bare = join(root, "bare");
  await mkdir(bare, { recursive: true });
  expect("fails when no Field definition is found at all", runCheck("check-field-name-convention.mjs", bare), {
    exit: 1,
    contains: ["No Field definitions found anywhere"],
  });
}

// ---- #311 — every declared definition kind resolves to a schema ---------------------------------
async function schemaKindCases(root) {
  console.log("#311 — definition kind → schema correspondence gate");

  // A copy of the canonical schema directory, so the fixture tracks the real declared kinds.
  const schemaDir = join(root, "docs/schema/2.0");
  await cp(join(REPO, "docs/schema/2.0"), schemaDir, { recursive: true });

  // Asserted without the kind count: adding an eleventh kind correctly is a green guard, and must
  // not read as a red test.
  expect("passes on the canonical schema set", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 0,
    contains: ["✓ Every declared definition kind resolves to a schema"],
  });

  // A declared kind whose schema is gone — the state `protocols` was in until #378.
  await rm(join(schemaDir, "protocol.json"));
  expect("rejects a declared kind with no schema file", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 1,
    contains: ["protocols", "protocol.json", "does not exist"],
  });
  await cp(join(REPO, "docs/schema/2.0/protocol.json"), join(schemaDir, "protocol.json"));

  // A kind added to package-manifest.json with no mapping row — the case the derivation exists for.
  const manifestSchema = join(schemaDir, "package-manifest.json");
  const doc = JSON.parse(await readFile(manifestSchema, "utf8"));
  doc.properties.widgets = { type: "array", items: { type: "string" }, description: "fixture kind" };
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);
  expect("rejects a newly declared kind with no mapping row", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 1,
    contains: ["widgets", "no row in PROPERTY_SCHEMA", "map it to null"],
  });

  // ...including one declared with `$ref` items, the style `dependencyRefs` uses. Deriving only
  // array-of-string kinds would drop this before the lookup: no row, no schema, green.
  doc.properties.widgets = { type: "array", items: { $ref: "#/$defs/DependencyRef" } };
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);
  expect("rejects a kind declared with $ref items", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 1,
    contains: ["widgets", "no row in PROPERTY_SCHEMA"],
  });

  // ...and one that is not array-shaped at all. Any shape filter would drop these before the
  // lookup, so there is none: classification is total over the declared properties.
  doc.properties.widgets = { $ref: "#/$defs/PathList" };
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);
  expect("rejects a property declared as a bare $ref", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 1,
    contains: ["widgets", "no row in PROPERTY_SCHEMA"],
  });
  delete doc.properties.widgets;

  // A schema that composes its properties elsewhere hides kinds from a check that reads
  // `properties` only — 21 properties would remain, so no floor fires and it prints a clean pass.
  const composing = JSON.parse(await readFile(manifestSchema, "utf8"));
  composing.allOf = [{ properties: { widgets: { type: "array", items: { type: "string" } } } }];
  await writeFile(manifestSchema, `${JSON.stringify(composing, null, 2)}\n`);
  expect("fails on a manifest schema that composes properties", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 1,
    contains: ["composes its properties via allOf"],
  });
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);

  // A manifest schema that declares nothing this check recognises is a check reading the wrong
  // thing; a vacuous pass would be worse than a failure.
  delete doc.properties;
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);
  expect("fails on a manifest schema with no declared kinds", runCheck("check-schema-kind-correspondence.mjs", root), {
    exit: 1,
    contains: ["declares no properties at all"],
  });
}

// ---- #391 — validate-package.mjs covers all ten definition kinds ---------------------------------
async function validatePackageCases(root) {
  console.log("#391 — package validation covers every declared definition kind");

  // A fixture package that declares one of the seven kinds that were previously neither
  // path-checked nor schema-validated. `blueprints` is the sharpest of them: #311's gate reports
  // `blueprints → blueprint.json ✓` while nothing ever opened a blueprint file.
  const schemaDir = join(root, "docs/schema/2.0");
  await cp(join(REPO, "docs/schema/2.0"), schemaDir, { recursive: true });

  const PKG = "package/fixture";
  const pkgDir = join(root, "srs", PKG);
  const run = () => runScript("validate-package.mjs", PKG, root);

  const validBlueprint = {
    $schema: "https://srs.semanticops.com/schema/2.0/blueprint.json",
    id: "00000000-0000-4000-8000-0000000b1001",
    namespace: "com.example.fixture",
    name: "fixture-blueprint",
    version: 1,
    description: "fixture blueprint",
    rootTypes: [{ typeId: "00000000-0000-4000-8000-0000000e1001", typeVersion: 1 }],
    createdAt: "2026-08-15T00:00:00Z",
  };
  const manifest = {
    $schema: "https://srs.semanticops.com/schema/2.0/package-manifest.json",
    id: "00000000-0000-4000-8000-0000000a1001",
    namespace: "com.example.fixture",
    name: "fixture",
    version: "1.0.0",
    title: "Fixture",
    description: "fixture package",
    status: "draft",
    fields: [],
    types: [],
    blueprints: ["blueprints/fixture.json"],
    createdAt: "2026-08-15T00:00:00Z",
  };

  // Baseline: a well-formed blueprint passes. Without this the cases below could not tell a working
  // check apart from one that rejects every blueprint it is shown.
  await writeJson(join(pkgDir, "package.json"), manifest);
  await writeJson(join(pkgDir, "blueprints/fixture.json"), validBlueprint);
  expect("accepts a valid blueprint", run(), {
    exit: 0,
    contains: ["Checking 1 blueprints definitions against blueprint.json", "✓ Package is valid"],
  });

  // View rows form one mixed FieldView | RecordPropertyView presentation sequence. JSON Schema
  // cannot express uniqueness by an object property, so validate-package owns this semantic check.
  const validView = {
    $schema: "https://srs.semanticops.com/schema/2.0/view.json",
    id: "00000000-0000-4000-8000-0000000v1001".replace("v", "1"),
    namespace: "com.example.fixture",
    name: "fixture-view",
    version: 1,
    description: "fixture view",
    fieldViews: [
      { fieldId: "00000000-0000-4000-8000-0000000f1001", order: 0 },
      { property: "lifecycleState", order: 1 },
    ],
    createdAt: "2026-08-15T00:00:00Z",
  };
  await writeJson(join(pkgDir, "views/fixture.json"), validView);
  await writeJson(join(pkgDir, "package.json"), { ...manifest, views: ["views/fixture.json"] });
  expect("accepts a View with unique mixed row orders", run(), {
    exit: 0,
    contains: ["Checking 1 views definitions against view.json", "✓ Package is valid"],
  });
  await writeJson(join(pkgDir, "views/fixture.json"), {
    ...validView,
    fieldViews: [validView.fieldViews[0], { property: "tags", order: 0 }],
  });
  expect("rejects duplicate View row orders", run(), {
    exit: 1,
    contains: ["views/fixture.json", "fieldViews[1].order 0 duplicates fieldViews[0].order", "View row order must be unique"],
  });
  await writeJson(join(pkgDir, "views/fixture.json"), validView);
  await writeJson(join(pkgDir, "package.json"), manifest);

  // The violation #391 is about: a malformed blueprint that passed `validate-all.mjs` in silence,
  // because no schema was ever loaded for the kind. `rootTypes` is required.
  const { rootTypes: _dropped, ...malformed } = validBlueprint;
  await writeJson(join(pkgDir, "blueprints/fixture.json"), malformed);
  expect("rejects a malformed blueprint", run(), {
    exit: 1,
    contains: ["package/fixture/blueprints/fixture.json", "rootTypes", "✗ Package validation failed"],
  });

  // ...and the path half of the same gap: a blueprint listed at a path that does not exist.
  await rm(join(pkgDir, "blueprints/fixture.json"));
  expect("rejects a listed blueprint file that is missing", run(), {
    exit: 1,
    contains: ["listed blueprints entry missing: blueprints/fixture.json"],
  });
  await writeJson(join(pkgDir, "blueprints/fixture.json"), validBlueprint);

  // Every one of the ten kinds is named in the run output. Asserting the count alone would pass on
  // ten arbitrary kinds; asserting the names is what pins the derivation to package-manifest.json.
  const perKind = [
    "fields definitions against field.json",
    "types definitions against type.json",
    "views definitions against view.json",
    "documentViews definitions against document-view.json",
    "themes definitions against theme.json",
    "relationTypes definitions against relation-type.json",
    "vocabularies definitions against vocabulary.json",
    "lifecycles definitions against lifecycle.json",
    "blueprints definitions against blueprint.json",
    "protocols definitions against protocol.json",
  ];
  expect("checks all ten declared kinds", run(), { exit: 0, contains: perKind });

  // The derivation is live, not a snapshot: a kind added to package-manifest.json with no
  // classification row must stop this script claiming the package was validated — the same
  // fail-open #311's gate refuses, refused again at the point of use.
  const manifestSchema = join(schemaDir, "package-manifest.json");
  const doc = JSON.parse(await readFile(manifestSchema, "utf8"));
  doc.properties.widgets = { type: "array", items: { type: "string" } };
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);
  expect("refuses to validate against an unclassified declared kind", run(), {
    exit: 1,
    contains: ["widgets", "no row in PROPERTY_SCHEMA", "cannot be fully validated"],
  });
  delete doc.properties.widgets;
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);

  // A kind mapped to a schema file that is not there must fail even when the package declares no
  // entries of that kind — otherwise the pre-#378 `protocols` state is invisible from this side.
  //
  // Asserted on the LOAD FAILURE message, not on "protocols"/"protocol.json": both of those strings
  // are printed by the per-kind progress line on a PASSING run too (the case above requires exactly
  // that on exit 0), so asserting them here would make this an exit-code-only test that could not
  // tell the missing schema apart from any unrelated failure.
  await rm(join(schemaDir, "protocol.json"));
  expect("fails when a kind's schema file is absent, even with no entries", run(), {
    exit: 1,
    contains: ["cannot load docs/schema/2.0/protocol.json"],
  });
  await cp(join(REPO, "docs/schema/2.0/protocol.json"), join(schemaDir, "protocol.json"));

  // The derivation's preconditions, enforced at the point of use and not only by #311's gate. A
  // manifest schema that composes its properties yields an empty kind list, and a validator that
  // shrugs at zero kinds prints "✓ Package is valid" over a package it never opened.
  const composing = JSON.parse(await readFile(manifestSchema, "utf8"));
  composing.allOf = [{ properties: { widgets: { type: "array", items: { type: "string" } } } }];
  await writeFile(manifestSchema, `${JSON.stringify(composing, null, 2)}\n`);
  expect("refuses to validate against a composed manifest schema", run(), {
    exit: 1,
    contains: ["composes its properties via allOf", "cannot be fully validated"],
  });

  const noProperties = JSON.parse(await readFile(manifestSchema, "utf8"));
  delete noProperties.allOf;
  delete noProperties.properties;
  await writeFile(manifestSchema, `${JSON.stringify(noProperties, null, 2)}\n`);
  expect("refuses to validate when the schema yields no definition kinds", run(), {
    exit: 1,
    contains: ["yielded no definition kinds", "vacuous pass would be worse"],
  });
  await writeFile(manifestSchema, `${JSON.stringify(doc, null, 2)}\n`);

  // A definition file sitting beside indexed ones but not itself indexed is a warning, and it must
  // fire for the KEBAB-CASE folders too. `documentViews` lives in `document-views/`, so a scan that
  // looks in a folder named after the kind finds nothing — the check silently stopped existing for
  // exactly the kinds #391 added.
  //
  // The package indexes a real documentView first, which is the shape this applies to in the wild
  // (the governance packages index four). It also keeps the case honest: the folder is reached
  // because the manifest references it, not because the fixture was arranged around the scan.
  await writeJson(join(pkgDir, "document-views/real.json"), {
    $schema: "https://srs.semanticops.com/schema/2.0/document-view.json",
    id: "00000000-0000-4000-8000-0000000d1001",
    namespace: "com.example.fixture",
    name: "fixture-document-view",
    version: 1,
    description: "fixture document view",
    sections: [],
    createdAt: "2026-08-15T00:00:00Z",
  });
  await writeJson(join(pkgDir, "package.json"), {
    ...manifest,
    documentViews: ["document-views/real.json"],
  });
  expect("accepts an indexed documentView in a kebab-case folder", run(), {
    exit: 0,
    contains: ["Checking 1 documentViews definitions against document-view.json", "✓ Package is valid"],
  });

  await writeJson(join(pkgDir, "document-views/stray.json"), { id: "unused" });
  expect("warns about an unlisted file in a kebab-case folder", run(), {
    exit: 0,
    contains: ["document-views/stray.json exists but is not listed in package.json"],
  });
  await rm(join(pkgDir, "document-views/stray.json"));
  await writeJson(join(pkgDir, "package.json"), manifest);

  // Back to the baseline: the fixture minus every violation still passes.
  expect("passes again once the violations are removed", run(), {
    exit: 0,
    contains: ["✓ Package is valid"],
  });
}

// ---- #285 — every discovered record is reachable from a declared presentation -------------------
async function publicationReachabilityCases(root) {
  console.log("#285 — publication reachability gate");

  const ID = (n) => `00000000-0000-4000-8000-0000000002${String(n).padStart(2, "0")}`;
  const TITLE_FIELD = "1a000001-0000-4000-a000-000000000001";

  // A minimal repository: one package declaring one DocumentView, one type-query section, and
  // records under the reserved instance root. Everything the guard reads is built here, so a case
  // that passes for a reason other than the one it names shows up as a message mismatch.
  const record = (n, typeName, extra = {}) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/record.json",
    instanceId: ID(n),
    typeId: "00000000-0000-4000-8000-0000000000t1".replace("t1", "01"),
    typeVersion: 1,
    typeNamespace: "com.example.fixture",
    typeName,
    fieldValues: { title: `record ${n}` },
    ...extra,
  });
  const relation = (n, type, source, target) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/relation.json",
    relationId: `00000000-0000-4000-8000-0000000003${String(n).padStart(2, "0")}`,
    relationType: type,
    sourceInstanceId: source,
    targetInstanceId: target,
    createdAt: "2026-08-18T00:00:00Z",
  });
  const exclusions = (...entries) =>
    writeJson(join(root, "scripts/publication-reachability-exclusions.json"), { exclusions: entries });

  // `titleFieldId` present ⇒ the renderer descends `contains` (render_service.rs). The two
  // cases below turn exactly this on and off, because getting it wrong is what made the first cut
  // of this guard call 34 records published that appear in no export.
  // A real exported id (lib/view-exports.mjs): only views `publish-spec.mjs` renders confer
  // reachability, so a synthetic id here would make every case below vacuously fail.
  const EXPORTED_ID = "3a000001-0000-4000-a000-000000000001";
  const view = (titleFieldId, id = EXPORTED_ID) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/document-view.json",
    id,
    namespace: "com.example.fixture",
    name: "fixture-view",
    version: 1,
    format: "markdown",
    sections: [
      {
        sectionId: "roots",
        title: "Roots",
        order: 0,
        source: { type: "type-query", semanticObjectType: "com.example.fixture/root" },
        ...(titleFieldId ? { titleFieldId } : {}),
      },
    ],
    createdAt: "2026-08-18T00:00:00Z",
  });

  const repo = join(root, "srs");
  await writeJson(join(repo, "manifest.json"), {
    srsVersion: "2.0-draft",
    dataModelRevision: 2,
    repositoryId: "00000000-0000-4000-8000-000000000501",
    namespace: "com.example.fixture",
    container: { containerId: "00000000-0000-4000-8000-000000000601", title: "Fixture", memberInstanceIds: [] },
  });
  await writeJson(join(repo, "package/package.json"), {
    id: "00000000-0000-4000-8000-000000000701",
    namespace: "com.example.fixture",
    name: "fixture-package",
    version: "1.0.0",
    documentViews: ["document-views/fixture-view.json"],
  });
  await writeJson(join(repo, "package/document-views/fixture-view.json"), view(TITLE_FIELD));
  await writeJson(join(repo, "records/root.json"), record(1, "root"));
  await exclusions();

  expect("passes when every record is a query root", runCheck("check-publication-reachability.mjs", root), {
    exit: 0,
    contains: ["✓ Every discovered record is reachable"],
  });

  // The violation the guard exists for: a valid, discovered, loading record no presentation reaches.
  await writeJson(join(repo, "records/orphan.json"), record(2, "leaf"));
  expect("rejects a discovered record no presentation reaches", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/orphan.json", "unreachable from every declared presentation"],
  });

  // Declaring the invisibility clears it — the exclusion list is the sanctioned escape, not a flag.
  const orphanEntry = { instanceId: ID(2), path: "records/orphan.json", reason: "fixture", issue: "#285" };
  await exclusions(orphanEntry);
  expect("accepts it once its invisibility is declared", runCheck("check-publication-reachability.mjs", root), {
    exit: 0,
    contains: ["✓ Every discovered record is reachable"],
  });

  // ...but only as typed data. A reason-less entry is an allowlist, which is the thing this is not.
  await exclusions({ instanceId: ID(2), path: "records/orphan.json", issue: "#285" });
  expect("rejects an exclusion entry with no reason", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["exclusions[0] is missing required properties: reason"],
  });

  // A stale exclusion is an error in both directions. First: it names an instance that is gone.
  await exclusions(orphanEntry, { instanceId: ID(9), path: "records/vanished.json", reason: "fixture", issue: "#285" });
  expect("rejects an exclusion for an instance that no longer exists", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["stale exclusion", "records/vanished.json", "no longer a discovered instance"],
  });

  // Second: it names one that has since become reachable, where it would hide the next regression.
  await exclusions({ instanceId: ID(1), path: "records/root.json", reason: "fixture", issue: "#285" }, orphanEntry);
  expect("rejects an exclusion for a record that is now reachable", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["stale exclusion", "records/root.json", "is now reachable"],
  });

  // `contains` from a query root publishes the target — but only from a section that descends.
  await writeJson(join(repo, "relations/contains.json"), relation(1, "contains", ID(1), ID(2)));
  await exclusions();
  expect("accepts a record contained by a structured section's root", runCheck("check-publication-reachability.mjs", root), {
    exit: 0,
    contains: ["✓ Every discovered record is reachable"],
  });

  // The same tree with `titleFieldId` removed. The renderer stops descending, so the contained
  // record is published nowhere — and an unconditional descent would call this green.
  await writeJson(join(repo, "package/document-views/fixture-view.json"), view(null));
  expect("rejects it when the section declares no titleFieldId", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/orphan.json", "unreachable from every declared presentation"],
  });
  await writeJson(join(repo, "package/document-views/fixture-view.json"), view(TITLE_FIELD));

  // `precedes` sequences records that are already published; it does not publish one. Traversing it
  // would have reported the eight unrendered RFC-017 change records as fine.
  await rm(join(repo, "relations/contains.json"));
  await writeJson(join(repo, "relations/precedes.json"), relation(2, "precedes", ID(1), ID(2)));
  expect("does not treat a precedes edge as publication", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/orphan.json", "unreachable from every declared presentation"],
  });
  await rm(join(repo, "relations/precedes.json"));

  // The RFC-013 ROOT container is a surface — it is the top of structural navigation.
  const manifestPath = join(repo, "manifest.json");
  const baseManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await writeJson(manifestPath, {
    ...baseManifest,
    container: { ...baseManifest.container, memberInstanceIds: [ID(2)] },
  });
  expect("accepts a record reached only by root container membership", runCheck("check-publication-reachability.mjs", root), {
    exit: 0,
    contains: ["✓ Every discovered record is reachable"],
  });
  await writeJson(manifestPath, baseManifest);

  // ...but a Container under `containers/` is NOT, because nothing points at it. Honouring those made
  // membership a free "publish" lever: all 12 Containers in the live corpus are referenced by nothing,
  // and one of them was silencing this guard for a note that reaches no reader.
  await writeJson(join(repo, "containers/orphan.json"), {
    containerId: "00000000-0000-4000-8000-000000000602",
    title: "Referenced by nothing",
    memberInstanceIds: [ID(2)],
  });
  expect("does not let an unreferenced Container publish a record", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/orphan.json", "unreachable from every declared presentation"],
  });
  await rm(join(repo, "containers/orphan.json"));

  // RFC-016 [R1]: the invariant projection publishes `records/invariants/` after render, so no view
  // selects it. A definition quantifying only over DocumentViews calls all 124 live ones invisible.
  // The orphan is excluded here so this case turns on the invariant alone: a run that reports the
  // invariant cannot reach exit 0, and one that reports nothing else cannot pass for another reason.
  await exclusions(orphanEntry);
  await writeJson(join(repo, "records/invariants/inv.json"), record(3, "invariant"));
  expect("accepts an invariant record via the RFC-016 projection", runCheck("check-publication-reachability.mjs", root), {
    exit: 0,
    contains: ["✓ Every discovered record is reachable"],
  });

  // ...and the projection is scoped to that directory, not to the type: the same record one level
  // out is unpublished. Otherwise "it is an invariant" would be the rule — and outside this
  // reachability guard's own escape hatch (an exclusion entry), a stray invariant is what
  // check-invariant-placement.mjs (srs#410) exists to reject outright, unconditionally.
  await rm(join(repo, "records/invariants"), { recursive: true });
  await writeJson(join(repo, "package/records/inv.json"), record(3, "invariant"));
  expect("does not project an invariant outside records/invariants/", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["package/records/inv.json", "unreachable from every declared presentation"],
  });
  await rm(join(repo, "package/records"), { recursive: true });

  // `document-view.json` admits four source kinds and this guard resolves one. The other three are
  // refused by name rather than skipped: an unresolved section can only shrink the reachable set,
  // so it surfaces as a false violation — with the wrong reason attached, which is how a guard
  // quietly stops covering what it was written for.
  const containerSubset = view(TITLE_FIELD);
  containerSubset.sections[0].source = { type: "container-subset", containerId: "00000000-0000-4000-8000-000000000602" };
  await writeJson(join(repo, "package/document-views/fixture-view.json"), containerSubset);
  expect("refuses a section source kind it cannot resolve", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["container-subset", "this guard does not resolve"],
  });

  // A type-query may also filter by lifecycle state or container, and the renderer applies those.
  // Ignoring them is fail-OPEN, not fail-closed: a section excluding `archived` records would
  // otherwise confer publication on every archived record of the type. Refused for that reason.
  const filtered = view(TITLE_FIELD);
  filtered.sections[0].source = {
    type: "type-query",
    semanticObjectType: "com.example.fixture/root",
    excludeLifecycleStates: ["archived"],
  };
  await writeJson(join(repo, "package/document-views/fixture-view.json"), filtered);
  expect("refuses a type-query it cannot filter", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["excludeLifecycleStates", "this guard does not apply"],
  });
  await writeJson(join(repo, "package/document-views/fixture-view.json"), view(TITLE_FIELD));

  // Declared is not published. `publish-spec.mjs` renders a fixed set of view ids; a view outside it
  // produces no artifact, so honouring it would be the same free "publish" lever the `containers/**`
  // glob was — worse, in fact, since a stale exclusion is an error, so one line added to a
  // `documentViews[]` array would *demand* the matching exclusions be deleted.
  await exclusions(); // the orphan must be undeclared here, or this case passes for the wrong reason
  const ghost = view(TITLE_FIELD, "00000000-0000-4000-8000-000000000499");
  ghost.name = "ghost-view";
  ghost.sections[0].source = { type: "type-query", semanticObjectType: "com.example.fixture/leaf" };
  await writeJson(join(repo, "package/document-views/ghost.json"), ghost);
  const withGhost = JSON.parse(await readFile(join(repo, "package/package.json"), "utf8"));
  await writeJson(join(repo, "package/package.json"), {
    ...withGhost,
    documentViews: [...withGhost.documentViews, "document-views/ghost.json"],
  });
  expect("a view no export renders publishes nothing", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/orphan.json", "unreachable from every declared presentation"],
  });
  await rm(join(repo, "package/document-views/ghost.json"));
  await writeJson(join(repo, "package/package.json"), withGhost);

  // The RFC-016 projection does a flat `readdir`, so a record one directory deeper is not projected.
  // Treating the root as a path prefix called it published.
  await writeJson(join(repo, "records/invariants/proposed/nested.json"), record(4, "invariant"));
  expect("does not project an invariant in a subdirectory of the root", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/invariants/proposed/nested.json", "in a subdirectory", "does not read"],
  });
  await rm(join(repo, "records/invariants/proposed"), { recursive: true });

  // The renderer resolves `contains` children as Tier-2 Records. An edge to a Note does not publish
  // it — it aborts the whole view with "missing field 'typeId'", so the guard would report the corpus
  // green at the moment every document stopped being produced.
  const note = { $schema: "https://srs.semanticops.com/schema/2.0/note.json", instanceId: ID(5), title: "note", sections: [] };
  await writeJson(join(repo, "records/note.json"), note);
  await writeJson(join(repo, "relations/contains-note.json"), relation(3, "contains", ID(1), ID(5)));
  expect("refuses a contains edge to a non-Record target", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/note.json", "not a Tier-2", "aborts the view"],
  });
  await rm(join(repo, "relations/contains-note.json"));
  await rm(join(repo, "records/note.json"));

  // Everything is keyed by instanceId, so two files sharing one id collapse to a single node and the
  // second is never reported. `repo validate` catches it; `validate-all` — this guard's pipeline — does not.
  await writeJson(join(repo, "records/duplicate.json"), record(1, "root"));
  expect("rejects two files sharing one instanceId", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["duplicate instanceId", "records/duplicate.json"],
  });
  await rm(join(repo, "records/duplicate.json"));

  // A package manifest that will not parse declares no views, so every record those views publish is
  // reported unreachable and nothing says why. Reported, like the unparseable view beside it.
  const pkgPath = join(repo, "package/package.json");
  const goodPkg = JSON.parse(await readFile(pkgPath, "utf8"));
  await writeFile(pkgPath, "{ not json");
  expect("reports a package manifest that will not parse", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["package manifest does not parse"],
  });
  await writeJson(pkgPath, goodPkg);

  // The exclusion `path` must name where the instance actually is. Matching is by instanceId, so
  // without this the path is decorative and a rename carries the suppression along in silence.
  await exclusions({ ...orphanEntry, path: "records/moved-away.json" });
  expect("rejects an exclusion whose path is not where the instance lives", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["records/moved-away.json", "is stored at", "records/orphan.json"],
  });

  // ...and `issue` must be a navigable reference, matching what the sibling RFC-031 allowlist
  // requires. "later" is not a tracking issue.
  await exclusions({ ...orphanEntry, issue: "later" });
  expect("rejects an exclusion with no real issue reference", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ['issue "later" is not a GitHub issue reference'],
  });

  await exclusions(orphanEntry, orphanEntry);
  expect("rejects two exclusions for one instance", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["duplicates the exclusion", "one entry per instance"],
  });
  await exclusions();

  // Floors. A walk that found nothing is not a repository with nothing wrong with it, and a
  // repository whose package declares no view publishes nothing at all.
  await exclusions(orphanEntry);
  await writeJson(join(repo, "package/package.json"), {
    id: "00000000-0000-4000-8000-000000000701",
    namespace: "com.example.fixture",
    name: "fixture-package",
    version: "1.0.0",
    documentViews: [],
  });
  expect("fails when no DocumentView is declared", runCheck("check-publication-reachability.mjs", root), {
    exit: 1,
    contains: ["no DocumentView is declared"],
  });

  const bare = join(root, "bare");
  await mkdir(join(bare, "scripts"), { recursive: true });
  await writeJson(join(bare, "scripts/publication-reachability-exclusions.json"), { exclusions: [] });
  expect("fails when the walk discovers no instances", runCheck("check-publication-reachability.mjs", bare), {
    exit: 1,
    contains: ["the walk found nothing"],
  });

  // A missing exclusion list is a missing decision, not an empty one.
  await rm(join(bare, "scripts/publication-reachability-exclusions.json"));
  expect("fails when the exclusion list is absent", runCheck("check-publication-reachability.mjs", bare), {
    exit: 1,
    contains: ["missing exclusion list"],
  });
}

// ---- srs#410 — invariant placement: no exclusion-list escape --------------------------------------
async function invariantPlacementCases(root) {
  console.log("srs#410 — invariant placement guard (no exclusion escape)");

  const ID = (n) => `00000000-0000-4000-8000-0000000004${String(n).padStart(2, "0")}`;
  const invariant = (n, num) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/record.json",
    instanceId: ID(n),
    typeId: "2a000006-0000-4000-a000-000000000006",
    typeVersion: 1,
    typeNamespace: "com.semanticops.spec",
    typeName: "invariant",
    fieldValues: { invariant_number: num, title: `invariant ${n}`, normative_statement: "MUST fixture." },
  });

  const repo = join(root, "srs");
  await writeJson(join(repo, "records/invariants/good.json"), invariant(1, "I-1"));

  expect("passes when every invariant is in the projection root", runCheck("check-invariant-placement.mjs", root), {
    exit: 0,
    contains: ["✓ Every com.semanticops.spec/invariant record lives in records/invariants/"],
  });

  // The violation this guard exists for: an RFC-authoring invariant record that sits outside the
  // projection root. Unlike #285's reachability guard, there is no exclusion file that can clear
  // this — the srs#410 defect was exactly a stale exclusion entry papering over this exact shape.
  await writeJson(join(repo, "package/package.json"), {
    id: "00000000-0000-4000-8000-000000000701",
    namespace: "com.example.fixture",
    name: "fixture-package",
    version: "1.0.0",
  });
  await writeJson(join(repo, "package/records/stray.json"), invariant(2, "011-1"));
  expect("rejects an invariant record outside the projection root", runCheck("check-invariant-placement.mjs", root), {
    exit: 1,
    contains: ["package/records/stray.json", "outside records/invariants/", "no exclusion escape"],
  });
  await rm(join(repo, "package/records"), { recursive: true });

  // The projection root is a flat readdir (render-invariants.mjs), so a record one directory deeper
  // is not projected either — this guard must agree with what actually renders, not just with the
  // path prefix.
  await writeJson(join(repo, "records/invariants/nested/deep.json"), invariant(3, "I-3"));
  expect("rejects an invariant record in a subdirectory of the projection root", runCheck("check-invariant-placement.mjs", root), {
    exit: 1,
    contains: ["records/invariants/nested/deep.json", "outside records/invariants/"],
  });
  await rm(join(repo, "records/invariants/nested"), { recursive: true });

  // A floor, matching the sibling guards: a walk that finds no invariant record at all is not a
  // repository with nothing wrong — it means the root argument is wrong.
  await rm(join(repo, "records/invariants"), { recursive: true });
  expect("fails when the walk finds no invariant records at all", runCheck("check-invariant-placement.mjs", root), {
    exit: 1,
    contains: ["No com.semanticops.spec/invariant records found"],
  });
}

// ---- srs#462 — decision-record cell tags: every rfc-decision dated 2026-08-23+ names its cell ---
async function decisionCellTagsCases(root) {
  console.log("srs#462 — decision-record cell tags guard");

  const ID = (n) => `00000000-0000-4000-8000-0000000005${String(n).padStart(2, "0")}`;
  const decision = (n, date, tags = []) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/record.json",
    instanceId: ID(n),
    typeId: "6a000004-0000-4000-a000-000000000004",
    typeVersion: 2,
    typeNamespace: "com.semanticops.spec",
    typeName: "rfc-decision",
    fieldValues: { title: `fixture decision ${n}`, decision_date: date },
    tags,
  });

  const repo = join(root, "srs");

  // A decision dated before the guard's enforcement floor carries no cell tag — out of scope,
  // must pass. Without this the guard could not be told apart from one that requires a tag on
  // every decision ever written, charter-era or not.
  await writeJson(join(repo, "records/pre-floor.json"), decision(1, "2026-08-22"));
  expect("passes on a decision dated before the enforcement floor", runCheck("check-decision-cell-tags.mjs", root), {
    exit: 0,
    contains: ["✓ Every com.semanticops.spec/rfc-decision record dated 2026-08-23 or later carries a valid cell:<slug> tag"],
  });

  // The violation this guard exists for: a decision dated on the floor, ratified with no cell.
  await writeJson(join(repo, "records/untagged.json"), decision(2, "2026-08-23"));
  expect("rejects a decision on the floor date with no cell tag", runCheck("check-decision-cell-tags.mjs", root), {
    exit: 1,
    contains: ["records/untagged.json", "carries no cell:<slug> tag at all"],
  });

  // A cell tag that does not name a slug in the vocabulary is caught by name, not waved through as
  // "has some tag starting with cell:".
  await writeJson(join(repo, "records/untagged.json"), decision(2, "2026-08-23", ["cell:mysticism"]));
  expect("rejects a cell tag naming a slug outside the vocabulary", runCheck("check-decision-cell-tags.mjs", root), {
    exit: 1,
    contains: ["records/untagged.json", '"cell:mysticism"', "none of which names a slug in the vocabulary"],
  });

  // A valid cell tag, dated after the floor: the guard is not simply always red.
  await writeJson(join(repo, "records/untagged.json"), decision(2, "2026-08-24", ["cell:governance"]));
  expect("accepts a decision carrying a valid cell tag", runCheck("check-decision-cell-tags.mjs", root), {
    exit: 0,
    contains: ["✓ Every com.semanticops.spec/rfc-decision record dated 2026-08-23 or later carries a valid cell:<slug> tag"],
  });

  // A floor, matching the sibling guards: a walk that finds no decision record at all is not a
  // repository with nothing wrong — it means the root argument is wrong.
  await rm(join(repo, "records/pre-floor.json"));
  await rm(join(repo, "records/untagged.json"));
  expect("fails when the walk finds no rfc-decision records at all", runCheck("check-decision-cell-tags.mjs", root), {
    exit: 1,
    contains: ["No com.semanticops.spec/rfc-decision records found"],
  });
}

function runInCwd(script, cwd, args = []) {
  const r = spawnSync("node", [join(REPO, "scripts", script), ...args], { encoding: "utf8", cwd });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

// ---- #465 — relation-type resolution covers every local package root, and fails the run ----------
async function relationTypeResolutionCases(root) {
  console.log("#465 — relation-type resolution covers sub-package roots, and the run fails on errors");

  const repo = join(root, "srs");
  await mkdir(join(repo, "records"), { recursive: true });
  await cp(join(REPO, "docs/schema/2.0"), join(root, "docs/schema/2.0"), { recursive: true });

  const relation = (n, type) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/relation.json",
    relationId: `00000000-0000-4000-8000-0000000005${String(n).padStart(2, "0")}`,
    relationType: type,
    sourceInstanceId: `00000000-0000-4000-8000-0000000006${String(n).padStart(2, "0")}`,
    targetInstanceId: `00000000-0000-4000-8000-0000000007${String(n).padStart(2, "0")}`,
    createdAt: "2026-08-23T00:00:00Z",
  });

  // Root manifest declares no relation types of its own — the shape that made master read all
  // sub-package relation types as uninstalled.
  await writeJson(join(repo, "package/package.json"), {
    id: "00000000-0000-4000-8000-000000000801",
    namespace: "com.example.fixture",
    name: "fixture-root",
    version: "1.0.0",
  });

  // The type is declared ONLY in a sub-package root (`package/core/` in the live tree), with its
  // `relationTypes` entry relative to ITS OWN directory, not `package/`.
  await writeJson(join(repo, "package/core/package.json"), {
    id: "00000000-0000-4000-8000-000000000802",
    namespace: "com.example.fixture",
    name: "fixture-core",
    version: "1.0.0",
    relationTypes: ["relation-types/contains.json"],
  });
  await writeJson(join(repo, "package/core/relation-types/contains.json"), {
    $schema: "https://srs.semanticops.com/schema/2.0/relation-type.json",
    id: "00000000-0000-4000-8000-000000000901",
    namespace: "com.example.fixture",
    key: "contains",
    version: 1,
    label: "Contains",
    description: "fixture relation type",
    category: "structural",
    status: "active",
    createdAt: "2026-08-23T00:00:00Z",
  });

  await writeJson(join(repo, "relations/one.json"), relation(1, "contains"));
  expect(
    "resolves a relation type declared only in a sub-package root",
    runInCwd("validate-records.mjs", root),
    { exit: 0, contains: ["✓ All instances are valid"] },
  );

  // The violation: a relation type genuinely absent from every local package root fails the run,
  // with the message naming the offending type — and, per #465's second defect, the run's exit code
  // now actually reflects it (master printed this and still exited 0).
  await writeJson(join(repo, "relations/one.json"), relation(1, "bogus-type"));
  expect(
    "rejects a relation type absent from every installed package, and fails the run",
    runInCwd("validate-records.mjs", root),
    {
      exit: 1,
      contains: [
        'relationType "bogus-type" has no installed definition',
        "✗ Instance validation failed",
      ],
    },
  );
  await writeJson(join(repo, "relations/one.json"), relation(1, "contains"));

  // A sabotaged sub-package manifest must fail loudly, not be silently skipped (the old
  // `loadInstalledRelationTypes` caught any parse error on the single manifest it read and
  // returned an empty map, which is silent by construction — the fix must not repeat that on any
  // one of several roots either).
  await writeFile(join(repo, "package/core/package.json"), "{ not json");
  expect(
    "fails loudly when a sub-package manifest does not parse",
    runInCwd("validate-records.mjs", root),
    {
      exit: 1,
      contains: ["package/core/package.json", "does not parse"],
    },
  );
}

// ---- srs#461 — Decision Compass drift: bidirectional presence ------------------------------------
async function decisionCompassDriftCases(root) {
  console.log("srs#461 — Decision Compass drift guard (bidirectional presence)");

  const decisionRecord = (id, title) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/record.json",
    instanceId: `${id}-0000-4000-8000-000000000000`,
    typeId: "6a000004-0000-4000-a000-000000000004",
    typeVersion: 2,
    typeNamespace: "com.semanticops.spec",
    typeName: "rfc-decision",
    fieldValues: {
      title,
      rfc_status: "accepted",
      decision_date: "2026-08-21",
      decision_statement: "fixture.",
    },
  });

  const recordsDir = join(root, "srs/records/tier-2");
  const compassPath = join(root, "docs/charter/decision-compass.md");

  await writeJson(join(recordsDir, "rfc-decision-aaaaaaaa.json"), decisionRecord("aaaaaaaa", "Fixture ruling A"));
  await writeJson(join(recordsDir, "rfc-decision-bbbbbbbb.json"), decisionRecord("bbbbbbbb", "Fixture ruling B"));

  const goodCompass = [
    "# The Decision Compass\n",
    "<!-- srs-charter-ids:v1\n",
    "aaaaaaaa bbbbbbbb\n",
    "-->\n",
    "Fixture ruling A: this over that. Cites `rfc-decision-aaaaaaaa`.\n",
    "Fixture ruling B: this over that. Cites `rfc-decision-bbbbbbbb`.\n",
  ].join("");
  await writeText(compassPath, goodCompass);

  expect(
    "passes when every roster id is cited and every citation resolves",
    runCheck("check-decision-compass-drift.mjs", root),
    { exit: 0, contains: ["✓ Every roster id is cited"] },
  );

  // FORWARD violation: a citation in the body whose record no longer exists (renamed or removed
  // out from under the compass).
  await rm(join(recordsDir, "rfc-decision-bbbbbbbb.json"));
  expect(
    "rejects a body citation whose record does not exist",
    runCheck("check-decision-compass-drift.mjs", root),
    { exit: 1, contains: ["rfc-decision-bbbbbbbb", "does not exist", "Fix the citation or remove it"] },
  );
  await writeJson(join(recordsDir, "rfc-decision-bbbbbbbb.json"), decisionRecord("bbbbbbbb", "Fixture ruling B"));

  // BACKWARD violation: a charter-class record added to the roster without the section that
  // documents it — declared presence, no delivered citation.
  await writeJson(join(recordsDir, "rfc-decision-cccccccc.json"), decisionRecord("cccccccc", "Fixture ruling C"));
  const rosterOnlyCompass = goodCompass.replace("aaaaaaaa bbbbbbbb", "aaaaaaaa bbbbbbbb cccccccc");
  await writeText(compassPath, rosterOnlyCompass);
  expect(
    "rejects a roster id with no citing section in the body",
    runCheck("check-decision-compass-drift.mjs", root),
    { exit: 1, contains: ["rfc-decision-cccccccc", "not cited anywhere in the compass body"] },
  );
  await rm(join(recordsDir, "rfc-decision-cccccccc.json"));
  await writeText(compassPath, goodCompass);

  // A roster comment id is not itself a citation — the scan must exclude the roster block, or a
  // record could sit in the roster forever with no real section and still pass.
  expect(
    "still passes after restoring the fixture to its original good state",
    runCheck("check-decision-compass-drift.mjs", root),
    { exit: 0, contains: ["✓ Every roster id is cited"] },
  );
}

// ---- srs#463 — Charter Check: the `## Charter alignment` section guard --------------------------
async function charterAlignmentSectionCases(root) {
  console.log("srs#463 — Charter Check `## Charter alignment` section guard");

  await mkdir(join(root, "docs/schema/2.0"), { recursive: true });

  const mdPath = join(root, "rfcs/fixture.md");
  const recordPath = join(root, "srs/records/rfcs/fixture.json");

  const manifestBlock = (...extraTokens) =>
    ["<!-- srs-integration:v1", "tooling-only", "cell:governance", ...extraTokens, "-->"].join("\n");

  const record = (affectedComponents, { num = "901", createdAt = "2026-08-25T00:00:00Z" } = {}) => ({
    $schema: "https://srs.semanticops.com/schema/2.0/record.json",
    instanceId: "00000000-0000-4000-8000-000000009001",
    typeId: "6a000001-0000-4000-a000-000000000001",
    typeVersion: 1,
    typeNamespace: "com.semanticops.spec",
    typeName: "rfc",
    fieldValues: {
      rfc_number: num,
      proposal_artifact_path: "rfcs/fixture.md",
      affected_components: affectedComponents,
    },
    lifecycleState: "accepted", // srs#447: rfc_status retired, spec-rfc-process Lifecycle owns this
    createdAt,
  });

  const statusLine = "**Status**: Accepted (Revision 1)\n\n";
  const completeSection = [
    "## Charter alignment",
    "",
    "**Cell(s):** cell:governance",
    "**Decision mode:** complicated",
    "",
    "**Governing cell preference:** migration over drift.",
    "**One-way-per-goal:** No existing mechanism serves this goal.",
    "",
  ].join("\n");

  // The violation this guard exists for: a post-floor accepted RFC whose .md has no Charter
  // alignment section at all.
  await writeJson(recordPath, record(manifestBlock()));
  await writeText(mdPath, `${statusLine}## Abstract\n\nFixture RFC body.\n`);
  expect(
    "rejects a post-floor RFC with no Charter alignment section",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 1, contains: ["RFC-901", "carries no", "## Charter alignment"] },
  );

  // A section that names a cell not matching the integration manifest's cell:<slug> tokens.
  const mismatchedCells = completeSection.replace("cell:governance", "cell:identity");
  await writeText(mdPath, `${statusLine}${mismatchedCells}\n## Abstract\n\nFixture RFC body.\n`);
  expect(
    "rejects a Cell(s) line that does not match the integration manifest",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 1, contains: ["does not match the integration manifest"] },
  );

  // A section with the cells right but no Decision mode line at all.
  const noMode = completeSection
    .split("\n")
    .filter((l) => !l.startsWith("**Decision mode:**"))
    .join("\n");
  await writeText(mdPath, `${statusLine}${noMode}\n## Abstract\n\nFixture RFC body.\n`);
  expect(
    "rejects a Charter alignment section with no Decision mode line",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 1, contains: ["no \"**Decision mode:**\" line"] },
  );

  // A section naming an illegal decision mode token.
  const badMode = completeSection.replace("complicated", "vibes-based");
  await writeText(mdPath, `${statusLine}${badMode}\n## Abstract\n\nFixture RFC body.\n`);
  expect(
    "rejects a Charter alignment section naming an illegal decision mode",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 1, contains: ['decision mode "vibes-based"', "not one of"] },
  );

  // The guard is not simply always red: a complete, consistent section passes.
  await writeText(mdPath, `${statusLine}${completeSection}\n## Abstract\n\nFixture RFC body.\n`);
  expect(
    "accepts a complete, consistent Charter alignment section",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 0, contains: ["Checking RFC integration... OK"] },
  );

  // Out of scope by date: an RFC created before the floor carries no section and still passes.
  await writeJson(recordPath, record(manifestBlock(), { createdAt: "2026-08-20T00:00:00Z" }));
  await writeText(mdPath, `${statusLine}## Abstract\n\nFixture RFC body.\n`);
  expect(
    "does not require the section on an RFC created before the floor date",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 0, contains: ["Checking RFC integration... OK"] },
  );

  // RFC-040's individual grandfather retired (srs#498 backfilled its section): RFC number "040"
  // is no longer special-cased — a post-floor RFC numbered 040 with no section still fails, the
  // same as any other post-floor RFC. Regression guard against the escape hatch reappearing.
  await writeJson(recordPath, record(manifestBlock(), { num: "040" }));
  await writeText(mdPath, `${statusLine}## Abstract\n\nFixture RFC body.\n`);
  expect(
    "requires the section on RFC-040 like any other post-floor RFC (grandfather retired)",
    runCheck("check-rfc-integration.mjs", root),
    { exit: 1, contains: ["RFC-040", "carries no", "## Charter alignment"] },
  );
}

// ---- srs#495 — checks registry membership: every scripts/check-*.mjs is declared ------------------
async function checksRegistryMembershipCases(root) {
  console.log("srs#495 — checks registry membership guard");

  const registryPath = join(root, "scripts/checks.json");
  const declaredCheckPath = join(root, "scripts/check-declared.mjs");
  const undeclaredCheckPath = join(root, "scripts/check-undeclared.mjs");

  const registry = (...scripts) => ({
    checks: scripts.map((script) => ({
      id: script.replace(/^check-/, "").replace(/\.mjs$/, ""),
      script,
      tier: "always",
      cell: "conformance",
      governing: "fixture",
      description: "fixture entry",
    })),
  });

  await writeText(declaredCheckPath, "// fixture check script\n");
  await writeText(undeclaredCheckPath, "// fixture check script\n");
  await writeJson(registryPath, registry("check-declared.mjs"));

  // The violation this guard exists for: a check-*.mjs script lands on disk with nobody
  // registering it in scripts/checks.json — the same undeclared-structure shape that shipped
  // check-release-drift.mjs outside validate-all.mjs's surface in the PR #493 incident.
  expect(
    "rejects a check-*.mjs script on disk that is absent from the registry",
    runCheck("check-checks-registry-membership.mjs", root),
    { exit: 1, contains: ["scripts/check-undeclared.mjs", "not declared in scripts/checks.json"] },
  );

  // Declaring it clears the violation — the guard is not simply always red.
  await writeJson(registryPath, registry("check-declared.mjs", "check-undeclared.mjs"));
  expect(
    "accepts once every check-*.mjs script is declared",
    runCheck("check-checks-registry-membership.mjs", root),
    { exit: 0, contains: ["✓ Every scripts/check-*.mjs file is declared in scripts/checks.json"] },
  );

  // A floor, matching the sibling guards: a walk that finds no check-*.mjs file at all is not a
  // scripts/ directory with nothing wrong — it means the root argument is wrong.
  await rm(declaredCheckPath);
  await rm(undeclaredCheckPath);
  expect(
    "fails when no check-*.mjs script is found at all",
    runCheck("check-checks-registry-membership.mjs", root),
    { exit: 1, contains: ["No scripts/check-*.mjs files found"] },
  );
}

// ---- #522 — every docs/schema/2.0/*.json file has a ledger row -----------------------------------
async function ledgerCompletenessCases(root) {
  console.log("srs#522 — generation ledger completeness guard");

  const schemaDir = join(root, "docs/schema/2.0");
  await cp(join(REPO, "docs/schema/2.0"), schemaDir, { recursive: true });

  expect(
    "passes on the canonical, fully-classified schema set",
    runCheck("check-ledger-completeness.mjs", root),
    { exit: 0, contains: ["✓ Every schema file in docs/schema/2.0/ has a row in the generation ledger"] },
  );

  // The violation this guard exists for: a new schema file lands with no ledger row — exactly the
  // "unclassified schema" state #522 was filed to close off going forward.
  const throwaway = join(schemaDir, "widget.json");
  await writeJson(throwaway, { $schema: "https://json-schema.org/draft/2020-12/schema", title: "fixture" });
  expect(
    "rejects a new schema file with no ledger row",
    runCheck("check-ledger-completeness.mjs", root),
    { exit: 1, contains: ["widget.json", "no row in docs/schema/2.0/generation-ledger.md"] },
  );

  // Removing it clears the violation — the guard is not simply always red.
  await rm(throwaway);
  expect(
    "passes again once the unclassified file is gone",
    runCheck("check-ledger-completeness.mjs", root),
    { exit: 0, contains: ["✓ Every schema file in docs/schema/2.0/ has a row in the generation ledger"] },
  );
}

const root = await mkdtemp(join(tmpdir(), "srs-guards-"));
try {
  await fieldNameCases(join(root, "field-name"));
  await schemaKindCases(join(root, "schema-kind"));
  await validatePackageCases(join(root, "validate-package"));
  await publicationReachabilityCases(join(root, "publication-reachability"));
  await invariantPlacementCases(join(root, "invariant-placement"));
  await decisionCompassDriftCases(join(root, "decision-compass-drift"));
  await decisionCellTagsCases(join(root, "decision-cell-tags"));
  await relationTypeResolutionCases(join(root, "relation-type-resolution"));
  await charterAlignmentSectionCases(join(root, "charter-alignment"));
  await checksRegistryMembershipCases(join(root, "checks-registry-membership"));
  await ledgerCompletenessCases(join(root, "ledger-completeness"));
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✗ ${failures} guard case(s) did not behave as specified.`);
  process.exit(1);
}
console.log("\n✓ Every guard fails on the violation it exists to catch, and passes without it.");
