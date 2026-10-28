# Recommended Relations (compatibility label only)

> Cost of Non-Adoption: None.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:recommended-relations

**Status**: live

**Adds**: Historically, a recommended (not required) set of seven canonical relation types for a repository to declare. Retired as of RFC-005: the canonical vocabulary (`contains`, `depends-on`, `supersedes`, `refines`, `derived-from`, `evidences`, `precedes`) is now provided unconditionally as installed `RelationTypeDefinition` records in the `com.semanticops.srs` package, so there is nothing left for declaring this extension to add.

**Cost of Non-Adoption**: None. The canonical relation definitions are available to any repository using the SRS package regardless of whether this extension is declared; an implementation that previously declared `ext:recommended-relations` may remove it without loss.
