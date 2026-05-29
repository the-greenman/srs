#!/usr/bin/env node
/**
 * Render SRS documents from canonical records.
 *
 * Usage:
 *   node scripts/render-spec.mjs                  # spec → docs/spec/srs-spec.md
 *   node scripts/render-spec.mjs --doc rationale  # rationale → docs/spec/srs-rationale.md
 *   node scripts/render-spec.mjs --doc unified    # both → docs/spec/srs-unified.md
 */
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT     = join(__dir, '..', 'srs');   // SRS repo root (manifest, records, relations)
const OUT_ROOT = join(__dir, '..');            // output root (docs/spec/)

// --- Field IDs (new com.semanticops.spec UUIDs) ---
const F_TITLE       = '1a000001-0000-4000-a000-000000000001';
const F_CONTENT     = '1a000002-0000-4000-a000-000000000002';
const F_CANONICAL   = '1a000013-0000-4000-a000-000000000013';
const F_VERSION     = '1a000010-0000-4000-a000-000000000010';
const F_STATUS      = '1a000009-0000-4000-a000-000000000009';
const F_SUMMARY     = '1a000011-0000-4000-a000-000000000011';
const F_INTRO       = '1a000025-0000-4000-a000-000000000025';
const F_OUTRO       = '1a000026-0000-4000-a000-000000000026';
const F_COLUMNS     = '1a000032-0000-4000-a000-000000000032';
const F_CELLS       = '1a000033-0000-4000-a000-000000000033';

// --- Type IDs ---
const T_SPECIFICATION = '2a000001-0000-4000-a000-000000000001';
const T_SECTION       = '2a000002-0000-4000-a000-000000000002';
const T_SUBSECTION    = '2a000003-0000-4000-a000-000000000003';
const T_TABLE         = '2a000013-0000-4000-a000-000000000013';

// --- Parse CLI args ---
const docArg = process.argv.indexOf('--doc');
const doc = docArg !== -1 ? process.argv[docArg + 1] : 'spec';
if (!['spec', 'rationale', 'unified'].includes(doc)) {
  console.error(`Unknown --doc value: ${doc}. Use spec | rationale | unified`);
  process.exit(1);
}

// --- Helpers ---
function fv(record, fieldId) {
  return record.fieldValues?.find(f => f.fieldId === fieldId)?.value ?? '';
}

function entryValues(entries = []) {
  return entries.map(entry => (entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry));
}

// Render a table record to markdown (v2: columns field + cells repeatable per row)
function renderTable(tableRecord) {
  const intro = fv(tableRecord, F_INTRO);
  const outro = fv(tableRecord, F_OUTRO);

  // columns: repeatable field → { fieldId, entries: [...] }
  const columnsDef = tableRecord.fieldValues?.find(f => f.fieldId === F_COLUMNS);
  const columns = entryValues(columnsDef?.entries ?? []);

  const group = tableRecord.groupValues?.find(g => g.groupId === 'rows');
  const entries = group?.entries ?? [];
  if (!entries.length && !columns.length) return '';

  let md = '';
  if (intro) md += `${intro}\n\n`;

  // Determine column count
  const colCount = columns.length || Math.max(
    ...entries.map(e => e.fieldValues?.find(f => f.fieldId === F_CELLS)?.entries?.length ?? 0),
    0
  );

  if (columns.length) {
    md += `| ${columns.join(' | ')} |\n`;
    md += `| ${columns.map(() => '---').join(' | ')} |\n`;
  }

  for (const entry of entries) {
    const cells = entryValues(entry.fieldValues?.find(f => f.fieldId === F_CELLS)?.entries ?? []);
    // Pad to colCount if needed
    const padded = Array.from({ length: colCount }, (_, i) => cells[i] ?? '');
    md += `| ${padded.join(' | ')} |\n`;
  }

  if (outro) md += `\n${outro}\n`;

  return md;
}

async function loadJson(rel) {
  const text = await readFile(join(ROOT, rel), 'utf8');
  return JSON.parse(text);
}

async function buildInstanceMap(instanceIndex) {
  const map = new Map();
  for (const entry of instanceIndex) {
    const path = typeof entry === 'string' ? entry : entry.path;
    const record = await loadJson(path);
    map.set(record.instanceId, record);
  }
  return map;
}

// Build a topologically-sorted chain from a set of node IDs using precedes edges.
// Returns ordered array of IDs.
function buildChain(nodeIds, precedesRels) {
  const idSet = new Set(nodeIds);
  const filtered = precedesRels.filter(
    r => idSet.has(r.sourceInstanceId) && idSet.has(r.targetInstanceId)
  );
  const targets = new Set(filtered.map(r => r.targetInstanceId));
  const roots = nodeIds.filter(id => !targets.has(id));
  const next = new Map(filtered.map(r => [r.sourceInstanceId, r.targetInstanceId]));
  const chain = [];
  let cur = roots[0];
  while (cur) {
    chain.push(cur);
    cur = next.get(cur);
  }
  return chain;
}

// Render inline tables contained by a given record
function renderContainedTables(recordId, instanceMap, containsRels) {
  let md = '';
  const tableIds = containsRels
    .filter(r => r.sourceInstanceId === recordId)
    .map(r => r.targetInstanceId);
  for (const tid of tableIds) {
    const tableRecord = instanceMap.get(tid);
    if (tableRecord?.typeId === T_TABLE) {
      md += renderTable(tableRecord) + '\n\n';
    }
  }
  return md;
}

