#!/usr/bin/env node
/**
 * Build complete manifest with full instance index
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function findRecordFiles(dir, basePath = '') {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await findRecordFiles(fullPath, relativePath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.json') && !entry.name.endsWith('.meta.json')) {
      files.push(relativePath);
    }
  }

  return files;
}

async function findSourceDocumentSidecars(dir, basePath = '') {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await findSourceDocumentSidecars(fullPath, relativePath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.meta.json')) {
      files.push(relativePath);
    }
  }

  return files;
}

async function buildManifest() {
  console.log('Building manifest...');

  // Find all record files
  const recordFiles = await findRecordFiles('records');
  console.log(`  Found ${recordFiles.length} records`);

  // Find all source document sidecars
  const sourceDocFiles = await findSourceDocumentSidecars('source-documents');
  console.log(`  Found ${sourceDocFiles.length} source documents`);

  const manifest = {
    $schema: 'https://srs.semanticops.com/schema/2.0/manifest.json',
    srsVersion: '2.0-draft',
    repositoryId: '4172fada-bc38-5479-ac18-4be3194a68ca',
    title: 'Semantic Record System Specification',
    description: 'The SRS specification, authored as an SRS repository. The rendered specification is a DocumentView export of the records in this repository.',
    namespace: 'com.semanticops.srs',
    packageRef: {
      mode: 'local',
      path: 'package'
    },
    instanceIndex: recordFiles.sort(),
    sourceDocumentIndex: sourceDocFiles.sort(),
    relationsPath: 'relations/relations.json',
    sourceDocumentsPath: 'source-documents',
    declaredExtensions: [
      'ext:lifecycle',
      'ext:addressability',
      'ext:views-l1',
      'ext:views-l2',
      'ext:repository',
      'ext:recommended-relations'
    ],
    meta: {
      renderedExports: [
        {
          view: 'srs-spec-document-view',
          outputPath: 'docs/spec/srs-spec.md',
          format: 'markdown'
        }
      ],
      sourceOfTruth: 'records'
    }
  };

  await writeFile('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log('  ✓ manifest.json written');
}

buildManifest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
