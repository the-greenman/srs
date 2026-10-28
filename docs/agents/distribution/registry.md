# Registry

> A published, discoverable catalog of Field, Type and other definitions that a multi-publisher ecosystem can index.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Distribution](/agents/distribution.md).

A published, discoverable catalog of Field, Type and other definitions that a multi-publisher ecosystem can index. A Registry states no opinion on registry authority, authentication or federation between competing catalogs; a consumer may index more than one.

## The `RegistryEntry` shape

`RegistryEntry`, in pseudo-IDL:

```typescript
{
  packageId: UUID
  packageName: string
  packageVersion: string
  publisher: string
  description?: string
  publishedAt: ISO8601
  homepage?: string
  tags?: string[]
  fieldCount: integer       // min: 0
  typeCount: integer        // min: 0
  viewCount?: integer
  schemaCount?: integer
  protocolCount?: integer
  relationTypeCount?: integer
  downloadUrl?: string
  checksum?: string         // SHA-256 hex digest for integrity verification
}
```


## The `Registry` shape

`Registry`, in pseudo-IDL:

```typescript
{
  schemaVersion: string
  registryId: UUID
  registryName: string
  catalogVersion: string    // registry's own version (semver)
  updatedAt: ISO8601
  homepage?: string
  entries: RegistryEntry[]
}
```


## `RegistryEntry`

One entry in a Registry catalog.

Example: the `RegistryEntry` shape.


## `Registry`

A registry's published index.

Example: the `Registry` shape.

Multiple Registries may coexist. A consumer may index multiple catalogs. The specification does not define registry authority, authentication, or federation.
