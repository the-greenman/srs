> **GitHub issue**: [the-greenman/srs#928](https://github.com/the-greenman/srs/issues/928). This is the RFC request; the RFC is drafted on it rather than on a second issue.

# RFC-054: A Composition carries an optional display title

**Status**: Draft (Revision 4)
**Affects**:
- **`Composition`** (`docs/schema/2.0/composition.json`): gains one optional top-level property, `title`. No other property changes meaning.
- **Adapters that describe a Composition** (any command, binding or MCP resource that lists or summarises Compositions): carry `title` beside `name` when the definition has one.
- **Clients that show a Composition to a person**: show `title`, else `name` unchanged, and stop deriving display text from `name`.
- **Builds on** RFC-015 and RFC-036 (presentation is view-owned; both Accepted), the Composition rename (`rfc-decision-92d2da05`), and the Identity preference as applied to outputs (`rfc-decision-b2ff7c91`). It amends no accepted RFC's rules and supersedes no recorded decision.
- **Door:** Door 2 (new normative meaning). No accepted RFC's own surface is amended, so no Door 3 revision rows ride with it.
- **Adjacent, not decided here:** display titles on other named definitions (Type, Field, View, Blueprint, Protocol, Theme, Lifecycle, Vocabulary). See Open Question 1.
**Author**: agent:rfc-drafter, drafted from the owner's rulings on the-greenman/srs#928 (2026-10-24: *"Allow a title … A composition needs to be a human controlled presentation. We are composing meaning. A title is key"*; 2026-10-30: the property is `title`, `name` stays the machine identifier, clients fall back to `name` and never humanise it, and it is not `displayLabel`).
**Date**: 2026-11-06

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-11-06 | Initial draft, from the owner's rulings of 2026-10-24 and 2026-10-30 on srs#928. |
| 2 | 2026-11-06 | Review round 1 (Integrity: 0 blocking, 5 should-fix, 4 nits; Completeness: 2 blocking, 6 should-fix, 3 nits). **Blocking:** [R4] now names the bound outputs (the full definition, the one composition summary every listing uses, and the MCP resource list) and puts rendered outputs out of scope; a new Change F and [R6] state that a title follows the definition's existing versioning rule (`rfc-decision-e5828aa8`), with the cost to authors stated and the exemption question routed to the owner (Open Question 3). **Should-fix:** [R3] bars rewording only, not truncation, escaping or a `namespace/name` prefix, and the level test says why it binds clients; [R4] omits an absent title (no `null`); [R5] no longer reads as forbidding a newer version's different title; two srs-web sites named; a render with no container title is unchanged; Door 2 named; fixtures and manifest tokens named; `minLength` dropped, whitespace preserved, and the stricter shape justified; version skew labelled authoring guidance; Open Question 3 (old) moved to *Defaults taken*; one sentence on RFC-050. |
| 3 | 2026-11-06 | Review round 2 (Integrity: 1 blocking, 2 should-fix, 3 nits; Completeness: 1 blocking, 4 should-fix, 2 nits). **Blocking (both):** Change F no longer stretches `rfc-decision-e5828aa8` to direct edits. It now separates the upgrade path (ruled; [R6] is now a testable rule there) from the direct-edit path (unruled; `rfc-decision-2a1e1590` added, the tension stated, Open Question 3 restated). **Should-fix:** [R6] gets an upgrade fixture; [R4] excludes count-only outputs; vendored snapshots corrected to four Compositions each (28) and moved to *What breaks*; version skew covers repositories; mechanism slug `composition-title` proposed under `concept-46a090b5`. **Nits:** [R2] scoped to the document body; whitespace defined; pin list; a sentence start. |
| 4 | 2026-11-06 | Review round 3 (Integrity: 0 blocking, 2 should-fix, 4 nits; Completeness: 0 blocking, 1 should-fix, 3 nits). Change B and the Identity bullet cite `rfc-decision-cce3c00e` for the stored property; `rfc-decision-b2ff7c91` is cited for [R4] only, and Open Question 3 no longer leans on it; [R1] fixes ECMA-262 whitespace semantics for native validators (U+FEFF case added); Change F states the cost after the first public release; [R6] scoped to `package upgrade`; fixture repository named (`conformance/composition-title/`); pin files named; revision rows ordered. |

---

## Charter alignment

**Cell(s):** cell:description, cell:identity, cell:conformance
**Decision mode:** complicated

The owner has already settled the direction (add a title) and the property name (`title`). What remains is how precisely to state it: what the title may and may not do, and who must carry and show it. Those are answered by the cells below without a judgement the compass leaves open, so the mode is complicated, not complex. The one scope question the compass does not settle (whether other definitions get the same property) is routed to the owner as Open Question 1, not decided here.

**Governing cell preference:**
- **Description: one name over many.** Aligned. Six stored constructs already carry a human-readable name, and every one of them spells it `title`: Container ("Human-readable label for this Container"), Note, the repository manifest, the package manifest ("Human-readable display name"), source-document metadata and, inside a Composition, each `DocumentSection`. The rendered output's `ProjectedSection` uses `title` too. The Composition takes the same key rather than a sixth spelling. It is deliberately not `displayLabel`, which is a different role: an override on a FieldAssignment (and on a View's rows) that only affects how one field is labelled where it is rendered.
- **Identity: identifier over label (outputs too).** Aligned. `name` stays the identifier and keeps every job it has today. The title is a label: nothing resolves, matches or validates by it. This is the base Identity preference (`rfc-decision-cce3c00e`) applied to a stored property. For the outputs that carry the title ([R4]), `rfc-decision-b2ff7c91` already says "human-readable text (message, notes, titles) is presentation: it may change freely and no consumer parses it"; that decision is scoped to machine-facing outputs ("stored data on the meaning plane is unchanged"), so it is cited here for [R4] only.
- **Conformance: one way over many.** Aligned. Today every client invents its own display text for a Composition (srs-web turns `renders-spec` into "Renders spec"), so two clients can show the same Composition under two names. This RFC replaces that with one rule: show the title, else the name unchanged.

