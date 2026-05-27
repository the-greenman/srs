#!/usr/bin/env node
/**
 * Render SRS specification markdown from canonical records
 */
import { readFile, writeFile, readdir } from 'fs/promises';
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
const NORMATIVE_CONTENT_FIELD = '436786e4-d51e-5275-9654-bc4b5ee82b1a';

async function renderSpec() {
  console.log('Rendering SRS specification...');

  // Load manifest
  const manifest = await loadRecord('manifest.json');

  // Load all section records
  const sections = [];
  for (const recordPath of manifest.instanceIndex) {
    if (recordPath.startsWith('sections/')) {
      const record = await loadRecord(join('records', recordPath));
      sections.push(record);
    }
  }

  // Sort sections by title order (01, 02, etc.)
  sections.sort((a, b) => {
    const titleA = getFieldValue(a, SECTION_TITLE_FIELD);
    const titleB = getFieldValue(b, SECTION_TITLE_FIELD);
    const orderA = titleA.match(/^(\d+)/)?.[1] || '99';
    const orderB = titleB.match(/^(\d+)/)?.[1] || '99';
    return parseInt(orderA) - parseInt(orderB);
  });

  // Load subsections
  const subsections = [];
  for (const recordPath of manifest.instanceIndex) {
    if (recordPath.startsWith('subsections/')) {
      const record = await loadRecord(join('records', recordPath));
      subsections.push(record);
    }
  }

  // Sort subsections
  subsections.sort((a, b) => {
    const titleA = getFieldValue(a, SECTION_TITLE_FIELD);
    const titleB = getFieldValue(b, SECTION_TITLE_FIELD);
    // Extract numeric prefix like 01-1, 01-2
    const matchA = recordPath.match(/^(\d+)-(\d+)/);
    const matchB = recordPath.match(/^(\d+)-(\d+)/);
    return 0; // Keep original order for now
  });

  // Build markdown
  let md = `# SRS Specification

**Version**: 2.0-draft
**Status**: active draft
**Scope**: field definitions (Field), type definitions (Type), records (Note / Typed Record / Record), relations, containers, distribution, and optional extensions covering addressability, lifecycle, protocol, schema, type inheritance, views, repeatable fields, field groups, cross-field validation, recommended relations, import tracking, and registry.

> **Projection note**: This Markdown file is a rendered projection of the SRS repository in this directory. The records are the source of truth; if this file diverges from repository state, the repository wins.

> **Migration note**: This document supersedes \`srs-schema.md\` (v1.0-draft). A vocabulary and structural mapping from v1 to v2 is in \`srs-schema-evolution.md\`. Design rationale, usage guidance, and commentary are in \`srs-rationale.md\`.

---

`;

  // Render sections
  for (const section of sections) {
    const title = getFieldValue(section, SECTION_TITLE_FIELD);
    const content = getFieldValue(section, NORMATIVE_CONTENT_FIELD);

    // Extract section number
    const sectionMatch = title.match(/^(\d+)\.\s*(.+)/);
    if (sectionMatch) {
      const sectionNum = sectionMatch[1];
      const sectionTitle = sectionMatch[2];
      md += `## ${sectionNum}. ${sectionTitle}\n\n`;
    } else {
      md += `## ${title}\n\n`;
    }

    if (content) {
      md += `${content}\n\n`;
    }

    // Find and render subsections for this section
    const sectionOrderMatch = title.match(/^(\d+)/);
    const sectionOrder = sectionOrderMatch ? sectionOrderMatch[1] : '';

    for (const subsection of subsections) {
      const subPath = subsection._path || '';
      const subTitle = getFieldValue(subsection, SECTION_TITLE_FIELD);
      const subContent = getFieldValue(subsection, NORMATIVE_CONTENT_FIELD);

      // Check if subsection belongs to this section by path
      if (subPath.includes(`${sectionOrder}-`)) {
        md += `### ${subTitle}\n\n`;
        if (subContent) {
          md += `${subContent}\n\n`;
        }
      }
    }
  }

  // Write output
  await writeFile('spec/srs-spec.md', md);
  console.log('  ✓ spec/srs-spec.md rendered');
  console.log(`  ${sections.length} sections, ${subsections.length} subsections`);
}

renderSpec().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
