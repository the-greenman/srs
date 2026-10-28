# Distribution Group (Core)

> The Distribution group is required for all conforming implementations.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

The Distribution group is required for all conforming implementations.

## Package

The distributable artefact. Contains Field, Type, View, and Relation type definitions with a complete dependency manifest.

A package travels between repositories as a Package Bundle, written by package export as one `.srspkg` file (see Package export).

Example: the `Package` shape.

`dependencyRefs` is required in both modes. Consumers use it to validate completeness without parsing content internals. `packageDependencies` is a different list: the packages this package requires (see Package requirement).

A package bundle MAY carry the package's readme as `readme`, its actual path relative to the package directory and its text (see Bundled readme). It is the exported package's own: a `mode: "bundled"` bundle inlines its dependencies' definitions, not their readmes. *(Effective with RFC-003 whole-package export, srs#857.)* An implementation that writes a package bundle carrying a valid `readme` out as a package directory MUST write `content`, encoded as UTF-8, to `path` relative to that directory, subject to the Bundled readme write rule. An implementation that installs such a bundle without writing a package directory SHOULD retain `readme` with the installed package so that a later whole-package export of that package carries it (RFC-045 [R3]).

### The `Package` shape

`Package`, in pseudo-IDL:

```typescript
{
  schemaVersion: string      // SRS spec version, e.g. "2.0"
  packageId: UUID
  packageName: string
  packageNamespace: string   // label; identity is packageId (RFC-044)
  packageVersion: string     // semver, e.g. "1.2.0"
  publishedAt: ISO8601
  publisher?: string
  description?: string
  homepage?: string

  // Content (at least one of fields or types must be non-empty)
  fields: Field[]
  types: Type[]
  views?: View[]             // ext:views-l1; omit if not in use
  compositions?: Composition[]  // ext:views-l2; omit if not in use
  themes?: Theme[]           // ext:themes-l1; omit if not in use
  blueprints?: Blueprint[]   // core; omit if not in use
  protocols?: Protocol[]     // ext:protocol; omit if not in use
  relationTypes?: RelationTypeDefinition[]  // relation type definitions
  vocabularies?: Vocabulary[]               // RFC-006: named vocabulary definitions
  lifecycles?: Lifecycle[]                  // RFC-006 ext:lifecycle: referenceable lifecycle definitions

  mode: "bundled" | "standalone"

  dependencyRefs: Reference[]          // definitions the content points at
  packageDependencies: DependencyRef[] // packages this package requires (RFC-044)
}

DependencyRef {
  packageId: UUID            // the key: the required package's id
  namespace: string          // display label
  name: string               // display label
  version: string            // SemVer 2.0.0; same compatibility band, at least this version
}
```


**Intro**: **`mode` semantics:**

| Mode | Meaning |
| --- | --- |
| `"bundled"` | All Field records referenced by any Type, all Type records referenced by any Type or View, and all View records referenced by any Composition are included in their respective arrays. Self-contained. |
| `"standalone"` | Dependencies are expected pre-installed in the consumer's registry. `dependencyRefs` is the required manifest. |



## Reference

A stable pointer to a specific definition version.

Example: the `Reference` shape.

Canonical string form: `namespace/name@version`

### The `Reference` shape

