> **GitHub issue**: [the-greenman/srs#1029](https://github.com/the-greenman/srs/issues/1029). This is the RFC request; the RFC is drafted on it rather than on a second issue.

# RFC-055: A LINEAGE reference resolves to the highest installed version

**Status**: Accepted (Revision 4)
**Affects**:
- **The LINEAGE reference strength** (`rfc-decision-c8704763`): gains a selection rule. The rule covers every LINEAGE site, listed in full in Change A. The PINNED, KEYED and LOCATOR strengths are untouched.
- **Resolution invariants** (mechanism *Resolution invariants*, V1 to V10): gains one rule beside V4 (*Vocabulary reference resolution*) and V8 (*Lifecycle reference resolution*). Those two say only that the reference resolves, not to which version.
- **Builds on:**
  - RFC-003 (Accepted, Revision 10): the reference-site table, and "a LINEAGE reference reaches every version of its `id` that the effective package set holds".
  - RFC-014 (Accepted): the effective package set as the union of installed package versions, and [R6] for Types and Fields.
  - RFC-029 (Accepted): the core package is part of the effective package set.
  - RFC-008 (Accepted): version-independent dispatch.
  - It amends no accepted RFC's own rules.
- **Door:** Door 2 (new normative meaning). No ruling says which version a LINEAGE reference uses: `rfc-decision-c8704763` says only "whatever version the context installs".
- **No schema change, no `dataModelRevision` bump.**
**Author**: agent (Claude Code), from the-greenman/srs#1029, found while fixing the-greenman/srs-rust#1648
**Date**: 2026-11-13

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | 2026-11-13 | Initial draft. |
| 2 | 2026-11-13 | Review round 1 (Integrity: 0 blocking, 9 should-fix, 3 nit; Completeness: 3 blocking, 7 should-fix, 2 nit). **Blocking:** the Field consequence is stated in full: a Field version may today change its `fieldType`, so a record's Field contract follows the highest installed Field version even though its `typeVersion` is pinned. The rule that would forbid that is routed to the owner as Open Question 1. The LINEAGE site list is inlined in Change A, and the identity-conflict rule is cited with its source. *What breaks* gives the method and per-corpus counts. **Should-fix:** RFC-014 [R6] cited only for Types and Fields; Compositions and Themes removed as LINEAGE targets; the rule's reach inside superseded and PINNED-reached definitions stated; `extends*` and the `typeDispatch` key stated as out of scope; the core package, identical duplicates, bundle installs, and what does not count (package SemVer, pre-release, lifecycle) stated; [R3] requires an error; the fixture gains Field and Lifecycle cases, the reversed-order variant, exact expected results and a layout; two alternatives added; srs-rust evidence cited; the LINEAGE quote made exact. |
| 3 | 2026-11-13 | Review round 2 (Integrity: 0 blocking, 3 should-fix, 4 nit; Completeness: 0 blocking, 4 should-fix, 3 nit). **Should-fix:** the Discovery and Protocol uses say what changes and what does not (a discovery `typeId` matches every version; a Protocol creates records at the highest Type version); a lower version that no PINNED reference names is stated to be unreached and removable; RFC-014 [R6] is narrowed to a Record's Type or Field, with RFC-003 [C1] cited for the rest; Invariant 9 is cited for Fields only; "same content" is defined as equal JSON values; the unverified srs-rust diagnostic claim is replaced by fixture cases 5 and 6; the multi-version Type count is corrected to five distinct Types and the corpus paths are given; Open Question 1 states what the owner commits to if (b) never lands. **Nits:** the core-package case respects RFC-029 [R2]; [R2]'s "version information outside the set" is enumerated; no diagnostic code is mandated; case 3 notes that Field contract changes are legal today and must be re-based if Open Question 1(b) is adopted. |
| 4 | 2026-11-13 | **Accepted** by the owner on the-greenman/srs#1029. Folded: Invariant I-155 under the Canonical reference concept; cross-pointers in V4 (Resolution invariants), V8 (Validation invariants V7–V9) and the Package export reference sites mechanism; the RFC record and an `rfc-decision` record linked to `rfc-decision-c8704763` by `refines`. Owed by follow-up issues: the conformance fixture (Change B, srs#1031), srs-rust conformance for Field, Vocabulary and Lifecycle lookups (srs-rust#1660), and Open Question 1 (whether a Field version may change its contract), filed as its own Door 2 issue (srs#1030). |

---

## Charter alignment

**Cell(s):** cell:reference, cell:versioning, cell:conformance
**Decision mode:** complicated

There are real alternatives (below), but the rulings already on record leave one of them standing:
- `rfc-decision-c8704763` makes LINEAGE mean "this thing, whatever version the context installs".
- RFC-003 [C1] carries every installed version of a LINEAGE target, and RFC-014 [R6] forbids removing a package version a Record's Type or Field still needs. So several installed versions side by side is a legal state.
- Conformance's "one way over many" rules out letting each site or each implementation choose.

Of the remaining candidates, only "highest version" is deterministic and serves what a package upgrade is for. The Field question raised in review (may a new Field version change its contract?) does not reopen this choice. Every candidate rule exposes records to a Field version their Type was not written against, because `fieldId` is LINEAGE by `c8704763`. That question is about what a Field version may contain, a separate rule, routed as Open Question 1. So no judgement inside this RFC's scope is left open, and the mode is complicated, not complex.

**Governing cell preference:**
- **Reference: declared strength over convenient reach.** Aligned. The strength a site declares is LINEAGE, and this RFC completes what that strength means when several versions are present. It does not let a site reach for a version its strength does not name. A site that needs one version is a PINNED site, and changing a site's strength is out of scope.
- **Versioning: increment over edit.** Aligned. A package changes a definition by installing a new version beside the old one, never by editing it in place. This rule makes the increment take effect for every LINEAGE reference, so an author never has to edit an existing version to get a change seen.
- **Conformance: one way over many.** Aligned. Today the outcome depends on the implementation, and inside srs-rust on the kind of definition (*Motivation*, Problem 2). This RFC replaces that with one rule for every site and every implementation.

**Axis preference:**
- **1–7 Versioning/Reference, Semantic Integrity over Practical Expression.** Default pole taken. One stored repository with one effective package set has one meaning in every conforming implementation. `c8704763` already records LINEAGE's version independence as a concession to Practical Expression ("version-independent dispatch remains a deliberate Practical Expression concession bounded by axis 1-7's clause"). This RFC makes that concession deterministic and adds nothing to it.
- **5–11 Succession/Conformance, Reliability over Renewal.** Default pole taken. Boundary clause: *"Standing contracts hold; renewal only as explicit supersession at a declared boundary."* A LINEAGE reference's standing contract is "whatever version the context installs". Installing a new version (a package install or upgrade) is the explicit act at a declared boundary, and the referrer follows it. A referrer that needs to hold a version uses a PINNED site, and every PINNED site's contract is untouched.
- **2–8 Identity/Assertion, Evolution over Continuity.** Default pole taken (the formation phase). The newest installed definition governs, which lets a package evolve without rewriting the records and definitions that use it. The continuity cost is named, not hidden: a record does not keep the Field contract it was written under (Change A, *What it costs later*). At the precommitted Continuity flip (first full public release), Open Question 1 becomes pressing.

**Decisions consulted:** rfc-decision-c8704763, rfc-decision-cce3c00e, rfc-decision-9ee14517, rfc-decision-7caca3a1, rfc-decision-e99a9437, rfc-decision-a8dcbfe5, rfc-decision-7255aecc, rfc-decision-a270e98a, rfc-decision-4f1e12e5, rfc-decision-4431046e, rfc-decision-c20fcff8, rfc-decision-2a1e1590.

**Contradictions found:** None.
- `rfc-decision-c8704763` is refined, not superseded. Its LINEAGE definition stays as written: *"LINEAGE - this thing, whatever version the context installs. Form: bare UUID (format: uuid); the effective package set resolves."* This RFC adds what "resolves" picks when the set holds several versions. At acceptance, the decision record for this RFC is linked to `c8704763` by `refines` (`rfc-decision-4431046e`: a decision refining something it does not supersede is linked by `refines`).
- PINNED keeps its meaning ("this thing, this version; semantics frozen"). A PINNED reference still reaches exactly the version it names, and that definition's own content stays frozen. What a frozen definition's own LINEAGE references reach was never frozen, because they are LINEAGE. This RFC makes that reach deterministic and states it (Change A).
- `rfc-decision-a8dcbfe5` and RFC-003 [C1] (export reaches every installed version of a LINEAGE target) are unchanged. Export says what a bundle carries; this RFC says which carried version a reference uses.
- RFC-014 [R6] (a Tier 2 Record's `typeId` and `fieldId` resolve if any installed package version holds them) is unchanged. It is an existence rule for Types and Fields; [R3] states the same existence rule for every LINEAGE site and leaves [R6] as written.

**One-way-per-goal:** No existing mechanism selects among installed versions of one definition for a LINEAGE reference. Two neighbouring mechanisms each serve a different goal and are not duplicated:
- RFC-044's requirement check picks "the highest SemVer precedence" candidate among packages, to explain why a package requirement is unsatisfied.
- PINNED references name their version outright.

This RFC uses the same "highest wins" shape as RFC-044, applied to a definition's own integer `version`.

**Layer test:**
- **Which layer owns this?** MEANING plane, definitions layer: how one definition's reference to another resolves inside the effective package set. Rendering (EXPRESSION) is one consumer of the rule, not its owner. That is why the rule also covers validation sites such as `fieldId`, `vocabularyRef` and `lifecycleRef`.
- **Consume or clone downward?** Consume. It uses the substrate's existing notions (a definition's `id` and integer `version`, and the effective package set of RFC-014 and RFC-029) and adds no construct.
- **Does the layer below stand alone without this?** Yes. Substrate schemas and the definitions themselves are unchanged and still valid. The rule only decides which already-valid definition a reference uses.

**Level test (`rfc-decision-c20fcff8`):** passes. A repository declares the situation (two versions of one id installed) through ordinary package machinery, and an implementation's choice is checkable from outside: the rendered output or the validation result differs between the two versions (Change B).

---

## Abstract

A LINEAGE reference names a definition by its `id` alone and means "whatever version the context installs". The spec never says which version is used when the context installs more than one, and a package upgrade routinely leaves the old version installed beside the new one. This RFC rules that the reference resolves to the installed version with the highest `version`, at every LINEAGE site and for every use: validation, rendering, type dispatch, discovery and Protocols. It changes no schema and no stored data. Across the four local corpora checked, exactly one reference changes behaviour, and it changes to what its authors intended.

---

## Motivation

### Problem 1: the same repository renders differently depending on the implementation

A package upgrade installs a definition's new version beside the old one. Keeping the old one is normal: RFC-014 [R6] forbids removing a prior package version a record's Type or Field still needs, and RFC-003 [C1] carries every installed version of a LINEAGE target. So a repository holding two versions of one View, Vocabulary or Field is a valid state.

The reference-strength ruling (`rfc-decision-c8704763`) defines LINEAGE as *"this thing, whatever version the context installs. Form: bare UUID (format: uuid); the effective package set resolves."* It does not say what "resolves" picks when the set holds two versions. Neither does V4 (*"A `vocabularyRef` must resolve to an installed `Vocabulary` in the effective package set"*) nor V8 (*"A `lifecycleRef` must resolve to an installed `Lifecycle` in the effective package set"*). Two conforming implementations can therefore render or validate the same repository differently, and neither is wrong.

This is not hypothetical:
- The essay package (`com.mudemocracy.essay`, muDemocracy.org) 1.13.0 installs `image-paragraph-view` at version 1 and version 2. Version 2 shows an image's alt text, labelled "Image".
- The essay Composition's `typeDispatch` maps `com.mudemocracy.essay/image_paragraph` to that View by bare id.
- srs-rust used version 1, so an upgraded essay exported its images without alt text. That was srs-rust#1648.
- srs-rust#1651 and #1658 fixed it to use the highest version, but no spec sentence stands behind the fix.

### Problem 2: inside one implementation, the answer differs by kind of definition

In srs-rust at master `12d018c`, `crates/srs-repository/src/package.rs` resolves a bare id in two different ways:
- `resolve_view` takes the highest installed version.
- `resolve_field`, `resolve_vocabulary` and `resolve_lifecycle` take the first matching definition in load order.

The second behaviour depends on load order, which is not data. A repository's validity could change when files are renamed or packages are listed in a different order. A rule the spec does not state cannot be tested, and an untested rule drifts per kind of definition, as it has here.

---

## Proposed Changes

### Change A: the selection rule

**The rule.** The effective package set is RFC-014's union of installed package versions, together with the RFC-029 core package. When that set holds more than one version of the definition a LINEAGE reference names, the reference resolves to the one whose `version` is highest.

Every definition kind's `version` is a required integer of at least 1 (every definition schema in `docs/schema/2.0/` says so), so "highest" is always defined. Ties do not arise:
- The same definition carried by two packages is one definition. "The same" means the two definition files parse to equal JSON values: the same members with equal values, in any member order and with any whitespace.
- Two definitions with the same `id` and `version` whose JSON values differ are an identity conflict. The charter makes identity conflicts fatal: in `rfc-decision-cce3c00e`'s words for the Earth column, "identity conflicts are fatal, never resolved by precedence". So this rule never settles one, and [R3] requires it to be reported as an error.

**Where it applies: every LINEAGE site.** This is the full LINEAGE row of RFC-003 Change C's reference-site table. Grouped by what the reference names:
- **A Field:**
  - `fieldId` in a Type's field assignments, overrides, cross-field rules and `fieldOrder`;
  - a Type's `identityFieldId`;
  - Field ids in a View's rows;
  - a Composition section's `titleFieldId` and `ordering.fieldId`;
  - Field ids in a composite-renderer binding or directive, including the Field ids that are its `roles` values;
  - a Theme's `cssClassFields`;
  - the `fieldId` of a Protocol's `FieldRef`.
- **A View:** a Composition section's `renderViewId`, and the View ids that are the values of a section's `typeDispatch`.
- **A Type:**
  - a `typeId` in a Composition's discovery query, a Theme's record wrapper override or a Protocol's `FieldRef`;
  - a Protocol's target and output Types.
- **A Vocabulary:** a Field's `vocabularyRef`.
- **A Lifecycle:** a Type's `lifecycleRef`.

**Where it does not apply:**
- **PINNED sites** reach exactly the version they name, so this rule cannot apply to them. They include a Record's `typeId` with `typeVersion`, a `ref` Field's target Type, `extendsTypeId`/`extendsVocabularyId`/`extendsLifecycleId` with their versions, a Composition's `rootTypeRefs`, and a Blueprint's types. Likewise, V5's "the resolved upstream version" for an `extends*` reference is the version that `extends*Version` names.
- **KEYED sites** match a key, not a version. They include a `typeDispatch` *key* (`namespace/name`), whose version independence (RFC-008) is unchanged.
- **LOCATOR sites** fetch bytes and name no version.

**Every use.** The rule applies for every purpose the reference is used for:
- **Validation:**
  - which Field version's `fieldType` and validation rules a record's value must meet;
  - which Vocabulary version's terms a `select` value must match;
  - which Lifecycle version's states a `lifecycleState` must be.
- **Rendering:** which View renders a section or a dispatched record, and which Field version supplies a row or a title.
- **Discovery:** a discovery query's `typeId` predicate is an exact match on `Record.typeId`, so it matches records bound to every version of that Type, and [R1] does not narrow it. [R1] decides only which Type definition an implementation reads when it needs the definition the predicate names (for example, to read its Fields).
- **Protocols:** a Protocol's target and output Types, and the `typeId` and `fieldId` of a `FieldRef`, resolve to the highest installed version. So a record that a Protocol stage creates for its target or output Type binds to the highest installed version of that Type, and a stage contributes to the highest installed version of the Field.

There is no per-site exception and no separate rendering rule.

**Inside superseded and PINNED-reached definitions too.** The rule applies to LINEAGE references made by any installed definition, including one that a higher version has superseded and that stays installed only because a PINNED reference names it.

Example: a Record bound to `Type@1` (PINNED) gets Type 1's own content exactly. Type 1's `fieldId` assignments are LINEAGE, so each resolves to the highest installed version of that Field, not to the Field version that was current when Type 1 was published.

**What does not count.** None of these change which version wins; only `version` counts:
- the order in which packages, package versions or files are listed or loaded;
- which package the referring definition belongs to;
- the version that was installed when the referring definition was written;
- a package's SemVer version or pre-release status;
- any lifecycle state a definition record might carry.

**Core definitions and installs.**
- A core definition (RFC-029) counts like any other installed definition. A repository cannot install its own version of a `com.semanticops.core` Type or Field at all: RFC-029 [R2] rejects the load. For any other definition of the core package, the effective package set decides, like everywhere else. The outcome depends only on the effective package set, which RFC-029 already makes depend on the core package an implementation embeds.
- After a bundle is installed, the consumer's effective package set decides. A bundle that carries version 1 of a View, installed where version 2 is present, does not make version 1 win.

**Consequences.**
- **What becomes possible:** a package author changes how existing records validate or render by publishing a new version of a View, Field, Vocabulary or Lifecycle. No Type is re-versioned, no Composition is edited and no record is migrated. Every repository that installs the new version sees the change, and every conforming implementation sees the same change.
- **What becomes forbidden:**
  - A superseded version cannot stay in force for LINEAGE references once a higher version is installed. No LINEAGE reference reaches it. It still matters only where a PINNED reference names it, which is possible for Types and Views but never for a Field, Vocabulary or Lifecycle, because every reference to those is LINEAGE. A lower version that nothing PINNED names is unreached. It is still a valid installed definition, and this RFC neither requires nor forbids removing it; existing rules such as RFC-014 [R6] decide that.
  - An implementation may not offer a "use the version this was built against" mode for LINEAGE sites.
- **What it costs later.** A new version is live everywhere at once. Today the spec does not forbid a new Field version from changing that Field's `fieldType` or validation rules: Invariant 2 forbids a *Type* overriding a Field's semantics, and Invariant 9 makes a new `id` a new definition, but nothing limits what a Field's next *version* may contain. So:
  - **Field.** If Field X version 2 changes X's `fieldType` from `string` to `number`, then every record of every Type that assigns X is validated against `number` from the moment version 2 is installed, including records bound to a Type version published before X version 2 existed. Pinning a record's `typeVersion` therefore does not pin its Fields' contracts. This is not new exposure: `fieldId` is LINEAGE by `c8704763`, so records already follow some installed Field version. This RFC decides which one. Whether a Field version should be allowed to change its contract at all is Open Question 1.
  - **Vocabulary.** A Vocabulary version that drops a term makes existing values that use the term invalid on the next validation (V1). One that adds a term makes new values valid. Essay 1.12.0's `context` source kind is this case.
  - **Lifecycle.** A Lifecycle version that drops a state makes records in that state invalid.
  - **Keeping old behaviour.** An author who needs an old behaviour to persist must publish the changed definition under a new `id`, or keep the newer version out of the repository. For a Field this is Invariant 9 ("A new `id` means a new definition, not a new version of an existing one"). For the other kinds it is the same identity principle in `rfc-decision-cce3c00e`.

### Change B: the conformance fixture

A fixture, `conformance/lineage-resolution/`, is added at acceptance. It follows the layout of `conformance/discovery/`:
- a `README.md`;
- a `fixture-repo/` SRS repository;
- a `fixture-repo-reversed/` variant: the same repository, with every package manifest listing the higher version first instead of second;
- a `fixture-repo-conflict/` variant for case 6 only;
- a `scenarios.json` naming each case and its expected result.

In `fixture-repo/`, every package manifest lists version 1 before version 2. The cases:

1. **View, by `renderViewId` and by `typeDispatch`.** View V is installed at version 1 (one row whose label is `v1`) and version 2 (label `v2`). One Composition section names V by `renderViewId`, another dispatches a Type to V through `typeDispatch`. Expected: both sections' rendered output contains `v2` and not `v1`.
2. **Vocabulary, by `vocabularyRef`.** Closed Vocabulary C is installed at version 1 (term `a`) and version 2 (terms `a`, `b`). A `select` Field references C, and a record holds `b`. Expected: the record validates with no error.
3. **Field, by a Type's `fieldId`.** Field F is installed at version 1 (`fieldType` string) and version 2 (`fieldType` number). Type T@1 assigns F, and a record bound to T@1 holds the number `3`. Expected: no error. A second record holding the string `"x"` has a value-shape error.
4. **Lifecycle, by `lifecycleRef`.** Lifecycle L is installed at version 1 (states `draft`, `done`) and version 2 (adds `review`). Type T uses L by `lifecycleRef`, and a record is in state `review`. Expected: the record validates with no error.
5. **Unresolved.** A Field's `vocabularyRef` names an id that no installed Vocabulary has. Expected: an unresolved-reference error, as V4 already requires.
6. **Identity conflict.** A second package carries View V version 2 with a different row label. Expected: an identity-conflict error, in `fixture-repo-conflict/` (a third variant, kept apart so cases 1 to 5 stay clean).

Case 3 changes a Field's `fieldType` between versions, which nothing forbids today. If Open Question 1(b) is adopted, case 3 is re-based on a change that rule allows. The expectations say "an error" without naming a diagnostic code: this RFC does not mandate codes.

Every expectation for cases 1 to 5 is the same for `fixture-repo-reversed/`, which is what tests [R2]. An implementation that resolves by load order fails at least one case in one of the two repositories.

---

## Conformance Rules

> **[R1]** When the effective package set holds more than one version of the definition named by a LINEAGE reference, an implementation MUST resolve the reference to the version with the highest `version`. This applies at every LINEAGE site listed in Change A, for every use of the reference (including validation, rendering, type dispatch, discovery and Protocol execution), and for LINEAGE references made by every installed definition, including one reached only through a PINNED reference.
>
> **[R2]** An implementation MUST NOT let any of the following change which version [R1] selects: the order in which packages, package versions or definition files are listed or loaded; the package the referring definition belongs to; a package's SemVer version or pre-release status; import provenance (`.srs-import` records); file timestamps; or any lifecycle state a definition record carries.
>
> **[R3]** [R1] does not change whether a LINEAGE reference resolves: it resolves when any installed version holds its `id`, and is unresolved when none does. One definition carried identically by several packages is one definition. Two different definitions with the same `id` and `version` are an identity conflict: an implementation MUST report it as an error and MUST NOT settle it by [R1] or by any order.

Each rule is testable:
- [R1]: cases 1 to 4 of Change B.
- [R2]: the same cases in `fixture-repo-reversed/`.
- [R3]: cases 5 and 6 of Change B.

---

## Schema changes

**None.** No property is added, removed or reshaped. `c8704763` already declares every LINEAGE site's form as a bare UUID, and that form stays.

---

## What breaks

**Method.** Four corpora were checked, each at its package directories: `srs/srs/package` (the spec), the served srs-context and srs-programme repositories (`~/.local/share/srs/served/<name>`), and `muSrs/packages` in muDemocracy.org. For each, every definition file was grouped by `id`, and the ids with more than one installed `version` were listed. Each such id was then searched for in every other package file (Types, Views, Compositions, Blueprints, Protocols, Themes), and each hit was classified by its site's strength. A LINEAGE reference can only behave differently under [R1] when its target has more than one installed version, so this finds every affected reference.

**Results.**

| Corpus | Definitions with more than one installed version | LINEAGE references to them |
|---|---|---|
| `srs/srs` (the spec) | 0 | 0 |
| srs-context | 0 | 0 |
| srs-programme | 2 Types (`com.semanticops.comments/comment`, `com.semanticops.programme/programme`) | 0 |
| muDemocracy.org packages | 4 Types (`com.mudemocracy.argument/source`, `com.mudemocracy.essay/document-state`, `com.mudemocracy.website/story-mark`, `com.semanticops.comments/comment`) and 1 View (`com.mudemocracy.essay/image-paragraph-view`) | 1 |

- **The one reference that changes behaviour does so toward its intent.** The essay Composition's `typeDispatch` value for `com.mudemocracy.essay/image_paragraph` names `image-paragraph-view` (versions 1 and 2). Under [R1] it renders with version 2, which shows alt text, and that is what essay 1.13.0 shipped version 2 for. srs-rust already does this (#1651, #1658).
- **References to the multi-version Types are not LINEAGE.** The five distinct multi-version Types (`com.semanticops.comments/comment` is installed in two corpora) are referenced only through PINNED sites (a Blueprint's `typeId` with its version, and records' `typeId` with `typeVersion`) and through import provenance (`.srs-import` records, which are not references).
- **No Field, Vocabulary or Lifecycle is installed at more than one version** in any of the four corpora, so no record is re-validated differently today.
- **No stored file becomes invalid in the corpora checked**, and nothing is migrated. A repository outside them is affected only if it installs two versions of a LINEAGE target and currently relies on the lower one. Its remedies are the ones in Change A: publish the changed definition under a new `id`, or remove the newer version from the repository.
- **Implementations:**
  - srs-rust conforms for Views, which is the only multi-version LINEAGE target in practice.
  - Its Field, Vocabulary and Lifecycle lookups fail [R1] and [R2] as soon as a corpus installs two versions of one of them. That conformance work is filed against srs-rust at acceptance and changes no output for any corpus checked today.
  - srs-web and srs-vscode resolve through srs-rust's bindings and CLI and hold no resolution logic of their own.

---

## Rationale

A LINEAGE reference was made version-independent so that a definition can evolve without re-versioning everything that refers to it (`c8704763`, and RFC-008 for dispatch). That purpose is served only if the evolved version is the one used. Every other candidate either defeats the purpose (the lowest version, or the version the referrer was written against) or is not a rule (load order).

"Highest" needs no new data. `version` is already a required integer on every definition kind, and identity conflicts already rule out ties. It matches what srs-rust settled on independently for Views and for name-only Type lookups (srs-rust#1512: "a caller that names no version means the newest"), and it has the same shape as RFC-044's candidate choice.

One rule for every site follows from Conformance's "one way over many". A rendering-only rule would leave validation, the larger consequence, to each implementation.

---

## Alternatives Considered

### Alt A: forbid more than one installed version of a LINEAGE target

Make it an error for the effective package set to hold two versions of any definition a LINEAGE reference names. This would remove the ambiguity by removing the state. Rejected because the state is legal and expected elsewhere: RFC-014 [R6] forbids removing a package version that a Record's Type or Field still needs (a Type at a PINNED version keeps its package version installed), and RFC-003 [C1] carries every installed version of a LINEAGE target. It would also block the upgrade (essay 1.13.0) that exposed the gap.

### Alt B: resolve within the referrer's own package first

Prefer the version installed by the same package as the referring definition. This does not settle the case that occurs in practice: the essay package itself lists both versions of `image-paragraph-view`, so the referrer's package still holds two candidates. It would also make one definition's meaning depend on which package carried it, which a LINEAGE reference does not record.

### Alt C: a rendering-only rule

Rule only for `renderViewId` and `typeDispatch`, as srs#1029 first scoped it, and leave validation sites open. Rejected under "one way over many": validation sites (`fieldId`, `vocabularyRef`, `lifecycleRef`) face the same question with higher stakes, and srs-rust already answers them differently from rendering.

### Alt D: let the repository pin a LINEAGE target's version

Add a manifest-level or package-level "use version N of definition X" override. This would be a second mechanism for a goal PINNED references already serve, and a second resolution path of the kind `c8704763` declined when it dropped aliases. If a real need appears, it should come as a strength change at the site, through its own decision.

### Alt E: take the version from the highest-SemVer package that carries the definition

Rank candidates by the SemVer version of the package that carries each one, as RFC-044 does for packages. Rejected because a definition's identity is its own `id` and `version`, not its package's (`rfc-decision-cce3c00e`; for Fields, Invariant 9). One package often carries several versions of a definition (the essay case), so the package version cannot tell them apart. And two packages that carry the same definition version would then rank it differently.

### Alt F: require a warning whenever an install changes how a LINEAGE reference resolves

This complements [R1] rather than replacing it. It is not made normative here, because the diagnostic would need its own contract (layer rule 6: behaviour needs a contract). Tooling may report such changes at install or upgrade time without any rule from this RFC.

---

## Open Questions

1. **May a new version of a Field change its contract?** Today nothing forbids Field X version 2 from changing X's `fieldType` or validation rules. Under [R1], that change applies at once to every record of every Type that assigns X (Change A, *What it costs later*). This RFC does not need the answer: the exposure comes from `fieldId` being LINEAGE (`c8704763`), not from [R1]. The options:
   - **(a) Leave it** as it is today: authors carry the risk, and [R1] makes it predictable.
   - **(b) Forbid it:** a Field version MUST NOT change its `fieldType`, and a changed contract needs a new `id`. This makes Invariant 9's "a new id means a new definition" do the work. It would be a new invariant through its own RFC, with a check at package install.
   - **(c) Allow only widening:** a new Field version may accept more values, never fewer.

   **What accepting this RFC commits to if (b) never lands:** Field contracts may change under records whose Type version is pinned, and [R1] makes that change deterministic and the same in every implementation.

   **Recommendation:** accept this RFC as written, and file (b) as its own Door 2 issue to be decided before the Continuity flip (axis 2–8). (b) is where the Identity cell ("identifier over label") and Invariant 9 already point. Trigger for urgency: the first package that publishes a second version of a Field, or the first public release, whichever comes first.

**Not an open question:** whether any LINEAGE site should become PINNED. That would be a strength change under `c8704763` and its own decision; no evidence for one exists today.

### Fold at acceptance

- A new invariant in `srs/records/invariants/`, stating [R1] to [R3].
- A cross-pointer sentence added to V4 and V8 in *Resolution invariants*: "Where several versions are installed, the reference resolves to the highest (RFC-055)."
- The same sentence added to the LINEAGE row of the *Package export reference sites* mechanism.
- `conformance/lineage-resolution/` (Change B).
- An `rfc-decision` record for the ruling, linked to `rfc-decision-c8704763` by `refines`.
- An srs-rust conformance issue for Field, Vocabulary and Lifecycle lookups by bare id.
