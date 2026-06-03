# RFC-006: Vocabulary Substrate — Terms, Vocabularies, Lifecycles, and Controlled Value Sets

> **Accepted**: This RFC is accepted. The downstream passes (spec records, Rust implementation) are tracked in [srs#8](https://github.com/the-greenman/srs/issues/8). It is not yet an SRS record projection.

---

**Status**: Accepted (Revision 8)
**Affects**: Foundation Group (Core), `Field`, `Type`, `TagDefinition`, `RelationTypeDefinition`, `LifecycleState`, `LifecycleTransition`, `Package`, `RepositoryManifest`, `ext:lifecycle`
**Author**: design dialogue draft
**Date**: 2026-06-03
**Builds on**: RFC-005 (installable, verifiable relation types)

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-06-03 | Initial draft: the vocabulary-entry substrate; `Vocabulary`/`Term`; `vocabularyRef` field binding; retrofit of `RelationTypeDefinition` and `LifecycleState` as substrate specializations; `TagDefinition` migration from instance to definition |
| 2 | 2026-06-03 | Unify the key-role field to `key` across all substrate specializations; fold `ext:lifecycle` fully into scope — `Lifecycle` becomes an installable, referenceable container (`Type.lifecycleRef`); lifecycle transitions documented as the first scoped case of edges-between-entries |
| 3 | 2026-06-03 | Resolve all open questions: scope key unification to definition entries (instance reference fields keep domain names); open-vocab duplicate keys are warnings; key-as-value confirmed for 2.0 with a documented cheap/lossless migration path to id-as-value; lifecycle transitions ship as intra-container payload with deferral assessed as effectively free / possibly permanent. Add Deferral Cost Analysis. |
| 4 | 2026-06-03 | Add Emergent Vocabularies: open vocabularies are usage-authoritative (instances define existence; the `Vocabulary` is a curation overlay that may lag or be empty). Define the emergence lifecycle (free string → Term → alias-merge → optional normalize → optional close), the derived-tag-set behavioral requirement, and open→close promotion (V10). |
| 5 | 2026-06-03 | Review fixes (findings 1–10): V6 no longer lists `retired` (V1 governs non-resolution); `select`/`multiselect` `vocabularyRef` MUST bind a closed vocabulary; `label`/`description` optional in substrate, specializations MAY tighten (RelationTypeDefinition requires both); define *effective entry set* and require key∪alias uniqueness in closed vocabularies (fixes "exactly one" + 1:1 key→id); cross-boundary transitions specified; `isFinal` forbids outgoing transitions; `LifecycleTransition` gains `id`; drop non-formable `Reference.definitionType: "term"` (entries are keyed sub-entries); add merge-operations terminology. |
| 6 | 2026-06-03 | Consistency pass: stale status header → Rev 6; record status modeled consistently as a `Lifecycle` (flat-vocabulary examples switched to `decision_category`), removing the Vocabulary/Lifecycle clash on `governance/record_status`; resolve V2↔V3 contradiction (no `Field` binds an open vocabulary); disambiguate *effective package set* vs *effective entry set* under Change D; map V10 + Emergent Vocabularies into the spec-amendment table; drop `"lifecycle"` from the `Term.roles` example to avoid colliding with the first-class concept. |
| 7 | 2026-06-03 | Second review (findings 1–10): V9 requires the initial state to be `active` and exactly one `isInitial` (no inoperable/ambiguous lifecycles); `absent = active` made normative; V10 migration window must declare an explicit end and its pre-flight must flag used-but-non-writable (deprecated/tombstone/retired) keys; V5 enforces `extends*Version` matching; `LifecycleTransition` gains `properties` under the Change H policy; alias-merge defined to consume (remove) the absorbed `Term`; migration declared a single atomic transition (intermediate states are not conformance points); Change A/E disambiguate inline `Package` arrays vs `package.json` path arrays. |
| 8 | 2026-06-03 | Third review (findings 1–9): `Vocabulary.promotionWindow.until` added as a real schema field (V10 window was previously unstorable); V10 pre-flight re-bins `retired` keys as will-be-invalid (reads do **not** survive) distinct from deprecated/tombstone; V5 rewritten as the single effective-set definition — `retired` excluded *before* uniqueness/resolution (frees keys for reuse; fixes timing), `extends*Version` mismatch is a hard error (no silent state-dropping / degradation), inline `Type.lifecycle` explicitly covered by V5/V9; alias-merge preserves the absorbed `id` via `mergedFrom` redirect (no orphaned id); V2 gains a deterministic open-collision tie-break (key>alias, then lowest `id`). |

---

## Abstract

SRS already contains several *controlled vocabularies* — sets of defined strings that appear in instance data and must mean something stable. RFC-005 made one of them (relation types) installable and mandatorily resolved. The same pattern recurs uncoordinated in three other places:

- **Tags** — `TagDefinition` enriches free-form tag strings, but lives as an *instance* (in `instanceIndex`), uses a different forward-compat policy than `RelationTypeDefinition`, and belongs to no container.
- **Select / multiselect field values** — constrained today by an inline `selectOptions: string[]`, an anonymous, unshareable, unextensible list with no identity.
- **Lifecycle states** — `ext:lifecycle` declares a per-Type set of named states with transitions, structurally the same as a closed vocabulary with edges, but inline and unshareable.

This RFC names the shared pattern as the **vocabulary-entry substrate** and unifies the *machinery* — identity, the `key` field, resolution, extension, lineage, status — across all of them, while keeping the domain-specific *payloads* distinct. It:

1. introduces `Vocabulary` and `Term` (generalizing `TagDefinition`);
2. binds `select`/`multiselect` fields to vocabularies via `vocabularyRef`;
3. unifies the key-role field to **`key`** across `Term`, `RelationTypeDefinition`, and `LifecycleState`;
4. folds `ext:lifecycle` in fully: `Lifecycle` becomes an installable, **referenceable** container (`Type.lifecycleRef`) so one state machine is defined once and reused.

RFC-005's resolution invariant ("every `relationType` must resolve to an installed definition") becomes a *special case* of one general rule that also governs closed field values and lifecycle states.

Lifecycle `transitions` are the first concrete, scoped case of *edges between vocabulary entries*. The general ontology layer (arbitrary relations between terms, term-as-value) remains deferred, but the identity that makes it possible is established here.

---

## Motivation

### Problem 1 — The same pattern is implemented four different ways

`RelationTypeDefinition` (RFC-005) and `TagDefinition` are the same kind of object — a defined string with identity, label, description, status — yet:

| | `RelationTypeDefinition` | `TagDefinition` (current) |
|---|---|---|
| Lives in | `package/` (definition) | `instanceIndex` (instance) |
| Forward-compat | `deny_unknown_fields` | `flatten extra` bag |
| Key field | `relationType` | `tagKey` |
| Resolution | mandatory (RFC-005 E1) | none |
| Extension by downstream | by id, in package | n/a |

`selectOptions` and `LifecycleState` are two *more* incarnations of the same idea with yet other shapes (and yet other key-field names: a bare array element, and `name`). Four implementations of one concept, with four different key spellings, is a foundations problem.

### Problem 2 — `selectOptions` is an orphaned closed vocabulary

`valueType: "select"` already means "one value from a constrained set." But the set (`selectOptions: string[]`) is anonymous: no id, not shareable between fields, not extensible by a downstream package, no labels/aliases/descriptions on its values. The governance profile hits this immediately: a `decision_category` select wants a shared, extensible value set, and a downstream package wants to *add* values (e.g. `financial`, `personnel`) without forking the field. (State machines like record status are the *Lifecycle* case — Problem 4 — not a flat select.)

### Problem 3 — `TagDefinition` has no container

A `TagDefinition` is "a defined option in a semantic space" — but the space is implicit and global. Nothing says *which* controlled set a term belongs to, whether that set is open (tags) or closed (field values), or where it is bound.

### Problem 4 — Lifecycle state machines cannot be shared

`ext:lifecycle` defines states and transitions inline on each `Type`. Two Types that share the same `draft → active → archived` machine must each redeclare it. The governance profile has many Types sharing one status machine; today that means copy-paste with no shared identity, no shared updates, no resolution.

### Problem 5 — Without a substrate, the ontology layer is unreachable

A governance system eventually wants to say `ratified` *supersedes* `provisional`, or that one relation type *refines* another. That requires vocabulary entries to have stable identity and to be addressable as endpoints. Today only `RelationTypeDefinition` has an id. The substrate makes identity uniform; lifecycle transitions demonstrate the scoped edge case; the general case stays deferred but reachable.

---

## Design Principles

**One substrate, specialized heads.** All vocabulary entries share a common header — including a single `key` field — and the same identity/resolution/extension/lineage/status machinery. They differ only in their domain payload. Flatten the machinery; do not flatten genuinely different payloads.

**Two axes describe every vocabulary.** *Binding scope* (ambient → repo-global → type-bound → field-bound) and *open/closed*. `mode: open | closed` is the single switch that lets one mechanism serve both tags and controlled values.

**Resolution is one rule.** RFC-005 relation-type resolution, closed-field-value resolution, and lifecycle-state resolution are the same operation over different vocabularies, with one status semantics (`active | deprecated | tombstone | retired`) shared verbatim with RFC-005.

**Containers and references are parallel.** Wherever a value set can be inlined, it can also be referenced: `selectOptions` ↔ `vocabularyRef`; inline `lifecycle` ↔ `lifecycleRef`. Same shape of choice, same exclusivity rule, same resolution.

**Extension is by id, in a package.** A downstream package extends an upstream vocabulary by declaring entries that target the upstream container's id.

**The instance shape does not change for tags.** `Note.tags` remains `string[]`. A tag is a key that *optionally* resolves to a `Term`.

**Open vocabularies are usage-authoritative.** For an open vocabulary, *instances* define what exists; the `Vocabulary` is a curation overlay that may lag usage or be empty. The `mode` switch is a statement about which side is the source of truth, not merely whether undefined values are allowed. Closed = vocabulary-authoritative (usage conforms); open = usage-authoritative (vocabulary curates). See Emergent Vocabularies.

**Identity now, ontology later.** Every entry gets a real `id` — and so does every lifecycle `transition` edge, so the one scoped edge construct is addressable. Arbitrary term-to-term relations and id-as-value are deferred.

---

## The Substrate

### `VocabularyEntry` (substrate contract)

`VocabularyEntry` is a **contract**, not a serialized type. `Term`, `RelationTypeDefinition`, and `LifecycleState` all satisfy it. Every conforming entry carries this header — including, as of Rev 2, a unified `key`:

```typescript
interface VocabularyEntry {
  id: UUID                  // stable identity
  version: integer          // min: 1
  namespace: string
  key: string               // the string that appears in instance data — UNIFIED across all specializations
  label?: string            // optional in the substrate; specializations MAY tighten to required (see below)
  description?: string      // optional in the substrate; specializations MAY tighten to required
  aliases?: string[]        // alternate keys that resolve to this entry
  status?: "active" | "deprecated" | "tombstone" | "retired"   // absent = active
  properties?: Record<string, unknown>   // explicit extensibility (replaces silent flatten / ad-hoc fields)
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

**Key-role unification (resolves Rev 1 Open Question 1).** All substrate specializations name their key field `key`:
- `Term.key` (was `tagKey`)
- `RelationTypeDefinition.key` (was `relationType`)
- `LifecycleState.key` (was `name`)

**Scope of the rename.** Unification applies to *definition entries* (the substrate). Instance-side *reference* fields keep their domain-readable names, because at a usage site the kind of key matters for readability:
- `Relation.relationType` (the instance field holding the string) is unchanged.
- `Record.lifecycleState`, `Note.tags`, and select field values are unchanged.

A usage site says *what kind* of key it holds; a definition entry simply *is* a keyed entry. This boundary is deliberate; see Open Question 1 if fuller unification (renaming the instance reference fields too) is wanted.

`properties` replaces `TagDefinition`'s `flatten extra` bag and any ad-hoc fields with one policy for the whole substrate: **unknown top-level fields are rejected; arbitrary entry metadata goes in `properties`.**

**Required-field tightening.** `label` and `description` are optional in the substrate so that an emergent `Term` curated from a bare tag key is valid before anyone writes prose for it. A specialization MAY tighten an optional substrate field to required (it MUST NOT relax a required one). `RelationTypeDefinition` requires **both** `label` and `description` (unchanged from RFC-005); the substrate making them optional does not relax that obligation. `Term` and `LifecycleState` leave both optional.

**Entries are keyed, not named.** Substrate entries (`Term`, `LifecycleState`, `RelationTypeDefinition`) carry a `key`, not a `name`, and are addressed by `key` *within their container*. They are therefore not independently `Reference`-able (a `Reference` is `namespace/name@version`). Containers that hold entries — `Vocabulary`, `Lifecycle` — have a `name` and are the `Reference` targets.

`status` semantics are inherited verbatim from RFC-005 §Validation E1 (`active`/`deprecated`/`tombstone`/`retired`). **An absent `status` MUST be treated as `active`.** This default is normative (resolves finding 2): every resolution rule that distinguishes by status (V1, V6, V9, V10) treats an absent value identically to `"active"`.

### `Vocabulary`

A named, versioned set of `Term` entries.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer          // min: 1

  mode: "open" | "closed"
  // open   — values not matching any Term are valid (tags). Terms are optional enrichment.
  // closed — values MUST resolve to a Term (field values). Non-resolving values are invalid.

  terms: Term[]

  extendsVocabularyId?: UUID       // when this vocabulary adds terms to an upstream vocabulary
  extendsVocabularyVersion?: integer

  promotionWindow?: {              // set when promoting open→closed with a grace window (V10)
    until: string                  // ISO8601 date OR target package version; the bound after which
                                   // V1 violations stop being warnings and become errors. Required if present.
  }

  description?: string
  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

A `Vocabulary` with `extendsVocabularyId` contributes its `terms[]` to the effective term set of the named upstream vocabulary. Term ids are globally unique, so additions never collide; a downstream package adds `financial`/`personnel` to a shared `governance/decision_category` vocabulary without editing or forking the upstream definition. (A state machine such as record status is a `Lifecycle`, not a flat vocabulary — see below.)

### `Term`

The generalization of `TagDefinition`. A defined option within a vocabulary; the minimal substrate head (no structural payload beyond identity, `roles`, and `properties`).

```typescript
{
  id: UUID                  // was instance_id; now a definition id
  version: integer
  namespace: string
  key: string               // was tagKey
  label?: string
  description?: string
  aliases?: string[]
  roles?: string[]          // retained: "foundation" | "navigation" | ... (drives AI context selection)
  status?: "active" | "deprecated" | "tombstone" | "retired"
  properties?: Record<string, unknown>   // color, order, icon, ...
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

### `Lifecycle` (folded in from `ext:lifecycle`)

A `Lifecycle` is a **specialized container**: a closed vocabulary of states *plus* the transitions between them and an initial state. It is installable in a package and **referenceable** by many Types.

```typescript
{
  id: UUID
  namespace: string
  name: string
  version: integer          // min: 1

  states: LifecycleState[]              // substrate entries (closed vocabulary)
  transitions: LifecycleTransition[]    // edges between state keys
  initialState: string                  // a state key whose isInitial === true

  extendsLifecycleId?: UUID             // downstream addition of states/transitions
  extendsLifecycleVersion?: integer

  description?: string
  tags?: string[]
  createdAt: ISO8601
  lineage?: Lineage
  provenance?: Provenance
}
```

`LifecycleState` (substrate specialization — payload is `isInitial`/`isFinal`):

```typescript
{
  id: UUID                  // NEW — states now have stable identity
  version: integer
  namespace: string
  key: string               // was name
  label?: string
  description?: string
  aliases?: string[]
  isInitial?: boolean       // valid starting state
  isFinal?: boolean         // no transitions out; settled
  status?: "active" | "deprecated" | "tombstone" | "retired"
  properties?: Record<string, unknown>
  lineage?: Lineage
  provenance?: Provenance
  createdAt: ISO8601
  updatedAt?: ISO8601
}
```

`LifecycleTransition` (edge between state keys — the first scoped case of edges-between-entries):

```typescript
{
  id: UUID                  // stable identity for the edge — addressable and losslessly migratable
  name: string              // e.g. "promote", "approve", "supersede"
  from: string              // a LifecycleState.key in the effective state set
  to: string                // a LifecycleState.key in the effective state set
  description?: string
  properties?: Record<string, unknown>   // same extensibility policy as entries (Change H)
}
```

A `LifecycleTransition` is an *edge*, not a `VocabularyEntry` (it has no `key`), but it carries an `id` so the scoped edge construct is addressable and convertible 1:1 should the general edges-between-entries layer ever land (see Deferral Cost Analysis, Q4). It follows the same forward-compatibility policy as substrate entries (Change H): unknown top-level fields rejected, arbitrary metadata in `properties` (resolves finding 5).

A `Lifecycle` is `closed` by nature: a `Record.lifecycleState` must resolve to a state `key` (V1).

---

## The Four Vocabularies, One System

| Vocabulary | Binding scope | Container | Payload (head) | Mode |
|---|---|---|---|---|
| Tags | ambient (whole repo) | `Vocabulary` (typically local) | none (`Term`) | `open` |
| Relation types | repo-global (any edge) | `package.relationTypes[]` (flat global set) | direction, endpoints, irreflexive | closed-extensible |
| Lifecycle states | type-bound, **now shareable** | `Lifecycle` (inline on Type, or referenced) | isInitial/isFinal + transitions | `closed` |
| Field values | field-bound | `Vocabulary` via `vocabularyRef` (or inline `selectOptions`) | none (`Term`) | `closed` (V3) |

Relation types remain a single implicit repo-global set rather than a named container (exactly one such set per effective package set). Lifecycles, like field vocabularies, support both inline and referenced forms.

---

## Emergent Vocabularies

Closed vocabularies are *declared-first*: the value set exists before the values, and usage must conform. Open vocabularies — paradigmatically free-form note tags — work the other way. The vocabulary is *discovered through use*: notes are added and tagged with whatever strings fit; structure crystallizes later. This section specifies that direction so the model does not invert it.

### Authority direction

For an **open** vocabulary, the authoritative set of values is the set actually present in instances — `DISTINCT(tag keys across notes)` — not the `terms[]` of any `Vocabulary`. The `Vocabulary` is a **curation overlay**: it holds the enriched subset of keys someone has defined, and it may lag usage arbitrarily or be entirely empty. A tag string that matches no `Term` is valid and fully functional; it is simply unenriched (V2).

Consequently an open `Vocabulary` does **not** gate writes and does **not** define existence. It only supplies enrichment (label, aliases, roles, properties) for the keys it happens to cover.

### Derived tag set (behavioral requirement)

A conforming implementation must be able to compute, from instances, the live set of keys in use in an open vocabulary, with usage counts, and classify each as:

- **used-and-defined** — appears in instances and resolves to a `Term`;
- **used-but-undefined** — appears in instances, no `Term` (a curation candidate);
- **defined-but-unused** — a `Term` exists, no instance carries its key or aliases (a dead-term candidate).

This is an operation, not a stored shape (cf. the context-query behavioral requirement in `ext:addressability`). It is the bridge from emergent usage to curated structure.

### The emergence lifecycle

The path from free string to structure, mirroring tier graduation (Note → Typed Record → Record):

1. **Free string.** A note carries a tag key. It exists, is undefined, and is valid.
2. **Curate → `Term`.** Attach label, description, roles, properties. **Non-destructive** — the note still carries the same string; the `Term` only attaches meaning.
3. **Alias-merge.** Unify synonyms without editing instances: a surviving `Term` absorbs another. The absorbed term's `key` (and its own `aliases`) move onto the survivor's `aliases`, and the absorbed `Term` entry is **removed from the effective set** — so two entries never coexist on the merged key (which would be a V5 key∪alias collision). Both note-strings now resolve to the one surviving term (V2), zero instance rewrites. **The absorbed `id` is not orphaned:** it MUST be recorded in the survivor's `properties.mergedFrom`, and id-based resolution of a merged-away id MUST redirect to the survivor. No id is lost to resolution — preserving the durable-identity guarantee (resolves finding 8) — while the key namespace is freed (resolves finding 6, round 2).
4. **Optional normalize.** A separate, opt-in operation that rewrites instance tag strings to a canonical key. Distinct from alias-merge (which leaves instances untouched); used only when the stored strings themselves should be cleaned.
5. **Optional close.** Once the space matures, promote `mode: open → closed` to lock it (V10). Thereafter V1 applies and stray tags become validation errors.

### Structure: now vs. later

"Emerges into structure" lands in two stages. **Flat structure is available now**: `Term`s, `aliases`, `roles` (e.g. `foundation`/`navigation`), and `properties` provide grouping and synonymy. **Relational structure** — true hierarchy (tag broader/narrower than tag, tag `contains` tag) — is the ontology layer and is deferred; `roles`/`properties` are the interim grouping mechanism.

---

## Proposed Changes

### Change A — Add `Vocabulary` and `Term` as core definition types

Foundation-group definition types, installed in packages alongside `fields`, `types`, `views`, `relationTypes`. Exactly parallel to how those are carried (resolves finding 9):
- the distributable **`Package`** holds full inline definitions: `vocabularies?: Vocabulary[]`;
- the repository **`package/package.json`** index holds **relative paths** to definition files: `"vocabularies": ["vocabularies/decision-category.json", ...]`.

Same two-surface split that already applies to `fields`/`types`/`relationTypes`.

### Change B — Bind `select`/`multiselect` fields to vocabularies

`Field` gains an optional binding, mutually exclusive with `selectOptions`:

```typescript
// When valueType is "select" or "multiselect", exactly one of:
selectOptions?: string[]      // inline anonymous closed vocabulary (sugar; retained)
vocabularyRef?: Reference     // bind to a named Vocabulary (id + version)
```

`selectOptions` is reframed as **sugar for an anonymous inline closed vocabulary**. A `vocabularyRef` on a `select`/`multiselect` Field MUST resolve to a `mode: closed` Vocabulary (V3); `select` is a constrained choice, so an open binding is rejected rather than silently accepting any string.

### Change C — Unify the key-role field to `key`

`RelationTypeDefinition.relationType` → `key`; `LifecycleState.name` → `key`; `Term.key` (from `tagKey`). Instance reference fields (`Relation.relationType`, `Record.lifecycleState`, tags, field values) are unchanged. See substrate §Key-role unification.

### Change D — Generalize resolution (subsumes RFC-005 E1)

> **V1 — Closed-vocabulary resolution.** Any value participating in a *closed* vocabulary must resolve to exactly one entry (matched by `key` or alias) in the effective entry set, with `status` in {`active`, `deprecated`, `tombstone`} for reads and `active` for new writes. Non-resolving values are invalid.
>
> Applies to: `Relation.relationType` (relation-type vocabulary — RFC-005 E1), `select`/`multiselect` values bound via `vocabularyRef` or `selectOptions`, and `Record.lifecycleState` (the Type's lifecycle).
>
> **V2 — Open-vocabulary resolution.** A value in an *open* vocabulary need not resolve; if it matches a `Term`, the term's enrichment applies. When a value matches **more than one** effective entry (a permitted, warned collision — V5), resolution is **deterministic**: a `key` match outranks an `alias` match; if still tied, the entry with the lexicographically smallest `id` wins. Enrichment is therefore identical across implementations (resolves finding 9 — no observable divergence).
>
> Applies to: `Note.tags` and `NoteSection.tags`. No `Field` binds an open vocabulary — `select`/`multiselect` must be closed (V3) — so open resolution is presently instance-tag-only; a future open-bindable field type would also fall here.

Resolution happens over the *effective package set* (RFC-005), using RFC-005's coalesce/conflict rules verbatim. The *effective entry set* within a resolved vocabulary is defined in V5.

### Change E — Fold `ext:lifecycle` in: installable, referenceable `Lifecycle`

`ext:lifecycle` is no longer an isolated inline-only feature. `Lifecycle` is an installable container (Change §`Lifecycle`). `Type` gains a referenced form, mutually exclusive with the inline form:

```typescript
// A Type that has a lifecycle declares exactly one of:
lifecycle?: { states: LifecycleState[]; transitions: LifecycleTransition[]; initialState: string }  // inline
lifecycleRef?: Reference   // reference a shared, installed Lifecycle
```

The distributable `Package` gains `lifecycles?: Lifecycle[]` (inline definitions); the repository `package/package.json` index gains a `lifecycles[]` array of relative paths (same two-surface split as Change A). The governance profile defines `governance/record_status` once as a `Lifecycle` and every governance Type references it.

### Change F — Migrate `TagDefinition` to `Term`; move it off the instance index

`tagKey`→`key`; `instanceId`→`id` (now a definition id); `flatten extra`→`properties`. A repository's tag pool is a local `Vocabulary` with `mode: "open"`. `Note.tags`/`NoteSection.tags` unchanged.

### Change G — Retrofit `RelationTypeDefinition` as a substrate specialization

No behavior change beyond the `relationType`→`key` rename (Change C) and adding `properties`. `RelationTypeDefinition` is declared a `VocabularyEntry` specialization whose payload is the RFC-005 edge semantics (`category`, `canonicalDirection`, `inverseType`, `irreflexive`, `allowedSourceTypes`, `allowedTargetTypes`, `requireSameSemanticObjectType`). Per the substrate tightening rule, it **requires both `label` and `description`** — unchanged from RFC-005. The substrate demoting these to optional applies only to `Term` and `LifecycleState`; it is **not** a regression on `RelationTypeDefinition` (resolves finding 9).

### Change H — One forward-compatibility policy

All substrate types: **reject unknown top-level fields; arbitrary metadata in `properties`.** `RelationTypeDefinition` keeps `deny_unknown_fields` and gains `properties`; `Term` drops the silent `extra` bag.

---

## Validation Semantics

In addition to V1/V2 (Change D):

- **V3 — Field binding exclusivity and closedness.** A `select`/`multiselect` Field must declare exactly one of `selectOptions` or `vocabularyRef`; zero or both is an error. A `vocabularyRef` bound to a `select`/`multiselect` Field MUST resolve to a `Vocabulary` with `mode: closed`. Binding `select`/`multiselect` to an open vocabulary is a validation error — `select` means *a value from a constrained set*, and an open vocabulary would silently accept any string (V2). Free-form enriched fields are tags, not `select`.
- **V4 — Vocabulary reference resolution.** A `vocabularyRef` must resolve to an installed `Vocabulary` in the effective package set (RFC-005 coalesce/conflict semantics).
- **V5 — Effective entry set, extension, and key uniqueness.** The *effective entry set* of a `Vocabulary` or `Lifecycle` (inline or referenced) is constructed in this order:
  1. **Membership by status (applied first).** Include entries whose effective `status` is `active`, `deprecated`, or `tombstone`. **Exclude `retired` entries entirely** — they are treated as absent (RFC-005). This exclusion happens *before* uniqueness (step 3) and *before* V1 resolution, which fixes the timing question (finding 5).
  2. **Extension.** Add, transitively, the entries of any container named by `extendsVocabularyId`/`extendsLifecycleId`. The extending container MUST declare the matching `extends*Version`, equal to the resolved upstream `version`. A missing or mismatched version is a **hard validation error**: the container fails to resolve and operations on it error with a diagnostic. Implementations MUST NOT silently fall back to a base-only set — doing so would drop extended states and silently invalidate Records bound to them (resolves findings 3 and 6; "not formed" means *hard failure*, never graceful degradation). An inline `Type.lifecycle` cannot extend; its effective set is exactly its own `states`/`transitions` (resolves finding 7 — inline lifecycles do not escape V5/V9).
  3. **Uniqueness.** Duplicate entry *ids* across the set are an error. In a **closed** vocabulary (incl. every `Lifecycle`), the union of all `key`s **and** `aliases` must be globally unique; any collision (key/key, key/alias, alias/alias) is an error (V1 needs exactly-one resolution; key→id must stay deterministic). In an **open** vocabulary, collisions are warnings, resolved by the V2 tie-break.

  Because `retired` entries are excluded *before* uniqueness, retiring an entry **frees its `key`/`aliases` for reuse** by a new entry (resolves finding 4); `tombstone` entries remain members and keep occupying their keys so historical reads still resolve. **Caution:** stored values still referencing a now-`retired` key are invalid under V1 (as if absent); if that key is later reused by a new entry, those stale values would silently resolve to the new entry. Implementations MUST surface stale references to a retiring key so the operator resolves them before the key is reused. A `Lifecycle` that extends another MAY declare transitions referencing any state `key` in the effective state set, including across the extension boundary.
- **V6 — Closed value status.** A value whose resolved entry is `deprecated` or `tombstone` follows RFC-005 E1 write semantics (resolves; new writes rejected). `retired` is **not** listed here: under V1 a `retired` entry does not resolve at all and the value is invalid exactly as if no entry existed. (Resolves finding 1: V1 and V6 no longer give opposite answers for `retired`.)
- **V7 — Lifecycle exclusivity.** A Type that has a lifecycle declares exactly one of `lifecycle` or `lifecycleRef`. Both is an error.
- **V8 — Lifecycle reference resolution.** A `lifecycleRef` must resolve to an installed `Lifecycle`.
- **V9 — Lifecycle integrity.** Over the *effective state set* (V5 — for an inline `Type.lifecycle` this is its own `states`/`transitions`; for a referenced `Lifecycle`, its own plus any extension):
  - **Exactly one** state MUST have `isInitial: true`, and `initialState` MUST reference that state's `key` (resolves finding 10 — multiple or zero initial states is an error, not a silent ambiguity).
  - The initial state MUST have effective `status: active` (absent = active). A lifecycle whose initial state is `deprecated`, `tombstone`, or `retired` is **invalid** — no new Record could ever be created in it, so the Type would be structurally valid but permanently inoperable (resolves finding 1).
  - Every `transition.from`/`transition.to` must reference a state `key` in the effective state set.
  - A state with `isFinal: true` MUST NOT appear as the `from` of any transition in the effective transition set — a final state is settled.
  - Transition `id`s must be unique within the effective transition set.
  - `Record.lifecycleState` resolves under V1.
- **V10 — Open→closed promotion.** Changing a `Vocabulary` from `mode: open` to `mode: closed` is a version-bumping change subject to a pre-flight over the derived in-use key set. The migration report MUST classify every in-use key as:
  - **will-be-invalid** — **used-but-undefined**, *or* used-but-resolving-only-to-a `retired` entry. `retired` does not resolve (V1), so reads do **not** survive; these behave exactly like undefined (corrects finding 2 — `retired` is not in the "reads survive" class).
  - **read-only-after-close** — resolves to a `deprecated` or `tombstone` entry: existing reads survive, but new writes are rejected post-promotion.
  - **used-and-active** — fine.

  A grace window MAY downgrade *will-be-invalid* keys to warnings. The window is declared in `Vocabulary.promotionWindow.until` (a date or target package version — the field added in Change A). Until that bound, violations are warnings; once it passes, V1 applies unconditionally. **Absence of `promotionWindow` means the promotion takes effect immediately** (no window). There is no unbounded window, so V1 enforcement is not permanently defeatable (resolves finding 3; the window is now a real, bounded field — resolves finding 1). Promotion does not modify instances.

---

## Terminology: the merge-like operations

This RFC uses four distinct operations that all loosely "combine" entries. They are **not** the same and must not be conflated by implementations (resolves finding 10):

| Operation | What it combines | Touches instances? | Defined in |
|---|---|---|---|
| **Coalesce** | Identical definitions (same `id`+`version`+content) arriving from multiple packages collapse to one | No | RFC-005 (reused by V4) |
| **Extend** | A downstream container adds *new* entries to an upstream container's effective set via `extendsVocabularyId`/`extendsLifecycleId` | No | V5 |
| **Alias-merge** | A surviving `Term` absorbs a synonym: absorbed key+aliases move to the survivor, absorbed entry removed (its `id` kept in `mergedFrom` and redirected); both instance strings then resolve to the survivor | No | Emergent Vocabularies, step 3 |
| **Normalize** | Instance tag strings rewritten to a canonical `key` | **Yes** (opt-in) | Emergent Vocabularies, step 4 |

Only **normalize** mutates instances. Coalesce and extend operate on the definition/effective-set layer; alias-merge changes resolution, not stored strings.

---

## Schema Changes Summary

| Schema / file | Change |
|---|---|
| `docs/schema/2.0/vocabulary.json` | **New.** `Vocabulary` shape, including `extendsVocabularyId`/`Version` and `promotionWindow.until` (V10 grace-window bound). |
| `docs/schema/2.0/term.json` | **New.** `Term` (substrate head + roles + properties). Replaces `tag-definition.json`. |
| `docs/schema/2.0/lifecycle.json` | **New / relocated.** `Lifecycle` container; `LifecycleState` gains `id`,`version`,`key`(was `name`),`status`,`properties`; `LifecycleTransition.from`/`to` reference state `key`. |
| `docs/schema/2.0/tag-definition.json` | **Retired**, superseded by `term.json`. |
| `docs/schema/2.0/field.json` | Add optional `vocabularyRef`; document `selectOptions` as inline-anonymous-vocabulary sugar; add exclusivity constraint. |
| `docs/schema/2.0/type.json` | Add optional `lifecycleRef`; mark `lifecycle`/`lifecycleRef` mutually exclusive. |
| `docs/schema/2.0/relation-type.json` | Rename `relationType`→`key`; add optional `properties`; annotate as `VocabularyEntry` specialization. |
| `docs/schema/2.0/package-manifest.json` / `package-bundle.json` | Add `vocabularies[]` and `lifecycles[]` path arrays; add `"vocabulary"` and `"lifecycle"` to `Reference.definitionType` and import-tracking vocabulary. **Not** `"term"`/`"lifecycle-state"`: entries are keyed sub-entries of a container (no `name`), so they are not independently `Reference`-able — they travel and are tracked with their container. |
| `srs/package/package.json` | Add `vocabularies[]`, `lifecycles[]`; relocate tag definitions into a local open `Vocabulary`. |
| `RepositoryManifest.instanceIndex` | Remove tag definitions (no longer instances). |

### Spec record amendments required

| Record | Required change |
|---|---|
| Foundation `Field` subsection | Add `vocabularyRef`; reframe `selectOptions` as inline closed-vocabulary sugar. |
| Foundation — new `Vocabulary`/`Term` subsections | Add the substrate, `Vocabulary`, `Term`, V1–V6, V10 (open→closed promotion), and the Emergent Vocabularies model (authority direction + derived-tag-set behavioral requirement). |
| Foundation `Type` subsection | Add `lifecycleRef` and exclusivity with inline `lifecycle`. |
| `Note` / tags subsection | Replace "a tag is not a defined term and carries no lineage" with the open-vocabulary framing. |
| `ext:lifecycle` subsection | Rewrite: `Lifecycle` is an installable, referenceable container; `LifecycleState` is a `VocabularyEntry` specialization with `key`; add V7–V9. The `relationType`→`key` note for relation types. |
| `RelationTypeDefinition` subsection (RFC-005) | Rename `relationType`→`key`; note as substrate specialization; add `properties`. |
| §9 core conformance | Generalize the RFC-005 relation-resolution requirement to V1 (closed-vocabulary resolution) with relation types as the named instance. |

---

## Alternatives Considered

**A1 — Full container unification (rejected).** Wrap relation types in `Vocabulary` containers too. Rejected: relation types are inherently a single repo-global set; a named container adds indirection and obscures binding scope. Lifecycles *do* get a container because there are genuinely many distinct, shareable state machines.

**A2 — Collapse `RelationTypeDefinition` into `Term` (rejected).** Relation types carry structural edge semantics a generic term must not carry. Shared substrate + distinct heads is the correct decomposition.

**A3 — Store term id as the field value instead of the key (deferred).** Would make values rename-safe and let terms be relation endpoints, but complicates human-readable instance files and is not needed until the ontology layer. `Term.id` keeps the path open.

**A4 — Rename instance reference fields too (`Relation.relationType`→`key`, etc.) (rejected for now).** Full uniformity, but usage sites lose readability ("key of what?"). Unification is scoped to definition entries. Revisit if tooling pressure warrants — see Open Question 1.

---

## Deferred Features (the ontology layer)

| Feature | Reason for deferral |
|---|---|
| **Arbitrary** term-to-term relations (broader/narrower, term `supersedes` term) | Lifecycle `transitions` ship the *scoped* edge case now; the general case needs terms as relation endpoints across vocabularies. `Term.id` is the prerequisite. |
| Id-as-value for fields (A3) | Not needed until rename-safety or term-as-endpoint is required. |
| Relation types relating to relation types (`refines` over relation types) | Same prerequisite as general term-to-term relations. |
| Cross-vocabulary mapping (`maps-to` between vocabularies) | Federation/ontology concern. |

> Note: lifecycle `transitions` are deliberately *not* modeled as general Relations in this RFC. They are an intra-`Lifecycle` payload. If the general edges-between-entries layer lands later, transitions may be reconciled with it, but they ship now as a scoped construct so lifecycle does not wait on the ontology RFC.

---

## Target Version

Targets **SRS 2.0**, a 2.0 amendment alongside RFC-005. Only two SRS repositories exist; both are updated at adoption. `TagDefinition` has no applied uses, so the instance→definition migration carries no data cost. Inline lifecycles migrate by extracting shared machines into `Lifecycle` definitions where reuse exists; one-off inline lifecycles may remain inline.

---

## Migration Path

Migration is a **single atomic transition per repository** (one commit / one operation). The numbered steps below are an authoring order, not sequential conformance points: intermediate states between steps (e.g. schema renamed but data not yet updated) are not required to validate. Conformance is evaluated only after all steps are applied (step 8). This avoids the schema-invalid intermediate states a stepwise migration would otherwise pass through (resolves finding 7).

1. Replace `tag-definition.json` with `term.json`; add `vocabulary.json` and `lifecycle.json`.
2. Per repository: create a local open `Vocabulary`, move tag definitions into it (`tagKey`→`key`, `instanceId`→`id`, `extra`→`properties`); remove them from `instanceIndex`.
3. Add `vocabularies[]` and `lifecycles[]` to `package.json` and the package/bundle schemas.
4. Add `vocabularyRef` to `Field`; existing `selectOptions` fields keep working (now formally inline closed vocabularies).
5. Add `lifecycleRef` to `Type`; extract shared lifecycle machines into `Lifecycle` definitions; rename inline `LifecycleState.name`→`key` and add ids.
6. Rename `RelationTypeDefinition.relationType`→`key`; add `properties`.
7. Generalize the §9 resolution requirement from relation types to V1.
8. Validate both repositories — relation-type and existing select-field behavior unchanged; lifecycle behavior unchanged except shared definitions now resolve.

---

## Consequences

**Benefits:**
- One concept (the substrate) with one `key` field, instead of four divergent implementations with four key spellings.
- `select` values gain identity, labels, sharing, and downstream extension — the governance `status` problem solved without field forks.
- Lifecycle state machines are defined once and reused across Types via `lifecycleRef` — directly serving the governance profile.
- Tags get a home (open `Vocabulary`) and align with relation types as package definitions under one forward-compat policy.
- RFC-005's resolution rule generalizes cleanly; relation types, field values, and lifecycle states are three named instances of V1.
- Lifecycle `transitions` establish a scoped precedent for edges-between-entries, keeping the ontology layer reachable.

**Tradeoffs:**
- `Field` and `Type` validation gain vocabulary/lifecycle resolution steps for referenced forms.
- Authors of controlled vocabularies and shared lifecycles maintain definitions rather than inline lists (inline paths remain for simple cases).
- The `relationType`→`key` rename touches the relation-type schema and any tooling that reads the definition field by name (instance `Relation.relationType` is unaffected).

---

## Deferral Cost Analysis

Two features are deferred (A3 id-as-value; general edges-between-entries). Because both could in principle force a future data migration, this section records why each deferral is safe.

### Deferring id-as-value (A3)

A future migration to id-as-value is **deterministic and lossless**: closed-vocabulary resolution is 1:1 (every stored `key` resolves to exactly one entry), so `key → id` is a scripted batch transform with no ambiguity. The migration is needed only when the ontology layer makes terms relation endpoints — not for rename-safety, which `aliases` already provide (add the old key as an alias; existing values keep resolving).

Three guarantees in this RFC keep that future migration cheap; they must be preserved:
- `Term.id` (and all entry ids) mandatory.
- Closed-vocabulary **key∪alias** uniqueness across the effective entry set (V5) — without it, both V1's "exactly one" resolution and the `key → id` mapping become ambiguous.
- `aliases` — gives rename-safety without id-as-value, removing the most common migration trigger. (Aliases preserve determinism precisely because V5 forbids any alias from colliding with another entry's key or alias in a closed vocabulary.)

Alias-merge does not break these guarantees: post-merge the absorbed key maps deterministically to the survivor's id, and the absorbed id stays resolvable via the `mergedFrom` redirect (alias-merge, Emergent Vocabularies step 3) — no id is orphaned, so the key→id transform remains total and lossless.

### Deferring transitions-as-general-edges (Q4)

The per-transition conversion is itself trivial and lossless (each `LifecycleTransition` already references stable state `key`s under V9, mapping 1:1 to an edge). The substantive cost is **not** in transitions: it is that `Relation` today addresses *instances* only (`sourceInstanceId`/`targetInstanceId`), whereas states are *definitions*. Edges between definitions require expanding the Relation model — a cost the ontology RFC bears regardless of transitions. Transitions add ~nothing to it.

Moreover, migration may be **unnecessary in perpetuity**: lifecycle transitions carry state-machine semantics (current-state guarding, V9 integrity) that a generic ontology relation does not. Keeping them a distinct construct is justified specificity, not debt. Stable state ids (✓) and V9 (✓) keep the option open at zero ongoing cost.

---

## Resolved Questions

1. **Instance reference field naming (A4) — resolved.** Key unification is scoped to *definition entries*. Instance reference fields (`Relation.relationType`, `Record.lifecycleState`, tags, field values) keep their domain-readable names; that is where readability is needed. The usage sites are not renamed.
2. **Open-vocabulary duplicate keys (V5) — resolved.** Distinct-id/same-key terms in an *open* vocabulary are a **warning**, not an error (alias-like overlap is acceptable). They remain an error in a *closed* vocabulary, where resolution must be unambiguous.
3. **Value stored as key vs id (A3) — resolved.** **Key-as-value for 2.0.** id-as-value is reserved for the ontology RFC; the migration path is deterministic and lossless (see Deferral Cost Analysis). Preserve mandatory ids, closed-key uniqueness, and aliases to keep it cheap.
4. **Transition/edge reconciliation — resolved.** Lifecycle `transitions` ship as intra-`Lifecycle` payload now. Later reconciliation onto a general edges layer is **optional and possibly permanent-never**; its enabling cost is owned by the ontology RFC, and transitions' state-machine semantics may justify keeping them distinct (see Deferral Cost Analysis).
