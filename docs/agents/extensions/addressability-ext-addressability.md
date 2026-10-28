# Addressability

> A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be resolved — including a transcript fragment and a field on a r…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:addressability

**Status**: live

**Adds**: A single addressing scheme spanning document space, process space and conversation space, so that anything that can be referred to can be resolved — including a transcript fragment and a field on a record, which is what makes an assertion linking them possible. Alongside the stable address sits the live cursor: the current focus of an active process run, stamped onto conversation material as it is produced, so that asking for everything said while attention was on a given field becomes a query, not a search. For live facilitation, declare together with `ext:protocol`.

**Cost of Non-Adoption**: Without it, there is no single addressing scheme spanning document, process and conversation space: a transcript fragment and a field on a record are not co-addressable, so an assertion linking them cannot be made, and there is no live cursor stamped onto conversation material as it is produced — asking for everything said while attention was on a given field is not answerable as a query.
