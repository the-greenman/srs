# RFC-004 Proposal Artifacts

This directory contains proposed artifacts for RFC-004. They are intentionally outside the active `package/` and `schemas/` directories.

Draft and proposed RFC artifacts may be validated and reviewed, but they do not become live SRS package/schema state until the RFC is accepted and an implementation record applies them.

## Contents

- `proposed-schemas/` — proposed changes to root JSON Schemas.
- `proposed-package/spec-authoring-core/` — proposed additions/changes to `spec-authoring-core`.
- `proposed-package/spec-authoring-json-schema/` — proposed JSON Schema projection package.

## Package Boundary

`proposed-package/spec-authoring-core/` is an RFC delta package. It intentionally lists only the fields and types introduced or changed by RFC-004. Its `schema-definition` and `schema-member` types also reference existing base fields from active `spec-authoring-core` v1.0.0, such as `title`, `namespace`, `version-label`, `description`, `status`, `content`, `examples`, and `notes`. A consumer reviewing the proposal should treat the RFC package as layered on top of the active base package.

`proposed-package/spec-authoring-json-schema/` depends on `spec-authoring-core` version `1.1.0-rfc-004`, because its projection rules require the proposed `schema-definition` and `schema-member` types.

## Schema Boundary

`proposed-schemas/field.json` is a direct candidate update for the active field schema: it adds `json` to `Field.valueType`.

`proposed-schemas/package.json` is different. It is the distribution-oriented package schema shape from the SRS spec with the RFC-004 `json` enum added. It is not a validator for this repository's lightweight local package manifests, which currently use `id`, `namespace`, `name`, `version`, `status`, and file paths. Replacing the local manifest format with the distribution shape would require a separate package-manifest migration RFC.

## Identity Notes

`schema-default-value` deliberately has its own field identity. It must not reuse the active `default-value` field (`1a000024-0000-4000-a000-000000000024`), because the active field documents defaults in prose while `schema-default-value` stores a concrete JSON default for a schema member.
