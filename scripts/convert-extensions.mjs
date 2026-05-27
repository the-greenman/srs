#!/usr/bin/env node
/**
 * Convert extension records from shorthand to Tier 2 format
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EXTENSIONS_DIR = 'records/extensions';
const SOURCE_DOC_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

// Type ID for meta.extension
const EXTENSION_TYPE_ID = '0f71335f-1bef-5fb7-8944-ae2f3ecaf3ec';

// Field IDs
const EXTENSION_ID_FIELD = '2618ded3-aba7-5202-a1d9-a89157582f98';
const SECTION_TITLE_FIELD = '96f04d9d-9432-5628-8664-0d92e50f6fd0';
const EXTENSION_DEPENDS_FIELD = 'd424795f-cb3c-5c07-bd2f-dc7f475bc492';
const NORMATIVE_CONTENT_FIELD = '436786e4-d51e-5275-9654-bc4b5ee82b1a';

async function convertExtensions() {
  const files = await readdir(EXTENSIONS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Converting ${jsonFiles.length} extension files...`);

  for (const filename of jsonFiles) {
    const filepath = join(EXTENSIONS_DIR, filename);
    const content = await readFile(filepath, 'utf-8');
    const oldRecord = JSON.parse(content);

    // Create Tier 2 format
    const newRecord = {
      $schema: 'https://srs.semanticops.com/schema/2.0/record.json',
      instanceId: oldRecord.id,
      typeId: EXTENSION_TYPE_ID,
      typeVersion: 1,
      typeNamespace: 'com.semanticops.srs',
      typeName: 'meta.extension',
      fieldValues: [
        {
          fieldId: EXTENSION_ID_FIELD,
          value: oldRecord.fields?.extension_id || ''
        },
        {
          fieldId: SECTION_TITLE_FIELD,
          value: oldRecord.fields?.section_title || ''
        },
        {
          fieldId: EXTENSION_DEPENDS_FIELD,
          value: oldRecord.fields?.extension_depends || ''
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
          note: `Extension ${oldRecord.fields?.extension_id || 'unknown'} from srs-spec.md - coarse source anchoring during migration`
        }
      ],
      createdAt: oldRecord.createdAt || '2026-05-27T00:00:00Z'
    };

    await writeFile(filepath, JSON.stringify(newRecord, null, 2) + '\n');
    console.log(`  ✓ ${filename} (${oldRecord.fields?.extension_id || 'unknown'})`);
  }

  console.log('Done!');
}

convertExtensions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
