#!/usr/bin/env node
/**
 * Convert RFC records from shorthand to Tier 2 format
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const RFCS_DIR = 'records/rfcs';
const SOURCE_DOC_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

// Type ID for meta.rfc
const RFC_TYPE_ID = '58113328-ab22-5114-a639-cb23409b0e05';

// Field IDs
const SECTION_TITLE_FIELD = '96f04d9d-9432-5628-8664-0d92e50f6fd0';
const RFC_STATUS_FIELD = '9aede8b8-d6ea-5da2-b02f-82ab3e823ff9';
const NORMATIVE_CONTENT_FIELD = '436786e4-d51e-5275-9654-bc4b5ee82b1a';

async function convertRFCs() {
  const files = await readdir(RFCS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Converting ${jsonFiles.length} RFC files...`);

  for (const filename of jsonFiles) {
    const filepath = join(RFCS_DIR, filename);
    const content = await readFile(filepath, 'utf-8');
    const oldRecord = JSON.parse(content);

    // Extract RFC number from title if possible
    const title = oldRecord.fields?.section_title || '';
    const rfcMatch = title.match(/RFC-(\d+)/);
    const rfcNum = rfcMatch ? rfcMatch[1] : 'unknown';

    // Create Tier 2 format
    const newRecord = {
      $schema: 'https://srs.semanticops.com/schema/2.0/record.json',
      instanceId: oldRecord.id,
      typeId: RFC_TYPE_ID,
      typeVersion: 1,
      typeNamespace: 'com.semanticops.srs',
      typeName: 'meta.rfc',
      fieldValues: [
        {
          fieldId: SECTION_TITLE_FIELD,
          value: title
        },
        {
          fieldId: RFC_STATUS_FIELD,
          value: oldRecord.fields?.rfc_status || 'draft'
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
          note: `RFC-${rfcNum} from srs-spec.md - coarse source anchoring during migration`
        }
      ],
      createdAt: oldRecord.createdAt || '2026-05-27T00:00:00Z'
    };

    await writeFile(filepath, JSON.stringify(newRecord, null, 2) + '\n');
    console.log(`  ✓ ${filename} (RFC-${rfcNum})`);
  }

  console.log('Done!');
}

convertRFCs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
