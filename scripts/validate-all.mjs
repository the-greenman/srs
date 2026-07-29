#!/usr/bin/env node
/**
 * Run all validation scripts
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packages = [
  'package',
  'package/spec-authoring-core',
  'package/spec-rfc-process',
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

async function validateAll() {
  console.log('Running all validations...\n');

  let allValid = true;

  for (const pkg of packages) {
    const valid = await runScript('validate-package.mjs', [pkg]);
    if (!valid) allValid = false;
  }

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

  console.log(`\n${'='.repeat(60)}`);
  console.log(allValid ? '\n✓ All validations passed' : '\n✗ Some validations failed');
  process.exit(allValid ? 0 : 1);
}

validateAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