**Axis preference:**
- **3–9 Description/Governance, Shared Coherence over Local Autonomy.** Default pole taken. The display name moves from each client's local derivation into the shared definition.
- **5–11 Succession/Conformance, Reliability over Renewal.** Default pole taken. The property is optional and additive; no standing contract changes, and every existing Composition stays valid as written.
- **1–7 Versioning/Reference, Semantic Integrity over Practical Expression.** Default pole taken. The title is expression only and cannot change what a Composition selects or how it renders records ([R2]).

**Decisions consulted:** rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-b2ff7c91, rfc-decision-628cf6c4, rfc-decision-6523cf5e, rfc-decision-92d2da05, rfc-decision-2e0cd70a, rfc-decision-0118e938, rfc-decision-c20fcff8, rfc-decision-5f8204bc, rfc-decision-e5828aa8, rfc-decision-2a1e1590, rfc-decision-7caca3a1, rfc-decision-e99a9437. Also the group's proposed decision `4b7f06ac` (srs-programme, created 2026-10-24 on an unmerged branch, not a ruling).

**Contradictions found:** None.
- `rfc-decision-628cf6c4` ("a rename is a migration") does not apply: nothing is renamed. `name` keeps its key and meaning.
- `rfc-decision-2e0cd70a` ("carry meaning you do not recognise") keeps definitions reject-unknown. That is not contradicted, but it has a consequence this RFC states in *What breaks*: a reader that predates this RFC rejects a package whose Composition carries `title`.
- `rfc-decision-e5828aa8` (a same-version definition change is overwritten by `package upgrade` before the first public release and refused from it) is honoured, not amended. A title-only difference is handled on that path like any other content difference (Change F, [R6]).
- `rfc-decision-2a1e1590` (increment over edit governs *semantic* content; machine-bound state mutates in place) is in tension with this RFC, not contradicted by it. A title is presentation ([R2]), so no ruling decides whether increment over edit reaches it on a direct edit. This RFC leaves direct edits as they are and routes the question to the owner as Open Question 3.
- `rfc-decision-6523cf5e` (presentation hints stay outside the semantic type model) is honoured: the title sits on the Composition, which is already on the EXPRESSION plane, and nothing is added to Type or Field.

**One-way-per-goal:** No existing mechanism gives a Composition a human-readable name. The goal "show a person what this thing is called" already has one mechanism elsewhere in the standard, an optional `title` string on the construct itself, and this RFC reuses it rather than standing up a second (a label map, a localisation table, or a `displayName`).

