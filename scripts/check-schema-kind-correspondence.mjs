#!/usr/bin/env node
/**
 * check-schema-kind-correspondence.mjs — every declared definition kind resolves to a schema (#311).
 *
 * `docs/schema/2.0/package-manifest.json` declares the definition kinds a package may index —
 * `fields`, `types`, `views`, `documentViews`, `themes`, `relationTypes`, `vocabularies`,
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
 *      (`documentViews` → `document-view.json`, `relationTypes` → `relation-type.json`,
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
const PROPERTY_SCHEMA = {
  // Definition-kind indexes — each names files validated by the schema it maps to.
  fields: "field.json",
  types: "type.json",
  views: "view.json",
  documentViews: "document-view.json",
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
  dependencyRefs: null, // packages this package depends on, not definition files
  createdAt: null,
  updatedAt: null,
};

const declaredProperties = (schema) => Object.keys(schema.properties ?? {});

const exists = (path) => access(path).then(() => true, () => false);

async function main() {
  const schema = JSON.parse(await readFile(MANIFEST_SCHEMA, "utf8"));
  const properties = declaredProperties(schema);

  console.log("Definition kind → schema correspondence (#311)");
  console.log(`  Properties declared by package-manifest.json: ${properties.length}`);

  if (properties.length === 0) {
    console.log("\n✗ package-manifest.json declares no properties at all.");
    console.log("  Its shape changed, or the wrong root was passed — either way this check is not");
    console.log("  reading what it thinks it is, and a vacuous pass would be worse than a failure.");
    process.exit(1);
  }

  const errors = [];
  const kinds = [];
  for (const property of properties) {
    if (!Object.hasOwn(PROPERTY_SCHEMA, property)) {
      errors.push(
        `${property}: declared by package-manifest.json with no row in PROPERTY_SCHEMA. If it ` +
        `indexes definition files, add its schema to docs/schema/2.0/ and map it here; if it does ` +
        `not, map it to null in scripts/check-schema-kind-correspondence.mjs.`,
      );
      continue;
    }
    const file = PROPERTY_SCHEMA[property];
    if (file == null) continue; // explicitly classified as not a definition kind
    kinds.push(property);
    if (!(await exists(join(SCHEMA_DIR, file)))) {
      errors.push(`${property}: maps to docs/schema/2.0/${file}, which does not exist.`);
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

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
