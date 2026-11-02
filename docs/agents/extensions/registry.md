# Registry

> A registry: one catalog of entries by kind, each mapping an identity to a locator, held outside everything it lists (RFC-049).

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:registry

**Status**: live

**Adds**: A registry: one catalog of entries by kind, each mapping an identity to a locator, held outside everything it lists (RFC-049). Two kinds are defined: `package` (published, versioned definition packages, the catalog a multi-publisher ecosystem indexes) and `repository` (the repositories an implementation may resolve into and route writes to, its boundary; an entry may be read-only). For resolution the operator who loads the registry vouches for its entries; a consumer may still index several catalogs for discovery.

**Cost of Non-Adoption**: Without it, an implementation catalogs no packages and serves exactly one repository: definitions have no published catalog to look up an unfamiliar package against, and an Address naming another repository is never resolved (it stays valid, RFC-049 [R11]).
