#!/usr/bin/env node
/**
 * Render RFC markdown files from canonical records
 */
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function loadRecord(path) {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
}

function getFieldValue(record, fieldId) {
  const fv = record.fieldValues?.find(fv => fv.fieldId === fieldId);
  return fv?.value || '';
}

// Field IDs
const TITLE_FIELD = '1a000001-0000-4000-a000-000000000001';
const CONTENT_FIELD = '1a000002-0000-4000-a000-000000000002';
const RFC_NUMBER_FIELD = '5a000001-0000-4000-a000-000000000001';
const RFC_STATUS_FIELD = '5a000002-0000-4000-a000-000000000002';

async function renderRFCs() {
  console.log('Rendering RFCs...');

  // Load manifest
  const manifest = await loadRecord('manifest.json');

  // Find all RFC records
  const rfcPaths = manifest.instanceIndex.filter(p => p.startsWith('rfcs/'));

  const rfcRecords = [];
  for (const rfcPath of rfcPaths) {
    const record = await loadRecord(join('records', rfcPath));
    rfcRecords.push({ rfcPath, record });
  }

  rfcRecords.sort((a, b) => getFieldValue(a.record, RFC_NUMBER_FIELD).localeCompare(getFieldValue(b.record, RFC_NUMBER_FIELD)));

  for (const { record } of rfcRecords) {
    const title = getFieldValue(record, TITLE_FIELD);
    const status = getFieldValue(record, RFC_STATUS_FIELD);
    const content = getFieldValue(record, CONTENT_FIELD);

    // Extract RFC number from title
    const rfcMatch = title.match(/RFC-(\d+)/);
    const rfcNum = rfcMatch ? rfcMatch[1] : 'unknown';

    // Build markdown
    const md = `# ${title}

**Status**: ${status}

> **Projection note**: This Markdown file is a rendered projection of an RFC record in the SRS repository. The record is the source of truth.

---

${content}
`;

    // Write to spec/rfcs/ directory
    const outputPath = `spec/rfcs/rfc-${rfcNum}.md`;
    await writeFile(outputPath, md);
    console.log(`  ✓ ${outputPath}`);
  }

  console.log(`Done! Rendered ${rfcPaths.length} RFCs`);
}

renderRFCs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
