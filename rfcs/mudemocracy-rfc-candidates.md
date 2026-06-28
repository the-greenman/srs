# muDemocracy — Candidate RFC Register

**Status: register (not numbered RFCs).** Existing RFCs run rfc-001 … rfc-010; the entries below are *candidate* spec/package changes surfaced by the muDemocracy tool design, not yet promoted to numbered RFCs. Promote a candidate by running `/rfc` and assigning the next number.

**Source.** Distilled from `muDemocracy.org/content/purpose/processed/`:
- `functional-requirements.md` (FR-1 … FR-15, scope boundary, open questions)
- `srs-domain-draft.md` (§4–§10: type/field/relation/protocol vocabulary, open questions Q1–Q7, §8.5–§8.10 technical constructs)

**Layering.** This register holds only changes owned by the **semantic layer** — the SRS spec, its extensions, the governance profile, package data, and companion standards. Engine work is in `srs-rust/plans/mudemocracy-engine-backlog.md`; editor work is in `srs-web/plans/mudemocracy-web-backlog.md`. Each candidate lists the sibling backlog items it blocks.

**Entry shape:** Title · Layer · Motivation · Blocks · Status · Related.

**Status vocabulary** (taken from the source docs): `open` (undecided), `leaning` (a recommendation exists), `adopted-direction` (decided, awaiting spec work), `deferred` (off critical path).

**Clusters** (candidates that must be designed together):
- **Revision / addressing** — C1 ↔ C3 ↔ C8
- **Governance / charity compliance** — C5 ↔ C10 ↔ C14
- **AI context** — C6 ↔ C7 ↔ C8
- **Fractal / federation** — C9 ↔ C11 ↔ C12

---

## C1 — Draft revision history (backend-neutral address shape)

- **Layer:** extension (new `ext:revision`, address-shape only)
- **Motivation:** SRS has no representation of working iterations of a single `draft` record. `record update` overwrites prior state; the AI-extraction → group-edit → ratified chain is lost. Accountability before ratification needs "show me how the draft evolved."
- **Blocks:** web W4/W5 (review-queue and edit loops), engine E6 indirectly; `.srsj` v1 workflow specifically (no git layer).
- **Status:** `open`. Four approaches enumerated in FR §"Draft revision history" (a app-layer snapshots, b explicit draft chain via `revised-from`, c spec-level `revisions[]`, d accept loss). Recommendation forming: the extension should define the **address shape** for a historical field state (`<repo-uuid>/<rev-ref>/<record-uuid>#<field_name>`), not a storage mechanism — so it resolves across backends (git SHA, db row version, `.srsj` snapshot ID).
- **Related:** C3 (`.srs`-as-git gives the history for free), C8 (`ext:addressability` — a TSS attention event must resolve a field *at a revision*). srs-domain §9 "Draft revision history"; FR §"Draft revision history", §"The revision extension as an addressing convention".

## C2 — Record retyping note (`refines` vs `supersedes`)

- **Layer:** governance-profile / `ext:recommended-relations` note (spec note, not a new extension)
- **Motivation:** A group reclassifying a record to a more precise type is **semantic transformation, not governance replacement**. The new record is a more precise description of the same committed act → `refines`. Without a note, implementers conflate this with `supersedes` (which means the decision was wrong/outdated).
- **Blocks:** engine E6 (retyping op), web W12 (retyping wizard must render the distinction legibly).
- **Status:** `adopted-direction`. From the SCDS graduation model: pure formalisation may preserve `instanceId`; semantic transformation creates a new `instanceId` linked via `refines`. Needs a note in the recommended-relations extension distinguishing the two uses.
- **Related:** C1, FR-9.5, srs-domain §9 "Record retyping", Q "Record retyping".

## C3 — `.srs` archive as internal git repo

- **Layer:** core-spec / `ext:repository`
- **Motivation:** A self-contained, portable `.srs` archive carrying an internal git repository gives full revision history with no external dependency. Merge becomes `git merge` on unpack rather than a bespoke algorithm. Upgrade path from historyless `.srsj`: unpack → `git init` → repack.
- **Blocks:** engine E8 (merge/split), C1 (revision backend), C4 (source-doc embedding).
- **Status:** `adopted-direction` (leading direction from architectural discussion; needs a spec issue before implementation).
- **Related:** C1, C4, C8, engine E8. FR §"The `.srs` archive as a git repo"; srs-domain Q2.

