#!/usr/bin/env node
/**
 * P4 Migration: Update all SRS records to use new com.semanticops.spec type/field UUIDs.
 *
 * Changes applied to every JSON file under srs/records/:
 *   1. typeId: 5 old → 5 new UUIDs
 *   2. fieldId: 5 old → 5 new UUIDs
 *   3. typeNamespace: "com.semanticops.srs" → "com.semanticops.spec"
 *   4. typeName: strip "meta." prefix for known types
 *   5. section/subsection title values: strip leading "NN. " number prefix
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const RECORDS_ROOT = new URL('../records', import.meta.url).pathname;

// --- ID mappings ---

const TYPE_ID_MAP = {
  '0f71335f-1bef-5fb7-8944-ae2f3ecaf3ec': '2a000008-0000-4000-a000-000000000008', // meta.extension
  '31a5a746-d2d6-5c56-a4b3-10fa07483a73': '2a000005-0000-4000-a000-000000000005', // meta.type-definition
  '58113328-ab22-5114-a639-cb23409b0e05': '6a000001-0000-4000-a000-000000000001', // meta.rfc
  '5e816b81-134f-5f60-938c-700617fd79ae': '2a000002-0000-4000-a000-000000000002', // meta.section
  'b01527f9-1a4c-5e5f-8a36-29e7ae7c51c4': '2a000003-0000-4000-a000-000000000003', // meta.subsection
};

const FIELD_ID_MAP = {
  '2618ded3-aba7-5202-a1d9-a89157582f98': '1a000018-0000-4000-a000-000000000018', // extension-id
  '436786e4-d51e-5275-9654-bc4b5ee82b1a': '1a000002-0000-4000-a000-000000000002', // normative-content → content
  '96f04d9d-9432-5628-8664-0d92e50f6fd0': '1a000001-0000-4000-a000-000000000001', // section-title → title
  '9aede8b8-d6ea-5da2-b02f-82ab3e823ff9': '5a000002-0000-4000-a000-000000000002', // rfc-status
  'd424795f-cb3c-5c07-bd2f-dc7f475bc492': '1a000019-0000-4000-a000-000000000019', // extension-depends
};

// Old title field ID (section-title) — used to detect which fieldValues entries need prefix stripping
const OLD_TITLE_FIELD_ID = '96f04d9d-9432-5628-8664-0d92e50f6fd0';
const NEW_TITLE_FIELD_ID = '1a000001-0000-4000-a000-000000000001';

// Type IDs for section and subsection (old) — only strip prefixes for these types
const SECTION_TYPE_IDS = new Set([
  '5e816b81-134f-5f60-938c-700617fd79ae', // meta.section
  'b01527f9-1a4c-5e5f-8a36-29e7ae7c51c4', // meta.subsection
]);

const TYPE_NAME_MAP = {
  'meta.extension': 'extension',
  'meta.type-definition': 'type-definition',
  'meta.rfc': 'rfc',
  'meta.section': 'section',
  'meta.subsection': 'subsection',
};

// Strip leading "NN. " or "NN.NN " pattern from titles
function stripNumberPrefix(value) {
  return value.replace(/^\d+(\.\d+)*\.\s+/, '');
}

// Recursively collect all .json files under a directory
function collectJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

let changed = 0;
let unchanged = 0;

for (const filePath of collectJsonFiles(RECORDS_ROOT)) {
  const raw = readFileSync(filePath, 'utf8');
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    console.warn(`SKIP (parse error): ${relative(RECORDS_ROOT, filePath)}`);
    continue;
  }

  let dirty = false;

  // 1. typeId
  if (record.typeId && TYPE_ID_MAP[record.typeId]) {
    const isSectionType = SECTION_TYPE_IDS.has(record.typeId);
    record.typeId = TYPE_ID_MAP[record.typeId];
    dirty = true;

    // 5. Strip number prefix from title values for section/subsection records
    if (isSectionType && Array.isArray(record.fieldValues)) {
      for (const fv of record.fieldValues) {
        // Match on old field ID (before it gets replaced below)
        if (fv.fieldId === OLD_TITLE_FIELD_ID && typeof fv.value === 'string') {
          const stripped = stripNumberPrefix(fv.value);
          if (stripped !== fv.value) {
            fv.value = stripped;
            dirty = true;
          }
        }
      }
    }
  }

  // 2. fieldId in fieldValues
  if (Array.isArray(record.fieldValues)) {
    for (const fv of record.fieldValues) {
      if (fv.fieldId && FIELD_ID_MAP[fv.fieldId]) {
        fv.fieldId = FIELD_ID_MAP[fv.fieldId];
        dirty = true;
      }
    }
  }

  // 3. typeNamespace
  if (record.typeNamespace === 'com.semanticops.srs') {
    record.typeNamespace = 'com.semanticops.spec';
    dirty = true;
  }

  // 4. typeName
  if (record.typeName && TYPE_NAME_MAP[record.typeName]) {
    record.typeName = TYPE_NAME_MAP[record.typeName];
    dirty = true;
  }

  if (dirty) {
    writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n', 'utf8');
    console.log(`UPDATED: ${relative(RECORDS_ROOT, filePath)}`);
    changed++;
  } else {
    unchanged++;
  }
}

console.log(`\nDone. ${changed} files updated, ${unchanged} unchanged.`);
