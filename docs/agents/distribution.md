# Distribution

> How definitions and instances travel outside the tool that made them.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Read first: [Reading this specification](/agents/reading-this-specification.md), [Structure](/agents/structure.md).

Pages under this one:

- [Package](/agents/distribution/package.md): The distributable unit of definitions: Fields, Types, and the vocabularies, lifecycles, relation types, views, compositions, blueprints, protocols and themes built on them, with a complete dependency…
- [Lineage and provenance](/agents/distribution/lineage-and-provenance.md): Two distinct records of where a definition came from.
- [Blueprint](/agents/distribution/blueprint.md): The definition of a whole document type: which Record Types it produces at the root, what Relations are expected between the resulting Records, and which Types must be present for it to count as comp…
- [Repository](/agents/distribution/repository.md): A directory that holds SRS content as files: a marker directory identifying the root, a manifest declaring the repository's stable id, its packages, its required root container and its declared exten…
- [Protocol](/agents/distribution/protocol.md): An epistemically ordered process for building a good Record through structured conversation: named stages, each with the question it answers, the understanding it builds, how to tell it is sufficient…
- [Registry](/agents/distribution/registry.md): A published, discoverable catalog of Field, Type and other definitions that a multi-publisher ecosystem can index.
- [Distribution Group (Core)](/agents/distribution/distribution-group-core.md): The Distribution group is required for all conforming implementations.

How definitions and instances travel outside the tool that made them. A Package bundles Field, Type, Vocabulary and view definitions with a dependency manifest, self-contained or referencing what it depends on. A Repository lays a package and its instances out on disk, with its own layout, manifest, and shape for archives and single-file exchange. Blueprint and Protocol are package-layer definitions built on the entity model — what a whole document extracts to, and how a Record gets built through staged conversation. Where a definition came from, and who published it, is recorded separately, so a consumer can tell an update from a fork.
