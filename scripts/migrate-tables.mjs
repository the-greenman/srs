#!/usr/bin/env node
/**
 * Migrate Group 1 embedded markdown tables to `table` type records.
 *
 * Creates records in records/tables/, updates parent record content fields,
 * adds `contains` relations, and updates manifest.json.
 *
 * Run from srs/:
 *   node scripts/migrate-tables.mjs
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

async function loadJson(rel) {
  return JSON.parse(await readFile(join(ROOT, rel), 'utf8'));
}
async function saveJson(rel, obj) {
  await writeFile(join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
}

// Table type and field IDs
const T_TABLE      = '2a000013-0000-4000-a000-000000000013';
const F_INTRO      = '1a000025-0000-4000-a000-000000000025';
const F_OUTRO      = '1a000026-0000-4000-a000-000000000026';
const F_COL1       = '1a000027-0000-4000-a000-000000000027';
const F_COL2       = '1a000028-0000-4000-a000-000000000028';
const F_COL3       = '1a000029-0000-4000-a000-000000000029';
// const F_COL4    = '1a000030-0000-4000-a000-000000000030';
// const F_COL5    = '1a000031-0000-4000-a000-000000000031';

function tableId(n) {
  const hex = n.toString(16).padStart(8, '0');
  return `b1${hex.slice(0, 6)}-0000-4000-a000-${hex.padStart(12, '0')}`;
}
// e.g. tableId(1) → b1000001-0000-4000-a000-000000000001

function makeTableRecord(id, rows, intro = '', outro = '') {
  const fieldValues = [];
  if (intro) fieldValues.push({ fieldId: F_INTRO, value: intro });
  if (outro) fieldValues.push({ fieldId: F_OUTRO, value: outro });

  const fieldGroups = [{
    groupId: 'rows',
    entries: rows.map(cols => {
      const fvs = [];
      const fields = [F_COL1, F_COL2, F_COL3];
      cols.forEach((val, i) => {
        if (val !== undefined && val !== '') fvs.push({ fieldId: fields[i], value: val });
      });
      return { fieldValues: fvs };
    })
  }];

  return {
    '$schema': 'https://srs.semanticops.com/schema/2.0/record.json',
    instanceId: id,
    typeId: T_TABLE,
    typeVersion: 1,
    typeNamespace: 'com.semanticops.spec',
    typeName: 'table',
    fieldValues,
    fieldGroups,
    createdAt: '2026-05-27T00:00:00Z'
  };
}

// ===== TABLE DATA =====

// Table b1: design-note 017 — edit-in-place vs new record
const TABLE_017 = {
  id: tableId(1),
  file: 'tables/t001-edit-in-place-vs-new-record.json',
  parentFile: 'design-notes/017-when-to-edit-in-place-vs-create-a-new-record.json',
  parentId: 'f1000017-0000-4000-a000-000000000017',
  intro: 'The underlying question: *Would a reasonable reader, encountering this Record a year later, recognise it as the same understanding they would have read before the change?*',
  outro: 'Cross-check: if a `supersedes` Relation would feel misleading — as if the group reversed itself when it only clarified — it is probably an edit. If a silent edit would feel misleading — as if the record was silently revised after the fact — it is probably a new Record.',
  rows: [
    ['Scenario', 'Guidance'],
    ['Correcting how something is expressed (typo, phrasing)', 'Edit in-place'],
    ['Adding context that reinforces the existing understanding', 'Edit in-place'],
    ['Clarifying a detail that was ambiguous but understanding is unchanged', 'Edit in-place'],
    ['Adding information that changes what was actually committed to', 'New Record + `refines` or `supersedes`'],
    ['Reversing or materially replacing a prior commitment', 'New Record + `supersedes`'],
    ['Producing a more detailed version from a rough original', 'New Record + `refines`'],
  ]
};

// Table b2: design-note 018 — repeatable fields vs field groups vs separate records
const TABLE_018 = {
  id: tableId(2),
  file: 'tables/t002-repeatable-vs-field-groups-vs-records.json',
  parentFile: 'design-notes/018-choosing-between-repeatable-fields-field-groups-and-separate.json',
  parentId: 'f1000018-0000-4000-a000-000000000018',
  intro: '',
  outro: 'A Field Group entry does not have its own `instanceId`, lifecycle state, or Relation endpoints. If a group entry will ever need to be referenced independently, related to other Records, or reused across multiple Records, it should be a separate Record connected by a `contains` or `derived-from` Relation.',
  rows: [
    ['Pattern', 'When to use', 'Example'],
    ['Repeatable scalar (`ext:repeatable-fields`)', 'Multiple values of the same type, no pairing needed', 'Multiple assigned person names'],
    ['Field Group (`ext:field-groups`)', 'Multiple structured entries that must be read together', 'Contacts with name + email'],
    ['Separate Records + Relations', 'Repeated items need their own identity, lifecycle, or reuse', 'Tasks assigned to roles'],
  ]
};

// Table b3: design-note 019 — graduation identity continuity
const TABLE_019 = {
  id: tableId(3),
  file: 'tables/t003-graduation-identity-continuity.json',
  parentFile: 'design-notes/019-graduation-when-and-how.json',
  parentId: 'f1000019-0000-4000-a000-000000000019',
  intro: 'Graduation is the act of replacing a lower-tier instance with a higher-tier equivalent as its structure stabilises.\n\n**Identity continuity:**',
  outro: '**Graduation is not always one-to-one.** A single meeting Note may graduate into one Decision Record, three Task Records, and two Risk Records. Each resulting Record receives its own `instanceId` and links to the original via `derived-from`. The original Note is preserved as the semantic root of the derived graph.\n\nImplementations may automate graduation suggestions by matching section or field names against `Field.name` values in available Type definitions.',
  rows: [
    ['Scenario', '`instanceId`', 'Relation'],
    ['Pure formalisation (section names map directly to field names, content unchanged)', 'Keep', 'None required'],
    ['Content interpreted or restructured during formalisation', 'New', '`refines` from new to old'],
    ['One Note splits into multiple Records', 'New IDs for all', '`derived-from` from each new Record to the original'],
  ]
};

// Table b4: design-note 024 — which extensions to implement
const TABLE_024 = {
  id: tableId(4),
  file: 'tables/t004-which-extensions-to-implement.json',
  parentFile: 'design-notes/024-how-to-decide-which-extensions-to-implement.json',
  parentId: 'f1000024-0000-4000-a000-000000000024',
  intro: 'Start with the question: what does your implementation need to do?',
  outro: '',
  rows: [
    ['Need', 'Extensions'],
    ['Define and exchange Field and Type definitions', 'Core only'],
    ['Track definition origin and imports', '`ext:import-tracking`'],
    ['Publish a definition catalog', '`ext:registry`'],
    ['Governance with lifecycle states', '`ext:lifecycle`'],
    ['Present and export Records', '`ext:views-l1`'],
    ['Assemble multi-Record documents', '`ext:views-l2`'],
    ['Facilitate structured deliberation', '`ext:protocol`'],
    ['Live facilitation with context assembly', '`ext:addressability`'],
    ['Extraction from source material', '`ext:schema`'],
    ['Specialise Types while preserving base processability', '`ext:type-inheritance`'],
    ['Lists of values within a Record', '`ext:repeatable-fields`'],
    ['Structured repeatable context in a Record', '`ext:field-groups`'],
    ['Complex conditional validation', '`ext:cross-field-validation`'],
    ['Cross-system Relation interoperability', '`ext:recommended-relations`'],
  ]
};

// Table b5: design-note 041 — μDemocracy mapping
const TABLE_041 = {
  id: tableId(5),
  file: 'tables/t005-democracy-mapping.json',
  parentFile: 'design-notes/041-democracy-mapping.json',
  parentId: 'f1000041-0000-4000-a000-000000000041',
  intro: 'How the SCDS v2 vocabulary maps to the μDemocracy application layer. Reproduced from the v1→v2 conceptual remapping document for reference.',
  outro: '',
  rows: [
    ['SCDS concept', 'μDemocracy application'],
    ['Field', 'Semantic atom in a governance record'],
    ['Type', 'Decision, Proposal, Action, Role, Value, Principle, ...'],
    ['Record', 'A captured governance artefact with provenance'],
    ['Schema', 'Founding Document type; Decision Log type'],
    ['Protocol', 'Democracy protocol: Brain Dump, Decomposition, Decision, Proposal, ...'],
    ['Container', "A group's governance workspace; a founding process scope"],
    ['Relation', '`supersedes`, `derived-from`, `ratifies`, `depends-on`, ...'],
    ['View', 'Facilitator view; summary view; export for ratification'],
    ['Document View', 'Assembled founding document; full decision log'],
    ['Address', 'Stable identifier for any governance element — Field, Record, stage, chunk'],
    ['Attention State', 'Current focus of an active facilitated session'],
    ['Revision', 'Auditable history of how a governance field arrived at its current value'],
    ['Conversation layer', 'Session transcript; threaded discussion; facilitator annotations'],
  ]
};

// Table b6: type-definition/relation — directionality convention
const TABLE_RELATION = {
  id: tableId(6),
  file: 'tables/t006-relation-directionality.json',
  parentFile: 'type-definitions/relation.json',
  parentId: 'eddeaecc-f30e-5919-b5ae-0bd4e38161ab',
  intro: '**Directionality convention:**\n`sourceInstanceId` is the asserting instance; `targetInstanceId` is the related instance. The Relation reads: "source [relationType] target."',
  outro: 'This convention must be consistent across implementations. See Invariant 16.',
  rows: [
    ['Relation', 'source', 'target'],
    ['`supersedes`', 'the newer Record', 'the older Record'],
    ['`contains`', 'the stage', 'the task inside it'],
    ['`depends-on`', 'the dependent task', 'the task it needs'],
    ['`refines`', 'the detailed version', 'the rough version'],
    ['`derived-from`', 'the successor', 'the source Note or Record'],
    ['`evidences`', 'the source material', 'the claim it supports'],
  ]
};

// Table b7: ext:recommended-relations — canonical relation types
const TABLE_REC_REL_1 = {
  id: tableId(7),
  file: 'tables/t007-canonical-relation-types.json',
  parentFile: 'extensions/ext-recommended-relations.json',
  parentId: 'ed9f0446-800c-5428-8780-09bb499f76aa',
  intro: '**Canonical relation types** (use exact strings):',
  outro: 'Implementations must store only the canonical (forward) form and derive the inverse when needed.',
  rows: [
    ['Canonical', 'Converse', 'Category'],
    ['`contains`', '`part-of`', 'Composition'],
    ['`depends-on`', '`required-by`', 'Dependency'],
    ['`supersedes`', '`superseded-by`', 'Governance'],
    ['`refines`', '`refined-by`', 'Refinement'],
    ['`derived-from`', '`source-of`', 'Derivation'],
    ['`evidences`', '`evidenced-by`', 'Evidence'],
    ['`precedes`', '`follows`', 'Sequence'],
  ]
};

// Table b8: ext:recommended-relations — category taxonomy
const TABLE_REC_REL_2 = {
  id: tableId(8),
  file: 'tables/t008-relation-category-taxonomy.json',
  parentFile: 'extensions/ext-recommended-relations.json',
  parentId: 'ed9f0446-800c-5428-8780-09bb499f76aa',
  intro: '**Relation category taxonomy:**',
  outro: '',
  rows: [
    ['Category', 'Examples'],
    ['Composition', '`contains`, `part-of`, `has-section`'],
    ['Refinement', '`refines`, `expands`, `summarises`'],
    ['Dependency', '`depends-on`, `requires`, `blocks`, `enables`'],
    ['Sequence', '`precedes`, `follows`, `overlaps`'],
    ['Derivation', '`derived-from`, `extracted-from`, `based-on`'],
    ['Evidence', '`evidences`, `supports`, `contradicts`'],
    ['Governance', '`supersedes`, `amends`, `ratifies`, `delegates`'],
    ['Association', '`relates-to`, `links-to`'],
  ]
};

const ALL_TABLES = [
  TABLE_017, TABLE_018, TABLE_019, TABLE_024, TABLE_041,
  TABLE_RELATION,
  TABLE_REC_REL_1, TABLE_REC_REL_2
];

// ===== UPDATED CONTENT FOR PARENT RECORDS =====

// content field value after table extraction (markdown table and surrounding prose removed)
const UPDATED_CONTENT = {
  'f1000017-0000-4000-a000-000000000017': '',  // all content moves to table intro/outro
  'f1000018-0000-4000-a000-000000000018': '',
  'f1000019-0000-4000-a000-000000000019': '',
  'f1000024-0000-4000-a000-000000000024': '',
  'f1000041-0000-4000-a000-000000000041': '',
};

// For type-definition/relation: keep TypeScript block, pre/post-table prose; remove table + its intro/outro
const RELATION_NEW_CONTENT = `A first-class typed link between instances. Relations allow implementations to construct semantic graphs for navigation, analysis, projection, and reasoning.

\`\`\`typescript
{
  relationId: UUID

  relationType: string
  // Free-form. See ext:recommended-relations for canonical types and conventions.

  // source [relationType] target
  sourceInstanceId: UUID    // the asserting instance
  targetInstanceId: UUID    // the related instance

  assertedBy?: "human" | "ai" | "imported"
  confidence?: number       // 0.0–1.0; meaningful for ai-asserted
  createdAt?: ISO8601
  createdBy?: string

  status?: "proposed" | "active" | "rejected" | "superseded"
  validFrom?: ISO8601
  validUntil?: ISO8601

  notes?: string
  sourceRefs?: SourceReference[]
  meta?: Record<string, unknown>
}
\`\`\`

Relations span tiers. A Note may be the target of \`derived-from\` Relations from the Records it graduated into.

**Canonical relation types** (use these exact strings for cross-system interoperability):\n\n\`contains\`, \`depends-on\`, \`supersedes\`, \`refines\`, \`derived-from\`, \`evidences\`, \`precedes\`

Custom types not covered by these should use \`namespace/name\` format (e.g. \`com.acme.hr/transferred-to\`) to prevent collision. Extended relation type metadata is defined in \`ext:recommended-relations\`.

**Relations do not change lifecycle state.** A \`supersedes\` Relation does not mutate the prior Record's \`lifecycleState\`. Lifecycle state changes are explicit acts by an implementation's transition mechanism.

---`;

// For ext:recommended-relations: keep required-for, description, RelationTypeDefinition block; remove both tables + their prose
const EXT_REC_REL_NEW_CONTENT = `**Required for**: cross-system federation; multi-publisher ecosystems where Relation type semantics must be interoperable.

Canonical relation types and machine-readable Relation type definitions.

#### \`RelationTypeDefinition\`

Machine-readable metadata for a \`relationType\` string.

\`\`\`typescript
{
  relationType: string      // exact string used in Relation.relationType
  namespace: string
  label?: string
  description?: string
  category?: "composition" | "refinement" | "dependency" | "sequence" | "derivation" | "evidence" | "governance" | "association"
  canonicalDirection?: string   // e.g. "source is the dependent task; target is the task it depends on"
  inverseType?: string
}
\`\`\`

\`RelationTypeDefinition\` is optional metadata. Implementations are not required to resolve \`relationType\` strings against a definition before accepting a Relation. Relation type definitions may be included in a Package or published separately.

---`;

// ===== MAIN =====
async function main() {
  // Create tables directory
  await mkdir(join(ROOT, 'records/tables'), { recursive: true });

  // 1. Write table records
  for (const t of ALL_TABLES) {
    const record = makeTableRecord(t.id, t.rows, t.intro, t.outro);
    await saveJson(`records/${t.file}`, record);
    console.log(`✓ Created records/${t.file}`);
  }

  // 2. Update parent design-note records (remove embedded tables, clear content)
  const F_CONTENT = '1a000002-0000-4000-a000-000000000002';
  const designNotesToClear = [TABLE_017, TABLE_018, TABLE_019, TABLE_024, TABLE_041];
  for (const t of designNotesToClear) {
    const rec = await loadJson(`records/${t.parentFile}`);
    const fv = rec.fieldValues.find(f => f.fieldId === F_CONTENT);
    if (fv) fv.value = UPDATED_CONTENT[t.parentId] ?? '';
    await saveJson(`records/${t.parentFile}`, rec);
    console.log(`✓ Updated records/${t.parentFile} (cleared content)`);
  }

  // 3. Update type-definitions/relation.json
  {
    const rec = await loadJson('records/type-definitions/relation.json');
    const fv = rec.fieldValues.find(f => f.fieldId === F_CONTENT);
    if (fv) fv.value = RELATION_NEW_CONTENT;
    await saveJson('records/type-definitions/relation.json', rec);
    console.log('✓ Updated records/type-definitions/relation.json');
  }

  // 4. Update extensions/ext-recommended-relations.json
  {
    const rec = await loadJson('records/extensions/ext-recommended-relations.json');
    const fv = rec.fieldValues.find(f => f.fieldId === F_CONTENT);
    if (fv) fv.value = EXT_REC_REL_NEW_CONTENT;
    await saveJson('records/extensions/ext-recommended-relations.json', rec);
    console.log('✓ Updated records/extensions/ext-recommended-relations.json');
  }

  // 5. Update manifest.json instanceIndex
  const manifest = await loadJson('manifest.json');
  const newPaths = ALL_TABLES.map(t => t.file);
  // Insert after 'specifications/srs-rationale.json'
  const specRatIdx = manifest.instanceIndex.indexOf('specifications/srs-rationale.json');
  manifest.instanceIndex.splice(specRatIdx + 1, 0, ...newPaths);
  await saveJson('manifest.json', manifest);
  console.log(`✓ Updated manifest.json (+${newPaths.length} table paths)`);

  // 6. Add `contains` relations to relations.json
  const rels = await loadJson('relations/relations.json');
  const newRelations = [
    // design-note 017 → table b1
    { id: 'rel-dn017-table', type: 'contains', from: TABLE_017.parentId, to: TABLE_017.id },
    // design-note 018 → table b2
    { id: 'rel-dn018-table', type: 'contains', from: TABLE_018.parentId, to: TABLE_018.id },
    // design-note 019 → table b3
    { id: 'rel-dn019-table', type: 'contains', from: TABLE_019.parentId, to: TABLE_019.id },
    // design-note 024 → table b4
    { id: 'rel-dn024-table', type: 'contains', from: TABLE_024.parentId, to: TABLE_024.id },
    // design-note 041 → table b5
    { id: 'rel-dn041-table', type: 'contains', from: TABLE_041.parentId, to: TABLE_041.id },
    // type-definition/relation → table b6
    { id: 'rel-relation-directionality-table', type: 'contains', from: TABLE_RELATION.parentId, to: TABLE_RELATION.id },
    // ext:recommended-relations → table b7
    { id: 'rel-recrel-canonical-table', type: 'contains', from: TABLE_REC_REL_1.parentId, to: TABLE_REC_REL_1.id },
    // ext:recommended-relations → table b8
    { id: 'rel-recrel-taxonomy-table', type: 'contains', from: TABLE_REC_REL_2.parentId, to: TABLE_REC_REL_2.id },
  ];
  rels.relations.push(...newRelations);
  await saveJson('relations/relations.json', rels);
  console.log(`✓ Updated relations/relations.json (+${newRelations.length} contains relations)`);

  console.log('\nDone. Run: node scripts/render-spec.mjs --doc unified');
}

main().catch(err => { console.error(err); process.exit(1); });
