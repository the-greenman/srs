# Dogfood SRS Migration Plan

## Goal

This plan migrates `/home/greenman/dev/semanticops/srs` into a fully dogfooded SRS repository. The repository records become the canonical SRS specification. Markdown files become source material or generated projection output, never canonical spec state.

After this migration:

- `/home/greenman/dev/semanticops/srs` is the canonical SRS specification.
- `spec/srs-spec.md`, `spec/rfcs/*.md`, `spec/profiles/*.md`, and `source-documents/ai-sessions/*.md` are repository-local source documents.
- Generated markdown is a temporary projection from semantic records.
- Canonical spec content is represented as fully atomic Tier 2 SRS records.
- Simpler agents can implement each phase independently by following path ownership and validation gates in this file.

## Decisions Already Made

- Use a fully atomic representation.
- Use the full Tier 2 Record shape for every canonical record.
- Replace the current canonical markdown-chunk records in place.
- Use deterministic UUIDs derived from canonical keys.
- Cite source material with `SourceReference` entries using `sourceType: "repository-document"`.
- Create first projection support for:
  - Main SRS markdown spec.
  - RFC markdown files.
- Treat markdown outputs as disposable projections.
- Treat the current markdown spec and original conversations as evidence, not as the spec itself.

## Canonical Record Model

Every new canonical record must use the full Tier 2 shape:

```json
{
  "$schema": "https://srs.semanticops.com/schema/2.0/record.json",
  "instanceId": "UUID",
  "typeId": "UUID",
  "typeVersion": 1,
  "typeNamespace": "com.semanticops.srs",
  "typeName": "meta.example_type",
  "fieldValues": [
    {
      "fieldId": "UUID",
      "value": "..."
    }
  ],
  "sourceRefs": [
    {
      "sourceType": "repository-document",
      "sourceId": "UUID",
      "relationType": "evidence",
      "note": "..."
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z"
}
```

Optional canonical record properties are:

- `updatedAt`
- `lifecycleState`
- `meta`

Do not create new canonical records using the old shorthand shape:

```json
{
  "id": "...",
  "type": "...",
  "fields": {}
}
```

The old shorthand may appear only in archived legacy material or temporary migration scripts. It must not appear in the final canonical instance index.

## Deterministic Identity Rules

Use deterministic UUIDs for all generated identity-bearing objects:

- Fields
- Types
- Views
- Source documents
- Canonical records
- Relations

Use canonical keys as UUID inputs. Examples:

- `field:com.semanticops.srs/title`
- `type:com.semanticops.srs/meta.requirement@1`
- `record:spec/srs/requirement/core-field-semantics/001`
- `source-document:spec/srs-spec.md`
- `relation:defines:record-a:record-b`

The same canonical key must always produce the same UUID. If a canonical key changes, treat that as a semantic identity change and create an explicit migration note.

## Source Document Policy

Move or copy all original source material into source-document storage and create sidecars for each source:

- `spec/srs-spec.md`
- `spec/rfcs/rfc-001.md`
- `spec/rfcs/rfc-002.md`
- `spec/rfcs/rfc-003.md`
- `spec/profiles/docx-dita-adoption.md`
- `spec/profiles/governance-profile.md`
- `source-documents/ai-sessions/chatgpt-origin.md`
- `source-documents/ai-sessions/chatgpt-spec-review.md`
- `source-documents/ai-sessions/claude-collaborative-document.md`

Each source document sidecar must include:

- `documentId`
- `contentPath`
- `contentType`
- `encoding`
- `title`
- `createdAt`
- `importedAt`
- optional `description`
- optional `tags`
- optional `meta.originalPath`

Canonical records must cite source documents through `sourceRefs`. Use line-range or heading anchors where practical. If exact anchoring is too expensive for a phase, cite the source document and add a `migration_note` field explaining that source anchoring is coarse.

## Reusable Package Model

Create a bundled local package under `package/`.

Required package files:

- `package/package.json`
- `package/fields/*.json`
- `package/types/*.json`
- `package/views/*.json`

Every Field definition must include:

- `id`
- `namespace`
- `name`
- `version`
- `description`
- `aiGuidance`
- `valueType`
- `createdAt`