`Reference`, in pseudo-IDL:

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer   // min: 1
  definitionType?: "field" | "type" | "view" | "blueprint" | "protocol"
}
```



## Lineage

Upstream and fork tracking for a specific definition version.

Example: the `Lineage` shape.

Both may be present during a transition from tracking to forking.

### The `Lineage` shape

`Lineage`, in pseudo-IDL:

```typescript
{
  sourceDefinitionId?: UUID     // UUID of the upstream definition
  sourceVersion?: integer       // upstream version at derivation time
  forkedFromDefinitionId?: UUID // UUID of the definition deliberately forked from
  forkedFromVersion?: integer   // version at the fork point
}
```


| Field pair | Meaning |
| --- | --- |
| `sourceDefinition*` | Tracked copy; consumer expects upstream updates |
| `forkedFrom*` | Deliberately diverged; no upstream tracking |



## Provenance

Publisher and package origin metadata.

Example: the `Provenance` shape.

`packageVersion` is distinct from `Field.version`. A package at `1.3.0` may contain `decision_statement@3` and `context@2`.

### The `Provenance` shape

`Provenance`, in pseudo-IDL:

```typescript
{
  publisher?: string        // namespace or org of the original author
  sourcePackage?: string    // package name that bundled this definition
  packageVersion?: string   // semver of the source package
  importedAt?: ISO8601
}
```



## Package requirement

A package declares the packages it requires in `packageDependencies`, a list of `DependencyRef` entries. A `DependencyRef` MUST carry `packageId`, `namespace`, `name` and `version`, and no other property (RFC-044 [R1]). `packageId` is the `id` of the required package and the key of the requirement. `namespace` and `name` are display labels: they never decide whether the requirement is satisfied. `version` MUST match the SemVer 2.0.0 pattern, the anchored regular expression published at semver.org (RFC-044 [R2]).

An installed package version `I` satisfies a requirement version `R` if and only if, in order (RFC-044 [R3]): (1) `I` is in `R`'s compatibility band: the same MAJOR when `R`'s MAJOR is at least 1; the same MAJOR 0 and the same MINOR when `R` is `0.y.z` with `y` at least 1; the same MAJOR, MINOR and PATCH when `R` is `0.0.z`; (2) if `I` carries a pre-release tag, `I` and `R` have identical MAJOR, MINOR and PATCH; (3) `I` has SemVer 2.0.0 precedence greater than or equal to `R`. Build metadata is ignored. For `R` = `1.2.0`, `1.3.5` satisfies and `2.0.0`, `1.1.9` and `1.3.0-rc.1` do not; for `R` = `0.1.0`, `0.1.7` satisfies and `0.2.0` does not.

`packageDependencies` denotes only the list of required packages, and the list of definition References a package's content points at is `dependencyRefs`. An implementation MUST NOT read either property as the other (RFC-044 [R7]).

A Package Bundle MUST declare `packageNamespace` and `packageDependencies` (possibly empty), and MUST accept `themes`, `blueprints` and `protocols` as optional arrays, so that every definition kind a package manifest declares has an array of the same name in the bundle (RFC-044 [R5], [R6]). A `DependencyRef` in a bundle has exactly the shape and meaning of one in a package manifest (RFC-044 [R8]). Once RFC-003's whole-package export is accepted, a bundle it produces carries the source manifest's `namespace` as `packageNamespace` and its `packageDependencies` unchanged (absent counts as `[]`), except that it MAY omit the entry for a package whose every definition it inlines. `dataModelRevision` is unchanged by RFC-044 (RFC-044 [R12]).


## Package export

Exporting a package takes one package installed in a repository (its package manifest and the definition files the manifest lists) and writes a Package Bundle: one JSON document conforming to `package-bundle.json` that carries definitions inline in the ten definition arrays (`fields`, `types`, `views`, `compositions`, `vocabularies`, `lifecycles`, `relationTypes`, `themes`, `blueprints`, `protocols`) with the package's publication metadata. Install consumes a bundle; export produces one. This mechanism defines whole-package export (RFC-003). Subset export is RFC-047 (Draft) and binds nothing.

A package export MUST be emitted as a Package Bundle. A whole-package export MUST carry every definition its source package manifest lists, each at the `version` its definition file carries, and MUST resolve every PINNED and LINEAGE reference a carried definition makes (Package export reference sites) in the exporting repository's effective package set, the RFC-014 union with the RFC-029 core package. A PINNED reference reaches the one version it names; a LINEAGE reference reaches every version of its `id` the set holds. KEYED and LOCATOR references are not followed (RFC-003 [C1]).

In both modes, every definition version so reached MUST be listed in `dependencyRefs`, one `Reference` per `id` and `version`, including the source package's own referenced definitions: the list means referenced, not missing (RFC-044 [R7]). In `mode: "bundled"`, the default, every definition so reached MUST be carried, transitively. In `mode: "standalone"` only the source package's own definitions are carried. A definition of the RFC-029 core package so reached, other than one the source manifest lists, MUST NOT be carried in either mode and MUST be listed in `dependencyRefs`: core is substrate every implementation embeds, identical by `id` and `version`, so it is declared, not carried (srs#869).

An exporter MUST stop with a diagnostic and write no file when a listed definition file is missing or does not parse, a carried definition fails its own schema, a followed reference does not resolve, two different definitions with the same `id` and `version` would be carried, or RFC-044 [R11] forbids it (RFC-003 [C1]).

A Package Bundle MUST carry definitions only, plus the package metadata `package-bundle.json` declares, including an RFC-045 `readme`. It MUST NOT contain instances, relations, source documents, a `manifest.json`, a `.srs/` marker, a root container or an `instanceIndex`, and a conformant tool MUST NOT open, validate or navigate it as an SRS repository (RFC-003 [C2]).

### Package export reference sites

A reference site is every property of a definition schema that holds another definition's UUID, bare or as an `{id, version}` pair, with the strength `rfc-decision-c8704763` declares for it. A site added by a later RFC declares its strength where it is defined. An empty value (a Protocol's `targetType` of `""`) is not a reference. Not reference sites: a definition's `Lineage` provenance (`sourceDefinitionId`, `forkedFromDefinitionId`) and a Composition source's `containerId`/`containerIds`. Package export follows PINNED and LINEAGE sites and no others (RFC-003 [C1]).

| Strength | Followed | Sites |
|---|---|---|
| PINNED: this definition at this `version` | yes, to that version | a `ref` Field's target Type; Type inheritance (`extendsTypeId` with its version); `extendsVocabularyId`, `extendsLifecycleId`; a Composition's `rootTypeRefs`; a Blueprint's `rootTypes`, `requiredTypes` and `RelationSpec` source and target Types |
| LINEAGE: this definition, any version the context installs | yes, to every version the effective set holds | `fieldId` in a Type's field assignments, overrides, cross-field rules and `fieldOrder`; the Field ids that are `roles` values of a View's composite-renderer binding and a Composition's composite-renderer directive; Field ids in a View's rows, a section's `titleFieldId` and `ordering.fieldId`, a composite-renderer directive and a Theme's `cssClassFields`; the View ids that are `typeDispatch` values; a Type's `identityFieldId` and `lifecycleRef`; a Field's `vocabularyRef`; a section's `renderViewId`; a `typeId` in a discovery query, a Theme's record wrapper override or a Protocol's `FieldRef`; the `fieldId` of a Protocol's `FieldRef` (`/stages/*/contributesTo/*/fieldId`); a Protocol's target and output Types |
| KEYED: whatever matches the key in the consumer's set | no | `relationType` keys, lifecycle state keys, term keys, `namespace/name` keys (`typeFilter`, `typeDispatch` keys, a discovery query's `typeNamespace`/`typeName`), a View's `compatibleTypes` |
| LOCATOR: where to fetch bytes | no | a Composition's `themeRef` and `themeVariants` |

Consequence: a bundled export whose Blueprint names another package's relation type, or whose Composition points at another package's Theme, installs; an unresolved relation-type key is a validation error where it is used (RFC-005 E1), and a `ThemeReference` is resolved as `ext:themes-l1` resolves any theme locator. A package's own relation types and Themes are always carried.


### Package export identity

A Package Bundle carries two independent identity layers. For a whole-package export, `packageId` and `packageVersion` MUST equal the source package manifest's `id` and `version`, and `packageName` MUST equal its `name` (RFC-003 [C3]); `packageNamespace` and `packageDependencies` are set by RFC-044 [R5] and [R11]. A whole-package export never mints a new `packageId`, so a later export of the same package is the same `packageId` at a higher `packageVersion` and a consumer, through RFC-014's `upstreamPackage`, recognises it as an update. Every carried definition MUST preserve its `id`, `namespace`, `name` and `version`; definition identity MUST NOT be rewritten on export (RFC-003 [C4]). A consumer deduplicates definitions by `id` and `version`, whichever bundle delivered them.

Each top-level property has one source:

| Property | Source |
|---|---|
| `packageId`, `packageVersion`, `packageName` | the manifest's `id`, `version`, `name` |
| `packageNamespace`, `packageDependencies` | the manifest's `namespace` and `packageDependencies` (RFC-044 [R5], [R11]) |
| `schemaVersion` | the constant `"2.0"` |
| `dataModelRevision` | the exporting repository's `dataModelRevision` (Package bundle revision gate) |
| `mode` | the caller; `"bundled"` when none is given |
| `publishedAt` | the caller; the current time when none is given |
| `publisher`, `homepage` | the caller, when given |
| `description` | the manifest's `description`, when it has one |
| `readme` | the package directory's readme file (RFC-045) |
| `$schema` | the constant `https://srs.semanticops.com/schema/2.0/package-bundle.json` |
| the ten definition arrays, `dependencyRefs` | the closure (Package export) |

