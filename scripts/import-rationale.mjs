#!/usr/bin/env node
/**
 * Import scds-rationale.md as design-note records.
 *
 * Each rationale entry (## heading or ### heading) becomes a design-note record.
 * Records are written to records/design-notes/.
 * manifest.json and relations/relations.json are updated in-place.
 *
 * Run from srs/ directory: node scripts/import-rationale.mjs
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const DESIGN_NOTE_TYPE_ID = '2a000012-0000-4000-a000-000000000012';
const SRS_SOURCE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

// Field IDs
const F_TITLE   = '1a000001-0000-4000-a000-000000000001';
const F_CONTENT = '1a000002-0000-4000-a000-000000000002';

// UUID generator: f10NNNNN-0000-4000-a000-00000000NNNN (1-indexed)
function makeUuid(n) {
  return `f1${String(n).padStart(6, '0')}-0000-4000-a000-${String(n).padStart(12, '0')}`;
}

// Semantic mapping: design-note title fragment → explains → spec entity UUIDs
// These are filled in after UUIDs are known for the design notes
const EXPLAINS_MAP = {
  'Why Field and Type are separate':         ['206b93e5-c3a4-516c-9e50-9c1be3a7f25c', '20ac347b-824d-5902-8dc6-6920d75b6dff'],
  'Why "Type" not "Module"':                 ['20ac347b-824d-5902-8dc6-6920d75b6dff'],
  'Why Record tiers exist':                  ['48b8b950-3ace-5b3e-b6a9-561b21dcb560', '44a1638e-923e-5a23-ae71-8b85b29d7149', 'b6ab8ae4-0041-5f4b-acf8-66204495d636'],
  'Why Protocol replaces':                   ['d557206f-fd5f-5626-8f13-8781b684fd03'],
  'Why Schema is a new concept':             ['d3b0ec85-760f-50d2-be4a-9edea5685740'], // subsection 07-4-ext-schema
  'Why Address and AttentionState':          ['a10d49a3-06ae-5690-ad9b-81edd6886b6d'],
  'Why Revision is addressable':             ['a10d49a3-06ae-5690-ad9b-81edd6886b6d'],
  'Why `valueType` and `editorHint`':        ['206b93e5-c3a4-516c-9e50-9c1be3a7f25c'],
  'Why `displayLabel` must not':             ['206b93e5-c3a4-516c-9e50-9c1be3a7f25c', 'e1000001-0000-4000-a000-000000000001'],
  'Why the directionality invariant':        ['eddeaecc-f30e-5919-b5ae-0bd4e38161ab', 'e1000016-0000-4000-a000-000000000016'],
  'Why Containers and Relations':            ['af489a79-3748-56a7-b21d-916da4a2ce08'],
  'Why the conversation layer':              ['6cb78382-35a5-5acc-a26c-774a2c288e23'],
  // Extension design notes — 4.x
  'How to decide which extensions':          null, // standalone
  'Addressability as a prerequisite':        ['a10d49a3-06ae-5690-ad9b-81edd6886b6d'],
  'Schema vs View':                          ['d3b0ec85-760f-50d2-be4a-9edea5685740'],
  '`semanticObjectType` as a federation':    ['87e912b6-b3f3-5207-a71b-73ce5cd6b8b7'],
  'Protocol loose-to-tight spectrum':        ['d557206f-fd5f-5626-8f13-8781b684fd03'],
  'Why Type inheritance is conservative':    ['c90aef1e-af6e-550e-ad07-1d5f1bfdf67f'], // ext-type-inheritance subsection
};

// Find best matching explains targets for a given title
function findExplains(title) {
  for (const [fragment, targets] of Object.entries(EXPLAINS_MAP)) {
    if (title.includes(fragment)) return targets;
  }
  return null;
}

// Parse the rationale markdown into sections
async function parseRationale() {
  const src = await readFile(join(ROOT, 'source-documents/rationale/scds-rationale.md'), 'utf8');
  const lines = src.split('\n');

  const entries = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) entries.push(current);
      const title = line.slice(3).replace(/^\d+\.\s+/, '').trim();
      current = { title, level: 2, body: [] };
    } else if (line.startsWith('### ')) {
      if (current) entries.push(current);
      const title = line.slice(4).replace(/^\d+\.\d+\s+/, '').trim();
      current = { title, level: 3, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) entries.push(current);

  // Trim trailing blank lines from each entry body
  return entries.map(e => ({
    ...e,
    content: e.body.join('\n').replace(/\n+$/, '')
  }));
}

async function main() {
  const entries = await parseRationale();
  console.log(`Parsed ${entries.length} rationale entries`);

  await mkdir(join(ROOT, 'records/design-notes'), { recursive: true });

  const createdRecords = [];
  const filenames = [];

  entries.forEach((entry, i) => {
    const n = i + 1;
    const uuid = makeUuid(n);
    const slug = entry.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    const filename = `${String(n).padStart(3, '0')}-${slug}.json`;

    const record = {
      "$schema": "https://srs.semanticops.com/schema/2.0/record.json",
      "instanceId": uuid,
      "typeId": DESIGN_NOTE_TYPE_ID,
      "typeVersion": 1,
      "typeNamespace": "com.semanticops.spec",
      "typeName": "design-note",
      "fieldValues": [
        { "fieldId": F_TITLE,   "value": entry.title },
        { "fieldId": F_CONTENT, "value": entry.content }
      ],
      "sourceRefs": [
        {
          "sourceType": "repository-document",
          "sourceId": SRS_SOURCE_ID,
          "relationType": "evidence",
          "note": `Imported from scds-rationale.md: "${entry.title}"`
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z"
    };

    createdRecords.push({ uuid, title: entry.title, filename, record });
    filenames.push(filename);
    console.log(`  ${filename}: ${entry.title.slice(0, 60)}`);
  });

  // Write record files
  for (const { filename, record } of createdRecords) {
    await writeFile(
      join(ROOT, 'records/design-notes', filename),
      JSON.stringify(record, null, 2) + '\n'
    );
  }

  // --- Update manifest.json ---
  const manifestPath = join(ROOT, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  // Remove any existing design-notes entries
  manifest.instanceIndex = manifest.instanceIndex.filter(p => !p.startsWith('design-notes/'));

  // Find position to insert: just before type-definitions
  const insertPos = manifest.instanceIndex.findIndex(p => p.startsWith('type-definitions/'));
  const newPaths = filenames.map(f => `design-notes/${f}`);
  manifest.instanceIndex.splice(insertPos, 0, ...newPaths);

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nUpdated manifest.json: added ${newPaths.length} design-note entries`);

  // --- Update relations.json ---
  const relPath = join(ROOT, 'relations/relations.json');
  const relFile = JSON.parse(await readFile(relPath, 'utf8'));

  // Remove old design-note relations
  relFile.relations = relFile.relations.filter(r =>
    r.id !== 'rel-design-note-sequence' && r.type !== 'explains'
  );

  // Add design-note-sequence
  relFile.relations.push({
    "id": "rel-design-note-sequence",
    "type": "design-note-sequence",
    "description": "Ordered list of all design-note records for the SRS rationale document.",
    "members": createdRecords.map(r => r.uuid)
  });

  // Add explains relations
  let explainCount = 0;
  createdRecords.forEach(({ uuid, title }) => {
    const targets = findExplains(title);
    if (targets) {
      targets.forEach((targetId, ti) => {
        relFile.relations.push({
          "id": `rel-explains-${uuid.slice(0, 8)}-${ti}`,
          "type": "explains",
          "from": uuid,
          "to": targetId,
          "note": `"${title.slice(0, 50)}" explains ${targetId.slice(0, 8)}`
        });
        explainCount++;
      });
    }
  });

  await writeFile(relPath, JSON.stringify(relFile, null, 2) + '\n');
  console.log(`Updated relations.json: added design-note-sequence + ${explainCount} explains relations`);
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
