#!/usr/bin/env node
/**
 * check-schema-kind-correspondence.mjs — every declared definition kind resolves to a schema (#311).
 *
 * `docs/schema/2.0/package-manifest.json` declares the definition kinds a package may index —
 * `fields`, `types`, `views`, `compositions`, `themes`, `relationTypes`, `vocabularies`,
 * `lifecycles`, `blueprints`, `protocols`. Each names files that must themselves be validatable, so
 * each kind needs a schema in `docs/schema/2.0/`. Nothing asserted that. `protocols` was declarable
 * for months with no `protocol.json` behind it (landed later by #378) and no check noticed, because
 * the correspondence existed only as an assumption.
 *
 * Two halves, and both matter:
 *
 *   1. THE PROPERTY LIST IS READ FROM the schema, and the classification of it is TOTAL. Hardcoding
 *      the kinds would reproduce the failure one level up — a kind added to the schema and not here
 *      would pass silently, the same "rule lives only in prose" defect this check exists to close.
 *      Deriving the kinds by shape instead (array-of-string, or `type: "array"`) does the same thing
 *      more quietly, since a filter drops what it does not recognise before the check can miss it.
 *      So every declared property needs a row, and a new one fails until it has one.
 *
 *   2. THE KIND → SCHEMA MAPPING IS EXPLICIT. Naive singularization is wrong for half the rows
 *      (`compositions` → `composition.json`, `relationTypes` → `relation-type.json`,
 *      `vocabularies` → `vocabulary.json`), and a rule that guesses is a rule that will guess wrong
 *      when the next kind is added. A new kind is given a schema and a row deliberately, not
 *      resolved by string surgery.
 *
 * Scope is this repository's canonical schemas. Mirror completeness (`srs-rust`, `srs-vscode`) is
 * enforced by each mirror's own drift check; this one never reaches across repositories.
 *
 *   node scripts/check-schema-kind-correspondence.mjs [root]   # root defaults to the repo root
 */
