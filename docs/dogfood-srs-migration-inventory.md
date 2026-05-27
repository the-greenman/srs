# Dogfood SRS Migration Inventory

**Generated**: 2026-05-27
**Phase**: 0 - Pre-migration Inventory

## Repository Structure

```
/home/greenman/dev/semanticops/srs/
├── .srs/                    (empty directory)
├── docs/                    (1 file)
│   └── dogfood-srs-migration-plan.md
├── manifest.json            (SRS repository manifest)
├── package/                 (13 files)
│   ├── fields/              (5 field definitions)
│   ├── types/               (6 type definitions)
│   └── views/               (2 view definitions)
├── records/                 (108 files)
│   ├── extensions/          (13 extension records)
│   ├── rfcs/                (3 RFC records)
│   ├── sections/            (20 section records)
│   ├── subsections/         (65 subsection records)
│   └── type-definitions/    (7 type definition records)
├── relations/               (1 file)
│   └── relations.json       (17 relations)
├── scripts/                 (1 empty directory marker)
├── source-documents/        (3 files)
│   └── ai-sessions/         (3 session transcripts)
└── spec/                    (71 files)
    ├── examples/            (68 example files)
    ├── profiles/          (2 conformance profiles)
    ├── rfcs/              (empty)
    └── srs-spec.md        (main specification)
```

## Record Counts by Directory

| Directory | Count | Notes |
|-----------|-------|-------|
| records/extensions/ | 13 | Extension definition records |
| records/rfcs/ | 3 | RFC records (RFC-001, RFC-002, RFC-003) |
| records/sections/ | 20 | Top-level section records |
| records/subsections/ | 65 | Subsection records |
| records/type-definitions/ | 7 | Type definition records |
| **Total** | **108** | All canonical records |

## Current Field Definitions (5)

| Field ID | Name | Namespace | Version | Value Type |
|----------|------|-----------|---------|------------|
| 96f04d9d-9432-5628-8664-0d92e50f6fd0 | section_title | com.semanticops.srs | 1 | string |
| 436786e4-d51e-5275-9654-bc4b5ee82b1a | normative_content | com.semanticops.srs | 1 | text (markdown) |
| 1bc7842f-14c6-557c-8308-6597e5d2f650 | extension_id | com.semanticops.srs | 1 | string |
| 3a2f8b4e-7c3d-5a1e-9b2f-4c5d6e7f8a9b | extension_depends | com.semanticops.srs | 1 | string |
| 2f9e8d7c-6b5a-4a3e-9f1d-2c3b4a5d6e7f | rfc_status | com.semanticops.srs | 1 | select |

## Current Type Definitions (6)

| Type ID | Name | Namespace | Version | Field Count |
|---------|------|-----------|---------|-------------|
| 5e816b81-134f-5f60-938c-700617fd79ae | meta.section | com.semanticops.srs | 1 | 2 |
| 3d8b4f4c-9c4b-5f1d-8f7c-4e5d6f7a8b9c | meta.subsection | com.semanticops.srs | 1 | 2 |
| 7c9b3d2e-5a1f-4b8e-9c3d-2e1f4a5b6c7d | meta.extension | com.semanticops.srs | 1 | 3 |
| 8d7c6b5a-4a3e-9f1d-2c3b-4a5d6e7f8a9b | meta.rfc | com.semanticops.srs | 1 | 3 |
| 9e8d7c6b-5a4f-3a2e-9b1d-3c4a5d6e7f8 | meta.type-definition | com.semanticops.srs | 1 | 2 |
| 1f9e8d7c-6b5a-4a3e-9f1d-2c3b4a5d6e7 | meta.example | com.semanticops.srs | 1 | 1 |

## Current View Definitions (2)

| View ID | Name | Description |
|---------|------|-------------|
| srs-spec-document-view | SRS Spec Document View | Renders the main SRS spec as a single markdown document |
| extension-card-view | Extension Card View | Renders extension summaries as reference cards |

## Relations Summary

| Relation Type | Count |
|---------------|-------|
| section-sequence | 1 |
| subsection-sequence | 11 |
| extension-dependency | 2 |
| rfc-targets-section | 2 |
| **Total** | **17** |

## Source Documents

| Path | Type | Size |
|------|------|------|
| source-documents/ai-sessions/chatgpt-origin.md | markdown | ~79KB |
| source-documents/ai-sessions/chatgpt-spec-review.md | markdown | ~744KB |
| source-documents/ai-sessions/claude-collaborative-document.md | markdown | ~744KB |

## Record Format Analysis

All current records use the **old shorthand format**:
```json
{
  "id": "UUID",
  "type": "namespace/name",
  "version": 1,
  "fields": { ... }
}
```

Migration target: **Tier 2 full format**:
```json
{
  "instanceId": "UUID",
  "typeId": "UUID",
  "typeVersion": 1,
  "typeNamespace": "namespace",
  "typeName": "name",
  "fieldValues": [ { "fieldId": "UUID", "value": "..." } ],
  "sourceRefs": [ ... ]
}
```

## Required Package Additions

Per migration plan, need to add:
- **34 new Fields** (currently have 5, need 39 total)
- **14 new Types** (currently have 6, need 20 total)
- **Additional Views** for RFC rendering

## Required Record Categories

Current: sections, subsections, extensions, rfcs, type-definitions

Need to create:
- specifications/
- parts/
- concepts/
- definitions/
- schema-members/
- requirements/
- invariants/
- conformance/
- examples/

## Migration Notes

1. Current records lack `sourceRefs` - need to add provenance
2. Current records use shorthand format - need full Tier 2 format
3. Package is minimal - need full bundled package
4. Relations use old format - need migration to proper SRS relations
5. No validation scripts exist - need to create
6. No projection scripts exist - need to create

## Backup Information

- Git repository: Yes (semanticops/srs-rust workspace)
- Backup branch: Will create `pre-dogfood-migration` branch
- Backup timestamp: 2026-05-27