**Layer test:**
- **Which layer owns this?** EXPRESSION plane, composition layer: the Composition definition. The obligation to carry it in outputs ([R4]) sits on the OPERATION plane's adapters, and the obligation to show it ([R3]) on its clients.
- **Consume or clone downward?** Neither: it adds one presentational string to the composition layer's own construct and reads nothing from the layers below.
- **Does the layer below stand alone without this?** Yes. Records, Types, Fields, Relations and Containers are untouched, and a Composition without a title is valid and renders exactly as it does today.

**Level test (`rfc-decision-c20fcff8`):** a repository can declare a title (it is a property of a stored definition), and an implementation can check every rule:
- [R1] by schema validation, with cases for an empty string, a string of spaces, and a string of U+FEFF only (all invalid);
- [R2] by a fixture pair, one Composition with and one without a title, otherwise identical, whose renders over the same Container MUST be byte-identical;
- [R4] by inspecting the named payloads for the fixture with a title (present, unchanged) and without (absent);
- [R5] by round-tripping the titled fixture through a Package Bundle export and import and comparing the definition;
- [R6] by an upgrade fixture: a bundle whose Composition differs from the installed one only in `title`, at the same `version`, must get the same overwrite or conflict result as one differing only in `description`.

[R3] is the one rule on clients. It stays on the normative surface, rather than in a client ADR, because its whole point is that two conforming clients show the same Composition under the same words: a rule each client keeps privately cannot give that. It is checkable by a client's contract test against the same fixture pair (title shown; `name` shown character for character). The fixtures go in a new conformance fixture repository, `conformance/composition-title/`, beside the existing `conformance/arrangement/` and `conformance/discovery/`: one Composition pair (`with-title`, `without-title`) over one Container, plus the [R6] upgrade bundle.

**Integration manifest (for the fold, Stage 6):** `schema:composition.json`, plus one new mechanism record, proposed slug `mechanism:composition-title` ("Composition display title"), under the Composition concept (`concept-46a090b5`, `record:concepts/composition`), carrying [R1]–[R6].

---

## Abstract

A Composition has a machine name (`renders-spec`, `problem-dossiers`) and a description, but nothing a person can be shown as its name. Clients fill the gap by inventing display text from the machine name, and each invents it differently. This RFC adds one optional property, `title`, to the Composition: a human-readable name that the author controls. The machine `name` keeps every job it has. The title is presentation only: it never identifies, resolves or validates anything. Adapters carry it in the outputs that describe a Composition, and clients show it, falling back to `name` exactly as written.

---

## Motivation

### Problem 1: a Composition has no name for a person

