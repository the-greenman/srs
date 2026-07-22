# Spec-Driven Development (SDD) Landscape — July 2026

> Research survey supporting [the-greenman/srs#214](https://github.com/the-greenman/srs/issues/214)
> (bridging SRS to SDD ecosystem conventions). Compiled 2026-07-22 via multi-source web
> research; GitHub star/activity figures verified against the GitHub API on that date
> unless noted. This is a point-in-time snapshot, not a maintained document.

Scope: open frameworks and tooling for AI-assisted software engineering that put a written
specification (not the chat transcript) at the center of the workflow. Throughout, each tool
is assessed against three problem areas:

- **(a) Feature specs** — writing specs to drive AI implementation of a feature/change
- **(b) Living normative spec** — maintaining a long-lived specification/standard as a
  first-class, evolving artifact
- **(c) Project/task management** — issues, priorities, epics, roadmaps

A useful framing from Birgitta Böckeler's Martin Fowler-site analysis
([martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html),
Oct 2025): three maturity tiers — **spec-first** (spec guides initial build, then discarded),
**spec-anchored** (spec persists and evolves with the feature), **spec-as-source** (humans
edit only specs, never code). Almost everything shipping today is spec-first; spec-anchored
is aspirational in most tools; spec-as-source is essentially only Tessl's bet.

---

## 1. GitHub Spec Kit (`github/spec-kit`)

**What it is.** GitHub's open-source (MIT) toolkit for SDD — a `specify` CLI that scaffolds
slash-command workflows into a coding agent. Created Aug 2025; now the category's gorilla:
**123,169 stars, ~11k forks, 197 releases, v0.13.2 released 2026-07-21** (GitHub API,
2026-07-22) — very active. Repo: [github.com/github/spec-kit](https://github.com/github/spec-kit);
docs: [github.github.com/spec-kit](https://github.github.com/spec-kit/) (docs last updated
2026-07-16).

**Workflow.** Commands are now namespaced `/speckit.*` (the bare `/specify` etc. from 2025
write-ups is the old naming): `/speckit.constitution` (project principles) →
`/speckit.specify` (requirements/user stories) → `/speckit.plan` (technical plan) →
`/speckit.tasks` (task list) → `/speckit.implement`. Optional: `/speckit.clarify`,
`/speckit.analyze`, `/speckit.checklist`, plus two notable newer additions:
`/speckit.taskstoissues` (convert tasks to GitHub issues) and `/speckit.converge` (assess an
existing codebase against specs and append remaining work).

**Storage.** All markdown: a constitution file plus per-feature spec directories (`spec.md`,
`plan.md`, `tasks.md`) under a `.specify/` scaffold; templates/presets/extensions are
markdown too. The docs site reports **~35 agent integrations** (Copilot, Claude Code, Gemini
CLI, Codex CLI, Cursor, Zed, Kiro, …), **138 community extensions and 25 presets**. Claude
Code integration is first-class — `specify init` installs the slash commands as Claude Code
commands.

**Greenfield vs. maintenance.** Historically greenfield/feature-branch oriented — Böckeler's
October 2025 critique noted its per-feature branching implies spec-first, not spec-anchored.
Since then it has moved toward brownfield: the repo now advertises "Iterative Enhancement"
for existing systems, an "Evolving Specs" guide, and `/speckit.converge` for reconciling
code against specs. It still does **not** treat the spec corpus as a queryable, structured
artifact — everything is prose markdown per feature, and ongoing reconciliation is
agent-judgment, not validation.

**Coverage:** (a) **yes — its core purpose**. (b) partial at best — the constitution is a
small persistent normative artifact; feature specs are not designed as a maintained corpus.
(c) marginal — `/speckit.taskstoissues` bridges to GitHub Issues, but there is no
priority/epic/roadmap model.

## 2. OpenSpec (`Fission-AI/OpenSpec`)

**What it is.** A lightweight, TypeScript, npm-installable SDD tool
([github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec),
[@fission-ai/openspec](https://www.npmjs.com/package/@fission-ai/openspec)). **62,019 stars,
v1.6.0 (2026-07-10), pushed 2026-07-22** — very active. Explicitly "fluid not rigid… built
for brownfield not just greenfield."

**Workflow and storage — the interesting part.** OpenSpec is the clearest **spec-anchored**
design in the mainstream tools. An `openspec/` directory holds two trees:

- `openspec/specs/` — the **current truth**: per-capability requirements as markdown with
  concrete scenarios;
- `openspec/changes/<change-id>/` — in-flight **change proposals**, each with `proposal.md`,
  `design.md`, `tasks.md`, and **delta specs** (`specs/` showing ADDED/MODIFIED/REMOVED
  requirements relative to current specs).

Lifecycle: explore (`/opsx:explore`) → propose (`/opsx:propose`) → implement → **archive**,
where the delta is merged into `openspec/specs/` and the change folder moves to
`changes/archive/` with a timestamp — so the living spec is updated as a side effect of
shipping, and history is retained
([docs/concepts.md](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md)).
v1.5.0 (June 2026) added **"Stores" (beta)** — a shared spec repository readable across
multiple code repos, for cross-repo features and team-level source of truth
([releases](https://github.com/Fission-AI/OpenSpec/releases)). Supports ~25 AI tools
including Claude Code via slash commands. A February 2026 independent 13-category evaluation
reportedly scored OpenSpec highest overall among SDD tools on a brownfield serverless
backend (reported via [MarkTechPost's May 2026 roundup](https://www.marktechpost.com/2026/05/08/9-best-ai-tools-for-spec-driven-development-in-2026-kiro-bmad-gsd-and-more-compare/);
the original study could not be verified).

**Coverage:** (a) **yes**. (b) **partial-yes — the strongest of the SDD tools**: it
genuinely maintains a living spec corpus with change-controlled deltas and an archive trail.
But the "spec" is unstructured markdown prose — no typed records, no IDs, no machine
validation of the corpus itself, and it describes *software behavior*, not standards
documents. (c) no — `tasks.md` checklists only; no priorities/epics/issue integration.

## 3. AWS Kiro ([kiro.dev](https://kiro.dev))

**What it is.** Amazon's agentic IDE (plus CLI and web agents), the official successor to
Amazon Q Developer (Q Developer sunsets April 2027). GA since roughly Nov 2025 with staged
rollout; full GA marketing push May 2026. Pricing: free tier (50 credits), Pro $20/mo
through Power $200/mo tiers (secondary sources:
[usagebar.com](https://usagebar.com/blog/kiro-pricing-and-free-tier),
[graphify.net](https://graphify.net/ai-coding-tools/kiro/) — exact tier details not verified
against AWS pricing pages). The product itself is **closed-source**;
[github.com/kirodotdev/Kiro](https://github.com/kirodotdev/Kiro) (4,055 stars) is an issue
tracker, not source.

**Spec mode.** The signature feature
([kiro.dev/docs/specs/feature-specs](https://kiro.dev/docs/specs/feature-specs/)): a prompt
is expanded into three files per feature under `.kiro/specs/<feature>/`:

- `requirements.md` — user stories with acceptance criteria in **EARS notation** ("WHEN
  [condition] THE SYSTEM SHALL [behavior]") — the most formally structured requirements text
  in any mainstream tool;
- `design.md` — architecture, sequence diagrams;
- `tasks.md` — dependency-sequenced tasks, each tracing back to a requirement.

Approval gates sit between phases; there are requirements-first and design-first variants
and a gate-skipping "Quick Plan." Separately, `.kiro/steering/` holds persistent
project-knowledge markdown, and Kiro also reads the cross-vendor **AGENTS.md** convention
([kiro.dev/docs/cli/steering](https://kiro.dev/docs/cli/steering/)).

**Portability.** The *format* is portable in the trivial sense — plain markdown files in
your repo, no lock-in, and Kiro's docs advertise exactly that. But it is a **convention, not
an open standard**: no published schema, no spec for EARS-in-markdown interchange, and the
generation/sync tooling is proprietary. Other tools (including Spec Kit presets and
community "spec workflow" plugins for Claude Code, e.g.
[Pimzino/claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow),
3.8k stars, dormant since Sep 2025) imitate the three-file layout. Kiro is essentially
**spec-first**: docs offer an "Analyze Requirements" consistency check but little story for
keeping specs authoritative after merge.

**Coverage:** (a) **yes**. (b) no. (c) marginal — `tasks.md` execution tracking inside one
feature; AWS positions broader agent scheduling/web-agent PR automation around it, but no
issue/epic model.

## 4. Tessl ([tessl.io](https://tessl.io))

**What it is.** London startup (founder Guy Podjarny, ex-Snyk; **$125M raised at ~$750M
valuation in Nov 2024**, before product) making the purest **spec-as-source** bet: specs are
the maintained artifact; code is generated ("// GENERATED FROM SPEC — DO NOT EDIT") with 1:1
spec-to-file mapping and test-based guardrails.

**Status as of mid-2026 — cautionary.** Two products
([announcement](https://tessl.io/blog/announcing-tessls-products-to-unlock-the-power-of-agents/),
Sep 2025):

- **Registry** — launched open beta Sep 2025 as a "spec registry" (10,000+ specs describing
  how to use external libraries, "npm for knowledge"); **repositioned Jan 29, 2026 as a
  *skills* registry** — versioned, evaluated bundles of instructions/docs/rules installable
  via `tessl install`
  ([tessl.io/blog](https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/)).
  This is the live, growing product.
- **Framework** (the actual spec-as-source engine) — **still in closed/private beta after
  ~9 months**. A June 2026 review
  ([codemyspec.com/blog/tessl-review](https://codemyspec.com/blog/tessl-review)) reports
  JavaScript-only output and non-deterministic regeneration (same spec → different
  implementations), undermining the "code is disposable" premise. The Jan 2026 repositioning
  toward "Agent Enablement Platform" / "skills are the new code" reads as a partial pivot
  away from spec-as-source. Not open source; no verified production adoption or pricing.
  Treat framework claims as unproven.

**Coverage:** (a) yes in vision, unproven in practice. (b) **partial in a distinctive way**
— the registry is the one instance of *versioned, published, evaluated spec packages with a
dependency model*, i.e., spec-as-registry rather than spec-as-repo-folder; but registry
content is library-usage guidance, not normative standards. (c) no.

## 5. BMAD-METHOD (`bmad-code-org/BMAD-METHOD`)

**What it is.** "Breakthrough Method for Agile AI-Driven Development" — the maximalist
framework: it simulates an entire agile team with 12+ agent personas (Analyst, PM,
Architect, UX, Scrum Master, Dev, QA, Tech Writer…). **50,940 stars, v6.10.0 (2026-07-03),
pushed 2026-07-22** — very active. Repo:
[github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD).

**Workflow/storage.** Brief → PRD → architecture doc → the PM/Scrum Master agents shard the
PRD into **epics and atomic story files**, each story a self-contained markdown context
package (requirements + architecture extract + acceptance criteria) that a Dev agent
implements, often on a dedicated branch; QA agent reviews. "Documents are the source of
truth and code becomes temporal" is explicit philosophy
([overview](https://nayakpplaban.medium.com/bmad-ai-powered-agile-framework-overview-238d4af39aa4),
[Augment guide](https://www.augmentcode.com/guides/bmad-method-ai-development)). Works in
Claude Code, Cursor, Copilot, etc. Criticism across comparisons: heavy ceremony; best for
high-stakes greenfield with a compliance paper trail
([Reenbit comparison](https://reenbit.com/bmad-vs-spec-kit-vs-openspec-choosing-your-spec-driven-ai-framework/)).

**Coverage:** (a) **yes**. (b) no — PRD/architecture docs persist but there's no
change-control model for them as a normative corpus. (c) **partial — the closest of the big
frameworks**: it genuinely models epics/stories/roles/sequencing, but inside markdown files,
not connected to issue trackers, priorities, or roadmaps.

## 6. Other notable entrants (2025–2026)

- **GSD ("Get Shit Done")** —
  [github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done):
  meta-prompting + context-engineering + SDD system built primarily *for Claude Code*,
  positioned as the lean anti-BMAD. Explosive growth: **64,785 stars** from a Dec 2025 first
  commit — but note **last push 2026-05-31**, i.e., ~2 months quiet as of this report.
  Covers (a); light (c) (phase/task planning); no (b).
- **Claude Code native + plugin ecosystem** — Claude Code itself ships plan mode,
  CLAUDE.md/AGENTS.md project memory, Skills, and a plugin/marketplace system. Anthropic's
  official marketplace
  ([anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official),
  271 plugins as of 2026-07-22) includes `feature-dev` (explore→architect→review workflow)
  and `code-review`, but **no official SDD plugin** — Spec Kit, OpenSpec, GSD and BMAD all
  install *into* Claude Code as commands/skills instead. Community marketplaces list
  hundreds of spec-workflow plugins (e.g.,
  [tonsofskills.com index](https://github.com/jeremylongshore/claude-code-plugins-plus-skills):
  425 plugins / 2,810 skills). Notable PM-flavored one: **CCPM**
  ([automazeio/ccpm](https://github.com/automazeio/ccpm), 8,280 stars) — PRD→epic→
  GitHub-Issues decomposition with git-worktree parallel agents; genuinely covers (c)+(a);
  last push Mar 2026.
- **Taskmaster AI** —
  [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master)
  (27,884 stars, last push Apr 2026) — PRD-parsing AI task-management dropped into
  Cursor/Windsurf/etc.; task graph with dependencies. Covers (c) (tool-local, not
  GitHub-integrated) + (a)-adjacent.
- **Cursor Plan Mode** ([cursor.com/blog/plan-mode](https://cursor.com/blog/plan-mode),
  [docs](https://cursor.com/docs/agent/plan-mode)) — research codebase → clarifying
  questions → editable plan → build; plans optionally saved to `.cursor/plans/` as markdown.
  Spec-first only, single-feature, no persistence model beyond saved files. Covers (a)
  lightly.
- **Amazon beyond Kiro** — AWS's agent push is mostly runtime (Bedrock AgentCore, Strands
  Agents SDK) rather than SDD; notable crossover: AWS now ships its Security Agent as *both*
  a Kiro power and a Claude Code plugin
  ([aws.amazon.com blog](https://aws.amazon.com/blogs/aws/aws-security-agent-adds-threat-modeling-kiro-power-and-claude-code-plugin-and-more/))
  — vendors treating agent-workflow surfaces as distribution channels.
- **Long tail** — Spec Kitty (community Spec Kit fork with worktree orchestration), Hermes,
  specs.md, CodeMySpec (BDD-flavored), catalogued at
  [specdriven.com/landscape](https://specdriven.com/landscape/),
  [cameronsjo/spec-compare](https://github.com/cameronsjo/spec-compare), and
  [awesome-spec-driven-development](https://github.com/engineering4ai/awesome-spec-driven-development).
  An academic taxonomy of these frameworks appeared on arXiv in June 2026
  ([2606.04967](https://arxiv.org/pdf/2606.04967)) — a sign the space is stabilizing enough
  to study.

## 7. Standards-document maintenance (IETF/W3C-style)

**No SDD tool targets this.** The tooling that *does* exist for normative standards is the
pre-AI stack, still current and actively maintained:

- **Bikeshed** ([speced.github.io/bikeshed](https://speced.github.io/bikeshed/)) and
  **ReSpec** — the two dominant W3C/WHATWG spec processors (markdown-superset /
  HTML-enhancing respectively), automated in CI via W3C's `spec-prod` GitHub Action
  ([w3.org/wiki/Tooling_Considerations](https://www.w3.org/wiki/Tooling_Considerations)).
- **kramdown-rfc → xml2rfc** ([cabo/kramdown-rfc](https://github.com/cabo/kramdown-rfc)) —
  the standard markdown pipeline for IETF Internet-Drafts/RFCs (RFCXML is the
  machine-readable canonical form).
- **w3c/browser-specs + Reffy/Webref**
  ([github.com/w3c/browser-specs](https://github.com/w3c/browser-specs)) — the closest thing
  to "specs as machine-readable records": a curated machine-readable *index* of web specs,
  plus automated extraction of definitions/IDL/references that Bikeshed and ReSpec consume
  for cross-spec linking. Crucially this is *extraction from* prose documents, not authoring
  *as* records.
- **spec-md** ([leebyron/spec-md](https://github.com/leebyron/spec-md), 412 stars, dormant
  since 2023) — markdown extensions for spec documents (used for the GraphQL spec).

What does **not** exist, as far as this survey could find: any tool where a standard's
normative content is *authored as typed, validated, individually addressable records*
(invariants, definitions, requirements as first-class entities with IDs, versions, and
relations) with prose as a rendered projection — let alone one designed for AI-agent
authorship with change-control. The nearest conceptual neighbors are OpenSpec's
delta/archive model (prose-level, software-behavior-scoped) and EARS notation (structured
sentences, no record model). Adjacent-but-different: llms.txt / AGENTS.md / skill.md
conventions for agent-readable *product* documentation, and machine-readable *compliance*
records (C2PA, EU-AI-Act "AI Cards" proposals). This niche is empty.

## 8. GitHub Projects automation: priority derivation

Still **mostly custom scripts**. What exists openly:

- **GitHub Agentic Workflows "ProjectOps"**
  ([github.github.com/gh-aw/patterns/project-ops](https://github.github.com/gh-aw/patterns/project-ops/),
  GitHub Next + Microsoft Research) — the most notable new thing: agentic workflows that
  read board state and write fields (status, priority, owner) through gated "safe outputs,"
  with AI judgment doing triage/routing. But it is *judgment-based field-setting*, not
  deterministic derivation — **no user-story→priority or MoSCoW rollup logic**.
- Conventional Actions:
  [Parent Issue Updater](https://github.com/marketplace/actions/parent-issue-updater),
  [Epic issues for GitHub](https://github.com/marketplace/actions/epic-issues-for-github),
  `actions/add-to-project`; GitHub's native sub-issues (GA 2025) give parent/child progress
  display and project grouping
  ([community discussion #154148](https://github.com/orgs/community/discussions/154148)),
  but field rollups (summing estimates, deriving priority from parent story fields) still
  require hand-rolled GraphQL workflows — the standard advice is literally "write an Actions
  workflow against the GraphQL API"
  ([devactivity write-up](https://devactivity.com/insights/automating-estimate-roll-ups-in-github-projects-a-key-for-development-kpi-examples/)).

This survey found **no notable open tool that derives issue priority from user-story
membership or MoSCoW rollups**. That specific mechanism (story-level MoSCoW → deterministic
per-issue priority, as in this ecosystem's `gh-project.mjs`) has no open-source equivalent;
the market splits into dumb sync actions and non-deterministic AI triage.

---

## Comparison table

| Tool | Type / license | Verified activity (2026-07-22) | Spec storage | Böckeler tier | (a) Feature specs | (b) Living normative spec | (c) Project mgmt |
|---|---|---|---|---|---|---|---|
| **Spec Kit** | OSS (MIT), GitHub | 123k★, v0.13.2 (Jul 21), very active | Markdown: constitution + per-feature `spec/plan/tasks.md` | Spec-first, edging spec-anchored (`converge`, Evolving Specs) | **Core** | Constitution only | Marginal (`taskstoissues`) |
| **OpenSpec** | OSS, Fission-AI | 62k★, v1.6.0 (Jul 10), very active | `openspec/specs` (truth) + `changes/` (delta proposals) + archive; Stores (beta) cross-repo | **Spec-anchored** | **Core** | Partial (prose corpus, change-controlled) | No |
| **Kiro** | Proprietary IDE/CLI (AWS) | GA; closed source; issue repo 4k★ | `.kiro/specs/*/requirements(EARS)/design/tasks.md` + steering; portable markdown, no open standard | Spec-first | **Core** | No | Marginal (task tracking) |
| **Tessl** | Proprietary; Registry open beta, Framework closed beta | $125M raised; framework unproven, JS-only, non-deterministic regen | Spec files 1:1 with code files; versioned registry packages | **Spec-as-source (attempted)** | Vision | Partial (spec/skill registry) | No |
| **BMAD** | OSS | 51k★, v6.10.0 (Jul 3), very active | PRD/architecture sharded into epic + story markdown files | Spec-first w/ persistent docs | **Core** | No | Partial (epics/stories, file-local) |
| **GSD** | OSS (Claude Code-first) | 65k★ but quiet since May 31 | Planning/context markdown | Spec-first | Yes | No | Light |
| **CCPM** | OSS | 8.3k★, last push Mar | PRD→epics→GitHub Issues + worktrees | Spec-first | Yes | No | **Yes (GitHub-native)** |
| **Taskmaster** | OSS | 28k★, last push Apr | PRD-derived task graph | — | Adjacent | No | Yes (tool-local) |
| **Cursor Plan Mode** | Proprietary feature | Shipping | `.cursor/plans/*.md` (optional save) | Spec-first | Light | No | No |
| **Bikeshed / ReSpec / kramdown-rfc / webref** | OSS, standards bodies | Mature, maintained | Markdown-superset / HTML / RFCXML; machine-readable *extraction* (webref) | n/a (pre-AI) | No | **Yes (prose-canonical)** | No |

## Gaps — what none of these cover

1. **Specs as structured records.** Every SDD tool stores specs as free-form markdown prose.
   None has typed entities, stable IDs, versioned lineages, validated field values, or
   first-class relations between spec elements. EARS is the ceiling of formality, and it's a
   sentence template. Consequences: no machine validation of the spec corpus, no reliable
   cross-referencing, no queryable spec graph, no deterministic rendering of multiple
   projections from one source.
2. **Standards-document maintenance with AI.** The (b) column is nearly empty. OpenSpec
   change-controls a prose corpus about *one codebase's behavior*; Bikeshed/ReSpec/xml2rfc
   render prose-canonical standards without any AI-workflow or record model; webref extracts
   structure *after the fact*. Nothing supports authoring/maintaining an IETF/W3C-style
   normative standard as machine-readable records with agent-safe write workflows, RFC-style
   change control, and rendered prose as a projection.
3. **Deterministic spec→backlog→priority pipelines.** BMAD and CCPM decompose specs into
   epics/stories, and ProjectOps sets project fields by AI judgment, but no open tool closes
   the loop deterministically: spec/story records → derived priorities (e.g., MoSCoW
   rollups) → issue-tracker state. That space is still custom GraphQL scripts.
4. **Spec identity across the lifecycle.** Tools conflate three different artifacts — the
   persistent normative layer (constitution/steering), the transient change proposal, and
   the task list — or keep only one of them. Only OpenSpec cleanly separates current-truth
   from in-flight-change, and even it discards structure at archive time (prose merge, no
   supersession/refinement relations).
5. **Interchange.** Despite "portable markdown" claims everywhere, there is no interchange
   format: a Kiro spec, a Spec Kit spec, and an OpenSpec change are mutually unintelligible
   conventions. Tessl's registry is the only versioned-package distribution model, and it's
   proprietary and now pivoted toward skills.
6. **Verification of spec adherence.** All tools rely on agent obedience; Böckeler's
   critique (agents ignoring or over-applying specs) remains unanswered. `speckit.converge`
   and OpenSpec's review step are agent-judgment checks, not verification against a
   machine-checkable contract.

## Relevance to SRS

The gap list above is, item for item, what SRS already provides: gap 1 is the record model
(Fields, Types, tiers, relations), gap 2 is the spec repo itself (`srs/srs/` — a normative
standard authored as validated records with rendered prose as a projection), gap 4 is the
supersession/refinement relation machinery plus the RFC records-canonical vs proposal-`.md`
split, and gap 6 is `check-rfc-integration.mjs` and `repo validate`. Gap 3 is covered by the
ecosystem's `gh-project.mjs` priority pipeline (srs-rust), which this survey found no open
equivalent for.

The conclusion drawn from this survey (see
[#214](https://github.com/the-greenman/srs/issues/214)) is not to adopt any SDD framework
but to **bridge to their conventions**: render SRS containers as Spec Kit-style projections,
import OpenSpec change folders as records, and describe the RFC pipeline in the vocabulary
this audience now searches for (spec-anchored development, change-controlled deltas, spec as
source of truth).

## Confidence notes

GitHub metrics are API-verified as of 2026-07-22. Kiro pricing/GA dates and the February
2026 OpenSpec benchmark come from secondary sources and were not verified against primary
AWS/benchmark material. Tessl Framework assessments rest on one detailed third-party review
plus Tessl's own blog; its closed beta means real capability is unverifiable. The claim that
no standards-records tooling exists is a negative claim from multiple targeted searches —
absence of evidence, held with reasonable but not complete confidence.