Every Type definition must include:

- `id`
- `namespace`
- `name`
- `version`
- `description`
- `fields`
- `createdAt`

The package must include reusable specification/RFC fields and types. Do not create one-off fields for a single record unless the field captures a reusable semantic role.

## Required Fields

Create reusable Fields for these semantic roles:

- `canonical_key`
- `title`
- `short_name`
- `summary`
- `description`
- `status`
- `version_label`
- `namespace`
- `name`
- `identifier`
- `order`
- `normative_statement`
- `rationale`
- `schema_notation`
- `allowed_values`
- `default_value`
- `examples`
- `notes`
- `applies_to`
- `required_for`
- `conformance_level`
- `extension_id`
- `dependency_refs`
- `affected_components`
- `rfc_number`
- `rfc_status`
- `author`
- `decision_date`
- `revision_history`
- `proposed_change`
- `consequences`
- `open_questions`
- `source_summary`
- `source_confidence`
- `migration_note`

Use `contentFormat: "markdown"` only for fields whose value intentionally contains markdown. Use `valueType: "select"` for status fields with stable enumerations.

## Required Types

Create reusable Types for these record categories:

- `meta.specification`
- `meta.spec_part`
- `meta.concept`
- `meta.field_definition`
- `meta.type_definition`
- `meta.schema_member`
- `meta.extension`
- `meta.requirement`
- `meta.invariant`
- `meta.conformance_profile`
- `meta.example`
- `meta.rfc`
- `meta.rfc_change`
- `meta.rfc_revision`

Type meanings:

- `meta.specification`: top-level specification identity, version, status, and summary.
- `meta.spec_part`: ordered grouping node used by projections.
- `meta.concept`: named concept, principle, or explanatory construct.
- `meta.field_definition`: a Field definition described by the spec as normative content.
- `meta.type_definition`: a Type or supporting type described by the spec as normative content.
- `meta.schema_member`: one property/member of a type or supporting schema object.
- `meta.extension`: extension identity, dependency data, required-for text, and summary.
- `meta.requirement`: one normative requirement.
- `meta.invariant`: one numbered or canonical invariant.
- `meta.conformance_profile`: core, extension, or profile conformance declaration.
- `meta.example`: code block, table, example scenario, or illustrative payload.
- `meta.rfc`: RFC header and abstract.
- `meta.rfc_change`: one proposed RFC change.
- `meta.rfc_revision`: one RFC revision-history entry.

## Required Relations

Use relations to express structure and semantics. Required relation types:

- `part-of`
- `contains`
- `defines`
- `has-member`
- `requires`
- `depends-on`
- `extends`
- `constrains`
- `applies-to`
- `affects`
- `supersedes`
- `derived-from`
- `evidences`
- `rationale-for`
- `example-of`

Use `part-of` and `contains` for document/spec structure. Use `defines`, `has-member`, `requires`, and `constrains` for semantic links. Use `evidences` or record-level `sourceRefs` for source provenance.

## Implementation Phases

### Phase 0: Inventory And Backup

Owner: inventory agent

Inputs:

- Entire repository.

Owned paths:

- `docs/dogfood-srs-migration-inventory.md`
- Optional backup directory under `/tmp/srs-dogfood-backup/`

Tasks:

1. Record current file inventory.
2. Record current record counts by directory and type.
3. Record current field/type/view definitions.
4. Create a backup branch if the repo is under Git, otherwise copy current canonical files to `/tmp/srs-dogfood-backup/`.
5. Do not change canonical records in this phase.

Outputs:

- Inventory document.
- Backup branch or backup directory.

Validation:

```bash
find . -maxdepth 3 -type f | sort
find package records relations source-documents spec -type f | sort
```

### Phase 1: Source Document Migration

Owner: source document migration agent

Inputs:

- `spec/srs-spec.md`
- `spec/rfcs/*.md`
- `spec/profiles/*.md`
- `source-documents/ai-sessions/*.md`

Owned paths:

- `source-documents/spec/`
- `source-documents/rfcs/`
- `source-documents/profiles/`
- `source-documents/ai-sessions/`
- Source document sidecars.

