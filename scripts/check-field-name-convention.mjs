#!/usr/bin/env node
/**
 * check-field-name-convention.mjs — `Field.name` is snake_case, fail-closed (#308).
 *
 * `docs/schema/2.0/field.json` and record `7d22d50f` both state the rule unconditionally
 * ("Machine-readable name within the namespace; snake_case"), and #358 renamed the corpus so the
 * statement became true. Nothing enforced it: the rule lived only in prose, so the next kebab-case
 * Field to land would have been accepted in silence — exactly how the 33 renamed by #358 (and the
 * 8 added after the cutoff that decided against them) got in.
 *
 * The failure mode is not cosmetic. `srs-repository` resolves several Fields by name, and a miss is
 * bound with `if let Some(..)` — so a name that drifts does not error, the check that depended on it
 * simply stops running. The RFC-017 attachment-policy diagnostics never fired against a real
 * repository for exactly this reason (srs-rust#802).
 *
 * No grandfather list and no exemption parameter (owner decision 2026-08-08, superseding the
 * 2026-07-31 grandfather): every Field definition in every package tree this repository carries must
 * be snake_case. `rfcs/rfc-004/**` is the one excluded tree — RFC-004's proposed package was
 * declared historical, is not a live package, and its five kebab names are frozen artifacts of a
 * proposal that was never adopted.
 *
 * Node pipeline only, per ADR-004 (the embedded binary still carries the pre-RFC-032 schema, and a
 * name-convention rule is an authoring convention rather than a load-time invariant — putting it in
 * the Rust validator would reject third-party repositories the spec does not govern).
 *
 *   node scripts/check-field-name-convention.mjs [root]   # root defaults to the repo root
 */
import { readdir, readFile } from "fs/promises";
import { join, resolve, relative, dirname } from "path";
import { fileURLToPath } from "url";

// Optional root override — the negative test (tests/guards/run.mjs) points this at a fixture tree.
// `fileURLToPath`, not `new URL(..).pathname`: the latter is percent-encoded, so a checkout under a
// path containing a space resolves to a directory that does not exist.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The whole repository is walked, rather than a list of trees known to hold packages. A list is an
// allowlist, and an allowlist silently excludes whatever is added next: proposal, example and
// fixture trees all hold real Field definitions (`tests/rfc-032/package/` alone is 24), and the
// sibling #311 guard refuses hardcoding for the same reason. Measured: the walk finds the same 326
// Field definitions the six-tree list did, with no parse failures anywhere in the repo — the list
// bought nothing and would have cost the next tree.

// RFC-004's proposed package is a historical artifact, not a live package (row 5 of #308).
const EXCLUDED = ["rfcs/rfc-004"];

const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

function isExcluded(abs) {
  const path = relative(ROOT, abs);
  return EXCLUDED.some((e) => path === e || path.startsWith(`${e}/`));
}

// Every extension a Field definition can arrive in: loose JSON, a `.srsj` repository or package
// bundle, and RFC-003's `.srspkg` package bundle (none committed yet — listed so the first one is
// walked rather than silently skipped, which is how the inline package-bundle shape got missed).
const CARRIERS = [".json", ".srsj", ".srspkg"];

async function findFiles(dir) {
  const out = [];
  // Not swallowed: a directory that cannot be read is unwalked coverage, and the only other floor
  // here is total emptiness.
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    // Dot-directories are tooling, not corpus (`.vscode`, `.claude`, `.srs` markers, `.git`), and
    // parse failures here are fatal: a JSONC editor-settings file would otherwise block every
    // commit through hooks/pre-commit for a reason that has nothing to do with the spec. Matches
    // check-package-id-uniqueness.mjs.
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const abs = join(dir, e.name);
    if (isExcluded(abs)) continue;
    if (e.isDirectory()) out.push(...(await findFiles(abs)));
    else if (CARRIERS.some((ext) => e.name.endsWith(ext))) out.push(abs);
  }
  return out;
}

const isObject = (o) => o != null && typeof o === "object" && !Array.isArray(o);

/**
 * Every candidate definition object in a file, as `{ label, doc }` — every object anywhere in the
 * document, labelled by its JSON path.
 *
 * A Field definition reaches disk in more carriers than a loose `.json` file: a repository `.srsj`
 * keys definitions under `data` by the path they would occupy exploded (84 entries in
 * `docs/spec/examples/gallery.srsj`), and a package bundle inlines them in top-level definition
 * arrays (`docs/schema/2.0/package-bundle.json`, as `packages/com.semanticops.core`'s shipped
 * `core-bundle.srsj` does). Enumerating the carriers instead of the objects is how the second one
 * got missed, and the list would need extending for every bundle shape added later — a package
 * bundle committed as `.json`, or one nested inside a repository bundle's `data` entry. Recursing
 * over the whole document has no such list. `isFieldDefinition` is specific enough to make the
 * over-collection free.
 *
 * A file that cannot be parsed is returned as an error rather than skipped: this guard's claim is
 * "every Field definition", and it cannot make that claim over a file it could not read.
 */
