#!/usr/bin/env node
/**
 * Convert subsection records from shorthand to Tier 2 format
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SUBSECTIONS_DIR = 'records/subsections';
const SOURCE_DOC_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

// Type ID for meta.subsection
const SUBSECTION_TYPE_ID = 'b01527f9-1a4c-5e5f-8a36-29e7ae7c51c4';

// Field IDs
const SECTION_TITLE_FIELD = '96f04d9d-9432-5628-8664-0d92e50f6fd0';
const NORMATIVE_CONTENT_FIELD = '436786e4-d51e-5275-9654-bc4b5ee82b1a';

async function convertSubsections() {
  const files = await readdir(SUBSECTIONS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Converting ${jsonFiles.length} subsection files...`);

  for (const filename of jsonFiles) {
    const filepath = join(SUBSECTIONS_DIR, filename);
    const content = await readFile(filepath, 'utf-8');
    const oldRecord = JSON.parse(content);

    // Extract order from filename or meta
    const orderMatch = filename.match(/^(\d+-\d+)/);
    const order = orderMatch ? orderMatch[1] : oldRecord.meta?.order || '00-0';

    // Create Tier 2 format
    const newRecord = {
      $schema: 'https://srs.semanticops.com/schema/2.0/record.json',
      instanceId: oldRecord.id,
      typeId: SUBSECTION_TYPE_ID,
      typeVersion: 1,
      typeNamespace: 'com.semanticops.srs',
      typeName: 'meta.subsection',
      fieldValues: [
        {
          fieldId: SECTION_TITLE_FIELD,
          value: oldRecord.fields?.section_title || ''
        },
        {
          fieldId: NORMATIVE_CONTENT_FIELD,
          value: oldRecord.fields?.normative_content || ''
        }
      ],
      sourceRefs: [
        {
          sourceType: 'repository-document',
          sourceId: SOURCE_DOC_ID,
          relationType: 'evidence',
          note: `Subsection ${order} from srs-spec.md - coarse source anchoring during migration`
        }
      ],
      createdAt: oldRecord.createdAt || '2026-05-27T00:00:00Z'
    };

    await writeFile(filepath, JSON.stringify(newRecord, null, 2) + '\n');
    console.log(`  ✓ ${filename}`);
  }

  console.log('Done!');
}

convertSubsections().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