Tasks:

1. Ensure every source file is present under `source-documents/`.
2. Create a `.meta.json` sidecar for each source document.
3. Preserve original source path in `meta.originalPath`.
4. Add stable `documentId` values using deterministic UUIDs.
5. Add `sourceDocumentIndex` entries later through the manifest agent.

Outputs:

- Source document files.
- Source document sidecars.

Validation:

```bash
find source-documents -type f | sort
```

Every `.meta.json` must point to an existing content file.

### Phase 2: Package Fields And Types

Owner: package fields/types agent

Inputs:

- Current `package/fields/*.json`
- Current `package/types/*.json`
- Current `package/views/*.json`
- Required Fields and Required Types sections in this plan.

Owned paths:

- `package/package.json`
- `package/fields/`
- `package/types/`
- `package/views/`

Tasks:

1. Replace the current minimal package with a bundled local package.
2. Create all required Field definitions.
3. Create all required Type definitions.
4. Add `aiGuidance` to every Field.
5. Ensure every Type field assignment references an existing Field.
6. Add initial projection Views for main spec markdown and RFC markdown.

Outputs:

- Complete bundled package.

Validation:

```bash
node scripts/validate-package.mjs
```

The validation script may be added in Phase 6. Until then, manually verify:

- Every Field has `aiGuidance`.
- Every Type field assignment references an existing Field ID.
- `package/package.json` includes all local Fields and Types or references their paths consistently.

### Phase 3: Atomic Canonical Records

Owner: record migration agents

Inputs:

- Source documents from Phase 1.
- Package definitions from Phase 2.
- Existing records under `records/`.

Owned paths:

- `records/specifications/`
- `records/parts/`
- `records/concepts/`
- `records/definitions/`
- `records/schema-members/`
- `records/extensions/`
- `records/requirements/`
- `records/invariants/`
- `records/conformance/`
- `records/examples/`
- `records/rfcs/`

Tasks:

1. Replace current canonical section/subsection markdown-chunk records.
2. Create one `meta.specification` record for SRS.
3. Create `meta.spec_part` records for projection structure.
4. Create atomic definition records for Field, Type, Record, Relation, Container, Package, Reference, Lineage, Provenance, and supporting types.
5. Create one `meta.schema_member` record for each meaningful schema property/member.
6. Create one `meta.extension` record per extension.
7. Create one `meta.requirement` record per normative requirement.
8. Create one `meta.invariant` record per invariant.
9. Create conformance profile records for core and extensions.
10. Create example records for code blocks, tables, and scenarios that need addressable semantics.
11. Split RFCs into `meta.rfc`, `meta.rfc_change`, and `meta.rfc_revision` records.
12. Add source references to each record.

Outputs:

- Full Tier 2 canonical record set.

Validation:

```bash
node scripts/validate-records.mjs
```

The validation script may be added in Phase 6. Until then, manually verify:

- No canonical record uses `id/type/fields`.
- Every canonical record uses `instanceId/typeId/typeVersion/typeNamespace/typeName/fieldValues`.
- Every canonical record has at least one source reference unless it is generated scaffolding with a `migration_note`.

### Phase 4: Manifest And Relations

Owner: manifest/relations agent

Inputs:

- Canonical records from Phase 3.
- Source document sidecars from Phase 1.
- Package from Phase 2.

Owned paths:

- `manifest.json`
- `relations/relations.json`

Tasks:

1. Rebuild `manifest.json` to match the repository specification.
2. Add a real `instanceIndex` array.
3. Add `sourceDocumentIndex`.
4. Add embedded repository `container`.
5. Keep `packageRef.mode` as `local`.
6. Point `packageRef.path` to the bundled local package.
7. Rebuild relations with deterministic IDs.
8. Encode structural and semantic relations.
9. Remove old `section-sequence` and `subsection-sequence` relations unless represented as valid SRS relations or projection-specific view metadata.

Outputs:

- Valid manifest.
- Valid relations collection.

Validation:

```bash
node scripts/validate-manifest.mjs
node scripts/validate-relations.mjs
```

### Phase 5: Projection Scripts

