#!/usr/bin/env node
/**
 * check-cardinality-coherence.mjs — RFC-032 [R4] guard (#276).
 *
 * Under RFC-032 [R4], `Field.fieldType.cardinality` is the *sole* cardinality mechanism. The
 * assignment-level `repeatable`/`minItems`/`maxItems` trio on `FieldAssignment` is DEPRECATED and
 * survives only until the #242 cutover.
 *
 * That leaves a silent trap: a Type may assign `repeatable: true` to a Field whose `fieldType`
 * declares no `cardinality: "list"`. Such a Field is single-valued on paper while its instance data
 * is arrays — the records load only because the deprecated trio is still honoured, so deleting the
 * trio (as #242 will) invalidates them with no prior warning. `srs repo validate` reports 0 errors
 * for this state, because both readings are individually well-formed.
 *
 * This check fails whenever a FieldAssignment carries deprecated cardinality (`repeatable: true`,
 * `minItems`, or `maxItems`) while the Field it references has *adopted* `fieldType` but is not
 * `cardinality: "list"`. Group-level cardinality on a `FieldGroup` is *not* flagged: it counts group
 * occurrences (rows), not values of any one Field, and it is removed wholesale by #242 along with
 * FieldGroup itself.
 *
 * A Field still on the pre-RFC-032 `valueType` model is reported but does NOT fail the check. There,
 * standalone `repeatable` was the legitimate mechanism of its day, so the pair is coherent under the
 * model that package was authored against — it is a not-yet-migrated package, not a Field that lost
 * its list-ness in migration. `scripts/migrate-rfc-032-field-type.mjs` scopes itself to the live spec
 * packages for the same reason; released package artifacts under `packages/<name>/<version>/` are
 * frozen and must not be rewritten in place.
 *
 * The check is intentionally kept after the trio is deleted: with no deprecated cardinality left to
 * find, it passes vacuously and costs nothing.
 *
 *   node scripts/check-cardinality-coherence.mjs
 */
import { readdir, readFile } from "fs/promises";
import { join, resolve, relative } from "path";

const ROOT = resolve(new URL("..", import.meta.url).pathname); // srs repo root

// Every tree that holds SRS packages. Proposal/example trees are included deliberately — a stale
// example is exactly the kind of thing that gets copied into a real package later.
const SEARCH_ROOTS = ["srs", "packages", "conformance", "docs/spec/examples", "rfcs"];

const DEPRECATED_CARDINALITY_KEYS = ["repeatable", "minItems", "maxItems"];