The manifest's `title`, `status`, `createdAt`, `updatedAt` and definition file paths are not carried.


### Package Bundle serialisation

A Package Bundle that a package export writes to a file MUST be a single JSON document, UTF-8 without a byte-order mark, with the suffix `.srspkg`, and no archive wrapper (RFC-003 [C5]). The `.srspkg` file is the distributed artifact, the package counterpart of the `.srsj` repository file; tools SHOULD recognise a bundle by the suffix.

Every object at every depth MUST write its members in ascending order of member name by Unicode code point (not UTF-16 code unit), with no duplicate names. Arrays MUST keep their element order, except that the ten definition arrays MUST be ordered ascending by `id` and then `version` (numerically), and `dependencyRefs` by `id`, `version`, then `definitionType` (absent first), with `id`s compared as written by code point. Order inside a definition and the order of `packageDependencies` are content and are kept. `fields`, `types`, `dependencyRefs` and `packageDependencies` MUST be written, possibly empty; any other definition array with no entries MUST NOT be written (RFC-003 [C5]).

Identical content means identical definitions and identical values of every top-level property, including `publishedAt`, `mode`, `dataModelRevision` and `readme`. Given identical content, the same build of an exporter MUST write byte-for-byte identical files on every invocation, and no other input (file-system order, timestamps, host, locale) may change a byte. Byte identity between different exporters is not required: whitespace, a trailing newline, string-escape spelling and number spelling are the exporter's choice, held fixed within one build, as RFC-017 [R6] scopes the `.srs` archive (RFC-003 [C5]).

