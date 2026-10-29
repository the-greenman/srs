# Stable identity

> The rule that every SRS entity carries a UUID that is minted once and never changes — not when the entity is copied, exported, imported, renamed for display, or moved between repositories.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

The rule that every SRS entity carries a UUID that is minted once and never changes — not when the entity is copied, exported, imported, renamed for display, or moved between repositories. Identity is declared, never inferred from a filename, a path, a storage history or a display label, and never selected by precedence: an identity conflict is fatal, never resolvable. Changing what an entity is at root means minting a new UUID, not reusing the old one.

**Notes**: Definition identity (Field.id, Type.id, packageId) and instance identity (instanceId, relationId, documentId, containerId) are distinct id spaces that obey the same rule.

**Examples**: `repositoryId` survives export and copy; an importer that mints a new repository for every archive it receives, instead of keying on `repositoryId`, is non-conformant (Invariant 53).

## Stable identity

An SRS entity carries a UUID minted once, at creation, that does not change afterward. A copy, an export, an import, or a rename for display MUST NOT change an entity's UUID. Identity is declared on the entity itself, never derived from a file path, a directory position, or a storage history.

A UUID conflict between two entities is a fatal error. A loader MUST NOT resolve it by precedence, and MUST NOT pick one entity as the winner over the other: doing so would discard whichever identity claim lost.

Changing what an entity is at its root means minting a new UUID. A materially different entity does not reuse an old UUID: every existing reference to that UUID already points at the entity it used to be.


## Field.id is stable across versions.

**Number**: 9

`Field.id` is stable across versions. A new `id` means a new definition, not a new version of an existing one.


## When an importer encounters an incoming object whose identity key…

**Number**: 54

When an importer encounters an incoming object whose identity key matches an existing local object but whose content or checksum differs, it must surface the conflict explicitly. An importer that silently overwrites or silently discards in this case is not conformant.