async function candidates(abs) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(abs, "utf8"));
  } catch (error) {
    return { error: error.message, docs: [] };
  }
  const docs = [];
  const walk = (node, label) => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${label}[${i}]`));
      return;
    }
    if (!isObject(node)) return;
    docs.push({ label, doc: node });
    for (const [key, child] of Object.entries(node)) {
      if (child != null && typeof child === "object") walk(child, `${label}#${key}`);
    }
  };
  walk(parsed, relative(ROOT, abs));
  return { docs };
}

/**
 * A Field definition is any object with an id plus a fieldType (post-RFC-032) or valueType (pre-).
 * `name` is deliberately NOT part of the test: requiring it to be a string would make a Field whose
 * name is missing, null or a number fail to match at all — the guard would report success over the
 * one Field most obviously in breach of a rule about names, and nothing else schema-validates Field
 * files outside `srs/`. A candidate with no usable name is a violation, checked below.
 *
 * `id` IS part of the test, and load-bearing: it is what separates a Field *definition* from the
 * other things that carry a `fieldType` — a Tier-1 TypedRecord's field values, and the JSON Schema
 * fragments under `docs/schema/2.0/` and `tests/rfc-035/goldens/`. Measured: dropping it matches 9
 * more objects, several with an object-valued `name`, which the guard would then report as
 * violations of a rule they are not subject to. A definition with no `id` is a different defect,
 * for the schema validation that owns identity.
 */
function isFieldDefinition(o) {
  return typeof o.id === "string" &&
    (typeof o.valueType === "string" || (o.fieldType != null && typeof o.fieldType === "object"));
}

async function main() {
  const files = (await findFiles(ROOT)).sort();

  const violations = [];
  const unreadable = [];
  let checked = 0;

  for (const abs of files) {
    const { error, docs } = await candidates(abs);
    if (error != null) unreadable.push({ path: relative(ROOT, abs), error });
    for (const { label, doc } of docs) {
      if (!isFieldDefinition(doc)) continue;
      checked++;
      if (typeof doc.name !== "string" || !SNAKE_CASE.test(doc.name)) {
        violations.push({
          path: label,
          name: typeof doc.name === "string" ? doc.name : `(${doc.name === undefined ? "absent" : JSON.stringify(doc.name)})`,
          id: doc.id,
          namespace: doc.namespace ?? "?",
        });
      }
    }
  }

  console.log("Field.name convention (#308)");
  console.log(`  Field definitions checked: ${checked}`);
  console.log(`  Walked:                    ${ROOT} (excluding ${EXCLUDED.join(", ")})`);

  // Unreadable files first: a corpus whose Field-bearing files all fail to parse would otherwise
  // report "no Field definitions found / the trees moved" and swallow the parse errors behind it.
  if (unreadable.length > 0) {
    console.log("");
    for (const u of unreadable) console.log(`  ✗ ${u.path}: ${u.error}`);
    console.log(`\n✗ ${unreadable.length} file(s) in the walked trees could not be parsed.`);
    console.log("  This check cannot claim every Field definition is conformant while a file it");
    console.log("  would have read is unreadable. (validate-package.mjs reaches only the four");
    console.log("  packages under srs/ — nothing else reports a malformed file in these trees.)");
    process.exit(1);
  }

  // A guard that checked nothing is not a guard that found nothing — the exact fail-open mode this
  // check exists to close, one level up.
  if (checked === 0) {
    console.log(`\n✗ No Field definitions found anywhere under ${ROOT}.`);
    console.log("  This repository has 326 of them, so an empty walk means the root is wrong.");
    process.exit(1);
  }

  if (violations.length > 0) {
    console.log("");
    for (const v of violations) {
      console.log(`  ✗ ${v.path}`);
      console.log(`    Field ${v.namespace}/${v.name} (${v.id}) is not snake_case.`);
      console.log(`    Rule: Field.name matches ${SNAKE_CASE} — docs/schema/2.0/field.json, record 7d22d50f.`);
    }
    console.log(`\n✗ ${violations.length} Field definition(s) violate the snake_case name convention.`);
    console.log("  A Field's name is resolved by name in srs-repository, where a miss is silent —");
    console.log("  the dependent check stops running rather than erroring (srs-rust#802).");
    process.exit(1);
  }

  console.log("\n✓ Every Field definition name is snake_case");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
