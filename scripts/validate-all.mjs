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

  console.log(`\n${'='.repeat(60)}`);
  console.log(allValid ? '\n✓ All validations passed' : '\n✗ Some validations failed');
  process.exit(allValid ? 0 : 1);
}

validateAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
