# Addressability

> The live cursor over the core Address (RFC-049): the current focus of an active process run, AttentionState, stamped onto conversation material as it is produced, so that asking for everything said w…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:addressability

**Status**: live

**Adds**: The live cursor over the core Address (RFC-049): the current focus of an active process run, `AttentionState`, stamped onto conversation material as it is produced, so that asking for everything said while attention was on a given field becomes a query, not a search, together with the context-query behaviour built on it. The Address itself, which makes a transcript fragment and a field on a record co-addressable, is core. For live facilitation, declare together with `ext:protocol`.

**Cost of Non-Adoption**: Without it, there is no live cursor stamped onto conversation material as it is produced: asking for everything said while attention was on a given field is not answerable as a query, and context assembly is retrospective only. Addresses themselves remain available, because the Address is core.