Consequence: a `.srspkg` is content-hashable per exporter build, and a committed one changes in a diff only where the package changed while one exporter writes it. A different exporter, or a new release of one, may change every line's whitespace and its hash, and an exporter that stamps the current time as `publishedAt` writes a new file each run.


### Package bundle revision gate

A whole-package export MUST stamp the bundle's `dataModelRevision` with the exporting repository's `dataModelRevision`; the package manifest's own stamp is not consulted (RFC-003 [C6]). The repository's stamp is the authority: a repository at revision N loads and migrates its packages as revision N.

A reader of a bundle as input to package install, or of a `.srspkg`, MUST treat an absent stamp as revision 0 (RFC-033 [R6]). An implementation's own embedded core package (RFC-029) is not read under this rule. The reader then:

- MUST refuse a bundle stamped above its supported revision, installing nothing;
- MUST bring a bundle stamped below its supported revision forward through a bundle-form transformer for every intervening step, one step at a time, before reading any definition, refusing the bundle and installing nothing when a step has no transformer or a transformer refuses; what a transformer reports it could not carry forward is passed on as diagnostics and the install proceeds;
- reads a bundle stamped at its revision as is.

Each refusal MUST be reported with a diagnostic naming the revisions or step involved (RFC-003 [C6]).

A step whose migration changes no shape a Package Bundle carries has the re-stamp as its bundle-form transformer: the reader sets the bundle's revision to the step's target and continues. RFC-043 [R17] is the bundle-form transformer from revision 7 to 8; RFC-046's step from 8 to 9 is a re-stamp, because it adds `createdBy` to instances only. A revision-9 reader therefore reads bundles stamped 7, 8 or 9 and refuses one stamped below 7 or unstamped. Every bundle a conforming exporter writes is stamped. Reading an older generation's definitions as current is the bundle form of what Invariant I-135 forbids for a record.