## C4 — Source-document embedding for `.srsj` / `.srs` v2

- **Layer:** core-spec
- **Motivation:** Transcripts are source material for governance records and must be accessible and retrievable, not discarded after extraction. Current `.srsj` has no source-document embedding (that belongs to the `.srs` ZIP archive / `ext:repository`). v1 groups share `.srsj` files — transcripts currently must stay external or use an app-layer convention.
- **Blocks:** engine E10 (source storage + `evidences`), web W3/W16 (transcript & materials attach).
- **Status:** `open`. A practical answer is needed before the transcript workflow can be designed; C3 is the leading resolution.
- **Related:** C3, C6, FR-3.2, FR Open Questions, srs-domain Q2.

## C5 — Article amendment via recorded decision + differential ratification

- **Layer:** governance-profile / package
- **Motivation:** A change to a ratified article must be authorised by a recorded `governance/decision`, so the meeting + decision log form an audit trail (essential for charities). Different articles carry different ratification bars (amending charitable purpose ≠ amending an operational rule). This logic must live in the package (lifecycle + protocol), not the editor, to stay portable.
- **Blocks:** web W8 (article amendment, post-v1), engine E4/E5 (lifecycle + supersession already cover immutability).
- **Status:** `adopted-direction`. Embed in package: immutability via existing ratified-record lifecycle; amendment via the **Article Amendment Protocol** (see C17) + `authorised-by` relation; differential ratification via a `ratification_requirement` field on `governance/article` *or* article subtypes.
- **Related:** C10 (structured founding-articles), C14 (CC48 vote/minute), C17 (protocol + relation + field). FR-6.6/6.7, srs-domain Q6, §8.

## C6 — External-source / RAG layer

- **Layer:** companion-standard (architecture decision pending)
- **Motivation:** Decisions draw on external materials (legal duties, policies, proposals). SRS stores and cites source docs (`source-documents/` + `evidences`) but does **not** ingest, chunk, embed, or retrieve — there is no RAG layer.
- **Blocks:** web W16, engine E10, FR-13 entirely.
- **Status:** `open`. Three options: (a) companion standard alongside SRS/TSS (cleanest — mirrors how TSS sits beside SRS); (b) SRS extension `ext:knowledge` / `ext:rag`; (c) app-layer index over `source-documents/`. The older **semops2** knowledge-repository is the reference design (configurable ingestion pipelines, stable URL-hash `source_id`, vector/graph/hybrid backends, source-attachment-with-inheritance).
- **Related:** C7, C8 (source chunks get Addresses), C4. FR-13, srs-domain §8.7.

## C7 — Threaded, versioned, rated annotations + specialist-agent registry

- **Layer:** governance-profile / package
- **Motivation:** Specialist-agent review (human + AI) is stronger in the decision-logger than in SRS today. SRS `governance/agent_note` is flat; it lacks threading, version-precise addressing, ratings, and a configurable agent registry.
- **Blocks:** web W17, engine indirectly (annotation records are SRS data; agent execution is engine/app).
- **Status:** `leaning`. Strengthen `governance/agent_note` into a threaded (`threadId`), version-addressed (field@version), rated (`approved`/`needs_work`/`rejected`) annotation with `source` and `excludeFromRegeneration`. Add a specialist-agent registry (each agent: domain + prompt persona + declared tool/MCP access). **Boundary:** annotation records = SRS data; agent roster + domain framing = package/profile data; agent execution = engine/app. Agents coach, never mutate.
- **Related:** C8 (version-addressing), C6 (policy agent uses RAG). FR-14, srs-domain §8.8.

## C8 — `ext:addressability` — Address + AttentionState

- **Layer:** extension
- **Motivation:** Attention is the mechanism that binds TSS (what happened) to SRS (what it meant). A stable, resolvable `Address` across document / process / conversation spaces, plus a live `AttentionState` cursor, makes a decision's provenance auditable and lets AI draft a field's answer from *only* the relevant conversation.
- **Blocks:** web W15 (facilitator view, per-question drafting), engine E11 (address resolution), C1 (resolve a field at a revision), C7 (version-precise annotation targets).
- **Status:** `adopted-direction` (extension named; declared in the muDemocracy extension set). The decision-logger's context tags `{scope}:{id}[:{field}]` validate the model under implementation pressure.
- **Related:** C1, C6, C7, C15 (TSS event types point at Addresses). FR-12.9, srs-domain §8.6.

