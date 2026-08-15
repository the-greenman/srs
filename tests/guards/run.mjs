#!/usr/bin/env node
/**
 * tests/guards/run.mjs — the negative tests for the enforcement checks (#308, #311, #391).
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

  // A definition file on disk that no kind indexes is a warning, and it must fire for the
  // kebab-case folders (`document-views/`, `relation-types/`) too — looking inside a folder named
  // after the kind finds nothing for exactly the kinds #391 added.
  await writeJson(join(pkgDir, "document-views/stray.json"), { id: "unused" });
  expect("warns about an unlisted file in a kebab-case folder", run(), {
    exit: 0,
    contains: ["document-views/stray.json exists but is not listed in package.json"],
  });
  await rm(join(pkgDir, "document-views/stray.json"));

  // Back to the baseline: the fixture minus every violation still passes.
  expect("passes again once the violations are removed", run(), {
    exit: 0,
    contains: ["✓ Package is valid"],
  });
}

const root = await mkdtemp(join(tmpdir(), "srs-guards-"));
try {
  await fieldNameCases(join(root, "field-name"));
  await schemaKindCases(join(root, "schema-kind"));
  await validatePackageCases(join(root, "validate-package"));
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✗ ${failures} guard case(s) did not behave as specified.`);
  process.exit(1);
}
console.log("\n✓ Every guard fails on the violation it exists to catch, and passes without it.");