async function findJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findJsonFiles(abs)));
    else if (e.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

async function readJson(abs) {
  try {
    const parsed = JSON.parse(await readFile(abs, "utf8"));
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null; // structural load failures are validate-package.mjs's job to report
  }
}

/** A Field definition is any object with an id plus a fieldType (post-RFC-032) or valueType (pre-). */
function isFieldDefinition(o) {
  return typeof o.id === "string" && typeof o.name === "string" &&
    (typeof o.valueType === "string" || (o.fieldType != null && typeof o.fieldType === "object"));
}

/** A Type definition is any object with an id and a fields[] array of assignments. */
function isTypeDefinition(o) {
  return typeof o.id === "string" && typeof o.name === "string" && Array.isArray(o.fields);
}

function label(o) {
  return `${o.namespace ?? "?"}/${o.name}${o.version != null ? `@${o.version}` : ""}`;
}

/** Assignments carrying deprecated cardinality, from both `fields[]` and `fieldGroups[].fields[]`. */
function* assignmentsWithDeprecatedCardinality(type) {
  const scan = function* (list, groupId) {
    for (const a of list ?? []) {
      if (a == null || typeof a !== "object") continue;
      const keys = DEPRECATED_CARDINALITY_KEYS.filter((k) => a[k] != null && a[k] !== false);
      if (keys.length > 0) yield { assignment: a, keys, groupId };
    }
  };
  yield* scan(type.fields, null);
  for (const g of type.fieldGroups ?? []) {
    if (g != null && typeof g === "object") yield* scan(g.fields, g.groupId ?? "?");
  }
}

async function main() {
  const files = (await Promise.all(SEARCH_ROOTS.map((r) => findJsonFiles(join(ROOT, r))))).flat().sort();

  /** @type {Map<string, Array<{field: object, path: string}>>} fieldId -> definitions, all trees */
  const fields = new Map();
  /** @type {Array<{type: object, path: string}>} */
  const types = [];

  for (const abs of files) {
    const o = await readJson(abs);
    if (o == null) continue;
    const path = relative(ROOT, abs);
    // Field first: a Type never carries fieldType/valueType, so the tests are disjoint.
    if (isFieldDefinition(o)) {
      // The same fieldId is copied across package/proposal/example trees. Keep every copy so the
      // Type gets resolved against the one in its *own* tree — copies can be on different sides of
      // the RFC-032 migration, which is precisely what this check is reading.
      if (!fields.has(o.id)) fields.set(o.id, []);
      fields.get(o.id).push({ field: o, path });
    } else if (isTypeDefinition(o)) {
      types.push({ type: o, path });
    }
  }

  /** Resolve a fieldId as the Type at `typePath` would: the copy sharing the longest path prefix. */
  const resolveField = (fieldId, typePath) => {
    const candidates = fields.get(fieldId);
    if (candidates == null || candidates.length === 0) return null;
    const typeSegs = typePath.split("/");
    const shared = (p) => {
      const segs = p.split("/");
      let n = 0;
      while (n < segs.length && n < typeSegs.length && segs[n] === typeSegs[n]) n++;
      return n;
    };
    return candidates.reduce((best, c) => (shared(c.path) > shared(best.path) ? c : best));
  };

  const violations = [];
  const legacy = [];
  const unresolved = [];
  let assignmentsChecked = 0;

  for (const { type, path } of types) {
    for (const { assignment, keys, groupId } of assignmentsWithDeprecatedCardinality(type)) {
      assignmentsChecked++;
      const entry = resolveField(assignment.fieldId, path);
      const where = groupId == null ? "fields[]" : `fieldGroups[${groupId}].fields[]`;
      if (entry == null) {
        // Not this check's business to resolve packages — report and keep going.
        unresolved.push({ path, type: label(type), where, fieldId: assignment.fieldId, keys });
        continue;
      }
      const finding = { path, type: label(type), where, keys, field: label(entry.field), fieldPath: entry.path };
      if (entry.field.fieldType == null) {
        legacy.push(finding); // pre-RFC-032 package: coherent under its own model
      } else if (entry.field.fieldType.cardinality !== "list") {
        violations.push({ ...finding, cardinality: entry.field.fieldType.cardinality ?? "(absent → single)" });
      }
    }
  }

  console.log("RFC-032 [R4] cardinality coherence (#276)");
  console.log(`  Field definitions indexed:              ${[...fields.values()].reduce((n, v) => n + v.length, 0)}`);
  console.log(`  Type definitions scanned:               ${types.length}`);
  console.log(`  Assignments with deprecated cardinality: ${assignmentsChecked}`);

  for (const u of unresolved) {
    console.log(`\n  ? ${u.path}`);
    console.log(`    ${u.type} ${u.where} references unknown fieldId ${u.fieldId} (carries ${u.keys.join(", ")})`);
  }

  if (legacy.length > 0) {
    console.log(`\n  Not failed — ${legacy.length} assignment(s) on pre-RFC-032 (valueType) Fields:`);
    for (const l of legacy) {
      console.log(`    · ${l.path}`);
      console.log(`      ${l.type} ${l.where} assigns ${l.keys.join(", ")} to ${l.field} (${l.fieldPath})`);
    }
    console.log("    These packages have not adopted RFC-032 at all, so standalone `repeatable` is still");
    console.log("    their own model's cardinality mechanism. They migrate when (and if) they are");
    console.log("    republished — released versions under packages/<name>/<version>/ are frozen.");
  }

  if (violations.length > 0) {
    console.log("");
    for (const v of violations) {
      console.log(`  ✗ ${v.path}`);
      console.log(`    ${v.type} ${v.where} assigns ${v.keys.join(", ")} to ${v.field},`);
      console.log(`    whose fieldType.cardinality is ${v.cardinality} — expected "list".`);
      console.log(`    Fix: add "cardinality": "list" to fieldType in ${v.fieldPath}`);
    }
    console.log(`\n✗ ${violations.length} assignment(s) rely on deprecated cardinality that the Field does not declare.`);
    console.log("  Deleting the deprecated repeatable/minItems/maxItems trio (#242) would silently");
    console.log("  invalidate every record of the Type(s) above.");
    process.exit(1);
  }

  console.log("\n✓ Every deprecated cardinality assignment is backed by fieldType.cardinality: list");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
