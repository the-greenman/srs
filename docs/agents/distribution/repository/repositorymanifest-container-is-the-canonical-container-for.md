# RepositoryManifest.container is the canonical Container for the…

> RepositoryManifest.container is the canonical Container for the…: a section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: 47

`RepositoryManifest.container` is the canonical `Container` for the repository. It must satisfy all core Container invariants (Invariants 20–21). If a separate `container.json` is present in the repository root, it must be consistent with the manifest's embedded Container; the manifest takes precedence on conflict.