`composition.json` gives a Composition `name`, described as "Machine-readable name within the namespace, kebab-case", and `description`, described as "What kind of document this produces; intended audience". It has no title or label. Its schema is closed (`additionalProperties: false`), so an author who tries to add one is refused: `composition create` with a `title` fails with `unknown field 'title'` (reported on srs#928, 2026-10-30).

Yet a Composition is exactly the thing people are asked to choose. srs-web's Documents list and its Lenses view list Compositions by name. The MCP resource list has a human-readable `title` slot for every resource, which it fills from a Container's `title` and leaves empty for every Composition, because there is nothing to fill it with. In the LiveWyer Insight demo (2026-10-30), a business reader saw the documents as `signal-map`, `problem-dossiers`, `affirmation-queue` and `evidence-by-event`, when what the author meant was "Signal map", "Problem dossiers" and so on. The owner's ruling names why this matters: *"A composition needs to be a human controlled presentation. We are composing meaning. A title is key."*

### Problem 2: every client invents the display name differently

Without a title, a client either shows the kebab-case identifier or derives something nicer from it. srs-web does the second, in two places: `compositionTitle = (v) => humanise(v.name)` in `src/lib/lens/lens-data.ts` and `label: humanise(c.name)` in `src/lib/lens/lens.ts` (srs-web `fdccb0b`; both marked as a known gap against this issue). The derived text is the client's guess, not the author's words. It cannot express anything the identifier does not already spell (the spec repository's `rfc-decision-log` comes out as "Rfc decision log", not "RFC decision log"), and another client (srs-vscode, an MCP agent, a third-party editor) will guess differently. One Composition then has as many display names as there are clients, which is the Conformance cell's "one way over many" failing in the place a person sees it.

---

## Proposed Changes

### Change A: Composition gains an optional `title`

A Composition MAY carry `title`: a string, written by the Composition's author, that names the Composition for a person. It is optional. When it is absent the Composition is exactly what it is today.

It is a single string, not a map of languages: localisation is not part of this RFC, and no other `title` in the standard is localised either. It must contain at least one non-whitespace character, because a blank title would defeat the fallback in Change C (a client would show nothing rather than the `name`). This is stricter than the other `title` properties, which are bare strings; the difference is deliberate, because only this one has a fallback that a blank value would silently disable. There is no length limit and no character set restriction beyond that, and whitespace is kept as written, never trimmed.

What becomes possible: an author names a Composition "Problem dossiers" or "RFC decision log", and every conforming client shows those words. What it costs: one optional property in the schema and in each implementation's Composition type.

### Change B: the title is presentation, never identity

`name` stays the Composition's machine identifier within its namespace, with every role it has today. The title takes none of them. Concretely, nothing in the standard or an implementation may:

- look a Composition up by its title, or treat a title as a reference to it;
- require titles to be unique (two Compositions may share a title, in one package or across packages);
- make a Composition valid or invalid by its title (beyond [R1]'s shape);
- let the title change what a Composition selects, how it orders or renders records, or what any other definition resolves to.

This is the Identity preference, identifier over label (`rfc-decision-cce3c00e`), applied to one stored property, and it matches what `rfc-decision-b2ff7c91` says of titles in outputs: changing a title changes nothing any other definition, record or consumer depends on, and no consumer parses it. (It is still part of the definition: Change F says how a change to it is handled.) What it forecloses: using the title as a second, friendlier handle for a Composition. A Composition is addressed by its `id`, and named in its namespace by `name`, as now.

**What does not change in rendering.** The heading of a rendered document comes from the rendered Container's title (`containerTitle` in `document-view-output.json`, "Human-readable container title resolved at render time"), and each section's heading from its `DocumentSection.title`. This RFC changes neither. A Composition's title names the *template* (the kind of document, such as "Problem dossiers"); a Container's title names *the document* rendered through it. A renderer MUST NOT substitute the Composition's title for the Container's ([R2]). Where a render has no Container title (`containerTitle` is optional in the rendered output), what heads it is unchanged by this RFC; the Composition's title is not used to fill the gap. Under RFC-050's proposed `children` scope (Draft), where each child Container's title heads its part, the same holds: those headings stay the Containers'.

### Change C: clients show the title, else the name unchanged

Any implementation that shows a Composition to a person, in a list, a picker, a menu, a tab, or a heading that names the Composition itself, shows its `title` when it has one. When it has none, it shows `name` exactly as written, and does not reword it: no case change, no replacing hyphens with spaces, no dictionary of known words. Display mechanics that keep the characters are not rewording and stay allowed: truncating with an ellipsis where space runs out, escaping for HTML or a terminal, and qualifying with the namespace (`namespace/name`). The owner's ruling: clients "show `title` and fall back to `name`. They never humanise `name` themselves."

The fallback is deliberately plain. A raw `name` in a list is a visible prompt to the author to add a title; a humanised one hides the gap and leaves each client's guess standing in for the author's words.

What becomes forbidden: srs-web's `humanise(v.name)` for Compositions, and its equivalents in any other client. What it costs: srs-web shows kebab-case names for every Composition until its author adds a title (see *What breaks*).

### Change D: adapters carry the title in the outputs that describe a Composition

The outputs bound are those whose subject is the Composition definition itself. There are three kinds:
- **The whole definition**, wherever an output returns it. In srs-rust today that is `composition get`, `composition create` and `composition update`. The title travels as part of the definition.
- **A Composition summary**, wherever an output lists Compositions. In srs-rust every listing uses one struct, `CompositionSummary`, which carries, among others, `id`, `namespace`, `name`, `version` and `description`. It is used by `composition list`, `composition list-for-container` and `composition shown-in`, by the WASM binding's composition listing, and by the MCP resource list. The summary gains `title` beside `name`.
- **A resource listing that has a human-readable title slot.** The MCP resource list is the case today: it fills that slot from the Composition's `title`. The resource's `name` stays `namespace/name`.

**Not bound:** rendered outputs (`document-view-output.json`, the rendered markdown behind an MCP `composition/{id}` read, render payloads). Their subject is a document, not the definition, and whether they should also name the Composition's title is Open Question 2. Repository overviews that only count Compositions are not bound either.

A client therefore never needs a second read of the definition to learn what to show.

When the definition has no title, the output omits `title`. It does not carry `null`, and it never fills the title in from `name`. Filling it in would hide from a client whether the author wrote a title, which Change C relies on.

### Change E: writers preserve the title

Every operation that writes, copies, exports, imports or bundles a Composition preserves its `title` byte for byte, as it preserves `description`. A Package Bundle (`.srspkg`) that carries a Composition carries its title. An operation whose input is a different definition (a `package upgrade` installing a newer version, or `composition update` with a new body) writes that definition's title, as it writes the rest of it. This states for `title` what conformant writers already do for every other property of a definition; it is listed so the implementation's round-trip tests cover it.

### Change F: a title-only difference is handled like any other content difference

A title is part of the Composition definition, like `description`. Two paths can change a stored definition, and the standard treats them differently today.

**The upgrade path, ruled by `rfc-decision-e5828aa8`.** When `package upgrade` brings a Composition with the same `id` and `version` as an installed one but different content, it overwrites a clean installed copy, and it reports a conflict (keeping the local edit) where the installed copy was edited locally. From the first full public release the overwrite becomes a refusal. This RFC adds one thing: a difference in `title` alone is a content difference for this purpose, handled exactly as any other ([R6]). An upgrade must not ignore a changed title as "only presentation", and must not refuse it more strictly than other changes.

**The direct-edit path, unruled.** `composition update` replaces a Composition in place. No rule requires a version increment on a direct edit of a definition, and no implementation checks one (srs-rust's `update_composition` does no version check). The Versioning cell's rule, increment over edit (`rfc-decision-2a1e1590`), governs *semantic* content. By [R2] a title is presentation, so whether that rule reaches it is not settled by any ruling. This RFC does not settle it either: a direct edit of a title behaves exactly as a direct edit of `description` does today. The question is Open Question 3.

What this costs authors before the first full public release: nothing beyond the edit. The first-party corpora can title their Compositions in place without new versions. From that release on, a title change that reaches other repositories by `package upgrade` needs a new `version`, like any other content change.

---

## Conformance Rules

> **[R1]** A Composition MAY carry `title`. When present, `title` MUST be a string containing at least one character that is not whitespace, where whitespace is as ECMA-262's `\s` defines it (the semantics of the schema's `pattern`). An implementation that validates natively MUST use those semantics, including U+FEFF as whitespace, not its own regular-expression library's. A Composition whose `title` is present and is not such a string MUST be rejected as invalid.
>
> **[R2]** A Composition's `title` is presentation. An implementation MUST NOT use it to identify, resolve, reference or deduplicate a Composition, MUST NOT require it to be unique, and MUST NOT let it affect validity (beyond [R1]), selection, ordering, or the rendered document body (its headings, sections and records). In particular a renderer MUST NOT use a Composition's `title` in place of the rendered Container's title or of a `DocumentSection.title`. `name` remains the Composition's machine identifier within its namespace.
>
> **[R3]** An implementation that presents a Composition to a person, by naming the Composition itself rather than a document rendered through it, MUST show the Composition's `title` when present. When `title` is absent it MUST show `name` with its characters unchanged, and MUST NOT reword it (no change of case, no replacement of separators, no mapping of words). Truncation, escaping for the display medium, and qualification as `namespace/name` are not rewording.
>
> **[R4]** Every machine-facing output of an implementation whose subject is a Composition definition (an output that returns the definition, a listing or summary that names each Composition individually, or a resource listing with a human-readable title slot) MUST carry that Composition's `title`, unchanged, as a typed field beside `name`, whenever the definition has one. Where the definition has no `title`, the output MUST omit `title` and MUST NOT supply one derived from `name` or any other property. Rendered outputs, whose subject is a document, and outputs that only count Compositions are not bound by this rule.
>
> **[R5]** An implementation that writes, copies, exports, imports or bundles a Composition MUST preserve its `title` exactly, including whitespace, and including in a Package Bundle. It MUST NOT alter or drop `title` except where the operation's input is a different definition, whose own `title` it then writes.
>
> **[R6]** Where `package upgrade` (or an operation a later ruling gives the same same-version comparison) compares an incoming Composition with an installed one of the same `id` and `version`, a difference in `title` alone MUST be treated as a content difference, with the same result as any other content difference.

---

## Schema changes

| Schema file | Change | Effect on existing data |
|---|---|---|
| `composition.json` | Add optional top-level property `title`: type `string`, `pattern: "\\S"` (at least one non-whitespace character; whitespace otherwise kept as written), description "Human-readable display name for this Composition, shown to people; presentation only. `name` stays the machine identifier (RFC-054)." Not added to `required`. `additionalProperties: false` stays. | None. Every existing Composition is valid unchanged, because none carries `title` (the closed schema refused it). |
| `package-bundle.json` | None. Its `compositions` array declares each entry only as an untyped object (`items: {type: object}`); implementations validate it as a Composition definition, so the new property needs no change here. | None. |
| `srsj-envelope.json` | None. It names a Composition only by `compositionId`. | None. |
| `document-view-output.json` | None. A rendered output's heading stays the Container's title ([R2]); whether a rendered output should also name its Composition's title is Open Question 2. | None. |
| All other schemas | None. | None. |

No `dataModelRevision` bump: no stored form changes and nothing migrates. This follows the precedent of RFC-042 Revision 5, which added the optional `containerScope` to `DocumentSection` in this same schema without a revision bump.

Schema changes must be synced, after acceptance and the fold, to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/sync-schemas-from-spec.sh`, then `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (its own sync script)

---

## What breaks

**Nothing stored breaks, and no migration is needed.** There are 100 first-party Composition definitions across the six corpora that hold them (srs 15, including the conformance fixture and gallery example; srs-programme 23; srs-context 6; clerk 14; semanticops.com 9; muDemocracy.org 33; counted 2026-11-06 under each repository's `compositions/` directories, excluding vendored copies of older package versions). None carries `title`, because the schema refused it, so all 100 stay valid and render identically.

**Version skew, for authors (authoring guidance, not a conformance rule).** Compositions are definitions, and definitions stay reject-unknown (`rfc-decision-2e0cd70a`). So a reader built before this RFC is implemented refuses any repository or package whose Composition carries `title`, not only a bundle being installed. Consequently no first-party corpus should add a title until the srs-rust release that implements this RFC is the pinned build for that corpus (srs `release-drift.yml`, srs-web `ensure-bindings.mjs`, muDemocracy.org `ensure-srs-cli.mjs`, srs-context `hooks/srs-pinned`, srs-programme `validate.yml`, clerk `scripts/lib/pinned-srs.mjs`, semanticops.com `scripts/source/ensure-srs-cli.mjs`). That is the usual landing order: spec fold, srs-rust support, release, pin advance, then data.

**Clients.**
- **srs-web** must stop humanising Composition names. Two sites do it today (`compositionTitle` in `src/lib/lens/lens-data.ts` and the composition `label` in `src/lib/lens/lens.ts`). Until authors add titles, srs-web shows kebab-case names, which is a visible regression for a business reader such as the Insight demo's, and the reason the first-party corpora should add titles in the same pin advance that enables them.
- **srs-vscode** shows `name` today and continues to where there is no title. The **MCP** resource list starts filling its title slot.
- **Vendored package snapshots** are not edited. In srs, `packages/com.mudemocracy.governance/` holds seven versions (1.0.0 to 1.2.4), each with four Compositions (28 in all). A title for any of them arrives in that package's next version.
- **srs-rust** gains the property on its Composition type (which refuses unknown fields today) and on `CompositionSummary`. The payload golden schemas regenerate. This is implementation work, after acceptance.

---

## Rationale

**Why on the Composition, not in each client.** The display name is the author's statement about what the Composition is for. A statement belongs with the thing it describes, once, where every reader finds it (Description: one name over many; axis 3–9). A client-side derivation is a second, unstated source, and one per client.

**Why `title`, and not `displayLabel` or `label`.** Every construct in the standard that has a human-readable name calls it `title`: Container, Note, the two manifests and `DocumentSection`, which is already inside the Composition schema. `displayLabel` exists for a different role (an override that relabels one field where it is rendered, on a FieldAssignment and a View row) and `label` is used for vocabulary terms, lifecycle states and relation types. Reusing `title` keeps one spelling for one job; introducing `displayLabel` here would give one key two meanings.

**Why the fallback is `name` unchanged.** Any transformation is a rule a client invents, and different clients invent different rules. The plain fallback is the one every client can apply identically, and it makes a missing title visible to the author instead of hiding it.

**Why the adapters must carry it ([R4]).** Under `rfc-decision-b2ff7c91`, clients must not reconstruct what the core already knows. A listing payload that dropped the title would push every client to read each definition again just to show its name.

**Why not a revision bump.** The revision stamps a change of stored form that readers must migrate. An optional property that no existing data carries migrates nothing; the version skew it creates is the ordinary skew of any added definition property, handled by pin choreography, as with `containerScope`.

---

## Alternatives Considered

### Alt A: clients humanise `name` (the issue's other option)

Rule that `name` is the display source and clients transform it (for example, kebab-case to sentence case). Rejected by the owner on 2026-10-30, and by the cells: the transform cannot express words the identifier does not spell, it is a rule every client would have to reimplement identically, and it ties the identifier's spelling to what people see, so improving the display text would mean renaming the identifier, which `rfc-decision-628cf6c4` makes a migration.

### Alt B: reuse `description`

Show the first sentence of `description`. Rejected: `description` is "what kind of document this produces; intended audience", a sentence for a reader, not a name for a list. Splitting one property into two meanings is the drift the Description cell exists to prevent.

### Alt C: `displayLabel` on the Composition

Use the key that FieldAssignment uses. Rejected by the owner (2026-10-30): `displayLabel` is a rendering override for one field in one position, a different role from naming a definition. One key with two roles is "one name over many" failing the other way.

### Alt D: a title on every named definition at once

Add `title` to Type, Field, View, Blueprint, Protocol, Theme, Lifecycle and Vocabulary together. Not chosen for this RFC: the issue, the evidence and the owner's ruling are about Compositions, which are the definitions people are asked to open. srs-web does humanise Type names too (`lens.ts`, `document-model.ts`), so the question is real; it is Open Question 1, for the owner.

### Alt E: do nothing

Compositions keep only `name`; clients keep showing or transforming it. Rejected: the owner ruled that a title is key (2026-10-24), and the demo evidence shows the cost to a reader.

---

## Open Questions

1. **Scope: Composition only, or every named definition?** Type, Field, View, Blueprint, Protocol, Theme, Lifecycle and Vocabulary also have only a machine `name`, and srs-web humanises Type names in at least two places. Options: (a) Composition only, now, as drafted (recommended: it is what the evidence and the ruling cover, and a later RFC can extend the same property and rules by name once a second definition shows the need); (b) extend `title` with [R1]–[R5] to all named definitions in this RFC (one rule for all, but a larger change without evidence for most of them, and Types touch the MEANING plane, where `rfc-decision-6523cf5e` keeps presentation out); (c) do nothing beyond Compositions, ever (clients keep humanising Type names).
2. **Should a rendered output name its Composition's title?** `document-view-output.json` carries `compositionId` and `containerTitle`, not the Composition's title. Options: (a) no change (recommended: a client that shows a rendered document already holds the Composition from the listing it chose it in, and [R2] keeps the document's heading the Container's); (b) add an optional `compositionTitle` to the rendered output, so a projection names its template without a second read. Option (b) is additive and can follow later if a client needs it.
3. **Does increment over edit reach a title on a direct edit?** Change F rules the upgrade path ([R6]) and leaves direct edits as they are, because no ruling says whether a presentation property of a definition is versioned content (`rfc-decision-2a1e1590` covers semantic content; `rfc-decision-b2ff7c91`'s "may change freely" was written about text in outputs, not stored definitions, so it does not decide this). Options:
   - (a) **Leave it unruled here, as drafted** (recommended). The question is not specific to titles: it applies equally to `description` and to section titles, and deciding it for one property would set the rule for the others without their evidence. It is the smallest reversible step. It costs nothing now; the cost is that the question stays open until the standard rules on direct definition edits generally.
   - (b) **A title is versioned content.** Once direct edits are checked, a retitle needs a new `version`. One rule for all of a definition's content, but no check exists to enforce it, so this commits a later implementation to build one, and every retitle after the first public release becomes a version.
   - (c) **A title is exempt, as presentation.** Retitling stays free forever, on both paths. The upgrade path then needs an exception to `rfc-decision-e5828aa8`'s sunset for one property (a supersession), and it opens a second rule ("presentation properties are edited, not versioned") that `description` and section titles would soon claim, against "one way over many".

**Defaults taken (object by name if you disagree):**
- no `dataModelRevision` bump (precedent: `containerScope`, RFC-042 Revision 5);
- `title` is a single unlocalised string, with no length limit;
- an absent title is omitted from outputs, never `null`.
