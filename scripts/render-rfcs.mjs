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
const SECTION_TITLE_FIELD = '96f04d9d-9432-5628-8664-0d92e50f6fd0';
const RFC_STATUS_FIELD = '9aede8b8-d6ea-5da2-b02f-82ab3e823ff9';
const NORMATIVE_CONTENT_FIELD = '436786e4-d51e-5275-9654-bc4b5ee82b1a';

async function renderRFCs() {
  console.log('Rendering RFCs...');

  // Load manifest
  const manifest = await loadRecord('manifest.json');

  // Find all RFC records
  const rfcPaths = manifest.instanceIndex.filter(p => p.startsWith('rfcs/'));

  for (const rfcPath of rfcPaths) {
    const record = await loadRecord(join('records', rfcPath));
    const title = getFieldValue(record, SECTION_TITLE_FIELD);
    const status = getFieldValue(record, RFC_STATUS_FIELD);
    const content = getFieldValue(record, NORMATIVE_CONTENT_FIELD);

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
