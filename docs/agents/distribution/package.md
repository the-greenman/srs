# Package

> The distributable unit of definitions: Fields, Types, and the vocabularies, lifecycles, relation types, views, compositions, blueprints, protocols and themes built on them, with a complete dependency…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

The distributable unit of definitions: Fields, Types, and the vocabularies, lifecycles, relation types, views, compositions, blueprints, protocols and themes built on them, with a complete dependency manifest. It is bundled, meaning everything referenced is carried inside and it is self-contained, or standalone, meaning dependencies are expected already installed. The dependency manifest is required either way, so a consumer can check completeness without parsing what is inside.

**Notes**: Packages are what makes a vocabulary shareable instead of private to one tool. The specification defines the package's shape; how registries publish, authenticate or federate them is deliberately out of scope.

## Every fieldId referenced in any FieldAssignment within a…

**Number**: 7

Every `fieldId` referenced in any `FieldAssignment` within a `Package.types[]` must appear as the `id` of an entry in `Package.dependencyRefs`.


## If Package.mode === "bundled": every Reference in dependencyRefs must…

**Number**: 8

If `Package.mode === "bundled"`: every `Reference` in `dependencyRefs` must have a matching `Field` in `fields[]` (matched on `id` and `version`) unless it is a definition of the RFC-029 core package, which is listed in `dependencyRefs` and need not be carried (RFC-003 [C1]).


## Every typeId referenced by any View in Package.views[] must appear in…

**Number**: 15

Every `typeId` referenced by any `View` in `Package.views[]` must appear in `Package.dependencyRefs` with `definitionType: "type"`. If `mode === "bundled"`, that `Type` must be present in `types[]` unless it is a definition of the RFC-029 core package, which is listed in `dependencyRefs` and need not be carried (RFC-003 [C1]).


## Every DocumentSection.renderViewId in any Composition within…

**Number**: 35

Every `DocumentSection.renderViewId` in any `Composition` within `Package.compositions[]` must reference a `View.id` that appears in `Package.views[]` or `Package.dependencyRefs`. If `mode === "bundled"`, that `View` must be present in `Package.views[]` unless it is a definition of the RFC-029 core package, which is listed in `dependencyRefs` and need not be carried (RFC-003 [C1]).


## Every TypeRef.typeId referenced in any Blueprint.rootTypes[],…

**Number**: 36

Every `TypeRef.typeId` referenced in any `Blueprint.rootTypes[]`, `Blueprint.requiredTypes[]`, or in any `RelationSpec.sourceType` or `RelationSpec.targetType` within `Blueprint.structure[]`, for each Blueprint in `Package.blueprints[]`, must appear in `Package.dependencyRefs` with `definitionType: "type"`. If `mode === "bundled"`, each such Type must be present in `Package.types[]` unless it is a definition of the RFC-029 core package, which is listed in `dependencyRefs` and need not be carried (RFC-003 [C1]).


## Every Protocol.protocolTargetType and ProtocolStage.outputType referenced…

**Number**: 37

Every `Protocol.protocolTargetType` (when a non-empty UUID) and every `ProtocolStage.outputType`, for each Protocol in `Package.protocols[]`, must appear in `Package.dependencyRefs` with `definitionType: "type"`. Every `FieldRef.fieldId` in any `ProtocolStage.contributesTo[]` must appear in `Package.dependencyRefs` with `definitionType: "field"`. If `mode === "bundled"`, those Types must be in `Package.types[]` and those Fields in `Package.fields[]`, each unless it is a definition of the RFC-029 core package, which is listed in `dependencyRefs` and need not be carried (RFC-003 [C1]).


## When PackageRef.mode === "local", the package at the declared path…

**Number**: 50

When `PackageRef.mode === "local"`, the package at the declared path must be `mode: "bundled"` and must include all Fields and Types referenced by any Tier 2 `Record` in the repository's instance set (RFC-038 [R1]; enumerated from the tree, not a manifest `instanceIndex`, which is retired per [R2]). This is the repository analogue of Package Invariants 7–8.


## Multi-version repository MUST resolve definition references against union of all installed package directories

**Number**: I-83

A tool MUST resolve every `typeId` and `fieldId` referenced by any Tier 2 Record against the union of all installed package version directories. This extends Invariant 50 to the multi-version case: a reference is resolved if it can be found in any installed version directory. A reference that cannot be found in any installed version directory MUST be reported as a validation error. A tool MUST NOT remove any prior-version package directory if doing so would leave any such reference unresolvable.


## no-base-package: repository must load without com.semanticops.base

**Number**: I-103

A conformant implementation MUST NOT refuse to load, validate, or export a repository solely because the `com.semanticops.base` package is absent or because no `attachment_policy` record is present.