## C9 — RFC-N: parent/child container nesting (scope-without-containment)

- **Layer:** core-spec
- **Motivation:** Irreducibly needed only for nesting *boundaries* whose relationship is "in the scope of", not "part of" (e.g. *Q3 decisions* under *2026 decisions*) — where there is no `contains` tree to derive the hierarchy from.
- **Blocks:** nothing on muDemocracy's critical path.
- **Status:** `deferred`. **Off critical path.** RFC-009 (done) + `contains` + overlapping container membership already cover typed units, content hierarchy, discovery (`containers_for_instance`), and per-unit views. Pull RFC-N in only if a real scope-hierarchy appears that resists `contains` — and even then, separate-SRS + federation (C12) may serve better.
- **Related:** C11, C12, RFC-009 (done), engine E9. srs-domain Q7.

## C10 — RFC-P: blueprint composition / structured founding-articles

- **Layer:** core-spec
- **Motivation:** Structured founding-articles (article sections with their own root records) and per-article ratification requirements need blueprint composition support.
- **Blocks:** C5 (differential ratification aligns with article subtypes), web W8/W11 (blueprint editor + founding-articles).
- **Status:** `open`.
- **Related:** C5, C14, engine E7. srs-domain §4.1, Q6.

## C11 — RFC-M: subtree query scope

- **Layer:** core-spec
- **Motivation:** Needed only when the subtree is a *container hierarchy* rather than a `contains` record-tree.
- **Blocks:** nothing on critical path (depends on C9 existing first).
- **Status:** `deferred` (tied to C9).
- **Related:** C9, C12. srs-domain Q7.

## C12 — `ext:federation`: registry + cross-repository relations + two registry tiers

- **Layer:** extension (**core to the model**, not optional)
- **Motivation:** The system's guarantees (addressability, unified attention) are boundary-scoped — they hold *within* a declared boundary, so how boundaries are crossed is part of the architecture. Federation = cross-unit relations (a decision in one SRS referencing an article in another without merging) + a registry for discovery. Two tiers: an **internal** registry (full addressability within one organisation) and a **public, DNS-like** registry (only `consent_level: public` elements cross the organisation boundary).
- **Blocks:** engine E8 (merge/split move the boundary), web W13.
- **Status:** `adopted-direction`. Boundary-and-federation model is designed in from the start; registry + cross-boundary-relation *features* land per milestone.
- **Related:** C9, C11, engine E8. FR-10, srs-domain §8.9.

## C13 — Meeting Log type (B14)

- **Layer:** governance-profile / package
- **Motivation:** A durable session/meeting type. Currently the session leans toward lightweight application state, not a governance record; the SRS Meeting Log type is explicitly deferred pending spec RFC (B14). CC48 expects a meeting container (quorum, attendance, agenda summary).
- **Blocks:** web W3 (session entry point — v1 treats session as app state, so this is not a v1 blocker), C14 (quorum lives here).
- **Status:** `open` (deferred pending spec RFC, per B14).
- **Related:** C14, FR-2, srs-domain Q "Session", §8.10.

## C14 — CC48 governance elements

- **Layer:** governance-profile / package
- **Motivation:** UK Charity Commission CC48 is a real-world requirements spec for governance records. The four-question record already produces most of it; the gaps are: **conflict-of-interest** (declared conflicts + how managed), **quorum** (attendance check), **structured vote record** (who voted and how), **minute-approval** (approving the record at the next meeting is itself a ratifiable act). Also surfaced: decision↔purpose as the legal test, and anticipated stakeholder impact.
- **Blocks:** web W6/W8/W9, C5 (vote record ↔ differential ratification), C13 (quorum ↔ meeting container).
- **Status:** `open` (candidates for the governance package).
- **Related:** C5, C13, C7 (anticipated-impact is a job for the policy/decision-quality agent). srs-domain §8.10.

## C15 — muDemocracy custom TSS event types

