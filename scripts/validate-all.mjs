#!/usr/bin/env node
/**
 * Run all validation scripts
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = join(__dirname, '..');

/**
 * Every package in the tree, DISCOVERED rather than listed (#391).
 *
 * A hardcoded list is the same defect #391 fixes at the kind level, one level up: `package/base`
 * and `package/core` carried package.json files that no run ever reached, and the published
 * governance packages — the only ones populating `views`, `documentViews`, `lifecycles`,
 * `blueprints` and `protocols`, so the only ones that exercise five of the ten kinds against
 * anything — were never validated either. Adding a 1.2.0 to a list would have left it unvalidated
 * forever, silently. So nothing is listed: the two package roots are walked.
 *
 * Scoped to `srs/package/**` and `packages/**` deliberately. `rfcs/rfc-004/proposed-package/**`
 * also holds package.json files; those are the historical RFC-004 proposal that #308's guard
 * likewise excludes, and they are not live packages.
 *
 * Paths come back relative to `srs/`, because validate-package.mjs joins them onto the spec repo
 * root — so the published packages are reached with a leading `../`.
 */
async function discoverPackages() {
  const walkRoot = async (absRoot, relFromSrs) => {
    const found = [];
    const walk = async (absDir, rel) => {
      let entries;
      try {
        entries = await readdir(absDir, { withFileTypes: true });
      } catch {
        return;
      }
      if (entries.some((e) => e.isFile() && e.name === 'package.json')) found.push(rel);
      for (const entry of entries) {
        // `node_modules` would be fed to validate-package.mjs as an SRS manifest and turn the run
        // red for a reason unrelated to the corpus. Nothing puts one here today; excluding it costs
        // one line and removes a way for this walk to be wrong later.
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          await walk(join(absDir, entry.name), `${rel}/${entry.name}`);
        }
      }
    };
    await walk(absRoot, relFromSrs);
    return found;
  };

  // PER-ROOT floors, not one floor on the union. A single `packages.length === 0` check cannot fire
  // while the other root still yields something: rename `srs/package` and the walk would return the
  // two published packages, print "Discovered 2 packages" and exit 0 having validated none of the
  // six spec packages. Each root must independently produce at least one.
  const roots = [
    { abs: join(REPO_ROOT, 'srs/package'), rel: 'package', label: 'srs/package/**' },
    { abs: join(REPO_ROOT, 'packages'), rel: '../packages', label: 'packages/**' },
  ];
  const found = [];
  const emptyRoots = [];
  for (const root of roots) {
    const packages = await walkRoot(root.abs, root.rel);
    if (packages.length === 0) emptyRoots.push(root.label);
    found.push(...packages);
  }
  return { packages: found.sort(), emptyRoots };
}

