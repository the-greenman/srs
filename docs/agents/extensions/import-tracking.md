# Import Tracking

> Recording, for a consumer that receives packages from an upstream publisher, what was imported, whether local content has diverged from the upstream source, and whether the upstream has moved ahead s…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

**Extension ID**: ext:import-tracking

**Status**: live

**Adds**: Recording, for a consumer that receives packages from an upstream publisher, what was imported, whether local content has diverged from the upstream source, and whether the upstream has moved ahead since. Divergence and update conflicts are detected and surfaced rather than silently overwritten or silently missed.

**Cost of Non-Adoption**: Without it, a consumer that imports packages from an upstream publisher keeps no record of what it imported or from where, and cannot detect when local content has diverged from the upstream source or when the upstream has moved ahead — a divergence or update conflict is silently overwritten or silently missed instead of being surfaced.