Owner: renderer agent

Inputs:

- Manifest.
- Relations.
- Canonical records.
- Package views.

Owned paths:

- `scripts/render-spec.mjs`
- `scripts/render-rfcs.mjs`
- Generated markdown under `spec/`

Tasks:

1. Add script to render the main SRS markdown spec from canonical records.
2. Add script to render RFC markdown files from canonical RFC records.
3. Make render ordering depend on records/relations/views, not old markdown.
4. Add generated-output notice to rendered markdown.
5. Ensure generated markdown can be deleted and recreated.

Outputs:

- `spec/srs-spec.md`
- `spec/rfcs/rfc-001.md`
- `spec/rfcs/rfc-002.md`
- `spec/rfcs/rfc-003.md`

Validation:

```bash
node scripts/render-spec.mjs
node scripts/render-rfcs.mjs
```

Generated outputs must be non-empty and include all canonical spec/RFC records intended for projection.

### Phase 6: Validation Scripts

Owner: renderer/validation agent

Inputs:

- Package.
- Manifest.
- Relations.
- Records.
- Source documents.

Owned paths:

- `scripts/validate-package.mjs`
- `scripts/validate-records.mjs`
- `scripts/validate-manifest.mjs`
- `scripts/validate-relations.mjs`
- `scripts/validate-source-documents.mjs`
- `scripts/validate-all.mjs`

Tasks:

1. Validate package closure.
2. Validate record shape.
3. Validate record field values against bound Types.
4. Validate manifest index resolution.
5. Validate source-document sidecars.
6. Validate source references.
7. Validate relations endpoints.
8. Validate deterministic ID stability where IDs are generated by scripts.
9. Create one `validate-all` entrypoint.

Outputs:

- Validation scripts.

Validation:

```bash
node scripts/validate-all.mjs
```

### Phase 7: Final Validation And Completeness Review

Owner: final integration agent

Inputs:

- All prior phases.

Owned paths:

- `docs/dogfood-srs-migration-completion-report.md`

Tasks:

1. Run all validation scripts.
2. Render markdown outputs.
3. Confirm generated markdown includes all canonical spec and RFC records intended for projection.
4. Confirm no generated markdown is needed to reconstruct canonical records.
5. Confirm old shorthand chunk records are absent from the manifest instance index.
6. Write completion report with validation output summary and known follow-ups.

Outputs:

- Completion report.
- Passing validation.
- Regenerated markdown projections.

Validation:

```bash
node scripts/validate-all.mjs
node scripts/render-spec.mjs
node scripts/render-rfcs.mjs
```

## Agent Task Breakdown

### Source Document Migration Agent

Inputs:

- Current markdown source files.

Owned paths:

- `source-documents/spec/`
- `source-documents/rfcs/`
- `source-documents/profiles/`
- `source-documents/ai-sessions/`

Outputs:

- Source files and sidecars.

Validation command:

```bash
node scripts/validate-source-documents.mjs
```

Do not edit:

- `package/`
- `records/`
- `relations/`
- `manifest.json`

### Package Fields/Types Agent

Inputs:

- This plan.
- Existing package directory.

Owned paths:

- `package/package.json`
- `package/fields/`
- `package/types/`
- `package/views/`

Outputs:

- Bundled local package.

Validation command:

```bash
node scripts/validate-package.mjs
```

Do not edit:

- `records/`
- `source-documents/`
- `relations/`
- `manifest.json`

### Core Definition Records Agent

Inputs:

- Source documents.
- Package fields and types.

Owned paths:

- `records/specifications/`
- `records/parts/`
- `records/concepts/`
- `records/definitions/`
- `records/schema-members/`
- `records/examples/`

Outputs:

- Atomic records for core SRS concepts and definitions.

Validation command:

```bash
node scripts/validate-records.mjs
```

Do not edit:

- `package/`
- `records/extensions/`
- `records/rfcs/`
- `manifest.json`
- `relations/`

### Extension Records Agent

Inputs:

- Source documents.
- Package fields and types.
- Existing extension records.

Owned paths:

- `records/extensions/`
- Extension-related `records/schema-members/` only if assigned by integration agent.

