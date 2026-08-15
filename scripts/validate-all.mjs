#!/usr/bin/env node
/**
 * Run all validation scripts
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths are relative to `srs/` (validate-package.mjs joins them onto the spec repo root), so the
// published packages under `packages/**` are reached with a leading `../`.
const packages = [
  'package',
  'package/spec-authoring-core',
  'package/spec-rfc-process',
  'package/metamodel',
  // Declared package.json files that no run ever reached (#391). Both were invisible for the same
  // reason the seven definition kinds were: nothing enumerated them.
  'package/base',
  'package/core',
  // The published packages are the ONLY ones that populate `views`, `documentViews`, `lifecycles`,
  // `blueprints` and `protocols`. Without them, #391's extension is exercised against empty lists
  // for five of the ten kinds — CI green for the wrong reason, which is the failure mode this
  // whole line of work is about. They are shipped artifacts and both validate today.
  '../packages/com.mudemocracy.governance/1.0.0/package',
  '../packages/com.mudemocracy.governance/1.1.0/package',
];

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
