# Repository

> The file-based repository format: a marker directory identifying the root, a manifest declaring the repository's stable id, its packages, its required root container and its declared extensions, and …

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:repository

**Status**: live

**Adds**: The file-based repository format: a marker directory identifying the root, a manifest declaring the repository's stable id, its packages, its required root container and its declared extensions, and reserved folders for instances, relations, source documents and local definitions. Membership is authoritative from the tree itself — a file present under a reserved root is a member, with no manifest index to disagree with it — and the repository is operable with no running service, no registry and no network. The `.srsj` JSON Store is a single-file, lossless serialization of the same semantic content, for when portability matters more than per-file inspection. A `.srsj` can also carry the repository's readme beside `data`, as its actual path and text, restored at that path on unpack and kept on every rewrite (RFC-045, see Bundled readme); in a `.srs` a readme is one more entry at its path, ordinary application content that RFC-038 [R10] already preserves.

**Cost of Non-Adoption**: Without it, there is no standalone, directory-based repository format operable offline: no marker directory, no manifest declaring packages and root container, and no tree-authoritative membership rule. An implementation is left with the single-file `.srsj` JSON Store alone, or a bespoke storage mechanism of its own.

## Installed package set

A package requirement check compares requirements against these members (RFC-044 [R4]).

Each `PackageRef` in the manifest's `packageRefs` contributes one member; when `packageRefs` is present `packageRef` is ignored, and otherwise `packageRef` contributes the one member. A `local` ref resolves to the package manifest at its `path`, and a `remote` ref to the package the consumer's registry holds for its `packageId`. The member's identity is the resolved manifest's `id`, and its version that manifest's `version`. When the ref's own values disagree with that manifest, the manifest wins. A ref that cannot be resolved to a readable manifest contributes a member identified by `PackageRef.packageId` and versioned by `PackageRef.packageVersion` (absent means unknown), or no member when it has no `packageId`.

Refs that resolve to the same `id` at different versions are separate members, and a requirement on that `id` is satisfied when at least one of them satisfies it. The core base package (`com.semanticops.core`, `id` `3a000001-0000-4000-a000-000000000001`) is a member, at the version of the core package the consumer implements. `upstreamPackage` contributes nothing: it records what the repository was initialised from, not what is installed.


## Package requirement check

A consumer MAY check every `packageDependencies` entry of every member of a repository's installed set, and of a bundle before install (RFC-044 [R9]). A consumer that never checks is conforming. An unsatisfied requirement, and a `DependencyRef` that fails schema validation, MUST NOT cause a repository load to fail.

For a member `P` and an entry `D` of its `packageDependencies`, a consumer that checks MUST decide the outcome by these steps in order, and MUST NOT decide it from `namespace` or `name` (RFC-044 [R10]). (1) `D` without `packageId`: unsatisfied, reason `no-package-id`. (2) `D.packageId` equal to `P`'s own `id`: unsatisfied, reason `self-requirement`. (3) No member with that `id`: unsatisfied, reason `missing`. (4) Satisfied if any such candidate satisfies `D.version`. Otherwise the reason comes from one candidate: candidates of unknown version are not eligible (all unknown gives `version-unknown`); the chosen candidate is the highest-precedence one inside the requirement's compatibility band, or the highest overall when none is; the reason is the first version clause it fails: `incompatible`, `prerelease-excluded` or `version-too-low`. A bundle is checked the same way with `P` the bundle and the candidates drawn from the target repository. The check is not recursive.

Each unsatisfied entry MUST be reported as `package-dependency-unsatisfied`, default severity warning, with exactly one of those reasons, naming the requiring package's `id`, the entry's `packageId`, labels and `version`, and the candidates' installed versions. When a candidate's `namespace` or `name` differs from the entry's labels, the consumer MUST report `package-dependency-label-mismatch` once for the entry, default severity info. A client MAY refuse an action on `package-dependency-unsatisfied`; which actions it refuses is the client's own choice.

A `DependencyRef` without `packageId` is invalid against `package-manifest.json`, reported at error severity by a validator that checks manifests against the schema, while the load proceeds (RFC-044 [R11]). No reader or writer MAY supply a missing `packageId` by matching labels. A writer MUST preserve such an entry until it is repaired, and an exporter MUST NOT copy it into a bundle.
