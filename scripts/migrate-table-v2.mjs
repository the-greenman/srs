#!/usr/bin/env node
/**
 * Migrate table records from v1 (col-1..col-5) to v2 (columns + cells).
 *
 * v1: rows group entries each have col-1..col-5 fieldValues; first entry is header row.
 * v2: columns repeatable field on record; rows groupValues entries each have a
 *     single cells repeatable field. No header row in the group — columns field
 *     IS the header.
 *
 * Run from srs/:
 *   node scripts/migrate-table-v2.mjs
 */
import { readFile, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

async function loadJson(rel) {
  return JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
}
async function saveJson(rel, obj) {
  await writeFile(join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
}

// v1 col field IDs in column order
const COL_IDS = [
  '1a000027-0000-4000-a000-000000000027',
  '1a000028-0000-4000-a000-000000000028',
  '1a000029-0000-4000-a000-000000000029',
  '1a000030-0000-4000-a000-000000000030',
  '1a000031-0000-4000-a000-000000000031',
];

const F_COLUMNS = '1a000032-0000-4000-a000-000000000032';
const F_CELLS   = '1a000033-0000-4000-a000-000000000033';

function extractRowCells(entry) {
  // Extract values in col-1..col-5 order, dropping trailing empty values
  const vals = COL_IDS.map(id => entry.fieldValues?.find(f => f.fieldId === id)?.value ?? '');
  // Trim trailing empty strings
  let last = vals.length - 1;
  while (last > 0 && vals[last] === '') last--;
  return vals.slice(0, last + 1);
}

function wrapEntries(values) {
  return values.map(value => ({ value }));
}

async function migrateRecord(relPath) {
  const rec = await loadJson(relPath);
  const rowsGroup = rec.fieldGroups?.find(g => g.groupId === 'rows') ?? rec.groupValues?.find(g => g.groupId === 'rows');
  if (!rowsGroup) {
    console.warn(`  ⚠ No rows group in ${relPath}, skipping`);
    return;
  }

  const [headerEntry, ...dataEntries] = rowsGroup.entries;

  // Extract column names from header row
  const columnNames = extractRowCells(headerEntry);

  // Build new fieldValues: keep intro/outro, add columns if non-empty
  const newFieldValues = (rec.fieldValues ?? []).filter(
    fv => !COL_IDS.includes(fv.fieldId)
  );
  if (columnNames.length > 0) {
    newFieldValues.push({ fieldId: F_COLUMNS, entries: wrapEntries(columnNames) });
  }

  // Build new rows group entries
  const newEntries = dataEntries.map(entry => {
    const cells = extractRowCells(entry);
    return { fieldValues: [{ fieldId: F_CELLS, entries: wrapEntries(cells) }] };
  });

  const newRec = {
    ...rec,
    typeVersion: 2,
    fieldValues: newFieldValues,
    groupValues: [{ groupId: 'rows', entries: newEntries }],
  };

  delete newRec.fieldGroups;

  await saveJson(relPath, newRec);
  console.log(`  ✓ ${relPath} (${columnNames.length} cols, ${newEntries.length} rows)`);
}

async function main() {
  const manifest = await loadJson('manifest.json');
  const tablePaths = manifest.instanceIndex
    .filter(p => p.startsWith('tables/'))
    .map(p => `records/${p}`);

  console.log(`Migrating ${tablePaths.length} table records to v2...`);
  for (const p of tablePaths) {
    await migrateRecord(p);
  }

  // Delete col-1..col-5 field files
  const colFiles = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5'];
  for (const name of colFiles) {
    const path = join(ROOT, `package/spec-authoring-core/fields/${name}.json`);
    try {
      await unlink(path);
      console.log(`  ✓ Deleted fields/${name}.json`);
    } catch {
      console.warn(`  ⚠ fields/${name}.json not found`);
    }
  }

  console.log('\nDone. Run: node scripts/render-spec.mjs --doc unified');
}

main().catch(err => { console.error(err); process.exit(1); });
