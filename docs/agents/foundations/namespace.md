# Namespace

> A dot-separated, lowercase identifier that groups definitions under an authority and keeps names from colliding between independent publishers.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

A dot-separated, lowercase identifier that groups definitions under an authority and keeps names from colliding between independent publishers. Components match `[a-z0-9][a-z0-9-]*`. `core` is reserved for definitions maintained by the SRS standard, and `com.semanticops.core` is reserved such that no repository may declare a Type or Field under it. Namespace authorship is where domain vocabulary responsibility sits — the specification deliberately defines no universal ontology.

**Examples**: `core`, `community.adr`, `com.acme.hr`, `org.cooperative-name`

## com.semanticops.core/* types and fields MUST resolve in every conforming repository without any package declaration

**Number**: I-85

A conforming SRS implementation MUST make all `com.semanticops.core/*` types and fields resolvable in every repository without any `packageRef` or `packageRefs` declaration in the manifest. The core base package's definitions are treated as logically present in the RFC-014 R6 package union for all repositories. An implementation that fails to resolve `com.semanticops.core/*` types and fields in a structurally valid repository is non-conformant with RFC-029.


## No Type or Field with namespace com.semanticops.core MAY be declared in any repository package

**Number**: I-86

A repository MUST NOT declare any Type or Field under the `com.semanticops.core` namespace in a local or external package. An implementation MUST reject the repository load with a conflict error if any such declaration is encountered during package loading. This reservation covers only the `com.semanticops.core` namespace; other `com.semanticops.*` sub-namespaces are governed by their own RFC or by general package conflict rules and are not affected by this invariant.