Outputs:

- Atomic extension records.

Validation command:

```bash
node scripts/validate-records.mjs
```

Do not edit:

- `package/`
- `records/rfcs/`
- `manifest.json`
- `relations/`

### Requirement/Invariant Records Agent

Inputs:

- Source documents.
- Existing invariant content.

Owned paths:

- `records/requirements/`
- `records/invariants/`
- `records/conformance/`

Outputs:

- Atomic requirements, invariants, and conformance records.

Validation command:

```bash
node scripts/validate-records.mjs
```

Do not edit:

- `package/`
- `records/rfcs/`
- `manifest.json`
- `relations/`

### RFC Records Agent

Inputs:

- `source-documents/rfcs/`
- Existing `records/rfcs/`

Owned paths:

- `records/rfcs/`

Outputs:

- `meta.rfc`
- `meta.rfc_change`
- `meta.rfc_revision`

Validation command:

```bash
node scripts/validate-records.mjs
node scripts/render-rfcs.mjs
```

Do not edit:

- `package/`
- Main spec records outside `records/rfcs/`
- `manifest.json`
- `relations/`

### Manifest/Relations Agent

Inputs:

- Final package.
- Final records.
- Final source documents.

Owned paths:

- `manifest.json`
- `relations/relations.json`

Outputs:

- Real instance index.
- Source document index.
- Structural and semantic relations.

Validation command:

```bash
node scripts/validate-manifest.mjs
node scripts/validate-relations.mjs
```

Do not edit:

- `package/`
- `records/`
- `source-documents/`

### Renderer/Validation Agent

Inputs:

- Package.
- Manifest.
- Records.
- Relations.
- Source documents.

Owned paths:

- `scripts/render-spec.mjs`
- `scripts/render-rfcs.mjs`
- `scripts/validate-package.mjs`
- `scripts/validate-records.mjs`
- `scripts/validate-manifest.mjs`
- `scripts/validate-relations.mjs`
- `scripts/validate-source-documents.mjs`
- `scripts/validate-all.mjs`
- Generated markdown under `spec/`

Outputs:

- Renderer scripts.
- Validation scripts.
- Generated markdown projections.

Validation command:

```bash
node scripts/validate-all.mjs
node scripts/render-spec.mjs
node scripts/render-rfcs.mjs
```

Do not edit:

- Canonical records except for renderer-specific projection metadata agreed by the integration agent.

## Validation Gates

The migration is complete only when all gates pass:

- All source document sidecars resolve to content files.
- All `repository-document` SourceReferences resolve to source document sidecars.
- All instance index paths resolve.
- Every indexed record contains the matching `instanceId`.
- All Field IDs referenced by Types exist.
- All record field values belong to their bound Type.
- No canonical indexed record uses the old `id/type/fields` shorthand.
- All deterministic IDs are stable across rerun.
- All relation endpoints resolve to indexed records unless explicitly cross-repository.
- Generated markdown includes all canonical spec records intended for the main spec projection.
- Generated RFC markdown includes all canonical RFC records intended for RFC projection.
- No generated markdown file is required to reconstruct canonical records.

## Completion Criteria

The final repository state must satisfy these criteria:

- `manifest.json` is the entry point for the canonical SRS repository.
- `package/package.json` describes a bundled reusable specification-authoring package.
- `records/` contains atomic Tier 2 records.
- `source-documents/` contains the historical markdown and conversation sources with sidecars.
- `relations/relations.json` carries structural and semantic links.
- `spec/srs-spec.md` and `spec/rfcs/*.md` are generated projections.
- `scripts/validate-all.mjs` passes.
- A completion report exists at `docs/dogfood-srs-migration-completion-report.md`.

## Notes For Simpler Agents

- Work only in your owned paths.
- Do not make design changes. Follow this file.
- Prefer deterministic IDs from canonical keys.
- Preserve source provenance even when anchors are coarse.
- Do not edit generated markdown by hand after renderer scripts exist.
- Do not introduce new shorthand canonical records.
- If a validation script does not exist yet, perform the manual validation listed in the phase and leave a note for the renderer/validation agent.