- **Layer:** companion-standard — **belongs in the `tss/` repo, not `srs/`**
- **Motivation:** The muDemocracy tool is a TSS producer (temporal stream of what happened) alongside its SRS output (records that resulted). Custom event types extend TSS §15 inheritance: `org.mu-democracy/consent_check` (base `suggestion`), `org.mu-democracy/decision_flagged` (base `observation`), `org.mu-democracy/proposal_tabled` (base `stage`), `org.mu-democracy/deliberation_advance` (base `stage`).
- **Blocks:** the paired SRS + TSS community-dataset goal (Q5), web W4 (decision-flagged ↔ review queue).
- **Status:** `open` — first-draft vocabulary; needs review & ratification in the TSS spec as the tool matures. **Action: file against `tss/`, not this register.**
- **Related:** C8 (events point at Addresses). srs-domain §8.5.

## C16 — Decision taxonomy fields (`decision_scope` / `decision_depth` / `cognitive_type`)

- **Layer:** package fields
- **Motivation:** Three candidate dimensions: scope (strategic/tactical/operational), depth (record_only/mvd/deliberating), cognitive type (decision/preference/unknowable). CC48's "detail scales with risk" endorses the scope/depth axes.
- **Blocks:** nothing yet.
- **Status:** **`open` — learning, NOT yet a candidate for formalisation.** The cognitive-type taxonomy is in transcripts but not yet in any guide; adding it to the data model now would be premature. Guide development precedes formalisation. Field shapes drafted in srs-domain §6 are *exploration candidates*, not specifications.
- **Related:** C14 (regulatory endorsement of the axes). srs-domain Q4, §6, §10 Gap 3.

## C17 — muDemocracy package (`com.mudemocracy`) — package data

- **Layer:** governance-profile / **package data** (authored as its own SRS repo; not engine code, not editor code)
- **Motivation:** The concrete vocabulary the tool ships. Depends on / incorporates the existing `governance-profile` types. No new types are needed in the *core governance layer* — the governance profile is the right foundation.
- **Contents (from srs-domain §9 summary):**
  - **New types:** `mudemocracy/detection_event` (transient AI/human "a decision may be here" — app-layer, converts to Exercise/Decision via `derived-from`), `mudemocracy/guide` (versioned practice guide), `mudemocracy/decision_record` (community-layer canonical/anonymised — the SRS face of a contributed deliberation), `mudemocracy/constitutional_stance` (Six Lines position — aspirational, needs full Six Lines spec).
  - **New fields (6):** `decision_scope`, `decision_depth`, `cognitive_type` (all C16 — exploration only), `source_guide`, `detection_confidence`, `consent_level`.
  - **New relations (4):** `contributes-to`, `guided-by`, `instantiates-line`, `authorised-by` (article-amendment audit link, source=article → target=decision).
  - **New protocols (3):** Recognition (scan → filter → classify → record), Constitutional Founding (Six Lines), Article Amendment (propose → deliberate → check_ratification → ratify → supersede — the protocol form of C5).
  - **Article additions (→ C5):** immutability, amendment-via-decision, differential ratification.
- **Blocks:** engine E1 (bootstrap pre-loads this package), engine E7 (package mgmt), most web rows (the editor mirrors these definitions).
- **Status:** `leaning` — vocabulary proposed, "candidates for alignment, not specifications for implementation" (the project is in a learning/sharing phase). `constitutional_stance` blocked on Six Lines full spec (srs-domain §10).
- **Related:** C5, C13, C14, C16, C15 (TSS events pair with these records). srs-domain §4, §6, §7, §8, §9.

---

### Coverage note

Every open question and named RFC placeholder from `srs-domain-draft.md` is represented above:
Q1 (ratification method) → C17 fields + C14; Q2 (transcript chunks) → C4/C3/C8; Q3 (detection event) → C17; Q4 (taxonomy) → C16; Q5 (community dataset) → C15/C17; Q6 (article amendment) → C5/C10; Q7 (fractal) → C9/C11/C12; RFC-N → C9; RFC-P → C10; RFC-M → C11; B14 → C13; CC48 → C14; revision history → C1; record retyping → C2; addressability → C8; federation → C12; RAG → C6; annotations → C7; `.srs`-as-git → C3.
