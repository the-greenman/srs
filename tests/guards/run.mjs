#!/usr/bin/env node
/**
 * tests/guards/run.mjs — the negative tests for the two enforcement guards (#308, #311).
 *
 * Both guards pass over the live tree today, which is the whole problem with trusting them: a guard
 * that has never been watched fail is indistinguishable from a guard that cannot fail. Each case
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

/** Run a check script against a fixture root; returns {code, out}. */
function runCheck(script, root) {
  const r = spawnSync("node", [join(REPO, "scripts", script), root], { encoding: "utf8" });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

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

const root = await mkdtemp(join(tmpdir(), "srs-guards-"));
try {
  await fieldNameCases(join(root, "field-name"));
  await schemaKindCases(join(root, "schema-kind"));
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✗ ${failures} guard case(s) did not behave as specified.`);
  process.exit(1);
}
console.log("\n✓ Both guards fail on the violation they exist to catch, and pass without it.");