// --- Spec document renderer ---
function renderSpecDoc(specRecord, instanceMap, precedesRels, containsRels) {
  const title   = fv(specRecord, F_TITLE);
  const version = fv(specRecord, F_VERSION);
  const status  = fv(specRecord, F_STATUS);
  const summary = fv(specRecord, F_SUMMARY);

  let md = `# ${title}\n\n`;
  md += `**Version**: ${version}\n`;
  md += `**Status**: ${status}\n\n`;
  if (summary) md += `${summary}\n\n`;
  md += `> **Projection note**: This Markdown file is a rendered projection of the SRS repository. The records are the source of truth; if this file diverges from repository state, the repository wins.\n\n---\n\n`;

  // Order sections by following the precedes chain among section records
  const sectionIds = [...instanceMap.values()]
    .filter(r => r.typeId === T_SECTION)
    .map(r => r.instanceId);
  const orderedSections = buildChain(sectionIds, precedesRels);

  orderedSections.forEach((sectionId, i) => {
    const section = instanceMap.get(sectionId);
    if (!section) return;
    const sTitle   = fv(section, F_TITLE);
    const sContent = fv(section, F_CONTENT);
    md += `## ${i + 1}. ${sTitle}\n\n`;
    if (sContent) md += `${sContent}\n\n`;
    md += renderContainedTables(sectionId, instanceMap, containsRels);

    // Find subsections contained by this section, ordered by precedes
    const subIds = containsRels
      .filter(r => r.sourceInstanceId === sectionId)
      .map(r => r.targetInstanceId)
      .filter(id => instanceMap.get(id)?.typeId === T_SUBSECTION);
    const orderedSubs = buildChain(subIds, precedesRels);

    orderedSubs.forEach(subId => {
      const sub = instanceMap.get(subId);
      if (!sub) return;
      const ssTitle   = fv(sub, F_TITLE);
      const ssContent = fv(sub, F_CONTENT);
      md += `### ${ssTitle}\n\n`;
      if (ssContent) md += `${ssContent}\n\n`;
      md += renderContainedTables(subId, instanceMap, containsRels);
    });
  });

  return md;
}

// --- Rationale (design-note) renderer ---
function renderRationaleDoc(specRecord, instanceMap, precedesRels, containsRels) {
  const title   = fv(specRecord, F_TITLE);
  const version = fv(specRecord, F_VERSION);
  const status  = fv(specRecord, F_STATUS);
  const summary = fv(specRecord, F_SUMMARY);

  let md = `# ${title}\n\n`;
  md += `**Version**: ${version}\n`;
  md += `**Status**: ${status}\n\n`;
  if (summary) md += `${summary}\n\n`;
  md += `> This document is non-normative. Nothing here overrides the SRS specification.\n\n---\n\n`;

  // Design notes are contained by the rationale spec record, ordered by precedes
  const noteIds = containsRels
    .filter(r => r.sourceInstanceId === specRecord.instanceId)
    .map(r => r.targetInstanceId);
  const orderedNotes = buildChain(noteIds, precedesRels);

  orderedNotes.forEach(noteId => {
    const note = instanceMap.get(noteId);
    if (!note) return;
    const nTitle   = fv(note, F_TITLE);
    const nContent = fv(note, F_CONTENT);
    md += `## ${nTitle}\n\n`;
    if (nContent) md += `${nContent}\n\n`;
    md += renderContainedTables(noteId, instanceMap, containsRels);
  });

  return md;
}

// --- Main ---
async function main() {
  const manifest  = await loadJson('manifest.json');
  const relFile   = await loadJson(manifest.relationsPath ?? 'relations/relations.json');
  const instanceMap = await buildInstanceMap(manifest.instanceIndex);

  const allRels     = relFile.relations ?? [];
  const precedesRels = allRels.filter(r => r.relationType === 'precedes');
  const containsRels = allRels.filter(r => r.relationType === 'contains');

  const specRecord    = [...instanceMap.values()].find(r => r.typeId === T_SPECIFICATION && fv(r, F_CANONICAL) === 'com.semanticops.srs');
  const rationaleSpec = [...instanceMap.values()].find(r => r.typeId === T_SPECIFICATION && fv(r, F_CANONICAL) === 'com.semanticops.srs.rationale');

  const outputs = [];

  if (doc === 'spec' || doc === 'unified') {
    const md = renderSpecDoc(specRecord, instanceMap, precedesRels, containsRels);
    outputs.push({ path: 'docs/spec/srs-spec.md', md });
  }

  if (doc === 'rationale' || doc === 'unified') {
    const md = renderRationaleDoc(rationaleSpec, instanceMap, precedesRels, containsRels);
    outputs.push({ path: 'docs/spec/srs-rationale.md', md });
  }

  if (doc === 'unified') {
    const specMd = renderSpecDoc(specRecord, instanceMap, precedesRels, containsRels);
    const ratMd  = renderRationaleDoc(rationaleSpec, instanceMap, precedesRels, containsRels);
    const ratBody = ratMd.replace(/^#[^\n]+\n[\s\S]*?---\n\n/, '');
    const unified =
      specMd.trimEnd() +
      '\n\n---\n\n# Design Rationale\n\n' +
      `*Non-normative companion explaining design decisions. See [srs-rationale.md](srs-rationale.md) for the standalone document.*\n\n` +
      ratBody;
    outputs.push({ path: 'docs/spec/srs-unified.md', md: unified });
  }

  for (const { path, md } of outputs) {
    await writeFile(join(OUT_ROOT, path), md);
    console.log(`✓ ${path}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
