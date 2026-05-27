#!/usr/bin/env node
/**
 * Convert type-definition records from shorthand to Tier 2 format
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const TYPE_DEFS_DIR = 'records/type-definitions';
const SOURCE_DOC_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

// Type ID for meta.type-definition
const TYPE_DEF_TYPE_ID = '31a5a746-d2d6-5c56-a4b3-10fa07483a73';

// Field IDs
const SECTION_TITLE_FIELD = '96f04d9d-9432-5628-8664-0d92e50f6fd0';
const NORMATIVE_CONTENT_FIELD = '436786e4-d51e-5275-9654-bc4b5ee82b1a';

async function convertTypeDefinitions() {
  const files = await readdir(TYPE_DEFS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Converting ${jsonFiles.length} type-definition files...`);

  for (const filename of jsonFiles) {
    const filepath = join(TYPE_DEFS_DIR, filename);
    const content = await readFile(filepath, 'utf-8');
    const oldRecord = JSON.parse(content);

    // Extract type name from filename
    const typeName = filename.replace('.json', '');

    // Create Tier 2 format
    const newRecord = {
      $schema: 'https://srs.semanticops.com/schema/2.0/record.json',
      instanceId: oldRecord.id,
      typeId: TYPE_DEF_TYPE_ID,
      typeVersion: 1,
      typeNamespace: 'com.semanticops.srs',
      typeName: 'meta.type-definition',
      fieldValues: [
        {
          fieldId: SECTION_TITLE_FIELD,
          value: oldRecord.fields?.section_title || typeName
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
          note: `Type definition ${typeName} from srs-spec.md - coarse source anchoring during migration`
        }
      ],
      createdAt: oldRecord.createdAt || '2026-05-27T00:00:00Z'
    };

    await writeFile(filepath, JSON.stringify(newRecord, null, 2) + '\n');
    console.log(`  ✓ ${filename} (${typeName})`);
  }

  console.log('Done!');
}

convertTypeDefinitions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
