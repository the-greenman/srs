# Alignment Opportunities Register

> The actionable companion to [semantic-document-landscape.md](semantic-document-landscape.md)
> and [spec-driven-development-landscape.md](spec-driven-development-landscape.md): specific
> external elements SRS could adopt, align with, or interoperate with — prioritized and
> weighted. Maintained under Epic 13 "SRS for Specs"
> ([muDemocracy.org#124](https://github.com/the-greenman/muDemocracy.org/issues/124)).
>
> **This register is a required consult for interop-touching design work**: `/ship` (Stage 2
> ADR check) and `/rfc` should cite the relevant entry — including its weight and
> disposition — whenever a plan or RFC decides an export/import format, an agent-facing
> surface, a binding, or a portability question. If a decision contradicts an entry here,
> the ADR should say why.
>
> Compiled 2026-07-22. Items carry point-in-time evidence; verify an entry's external facts
> before building on it (formats in this space move fast — two of the biggest entries are
> one month old).

## Weighting model

Each item is scored 1–5 on three axes and given a composite weight:

- **Reach** — how much adoption/ecosystem leverage alignment buys (users, agents, tools that
  become reachable)
- **Fit** — how cleanly it lands in the existing architecture (capability layering: one core
  service, CLI + WASM adapters, clients presentation-only; spec independence preserved)
- **Cost** — effort *and* risk of carrying the alignment (inverted: 5 = cheap/safe)

**Weight = Reach × Fit × Cost** (max 125). Dispositions:

- **NOW** — roadmap-worthy today; an issue exists or should be filed under Epic 13
- **NEXT** — real, but needs RFC-level design first; queue behind NOW items
- **WATCH** — monitor a named external signal; act when it fires
- **COMPONENT** — not an integration to schedule; a design source to consult when the
  relevant internal work happens anyway

---

## Tier 1 — NOW (roadmap)

### 1. MCP server over srs-repository services — weight 100 (R5 × F5 × C4)

**What:** An MCP server exposing SRS repositories to any MCP client: resources for
records/containers/rendered views, tools for the validated write workflows (record create,
relation create, validate). Same capability-layering shape as the CLI: one adapter over the
existing `srs-repository` services — no new semantics.

**Why now:** MCP is the agent ecosystem's settled access layer (spec revisions stable
through 2025-11-25, RC 2026-07-28), and the object-model neighbors that added MCP servers
(Anytype, Tana, Basic Memory) did so as their headline 2025–26 move. SRS's differentiator —
a *validating* write contract — is exactly what the MCP knowledge-tool space lacks: current
MCP memory tools are either untyped markdown or proprietary services (landscape II.12,
III.6). Every MCP client (Claude Code, Cursor, Copilot, Goose, …) becomes an SRS client for
free.

**Compatibility flag (toolchain):** yes — this is the single highest-leverage compatibility
move available. It also composes with everything else in this register: an OKF export or
llms-index projection is just another resource the server exposes.

**Risk:** low. The CLI contract already proves the adapter pattern; MCP is
foundation-stewarded and multi-vendor.

**Action:** file an srs-rust issue (engineering epic under muDemocracy.org#124); spec
question (does the MCP surface need a conformance note in ext:addressability or a new
tooling-only RFC?) resolved at /ship's spec gate.

### 2. OKF export projection, then import — weight 80 (R4 × F5 × C4)

**What:** `srs render`-family export of a container as a Google OKF v0.1 knowledge bundle
(markdown files + YAML frontmatter, `type` label from the record's Type name, `index.md`
from navigation); later, an importer that ingests an OKF bundle as Tier-0/Tier-1 records.

**Why now:** OKF (June 2026) is the same mission with every design decision inverted —
path identity, one uncontrolled type label, prose-implied links, no validation (landscape
III.8). Google's distribution will seed the category. Export makes every SRS repository
OKF-consumable on day one; import makes SRS the *upgrade path* — "OKF is Tier 0 with a
folder convention; SRS is what your bundle needs the day two agents disagree about what a
file means." Moving before OKF grows typed links ("community-driven" per their own spec)
matters.

**Compatibility flag (toolchain):** yes — any OKF-aware tool (Google Cloud knowledge
catalog and whatever follows) can consume SRS output; OKF bundles become an SRS on-ramp.

**Risk:** OKF is one month old and could churn or die; keep the export a thin projection
(cheap to track or abandon). Import is lossy-by-nature (no IDs in OKF) — design the
provenance of imported records deliberately.

**Action:** fold under the SDD-bridge work ([srs#214](https://github.com/the-greenman/srs/issues/214))
or file as a sibling srs-rust issue under Epic 13. Export first; import after the format
shows 2+ quarters of life.

### 3. Agent-index projection + Agent Skills packaging — weight 80 (R4 × F4 × C5)

**What:** Two small distribution moves: (a) an `llms.txt`-style agent-readable index
projection of a repository (record inventory + types + navigation as a single markdown
artifact — trivially a view); (b) package `srs-usage.md` + the CLI as an **Agent Skill**
(SKILL.md folder per [agentskills.io](https://agentskills.io/)) so any skills-capable agent
(Claude Code, Codex, Gemini CLI, Cursor, Copilot, …) can install "work with SRS
repositories" as a capability.

**Why now:** SKILL.md is the fastest-moving portable-knowledge-bundle convention in
existence (landscape III.6) and it is *distribution*, not architecture: near-zero cost, and
it meets agents where they already are. The llms-index is the same play for repositories
themselves.

**Compatibility flag (toolchain):** yes — skills registries and every skills-capable agent
become an SRS distribution channel.

**Risk:** negligible; both are projections/packaging with no spec surface.

**Action:** file one srs-rust (or srs, for the skill packaging) issue under Epic 13. The
skill can ship independently of any release.

*(Already filed under Epic 13: the Spec Kit / OpenSpec SDD bridge —
[srs#214](https://github.com/the-greenman/srs/issues/214). See the SDD survey for its
rationale; it is the same pattern as items 2–3 applied to the spec-driven-development
audience.)*

## Tier 2 — NEXT (needs RFC-level design)

### 4. DocLang/Docling as ingestion front-end — weight 48 (R4 × F4 × C3)

**What:** Use Docling (and the emerging DocLang standard) as the parser for
`source-documents/`: PDF/DOCX in → DoclingDocument JSON → proposed Tier-1 records +
SourceReference metadata out, for human/agent promotion to Tier 2.

**Why:** DocLang answers "what did this PDF say"; SRS answers "what is true" (landscape
III.8). Chained, they form a pipeline the extraction camp cannot complete alone: parse →
propose → validate → govern. LF governance (IBM/NVIDIA/Red Hat) makes Docling a safe
dependency bet. This directly upgrades the RFC-017 source-documents/attachments story.

**Compatibility flag (toolchain):** yes — inherits every input format Docling parses.

**Why not now:** needs design: where the parse step runs (not in `srs-core`; likely a
separate ingestion tool feeding the CLI), and what "proposed records" look like as a
workflow. Worth an RFC seed once a concrete consumer (muDemocracy source-document ingestion)
demands it.

### 5. JSON-LD / schema.org export projection — weight 45 (R3 × F5 × C3)

**What:** A view/codec that renders Records as JSON-LD (schema.org vocabulary where types
map, local context otherwise), embeddable in published HTML projections.

**Why:** JSON-LD is what retrieval pipelines and AI Overviews actually consume (landscape
I.1), and it makes published SRS projections legible to the GraphRAG/knowledge-graph world
without adopting RDF internally. Stencila's schema.org grounding shows the mapping is
tractable.

**Why not now:** mapping design (Field/Type → vocabulary) deserves care, and the payoff is
publication-side SEO/interop rather than a blocking need. Natural companion to whichever
release first publishes SRS content to the public web at scale.

### 6. AT Protocol lexicon-publishing pattern → registry/federation design — weight 36 (R3 × F4 × C3)

**What:** A design borrow, not an artifact: atproto now publishes lexicon schemas *as
records* with DNS-anchored namespace authority (landscape II.1). Adopt the pattern —
packages published as SRS records, namespace ownership verifiable — when designing
`ext:registry` / `ext:federation` and the package-distribution story (RFC-014 lineage).

**Why:** it is the only schema-governance model proven at tens-of-millions-of-repos scale,
and it is philosophically identical to SRS's "the spec is itself an SRS repository."

**Why not now:** registry/federation are not on the near roadmap; record the borrow so the
future RFC starts from it.

### 7. Portable Text as structured content format for `text` fields — weight 30 (R3 × F5 × C2)

**What:** An optional declared content format for `text` field values carrying Portable
Text-style typed block JSON instead of flat text, per the spec's existing "Field semantics —
content format" invariant hook.

**Why:** gives rich text a machine-canonical form inside records — P4 discipline *inside*
the field — reusing a de-facto-stable open convention rather than inventing block markup.

**Why not now:** touches every renderer and editor (srs-web, srs-vscode); needs an RFC with
a migration story. Wait for a concrete editor demand (the muSrs semantic content editor
track is the likely trigger).

## Tier 3 — WATCH (act on a named signal)

| # | Watch item | Signal that triggers action | Then |
|---|---|---|---|
| 8 | **OKF evolution** — typed links / schema registry are explicitly "community-driven" future work | OKF ships typed links, a manifest, or any validation story; or a second major vendor adopts OKF | Re-weight item 2; consider participating in their community process to keep the SRS upgrade path clean — weight jumps if OKF becomes the category's floor |
| 9 | **Agentic AI Foundation** (LF; OpenAI/Anthropic/Block; stewards AGENTS.md) | The foundation opens a workstream on knowledge bundles, agent memory formats, or validated context | Engage early — this is the body most likely to bless a "portable knowledge" standard; SRS should be in that conversation, not reacting to it |
| 10 | **ACDC / VC 2.0 signatures** — ratified Jan 2026 / May 2025; the trust half of "records with provenance" | A consumer needs verifiable SRS content (regulated decision logs, cross-org federation) | Design `ext:` for signed records/relations *borrowing* ACDC's edge model and VC's proof envelope — do not invent proof formats (landscape III.7) |
| 11 | **Automerge as sync transport** — Automerge 3.0 production-grade; Ink & Switch Patchwork | srs-web needs real-time multi-writer collaboration (Live Governance track) | Evaluate CRDT container as a *transport* under the SRS semantic layer; the layers are cleanly complementary (landscape II.5) |
| 12 | **DocLang spec maturation** (WG launched June 2026) | First spec release + stable schema | Firms up item 4's dependency choice |
| 13 | **Atomic Data** | Reaches 1.0 or gains a second implementation | Re-examine as interop peer (JSON-AD import/export); until then it is a design mirror, not a target |

## Tier 4 — COMPONENT (design sources, consult when the internal work happens)

| # | Source | What to take | Where it lands |
|---|---|---|---|
| 14 | **Nanopublications** | Supersession/retraction-as-relations semantics; Trusty-URI-style content hashing for immutable records | Cross-check RFC-022 supersession semantics; any future content-addressing work |
| 15 | **Wikibase statement model** | Qualifiers, ranks, references on claims — the richest deployed relation-provenance model | If relation provenance ever extends beyond `assertedBy`/`confidence`/`status` |
| 16 | **W3C Web Annotation vocabulary** | Motivation taxonomy + fragment selectors for claims about content regions | Source-document annotation / RFC-017 attachments evolution |
| 17 | **SHACL 1.2 UI** | Form generation from shapes | Prior art for editor-from-Type generation in srs-web/vscode |
| 18 | **Frictionless Data Package** | `$schema` self-versioning on the manifest; the validate-CLI ergonomics that won institutional adoption | Manifest evolution; CLI UX polish |
| 19 | **S1000D / DITA** | Applicability metadata (S1000D), specialization discipline (DITA) — and their ceremony cost as the anti-pattern boundary | Type-inheritance (ext:type-inheritance) and any conditional-content feature |
| 20 | **TEI `@cert`/`@resp`** | The scholarly ancestor of relation provenance — vocabulary alignment for credibility with that audience | Documentation/positioning only |

## Priority summary

| Rank | Item | Weight | Disposition | Owner repo | Status |
|---|---|---|---|---|---|
| 1 | MCP server binding | 100 | NOW | srs-rust | to file |
| 2 | OKF export (→ import) | 80 | NOW | srs-rust (+ srs tooling-only RFC if needed) | to file / fold into #214 scope |
| 3 | Agent-index + SKILL.md packaging | 80 | NOW | srs-rust / srs | to file |
| — | SDD bridge (Spec Kit / OpenSpec) | (per SDD survey) | NOW | srs#214 | filed, under Epic 13 |
| 4 | Docling ingestion | 48 | NEXT | srs-rust + srs RFC | awaiting consumer |
| 5 | JSON-LD projection | 45 | NEXT | srs-rust | awaiting publication driver |
| 6 | atproto lexicon-publishing pattern | 36 | NEXT | srs (registry/federation RFC) | recorded |
| 7 | Portable Text content format | 30 | NEXT | srs RFC | awaiting editor demand |
| 8–13 | Watch items | — | WATCH | — | signals named above |
| 14–20 | Component sources | — | COMPONENT | — | consult in-context |

**Explicitly identified for the roadmap now:** items 1–3. All three are presentation/adapter
layer per capability-layering — no new semantics, no spec changes beyond (at most) a
tooling-only RFC note — and all three are compatibility multipliers rather than features.