import { readFile, access } from "fs/promises";
import { realpathSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree.
// `fileURLToPath`, not `new URL(..).pathname`, which is percent-encoded and so resolves wrong under
// any checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SCHEMA_DIR = join(ROOT, "docs/schema/2.0");
const MANIFEST_SCHEMA = join(SCHEMA_DIR, "package-manifest.json");

/**
 * The classification of EVERY property `package-manifest.json` declares: a schema filename for a
 * definition-kind index, `null` for anything else.
 *
 * The table is total on purpose. Any rule for picking out "the kind-like properties" — items of
 * type string, or `type: "array"` — is a filter, and a filter drops what it does not recognise
 * before the check can miss it: a kind declared with `$ref` items, or `"type": ["array", "null"]`,
 * or a `$ref` to a `$defs` path list, would need no row and no schema and stay green. That is the
 * one-level-up fail-open this check exists to close, so there is no filter. Every new property
 * fails until a person says which it is.
 */
export const PROPERTY_SCHEMA = {
  // Definition-kind indexes — each names files validated by the schema it maps to.
  fields: "field.json",
  types: "type.json",
  views: "view.json",
  compositions: "composition.json", // srs#523/#524, srs-rust#910: renamed from documentViews (rfc-decision-92d2da05)
  themes: "theme.json",
  relationTypes: "relation-type.json",
  vocabularies: "vocabulary.json",
  lifecycles: "lifecycle.json",
  blueprints: "blueprint.json",
  protocols: "protocol.json",
  // Not definition-kind indexes.
  $schema: null,
  id: null,
  namespace: null,
  name: null,
  version: null,
  dataModelRevision: null,
  title: null,
  description: null,
  status: null,
  packageDependencies: null, // packages this package depends on, not definition files. Renamed from dependencyRefs (srs#478, srs-rust#873/#910, rfc-decision-c8704763 item 2) — the PARK from ADR-004 is lifted: the fold rides the rev-6 composition-cutover stamp (srs#523/#524).
  createdAt: null,
  updatedAt: null,
};

const declaredProperties = (schema) => Object.keys(schema.properties ?? {});

/**
 * This check reads `properties` and nothing else. A manifest schema that composed its properties
 * elsewhere — an `allOf` branch, an `$ref` to a `$defs` entry (the file already uses `$defs`) —
 * would hide a definition kind from the classification entirely: 21 properties would still be
 * present so the zero floor never fires, and the guard would print a clean "✓ 9 checked" over
 * exactly the pre-#378 state it exists to detect. Rather than chase every composition keyword, the
 * assumption is asserted.
 */
const COMPOSITION_KEYWORDS = [
  "allOf", "anyOf", "oneOf", "$ref", "if", "then", "else",
  "patternProperties", "dependentSchemas", "unevaluatedProperties",
];

/**
 * THE derivation — the single place `package-manifest.json`'s declared properties are read and
 * classified. Both this file's own check and `validate-package.mjs` (#391) go through it, so a kind
 * added to the schema fails the gate until it has a row, and the moment it has one it is also
 * path-checked and schema-validated, with no second list to remember.
 *
 * Returns everything a caller needs to enforce its own policy, including the two structural facts
 * that decide whether the derivation means anything at all:
 *
 *   properties   — every property the schema declares (the zero floor is computed from this)
 *   composed     — composition keywords present at the schema root; non-empty means `properties`
 *                  is an incomplete view and any kind list derived from it is untrustworthy
 *   kinds        — [{ kind, schemaFile }] for the classified definition-kind indexes
 *   unclassified — declared properties with no PROPERTY_SCHEMA row
 *
 * `composed` and `properties` are returned rather than acted on here because each caller fails
 * differently — but a caller that ignores them gets the exact fail-open this check exists to close:
 * properties composed behind an `allOf`/`$ref` yield an EMPTY kind list, and a consumer that
 * validates zero kinds without complaint prints a clean pass over a package it never opened.
 */
export async function definitionKinds(root) {
  const schemaDir = join(resolve(root), "docs/schema/2.0");
  const schema = JSON.parse(await readFile(join(schemaDir, "package-manifest.json"), "utf8"));
  const properties = declaredProperties(schema);
  const composed = COMPOSITION_KEYWORDS.filter((k) => schema[k] != null);
  const kinds = [];
  const unclassified = [];
  for (const property of properties) {
    if (!Object.hasOwn(PROPERTY_SCHEMA, property)) {
      unclassified.push(property);
      continue;
    }
    const schemaFile = PROPERTY_SCHEMA[property];
    if (schemaFile != null) kinds.push({ kind: property, schemaFile });
  }
  return { properties, composed, kinds, unclassified };
}


const exists = (path) => access(path).then(() => true, () => false);

async function main() {
  // Through the same derivation `validate-package.mjs` uses — one reader of the schema, so the two
  // checks cannot disagree about what this file declares.
  const { properties, composed, kinds: classified, unclassified } = await definitionKinds(ROOT);

  console.log("Definition kind → schema correspondence (#311)");

  if (composed.length > 0) {
    console.log(`\n✗ package-manifest.json composes its properties via ${composed.join(", ")}.`);
    console.log("  This check classifies `properties` only, so a definition kind declared through a");
    console.log("  composition keyword would be invisible to it — the failure it exists to catch,");
    console.log("  one level up. Either inline the properties or teach this check to resolve them.");
    process.exit(1);
  }
  console.log(`  Properties declared by package-manifest.json: ${properties.length}`);

  if (properties.length === 0) {
    console.log("\n✗ package-manifest.json declares no properties at all.");
    console.log("  Its shape changed, or the wrong root was passed — either way this check is not");
    console.log("  reading what it thinks it is, and a vacuous pass would be worse than a failure.");
    process.exit(1);
  }

  const errors = unclassified.map(
    (property) =>
      `${property}: declared by package-manifest.json with no row in PROPERTY_SCHEMA. If it ` +
      `indexes definition files, add its schema to docs/schema/2.0/ and map it here; if it does ` +
      `not, map it to null in scripts/check-schema-kind-correspondence.mjs.`,
  );
  const kinds = [];
  for (const { kind, schemaFile } of classified) {
    kinds.push(kind);
    if (!(await exists(join(SCHEMA_DIR, schemaFile)))) {
      errors.push(`${kind}: maps to docs/schema/2.0/${schemaFile}, which does not exist.`);
    }
  }
  console.log(`  Definition kinds among them:                  ${kinds.length} (${kinds.join(", ")})`);

  if (errors.length > 0) {
    console.log("");
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    console.log(`\n✗ ${errors.length} declared property/properties are unclassified or unresolved.`);
    console.log("  A kind a package may index but nothing can validate is unvalidatable data by");
    console.log("  construction — the state `protocols` was in until #378.");
    process.exit(1);
  }

  console.log(`\n✓ Every declared definition kind resolves to a schema in docs/schema/2.0/ (${kinds.length} checked)`);
}

// Run only when invoked as a script. `validate-package.mjs` imports `definitionKinds` from here,
// and a bare `main()` at module load would run the whole check as a side effect of that import.
// `import.meta.main` is not available on the Node this repo targets, so compare argv[1].
//
// REALPATH BOTH SIDES. `import.meta.url` is already resolved to the real path (Node resolves the
// main entry that way unless --preserve-symlinks-main), but `process.argv[1]` is the literal string
// typed, and `resolve()` normalises without ever following a symlink. Comparing them raw makes this
// guard a silent no-op for any invocation whose path traverses a link — a symlinked checkout, an
// npm/pnpm bin shim, `node /proc/self/cwd/scripts/...` — and a no-op here EXITS 0, so
// validate-all.mjs reads the vanished check as a pass. That is the same fail-open this file exists
// to close, arriving through its own invocation.
const invokedDirectly = (() => {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return realpathSync(resolve(argv1)) === realpathSync(self);
  } catch {
    // FAIL TOWARDS RUNNING. Falling back to `resolve(argv1) === self` would reinstate the exact
    // comparison this block exists to replace — `self` is already realpath'd, `resolve` never
    // follows a link — and because a guard that does not run exits 0, that fallback would report a
    // clean pass for a check that never happened. Running when unsure is the safe direction: the
    // worst case is the check running during an import, which is noisy and obvious, not silent.
    return true;
  }
})();

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
