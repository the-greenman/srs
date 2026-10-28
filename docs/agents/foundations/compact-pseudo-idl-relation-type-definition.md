# Compact pseudo-IDL

> The Compact pseudo-IDL: relation-type-definition section of the specification.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Foundations](/agents/foundations.md).

```typescript
relation-type-definition {
  id: string // Globally unique, stable UUID identity of this entity.
  version: integer // Positive integer version within the UUID lineage.
  key: string // Machine-readable state key. Unified substrate field (was name pre-RFC-006).
  namespace: string // Reverse-DNS logical grouping.
  label: string // Human-readable display label for this lifecycle state.
  description: string // Human-readable description of this entity.
  category: string // Structural category of a relation type.
  canonicalDirection?: string // Human-readable description of which end is source and which is target, or what members represent.
  inverseType?: string // Key of the derived inverse (e.g. supersedes -> superseded-by); need not resolve — display-only (Invariant 16).
  irreflexive?: boolean // When true, a relation from an instance to itself is invalid.
  requireSameType?: boolean // When true, source and target must resolve to the same bound Type (srs-rust#910, re-keyed onto the Type system).
  status?: string // The VocabularyEntry status of this lifecycle state itself (distinct from the record-level status a Type's Records carry).
  createdAt: date-time // ISO-8601 creation timestamp.
  updatedAt?: date-time // ISO-8601 timestamp of the most recent update.
  meta?: map<string, open> // Open extension bag for state- or transition-specific metadata not otherwise modelled (rfc-decision-6fc7e142: the one escape-bag name, was `properties`).
}
```