async function runScript(script, args = []) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    const child = spawn('node', [join(__dirname, script), ...args], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Where this runs: `scripts/check-release-drift.mjs` invokes this script as its first step, and
// that is what `.github/workflows/release-drift.yml` (a required check on every push and pull
// request) and `hooks/pre-commit` both run. Grepping the workflows for `validate-all` finds nothing
// and reads as "no CI runs this" — it does, one call deep.
async function validateAll() {
  console.log('Running all validations...\n');

  let allValid = true;

  const { packages, emptyRoots } = await discoverPackages();
  console.log(`Discovered ${packages.length} packages: ${packages.join(', ')}`);
  if (emptyRoots.length > 0) {
    // A walk that found nothing is not a tree with nothing to validate.
    console.log(`\n\u2717 No packages discovered under ${emptyRoots.join(' or ')} — refusing to report success.`);
    process.exit(1);
  }

  for (const pkg of packages) {
    const valid = await runScript('validate-package.mjs', [pkg]);
    if (!valid) allValid = false;
  }

  // No two packages may claim one UUID (#295). validate-package.mjs checks each package in
  // isolation, so a duplicated package id — RFC-033 Change A pinned one spec-authoring-core already
  // held — passes every per-package check and surfaces only in whoever imports both.
  const packageIdsUnique = await runScript('check-package-id-uniqueness.mjs');
  if (!packageIdsUnique) allValid = false;

  const recordsValid = await runScript('validate-records.mjs');
  if (!recordsValid) allValid = false;

  const rfcProcessValid = await runScript('validate-rfc-process.mjs');
  if (!rfcProcessValid) allValid = false;

  const rfcIntegrationValid = await runScript('check-rfc-integration.mjs');
  if (!rfcIntegrationValid) allValid = false;

  // RFC-032 (Field type model) — proof, migration transform, and conformance fixture. These use the
  // runtime docs/schema/2.0 schemas (not the embedded `srs` binary, which still carries the
  // pre-RFC-032 schema per ADR-004).
  for (const script of ['rfc-032-paper-proof.mjs', 'rfc-032-migration-test.mjs', '../tests/rfc-032/run.mjs']) {
    const valid = await runScript(script);
    if (!valid) allValid = false;
  }
  // The migration must stay fully applied (no field left on the legacy valueType model).
  const migrationApplied = await runScript('migrate-rfc-032-field-type.mjs', ['--check']);
  if (!migrationApplied) allValid = false;
  // ...and no Type may lean on the deprecated repeatable/minItems/maxItems trio for cardinality its
  // Field does not declare (#276). Neither `repo validate` nor the migration --check sees this: the
  // migration reads Field definitions alone and derives `list` only from legacy `multiselect`, so a
  // Field made repeatable purely by assignment migrated to single-valued without complaint.
  const cardinalityCoherent = await runScript('check-cardinality-coherence.mjs');
  if (!cardinalityCoherent) allValid = false;

  // rfc-decision-c8704763 (reference taxonomy) vocabularyRef migration must stay fully applied: no
  // Field definition under tests/rfc-032/package/fields may still carry a legacy
  // "namespace/name@version" vocabularyRef pattern string. Deterministic and re-runnable
  // (scripts/migrate-vocabulary-ref-to-lineage.mjs --check).
  //
  // The sibling dependencyRefs -> packageDependencies rename (package-manifest.json item 2) is
  // PARKED, not executed here: srs/package/spec-rfc-process/package.json is the only live
  // package-manifest using it, and it is part of the effective package set the root container's
  // catalog load depends on. Even the latest available srs-rust release at the time of this
  // discovery (build.294, srs#478) still embeds a package-manifest.json with
  // additionalProperties:false and no `packageDependencies` — renaming it now would fail catalog
  // load entirely, taking `repo validate`/`render` (and therefore check-release-drift.mjs /
  // publish-spec.mjs) down with it. See #478's PARK comment for the ready-to-run schema + migration
  // diff, to land together with the srs-rust mirror-sync follow-up.
  const vocabularyRefMigrated = await runScript('migrate-vocabulary-ref-to-lineage.mjs', ['--check']);
  if (!vocabularyRefMigrated) allValid = false;

  // RFC-023 Change A/B (srs#480, RFC-040 Change I): no sourceRef under srs/records may still carry
  // the legacy relationType field. The schema-level rejection (additionalProperties:false, the
  // relationType property removed from note.json/record.json/relation.json/relations-collection.json/
  // typed-record.json) already fails validate-records.mjs on a legacy entry; this guard names the
  // migration explicitly so drift reads as "run the migration script", not a generic schema error.
  const sourceRefRoleMigrated = await runScript('migrate-sourceref-relationtype-to-sourcerole.mjs', ['--check']);
  if (!sourceRefRoleMigrated) allValid = false;

  // Field.name is snake_case (#308). The rule was stated unconditionally by field.json and record
  // 7d22d50f and enforced nowhere, so the corpus stayed conformant only by attention. Names matter
  // beyond style: srs-repository resolves several Fields by name and binds misses with
  // `if let Some(..)`, so a drifted name silently disables the check that depended on it.
  //
  // After the RFC-032 fixture above, not before: the guard walks `tests/`, and tests/rfc-032/run.mjs
  // regenerates those 24 Field files from its in-script table. Running first would read the previous
  // run's output, so a kebab name introduced in that generator would pass the run that introduced it
  // and fail the next one, detached from its cause.
  const fieldNamesValid = await runScript('check-field-name-convention.mjs');
  if (!fieldNamesValid) allValid = false;

  // Every definition kind package-manifest.json declares resolves to a schema (#311). `protocols`
  // was declarable with no protocol.json behind it until #378 and nothing noticed.
  const schemaKindsValid = await runScript('check-schema-kind-correspondence.mjs');
  if (!schemaKindsValid) allValid = false;

  // package-bundle.json's definitionType enum is GENERATED from package-manifest.json's ten
  // definition kinds (rfc-decision-c8704763 item 4; finding A6) — the two lists cannot diverge
  // again because there is only one list.
  const definitionTypeEnumSynced = await runScript('gen-package-bundle-definition-type.mjs', ['--check']);
  if (!definitionTypeEnumSynced) allValid = false;

  // Every discovered record reaches a reader, or its invisibility is recorded (#285). `repo
  // validate` reports an unpublished record as a healthy instance, which is how six
  // records/type-definitions/ shadows came to be read by RFC-031 as authoritative prose the
  // specification never published, and how eight populated table records carrying 62 rows of spec
  // content stayed invisible through a release criterion ("render identically") that was never
  // satisfiable. Reachability is a property of the corpus and its declared views, so it belongs
  // here rather than in the binary — a third-party SRS repository may legitimately hold
  // unpublished records.
  const publicationReachable = await runScript('check-publication-reachability.mjs');
  if (!publicationReachable) allValid = false;

  // Every com.semanticops.spec/invariant record lives in the RFC-016 projection root, with no
  // exclusion-list escape (srs#410). The #285 guard above already refuses to treat a stray invariant
  // as published; that guard's exclusion list is exactly the lever that let the RFC-011 invariants
  // sit outside the root for weeks on a factually wrong "unaccepted RFC" reason. This makes literal
  // [R1] mechanically true: placement in the root is what makes an invariant normative, and nothing
  // can declare a stray one deliberately invisible instead of relocating it.
  const invariantPlacementValid = await runScript('check-invariant-placement.mjs');
  if (!invariantPlacementValid) allValid = false;

  // The Decision Compass (docs/charter/decision-compass.md, srs#461) stays bidirectionally in sync
  // with the charter-class decision records it surfaces: every citation resolves to a real record,
  // and every record in its roster is actually cited, not just listed.
  const decisionCompassValid = await runScript('check-decision-compass-drift.mjs');
  if (!decisionCompassValid) allValid = false;

  // Every com.semanticops.spec/rfc-decision record dated 2026-08-23 or later carries a cell:<slug>
  // tag (srs#462). rfc-decision-cce3c00e's standing rule — "every new RFC and decision names its
  // cell" — held only by convention until this guard; a decision landing in no cell is exactly the
  // drift the Pattern Grid exists to catch.
  const decisionCellTagsValid = await runScript('check-decision-cell-tags.mjs');
  if (!decisionCellTagsValid) allValid = false;

  // ...and every guard demonstrably fails on the violation it exists to catch — including
  // validate-package.mjs's own ten-kind coverage (#391), whose blueprint cases would otherwise be
  // green on an empty list. A guard nobody has watched fail is indistinguishable from a guard that
  // cannot fail.
  const guardsBite = await runScript('../tests/guards/run.mjs');
  if (!guardsBite) allValid = false;

  // RFC-033 (self-hosted meta-model). The frozen-seed metamodel package must stay in sync with its
  // generator, and its fieldTypes must project (via the projectField stand-in) to the frozen seed's
  // authoritative fragments — the bootstrap-closure demonstration for [R4](a). Node pipeline only.
  const metamodelInSync = await runScript('gen-metamodel-package.mjs', ['--check']);
  if (!metamodelInSync) allValid = false;
  const closureHolds = await runScript('rfc-033-closure-test.mjs');
  if (!closureHolds) allValid = false;

  // RFC-035 (JSON Schema emitter). Tier 1: the emitter's whole-entity output is byte-for-byte reproducible
  // against its committed goldens (determinism). Tier 2: that output is `emitter ⊆ frozen seed` over the
  // covered authoritative features (whole-entity closure — discharges RFC-033 [R4](b)). Node pipeline only
  // (ADR-004: the binary can't load the fieldType metamodel package).
  const emitterDeterministic = await runScript('../tests/rfc-035/run.mjs');
  if (!emitterDeterministic) allValid = false;
  const emitterClosureHolds = await runScript('rfc-035-closure-test.mjs');
  if (!emitterClosureHolds) allValid = false;

  console.log(`\n${'='.repeat(60)}`);
  console.log(allValid ? '\n✓ All validations passed' : '\n✗ Some validations failed');
  process.exit(allValid ? 0 : 1);
}

validateAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
