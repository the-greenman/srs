# The Semantic-Document Landscape — July 2026

> Research survey supporting Epic 13 "SRS for Specs" ([muDemocracy.org#124](https://github.com/the-greenman/muDemocracy.org/issues/124))
> and [the-greenman/srs#216](https://github.com/the-greenman/srs/issues/216). Companion to
> [spec-driven-development-landscape.md](spec-driven-development-landscape.md) (the SDD tooling
> survey) and input to [alignment-opportunities.md](alignment-opportunities.md) (the actionable
> register derived from both). Compiled 2026-07-22 via three parallel research sweeps;
> GitHub/W3C/spec claims verified against primary sources on that date unless noted.
> Point-in-time snapshot, not a maintained document.

**The question:** SRS positions itself as a *portable semantic document format designed for
humans and AI* — "a PDF for meaning." Are there other projects in that space?

**The short answer:** many partial neighbors across three distinct lineages; none holding the
full combination; and as of June 2026 the category is newly contested — Google's Open
Knowledge Format and the Linux Foundation's DocLang both launched that month claiming
adjacent territory from opposite ends of the rigor spectrum.

## Method and property key

Three research lenses were swept independently: (I) the semantic web / linked data lineage,
(II) modern protocols and app-layer object models, (III) structured-document authoring
formats and AI-native conventions. A few systems appear in more than one part (Atomic Data,
Block Protocol, OKF) — the overlap is deliberate cross-checking, and assessments agreed.

Every system is scored against SRS's six defining properties:

- **P1 — Portable container**: self-contained repository/archive with a manifest
- **P2 — Typed, validated records**: atomic fields with stable IDs/versions composed into
  types; graduated tiers of structure
- **P3 — First-class typed relations**: binary edges between records as their own entities,
  with provenance
- **P4 — Machine-canonical, prose as projection**: records are the source of truth;
  human-readable documents are rendered from them
- **P5 — AI-agent read/write contract**: a stable machine interface with validation in the
  write path
- **P6 — Open spec, separate reference implementation**

## Executive synthesis

### The camps

| Camp | Exemplars | What they own | What they lack |
|---|---|---|---|
| **Portable-but-untyped** | Obsidian vaults, Automerge, Fedwiki, Noosphere (†2024), AGENTS.md / SKILL.md, llms.txt, **Google OKF** | Container, agent ergonomics, adoption | Types, validation, identity, typed relations |
| **Typed-but-captive** | Anytype, Tana, Notion, HASH / Block Protocol, Logseq DB | Object models — sometimes excellent (Anytype has first-class typed relations) | The data cannot leave home losslessly |
| **Typed + portable, account/network-scoped** | AT Protocol (thriving), Ceramic (†2025) | Schema-validated records in portable signed containers | Unit is the *account*, not the *document*; no relation layer |
| **Machine-canonical, read-only or single-vertical** | **DocLang / Docling** (LF, June 2026), DITA / JATS / S1000D, Stencila | Typed canonical models, projection discipline | Extraction *from* documents, or one vertical; no agent write path |
| **Claims, not documents** | VC 2.0, C2PA, KERI/ACDC (ratified Jan 2026) | Identity, schemas, typed provenance edges, signatures | No authoring, no documents |

### Nearest individual neighbors

1. **Atomic Data** — the *semantic-model* twin: URL-identified atomic Properties with
   datatypes composed into Classes ≈ SRS Fields → Types, with mandatory validation and
   signed versioned commits. Diverges exactly where SRS is distinctive: server-anchored
   identity (portability requires the server), no container/manifest, no projection layer —
   and six years in, still a one-team alpha.
2. **AT Protocol** — the *protocol* twin: Lexicon-validated typed records in exportable
   signed repos at real scale, with schema publishing itself now record-based (parallel to
   SRS packages). But repo = account, not document; no first-class relations; no tiers.
3. **Stencila** — the *philosophy* twin: typed schema-governed canonical document model,
   formats as codec projections, explicit human+LLM co-authoring with edit provenance, open
   spec + Rust reference implementation. Document-scoped: no repository container, no
   field-atom identity lineage, no relation graph. SRS is "records first, documents
   rendered"; Stencila is "documents first, nodes typed" — the two designs approach the same
   midpoint from opposite ends.
4. **S1000D** — the 20-year industrial existence proof of the architecture: identified,
   validated data modules in a common source database, assembled into rendered publications.
   SRS is roughly S1000D at wiki-weight with an agent write path; S1000D's ceremony cost is
   the cautionary tale.
5. **Nanopublications** — the *portable provenance-bearing record* done right: signed,
   immutable, with supersession/retraction as typed relations between records — but
   atomized to single claims, never composing into heterogeneous documents.

### The June 2026 inflection

- **Google OKF** is the SRS mission statement with every design decision inverted: portable
  markdown bundles for humans and agents, but path-based identity, one uncontrolled `type`
  string, links whose meaning "is conveyed by the surrounding prose," no manifest, no
  validation — by design. Simultaneously the strongest validation of the premise (Google
  asserting the category needs a standard) and the worse-is-better adoption threat. OKF's
  own spec defers typed links to "community-driven" future work.
- **DocLang** (LF AI & Data; IBM/NVIDIA/Red Hat) pitches literally "PDF, DOCX and JPEG were
  designed for human consumption, not machine interpretation" — but standardizes meaning
  *recovered from* documents by parsing, not meaning *authored as* records. DocLang answers
  "what did this PDF say"; SRS answers "what is true — now render me a document."

### What no surveyed system has

None holds all six properties, and none holds SRS's specific tetrad: **UUID+version record
identity that survives copying · first-class typed relations with semantic provenance
(`assertedBy` / `confidence` / `status`) · prose as a rendered projection of
machine-canonical records · a validating agent write contract.** Several systems are
potential *components* rather than competitors: Automerge (sync/merge transport), MCP
(access protocol), Portable Text (structured prose inside a text field), ACDC/VC
(signatures on relations).

### Lessons from the graveyard

Every typed system across the three lineages either rode a host platform (Wikidata), shrank
to a niche (Semantic MediaWiki, nanopubs), stalled in alpha (Atomic Data), died with its
infrastructure (Ceramic), or died without a viral artifact (Block Protocol). **Adoption
friction — not model quality — is what kills semantic document systems.** Two things cut in
SRS's favor: the file-first, infrastructure-free stance (the anti-Ceramic choice), and a
genuine historical discontinuity — for the first time since OpenDoc died in 1997, the
dominant new reader/writer (the AI agent) actually *prefers* structure. The open question is
whether SRS can approach SKILL.md/OKF-class adoption cost; the tier system (start as untyped
notes, harden gradually) is the right lever, and the one thing none of the rigid
predecessors had.

---

# Part I — The semantic web / linked data lineage

## I.1 RDF + JSON-LD + schema.org — the base layer

The foundational stack: RDF gives a universal graph data model (typed IRI-named binary
predicates between resources), JSON-LD (W3C Rec, 1.1 in 2020) gives it a JSON serialization,
and schema.org gives a shared vocabulary that reached mass deployment as SEO markup embedded
in web pages. The standards layer is *more* active in 2026 than it has been in a decade: the
rechartered [RDF & SPARQL Working Group](https://www.w3.org/2025/04/rdf-star-wg-charter.html)
is driving RDF 1.2 / SPARQL 1.2 (adding RDF-star statements-about-statements), with
[RDF 1.2 Semantics at Candidate Recommendation as of April 2026](https://www.w3.org/TR/rdf12-semantics/)
and a ["What's New in RDF 1.2" note drafted in 2026](https://www.w3.org/news/2026/group-note-draft-whats-new-in-rdf-1-2/).

**Why "semantic documents" never happened on it.** Four structural reasons recur in the
post-mortems ([Downes 2007](https://halfanhour.blogspot.com/2007/03/why-semantic-web-will-fail.html),
[Diffbot's "RIP: The Semantic Web"](https://blog.diffbot.com/rip-the-semantic-web/),
[Fournier-Viger's analysis](https://data-mining.philippe-fournier-viger.com/the-semantic-web-and-why-it-failed/)):
(a) **no record boundary** — RDF is a soup of triples with no native notion of "this bundle
of statements is one document/record you can own, version, and move"; named graphs arrived
late and underspecified; (b) **open-world semantics deferred validation** — you could say
anything about anything, so nothing was ever *invalid*, which is fatal for
documents-as-contracts; (c) **the embedding model inverted the projection** —
RDFa/JSON-LD-in-HTML makes semantics an *annotation on* prose, whereas a semantic document
needs prose to be a *projection of* the semantics; (d) authoring cost with no incentive loop
outside SEO. What survived is exactly the incentivized slice: schema.org JSON-LD as web
exhaust.

**Current AI relevance.** That exhaust is now being re-consumed: JSON-LD/schema.org markup
demonstrably feeds AI Overviews and retrieval pipelines
([Schema App](https://www.schemaapp.com/schema-markup/why-structured-data-not-tokenization-is-the-future-of-llms/),
[structured-data-for-LLMs guides](https://almcorp.com/blog/structured-data-for-llms-technical-guide/),
[GraphRAG-oriented nested JSON-LD patterns](https://cubitrek.com/blog/nested-json-ld-architecting-schema-for-graphrag-ai)),
and knowledge-graph-grounded RAG is an active research area
([Grounding LLM Reasoning with Knowledge Graphs](https://arxiv.org/pdf/2502.13247)). But
this is markup for discovery, not portable documents.

**Properties:** P1 **no** (no packaging/manifest convention) · P2 **partial** (rdf:type
exists; validation absent by design) · P3 **yes** (typed binary edges are the core
primitive; per-edge provenance only now arriving via RDF-star) · P4 **no** (deployed model
is prose-canonical with embedded markup) · P5 **no** (SPARQL Update exists but no validating
write contract) · P6 **yes**.

**Verdict:** The substrate everything else in this lineage is built on, and the definitive
proof that a graph model alone does not produce a "PDF for meaning" — it lacks the record
boundary, the container, and the validation contract.

## I.2 Solid (Tim Berners-Lee)

Solid reimagines the web around personal data pods: WebID identity, LDP-style resource
containers, access control, with apps reading/writing RDF into storage the user controls.
**Status 2026:** standardization is genuinely progressing but under a new name — the W3C
[Linked Web Storage Working Group](https://www.w3.org/2024/09/linked-web-storage-wg-charter.html)
(chartered Sept 2024–Sept 2026) took the Solid Protocol 0.11 as input and published the
[First Public Working Draft of Linked Web Storage Protocol 1.0 in March 2026](https://www.w3.org/news/2026/first-public-working-draft-linked-web-storage-protocol-1-0/)
plus [four authentication-suite FPWDs in April 2026](https://www.w3.org/news/2026/first-public-working-drafts-for-the-linked-web-storage-lws-1-0-authentication-suite/).
The [Solid Community Group](https://www.w3.org/community/solid/) continues alongside;
TimBL's own [history document](https://www.w3.org/DesignIssues/history/AShortHistoryoftheSolidProtocol.html)
records the community friction around the WG split. Commercially, Inrupt pivoted in July
2024 to a ["Data Wallet" product](https://www.inrupt.com/blog/data-wallet-release) built on
its Enterprise Solid Server, with Visa and Digital Vlaanderen (Flanders) as flagship
deployments. Adoption reality: government pilots (Flanders),
[ODI advocacy including Solid-backed LLM chat-history portability in LibreChat (Solid World, Feb 2026)](https://theodi.org/news-and-events/events/solid-world-feb-2026/)
— but consumer/developer adoption remains marginal after eight years of incubation.

**Properties:** P1 **partial** (a pod is a portable *personal data space*, but it's a live
web server, not an offline self-describing archive; no manifest/index of a coherent
document) · P2 **partial** (shapes-based app interop was specified but is not the deployed
norm; most pod data is untyped RDF resources) · P3 **partial** (arbitrary RDF relations; no
canonical relation vocabulary or edge provenance) · P4 **no** · P5 **partial** (a real
standardized read/write HTTP contract agents can use — but no validation gate) · P6 **yes**
(open specs; multiple servers: CSS, ESS, NSS).

**Verdict:** Closest in *spirit* on portability-of-data-from-apps, but it is a **protocol
for live personal storage**, not a document format. Solid answers "where does my data live
and who may touch it"; SRS answers "what is this bundle of meaning and is it valid."
Complementary more than competing — an SRS repository could live in a pod.

## I.3 Atomic Data — the closest semantic-model analog

Atomic Data ([docs.atomicdata.dev](https://docs.atomicdata.dev/)) is a full-stack
simplification of linked data: every resource is identified by a subject URL; **JSON-AD**
serialization uses Property URLs as JSON keys; **Atomic Schema** defines Properties as
atomic, URL-identified semantic units with required datatypes, composed into Classes with
required/recommended property lists — a near-exact structural twin of SRS
Fields-composed-into-Types; **Atomic Commits** are signed, audited state-change deltas
providing event-sourced versioning and provenance. Validation is mandatory, not optional.
**Status:** alive but still a single-team alpha. The reference implementation
[atomic-server](https://github.com/atomicdata-dev/atomic-server) (Rust, "headless CMS /
real-time database", ~1.6k stars) shipped **v0.40.3 on July 6, 2026** with ongoing commits,
and the README still states "Status: alpha. Breaking changes are expected until 1.0" —
nothing in the project has reached v1. There is a small
[W3C Community Group](https://www.w3.org/community/atomic-data/) and
[NLnet funding](https://nlnet.nl/project/AtomicData/), but no visible ecosystem of
independent implementations or third-party adoption; it remains essentially Ontola/joepio's
project (Meindertsma's public attention has substantially gone to PauseAI since 2023, though
the release cadence shows the server is still maintained).

**Properties:** P1 **partial** (JSON-AD files export/import cleanly, but identity is
server-anchored subject URLs; no offline container/manifest concept) · P2 **yes** (atomic
Properties with datatypes → Classes; required validation; versioning via commit history
rather than integer version lineages) · P3 **partial** (typed links via Properties, and
Commits carry signed provenance for *changes* — but edges themselves are not first-class
entities with status/confidence) · P4 **partial** (machine-canonical JSON-AD; atomic-server
renders Notion-style documents from it, but the projection contract isn't spec-level) ·
P5 **partial** (validating REST/commit API and a CLI exist; not designed as an agent
contract) · P6 **yes** (spec and implementation formally separate — though in practice there
is one implementation).

**Verdict:** The nearest **semantic-model** neighbor to SRS in existence — atomic typed
fields, class composition, mandatory validation, versioned provenance. Its bets diverge from
SRS exactly where SRS is distinctive: URL-anchored *web-native* identity instead of
UUID-anchored *portable* identity, a live server instead of a self-contained repository, and
no document/projection layer. Its trajectory (six years, still alpha, one team) is also the
cautionary tale for this category.

## I.4 SHACL / ShEx — shapes as validation

SHACL (W3C Rec 2017) and ShEx (community spec) define *shapes* — structural constraints over
RDF graphs — retrofitting the closed-world validation RDF lacked. **Status:** SHACL is
having a second life: the rechartered Data Shapes WG published First Public Working Drafts
of [SHACL 1.2 Core](https://www.w3.org/TR/shacl12-core/) (March 2025),
[SHACL 1.2 Rules](https://www.w3.org/news/2025/first-public-working-draft-shacl-1-2-rules/)
(inference rules), [SHACL 1.2 UI](https://www.w3.org/TR/shacl12-ui/) (form generation from
shapes — conceptually adjacent to SRS's typed-record editing), and
[SHACL 1.2 Profiling](https://www.w3.org/TR/shacl12-profiling/); a
[2026 community survey](https://arxiv.org/html/2606.03502v1) confirms both languages in
active use with SHACL dominant in enterprise KG pipelines. ShEx's flagship deployment is
Wikidata EntitySchemas; the two languages [never converged](https://book.validatingrdf.com/bookHtml011.html).
As "typed record" systems: shapes *are* the type layer several systems here borrow (Solid
interop, nanopub templates), but a shape types a graph neighborhood, not a bounded,
versioned record — and shapes ship separately from data with no container binding the two.

**Properties:** P1 **no** · P2 **yes** for the validation half, **no** for record
identity/versioning (shape-to-data binding is by convention) · P3 n/a (validates edges,
doesn't define them) · P4 **no** (though SHACL-UI generates editors) · P5 **partial**
(validation engines slot into CI/agent pipelines; no write workflow) · P6 **yes**.

**Verdict:** Not a competitor but the lineage's answer to one SRS property (typed
validation), delivered as a bolt-on rather than built-in. SRS's difference: types,
instances, and validation live *in the same portable container* with a single resolution
rule.

## I.5 Wikibase / Wikidata

Wikidata is the largest working typed-record system on Earth: **~122.5 million items** as of
2026 ([wikidata.org](https://www.wikidata.org/)), each a record of typed statements
(property → value with datatypes, qualifiers, references, ranks). Wikibase, the software
behind it, is [self-hostable](https://wikiba.se/) as Wikibase Suite (containers) or
[wikibase.cloud](https://meta.wikimedia.org/wiki/Wikibase/Wikibase.cloud). **Status:**
Wikidata is intensely active; the self-hosting story is much smaller than advertised — an
[independent December 2025 analysis found roughly 33 detectable Wikibase Suite installations](https://addshore.com/2025/12/how-much-is-wikibase-suite-and-deploy-used/),
and wikibase.cloud spent 2025 on a
[sustainability-focused strategic reset](https://lists.wikimedia.org/hyperkitty/list/wikibase-cloud@lists.wikimedia.org/thread/5XOVK76ZL6IMX55JSWRUYJMKZ35VSKRL/)
(DSA compliance, MW 1.43 upgrade). **Portability is the known weakness:** exports (JSON/RDF
dumps) are complete, but identifiers (Q/P numbers) are instance-local — moving data between
Wikibases requires property re-mapping, and cross-Wikibase federation remains a
long-standing pain point. Statements-as-edges is the richest relation model in this survey:
every claim carries qualifiers, source references, and ranks (including deprecation — a
lifecycle notion).

**Properties:** P1 **partial** (dumps are portable data, but a Wikibase is a heavyweight
live service, and IDs don't survive transplantation) · P2 **yes** (typed
properties/datatypes; but constraint violations are advisory reports, not hard validation,
and there's no UUID-stable cross-instance field identity) · P3 **yes** (statements = typed
edges with provenance, qualifiers, ranks, deprecation) · P4 **partial** (statements are
canonical; infoboxes/UI are projections) · P5 **partial** (mature write API used by bot
fleets for a decade; validation advisory) · P6 **partial** (open source, but the spec *is*
the implementation).

**Verdict:** Proof at scale that typed records + provenance-bearing relations work and that
humans+bots can co-author them. But it is a *service*, not a *document*: no self-contained
portable unit, no globally stable IDs, no hard validation. SRS is roughly "Wikibase's data
model, made portable, hard-validated, and shrunk to a directory."

## I.6 Semantic MediaWiki

SMW embeds typed property annotations (`[[Has population::1234]]`) directly in wikitext,
harvesting them into a queryable store — the canonical "documents with embedded typed
annotations" system, in production since 2005. **Status:** quietly alive and maintained:
[SMW 6.0.1 released August 26, 2025](https://www.semantic-mediawiki.org/wiki/Semantic_MediaWiki_Version_History),
a steady 5.x→6.x cadence through 2025 with MW 1.43 LTS / PHP 8.4 support
([Professional Wiki](https://professional.wiki/en/news/semantic-mediawiki-5-released)),
roadmap current to late 2025. Sustained by a consultancy ecosystem serving corporate wikis;
no growth story.

**Properties:** P1 **no** (data lives inside a MediaWiki; XML dumps are not semantic
containers) · P2 **partial** (typed properties; template+form stacks approximate typed
records; name-based identity, no UUIDs/versioned lineages, weak validation) · P3 **partial**
(properties are typed page→value edges; no provenance) · P4 **no — the inversion of SRS**:
human wikitext is canonical and semantics are extracted from it · P5 **partial** (MediaWiki
API; no validation contract) · P6 **partial** (spec = implementation).

**Verdict:** Twenty years of evidence for the annotate-the-prose architecture — and for its
ceiling: extracted semantics are only as reliable as free-hand wikitext. SRS's
records-canonical/prose-projected stance is the deliberate reversal of SMW's bet.

## I.7 W3C Web Annotations

The [Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) (W3C
Recommendation, February 2017) defines annotations as first-class JSON-LD records — a typed
claim (body, motivation, creator, timestamps) about a target (any resource, with
sophisticated fragment selectors). Structurally, an annotation is very close to an SRS
Relation: a provenance-bearing typed edge asserted about documents. **Status: dormant as a
standard.** The WG closed after 2017; the anticipated browser-native and federated
annotation layer ([WP Tavern's 2017 optimism](https://wptavern.com/web-annotations-are-now-a-w3c-standard-paving-the-way-for-decentralized-annotation-infrastructure))
never materialized. [Hypothesis](https://web.hypothes.is/blog/annotation-is-now-a-web-standard/)
remains the main living implementation, now a commercial education product; sources for its
current state are stale (2017–2022 material dominates), so its 2026 momentum is
uncharacterized. Dokieli (below) is the other serious consumer.

**Properties:** P1 **no** · P2 **partial** (annotations are typed, ID'd records — but one
fixed type) · P3 **yes** in miniature (typed, provenance-carrying claims about resources) ·
P4 **no** · P5 **partial** (the Web Annotation Protocol defines LDP-based read/write; barely
implemented anywhere) · P6 **yes**.

**Verdict:** A well-designed fragment of the SRS picture — the relations/claims layer only —
orphaned without a container, record system, or adoption engine. Useful vocabulary precedent
for SRS-style `evidences`-type claims.

## I.8 Frictionless Data / Data Package

A Data Package is a directory (or zip) with a `datapackage.json` **manifest** listing
resources, each optionally typed by Table Schema (field names, types, constraints) — the
closest *structural* match in this survey to the SRS repository layout (manifest + index +
typed content + validation tooling). **Status: alive and institutionally healthy.**
[Data Package v2.0 shipped June 26, 2024](https://datapackage.org/blog/2024-06-26-v2-release/)
(NLnet-funded, new home at [datapackage.org](https://datapackage.org/), adding `$schema`
self-versioning, a package `version` property, improved extensibility), with ongoing
2024–2026 integration work: a
[CKAN datapackage.json endpoint extension, a proposed Zenodo/InvenioRDM serializer](https://blog.okfn.org/2024/06/26/data-package-version-2-0-release/),
OKFN's Open Data Editor, and mature multi-language libraries
([Python](https://pypi.org/project/datapackage/), [R/rOpenSci](https://ropensci.r-universe.dev/frictionless)).
Its adopters are open-data portals and research-data workflows.

**Properties:** P1 **yes** — the exemplar: self-contained directory, manifest, resource
index · P2 **partial** (field-level types and constraints for *tabular rows*; no stable
field UUIDs, no cross-package semantic field identity, no record tiers) · P3 **no** (foreign
keys within a package; no semantic relations) · P4 **no** (data-first; humans get a README)
· P5 **partial** (`frictionless validate` is a real CLI validation contract; no agent write
workflow) · P6 **yes**.

**Verdict:** SRS's container architecture with none of its semantics. "Data Package is to
CSV what SRS wants to be to meaning" is a fair one-liner. Its decade of survival shows the
manifest-directory-validation pattern is sound and adoptable; its confinement to tabular
data is the gap SRS fills.

## I.9 Dokieli, Nanopublications, Micropublications

**Dokieli** ([dokie.li](https://dokie.li/docs), Sarven Capadisli) — a clientside editor
producing self-contained HTML+RDFa articles wired into Web Annotations, Linked Data
Notifications, ActivityPub, and Solid storage. Status: alive but a passion project —
[10+ years old, roadmap refreshed June 2025](https://csarven.ca/cv), used as an
[HTML submission path at ESWC 2025](https://2025.eswc-conferences.org/html-submission-guide/),
tiny community ([Open Collective](https://opencollective.com/dokieli)). Properties: P1
**partial** (a single HTML file is genuinely portable and self-describing), P2 **no**, P3
**partial** (typed citations/annotations), P4 **no** (prose-canonical with embedded RDFa —
the SMW inversion again), P5 **no**, P6 **yes**. Verdict: the most literal "semantic
document" in the lineage, but semantics-as-garnish on a human document.

**Nanopublications** — each nanopub is a tiny, immutable, cryptographically identified
(Trusty URI content hash), signed RDF bundle of exactly three named graphs: assertion,
provenance, publication info. Retraction/supersession are explicit relations between
nanopubs — a lifecycle model SRS would recognize. Status: alive in the eScience niche — the
[Knowledge Pixels](https://knowledgepixels.com/) company runs
[Nanodash](https://github.com/knowledgepixels/nanodash) with active 2025–2026 releases,
publisher-facing services, [incubator projects extended into 2026](https://knowledgepixels.com/),
and an ESWC 2025 tutorial. Properties: P1 **yes at micro-scale** (each nanopub is a
self-contained portable semantic record), P2 **partial** (Nanodash templates impose ShEx-ish
shapes; the base model is open RDF), P3 **yes** (assertions plus inter-nanopub
supersession/retraction, all provenance-signed), P4 **partial** (machine-canonical; Nanodash
renders human views), P5 **partial** (publish/sign/query APIs; template-guided creation),
P6 **yes**. Verdict: the strongest existing answer to "a portable, provenance-bearing
semantic record" — but atomized to single claims, with no container composing heterogeneous
records into a *document*, and adoption confined to scholarly communication.

**Micropublications** — the [Clark, Ciccarese & Goble 2014 ontology](https://link.springer.com/article/10.1186/2041-1480-5-28)
for claims-evidence-argument structure in biomedical papers. Status: **dormant** — an
influential paper, no maintained tooling or active community since the mid-2010s. Verdict:
historical reference only; its argumentation model (claims supported/challenged by evidence)
prefigures SRS's `evidences` relation.

## I.10 The 2024–2026 wave: linked-data-meets-LLM "portable knowledge"

The striking development is that the *problem statement* of SRS went mainstream in
2024–2026, while the *solutions* abandoned the semantic-web toolchain entirely in favor of
markdown:

- **Google's Open Knowledge Format (OKF)** — published as
  [v0.1 draft in June 2026](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
  ([openknowledgeformat.com](https://www.openknowledgeformat.com/), coverage by
  [Document360](https://document360.com/blog/open-knowledge-format/),
  [MindStudio](https://www.mindstudio.ai/blog/what-is-open-knowledge-format-okf-google-ai-knowledge-bases)).
  A "knowledge bundle" is a plain directory of markdown files, one concept per file, YAML
  frontmatter with a single **required but uncontrolled** `type` string, path-based
  identity, untyped markdown links ("link semantics emerge from surrounding prose"),
  reserved `index.md`/`log.md`, and deliberately permissive validation (consumers MUST
  tolerate unknown types, broken links, missing fields). Properties: P1 **yes** (portable
  bundle — though no manifest; the directory *is* the index), P2 **weak partial** (a type
  *label*, no schema, no validation, no versioned field semantics), P3 **no**, P4 **no**
  (markdown is simultaneously the human and machine form), P5 **partial** (built for agent
  *reading*; writing is trivial but ungoverned), P6 **yes**. Too new (one month old) to have
  measurable adoption. (See also Part III §8 for the spec-text verification.)
- **llms.txt** — the 2024 Answer.AI convention for site-level agent indexes;
  [5–15% website adoption by early 2026 with vendor uptake but no standards-body backing and
  no confirmed production consumption by any major lab; Google explicitly ignores it](https://presenc.ai/research/state-of-llms-txt-2026)
  ([Google's June 2026 statement](https://baselinelabs.ai/blog/llms-txt-google-search)). An
  index convention, not a record system — evidence of demand for agent-legible knowledge,
  nothing more.
- **Portable Agent Memory** ([arXiv 2605.11032](https://arxiv.org/html/2605.11032v1), 2026)
  — an academic protocol for provenance-verified transfer of agent memory between
  heterogeneous LLM systems; early, uncited, but signals the "portable typed knowledge with
  provenance" frame arriving from the agents side. Microsoft GraphRAG and kin, by contrast,
  emit internal pipeline artifacts (entity/community tables), not portable interchange
  formats — not competitors.

**Verdict on the wave:** the market has validated SRS's premise (agents need self-contained,
portable, structured knowledge) and is currently betting on the opposite end of the rigor
spectrum — untyped markdown with vibes-based linking. OKF is what you get optimizing for
zero-friction adoption; SRS is what you get optimizing for validity, identity, and
longevity. History (SMW, schema.org data quality) suggests the untyped end hits a
reliability ceiling; history (RDF) equally warns the typed end can price itself out of
adoption.

---

# Part II — Modern protocols and app-layer object models

## II.1 AT Protocol (Bluesky) — the closest live protocol-level analog

An atproto identity (DID) owns a signed repository — a Merkle Search Tree of records,
exportable as a single [CAR file](https://atproto.com/specs/repository) — where every record
is typed by a [Lexicon](https://atproto.com/specs/lexicon) schema (a JSON-schema-like IDL
with NSID namespaces and validation). Records are machine-canonical (DAG-CBOR), rendered by
apps. This is structurally the closest protocol-level relative of SRS: portable signed
containers of schema-validated typed records with global identifiers. The gaps: relations
are just `at://` URI references inside record fields — there is no first-class relation
entity with its own type registry, provenance, or direction semantics; there is no tiered
path from free text to full typing; and repos are account-scoped event streams, not
document-scoped bundles you hand to someone (a repo is *your* data across all apps, not *a
document*). The non-social ecosystem is real and growing in 2025–2026:
[Standard.site](https://brennan.day/publishing-my-eleventy-blog-to-the-atmosphere-with-standard-site/)
publishes blogs as records; [Leaflet](https://atproto.leaflet.pub/3lpqbxpesa224) built a
block-based longform lexicon with its own comment records;
[Tangled](https://bmannconsulting.com/notes/beyond-microblogging-atproto/) does git
collaboration with self-hosted "knots"; Streamplace does video with an
[embedded PDS](https://streamplace.leaflet.pub/3lut7mgni5s2k); and the spec now defines
[lexicon publishing as records](https://underreacted.leaflet.pub/3mjfjsk24qk2i)
(`com.atproto.lexicon.schema` + DNS authority verification), making the schema layer itself
portable and discoverable — very close in spirit to SRS packages.

**Mapping:** P1 partial (portable signed repo, but account-scoped, not document-scoped; no
per-document manifest) · P2 yes (Lexicon validation, versioned NSIDs) · P3 partial (typed
refs in fields, not first-class edges) · P4 yes · P5 partial (excellent HTTP/XRPC + `goat`
CLI tooling; not agent-contract-designed) · P6 yes (open spec, multiple implementations).

**Status:** very active — the healthiest ecosystem in this survey
([mackuba's 2025 intro](https://mackuba.eu/2025/08/20/introduction-to-atproto/),
[2026 developer overview](https://jeffbailey.us/blog/2026/05/25/what-is-atproto/)).

**Verdict:** nearest *protocol* neighbor. It solved schema governance and identity at
network scale but has no "document as unit of exchange" and no relation layer. An atproto
repo can serve as a general semantic *account*; making it a general semantic *document*
would require exactly the container/relation machinery SRS defines.

## II.2 Block Protocol / HASH — the ideas survived; the standard didn't take off

The [Block Protocol](https://blockprotocol.org/) (Þ) standardized typed entities (entity
types composed of property types with URIs and versions — strikingly close to SRS
Fields/Types) flowing between blocks and embedding applications. As an *ecosystem* it
stalled: the WordPress/Figma expansion on the [roadmap](https://blockprotocol.org/roadmap)
never materialized publicly, and the
[monorepo](https://github.com/blockprotocol/blockprotocol) (1.4k stars, last commit
2026-07-01 per the GitHub API) is maintained essentially as HASH infrastructure. (A "$BLOCK"
token listed on [CoinGecko](https://www.coingecko.com/en/coins/blockprotocol) appears to be
an unaffiliated project trading on the name — no link to HASH found.) HASH itself pivoted
the type system into its product: [hash.ai](https://hash.ai/) now pitches "Graph-backed
world models for better AI" — self-building knowledge graphs of typed entities grounding AI
agents, with recent [blog](https://hash.ai/blog) work on process foundation models and
Petri-net agents. So the typed-entity ontology lives on, but as a hosted knowledge-graph
platform, not a portable document format.

**Mapping:** P1 no (web-app graph, not a portable container) · P2 yes (versioned,
URI-addressed entity/property types) · P3 partial (graph links between entities, weaker
relation typing than SRS) · P4 partial (blocks render entities) · P5 partial (post-pivot:
agents-on-graph is the pitch, via API not open contract) · P6 partial (spec open but
effectively single-vendor).

**Status:** Block Protocol dormant-as-standard; HASH active, pivoted to AI knowledge graphs.

**Verdict:** the closest *type-system* ancestor — its entity/property-type versioning is
nearly isomorphic to SRS's Field/Type layer — but it abandoned portability for a platform. A
cautionary tale about launching a standard without a killer self-contained artifact.

## II.3 Anytype — local-first typed objects, open protocols, weak export story

[Anytype](https://anytype.io/) is a local-first, E2E-encrypted editor where everything is a
typed Object with user-defined Types and Relations (properties *and* links are both called
"relations"), synced via the open [any-sync](https://github.com/anyproto/any-sync) protocol
and stored in the protobuf-based [any-block](https://github.com/anyproto/any-block) format.
Conceptually it ticks P2 and P3 better than almost anyone: types are first-class, relations
are named and typed. In 2025–2026 it shipped a
[Local API, developer portal, and official MCP server](https://community.anytype.io/t/api-developer-portal-mcp/27945),
with the API [actively evolving](https://developers.anytype.io/docs/reference/changelog/)
(anytype-heart v0.50.7, June 2026) — so agent read/write is now real. Portability is the
weak point: [export](https://doc.anytype.io/anytype-docs/advanced/data-and-security/import-export)
is Markdown/CSV/HTML (lossy) or the Any-Block protobuf format (faithful but effectively
Anytype-only); there is no neutral, validated, self-describing bundle a third party could
consume without Anytype's stack.

**Mapping:** P1 partial (local-first space, protobuf export; no neutral manifest'd bundle) ·
P2 yes (typed objects, though validation is app-enforced not spec-enforced) · P3 yes (named
typed relations, first-class) · P4 partial (canonical any-block, rendered UI — but canonical
form is app-internal) · P5 partial→yes (Local API + official MCP, 2025–26) · P6 partial
(protocols open-sourced, single implementation, no independent spec-conformance story).

**Status:** active, growing developer surface.

**Verdict:** nearest *application* neighbor on the data model; farthest on interchange.
Anytype shows the demand for typed objects+relations in PKM, and its MCP move validates
SRS's agent thesis — but its "document" cannot leave home losslessly.

## II.4 Tana / Capacities / Notion — object-based PKM: typed, mostly captive

**Tana**: supertags are schema-defining tags with typed fields — a genuine type system. The
[Tana Intermediate Format](https://github.com/tana-inc/tana-import-tools) is an open JSON
format, but for *import*; export is JSON/Markdown dumps. In 2025–2026 Tana shipped a
[Local API and MCP server](https://github.com/jcfischer/supertag-cli) plus an
[Input API](https://tana.inc/docs/input-api) that exposes per-supertag API schemas — agents
can now read/write typed nodes. Cloud-captive data, closed format. **Capacities**: object
types with typed properties; [automated local export](https://capacities.io/whats-new/release-48)
to Markdown+frontmatter+CSV zips and an [API 2.0](https://capacities.io/whats-new/release-67)
— better-than-average egress, but export is a lossy projection, not a canonical format.
**Notion**: the API object model (blocks, pages, databases) got its biggest rework in years
with the [2025-09-03 "data sources" version](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03)
(databases become containers of multiple data sources) — a rich typed object model, entirely
proprietary and hosted.

**Mapping (all three):** P1 no · P2 partial (typed in-app; no portable validated schema) ·
P3 partial (Tana/Capacities have typed reference fields; Notion has relations between
databases) · P4 no (the app *is* the canonical store; exports are projections) · P5 partial
(Tana MCP+Local API, Notion API, Capacities API — but no validation contract an agent can
rely on offline) · P6 no.

**Status:** all active; Tana's MCP/Local API push (2026) is the notable move.

**Verdict:** these prove the *demand* (typed personal objects + AI access) while
demonstrating the *gap* SRS targets: none can emit a self-contained, validated, typed
document.

## II.5 Automerge / Ink & Switch — portable containers, deliberately schema-less

[Automerge](https://automerge.org/) documents are the best pure realization of P1: a CRDT
document is a self-contained, binary, merge-capable container you can sync anywhere, and
[Automerge 3.0](https://automerge.org/blog/automerge-3/) (Aug 2025) made it
production-serious (10–100x memory reduction, Rust core). But the payload is untyped
JSON-like data — schema is the application's problem. The typed-schema attempts in this
lineage are instructive: [Cambria](https://www.inkandswitch.com/cambria/) (bidirectional
schema-migration lenses) has been dormant since 2021 (last commit to cambria-project:
2021-03-05, per GitHub API); the "Embark" essay explored gradually-typed dynamic documents;
and the current research — [Patchwork](https://www.inkandswitch.com/project/patchwork/)
(universal version control over Automerge docs, per
[Geoffrey Litt's write-up](https://buttondown.com/geoffreylitt/archive/towards-universal-version-control-with-patchwork/)),
PlayBook (dynamic notebooks, per [Dispatch 015](https://www.inkandswitch.com/newsletter/dispatch-015/),
March 2026), and the [Malleable Software essay](https://www.inkandswitch.com/essay/malleable-software/)
(June 2025) — pursues universal *documents* and *tools*, not universal *semantics*. Their
bet is that structure should stay soft and end-user-moldable; SRS bets that agents need
hard, validated structure.

**Mapping:** P1 yes (the strongest container story here) · P2 no (no schema/validation
layer; Cambria dormant) · P3 no (no relation primitive between documents) · P4 partial
(canonical binary doc, rendered views) · P5 partial (great libraries; no semantic contract)
· P6 yes for Automerge itself (spec + multiple bindings).

**Status:** very active (lab, Automerge 3, Local-First Conf 2026).

**Verdict:** complementary rather than competitive: Automerge answers "how does the
container sync and merge," SRS answers "what do the contents mean." A future SRS transport
could plausibly sit on Automerge; nothing in this lineage occupies SRS's semantic layer.

## II.6 Fedwiki — the 2011 prototype of the portable JSON page

Ward Cunningham's [Federated Wiki](https://en.wikipedia.org/wiki/Federated_Wiki) made every
page a portable JSON object (title + `story[]` of typed items + `journal[]` of edit actions)
that any server can fork, with provenance carried in the journal. It anticipated P1
(page-as-portable-JSON), P4 (JSON canonical, HTML rendered), and even crude item typing
(paragraph, image, plugin types — behavioral, not semantic). No schemas, no validation, no
typed relations (links are untyped names). Still quietly alive: v0.38.5 released October
2025, maintained by a small community ([github.com/wardcunningham](https://github.com/wardcunningham),
[fed.wiki.org](http://fed.wiki.org/federated-wiki.html)).

**Mapping:** P1 partial · P2 no · P3 no · P4 yes · P5 no · P6 partial (de-facto format, one
main implementation).

**Status:** alive, niche, low activity.

**Verdict:** honorable ancestor — proof that "document as forkable JSON with provenance"
works — but two generations behind on typing and agents.

## II.7 Ceramic / ComposeDB — dead branch, cause of death worth noting

Ceramic offered mutable signed event streams with
[ComposeDB](https://developers.ceramic.network/docs/introduction/composedb-overview) adding
typed, GraphQL-composable data models — decentralized typed records with schema reuse across
apps. In 2025 the team (now Recall Labs, post-Textile merger)
[announced](https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/) it was
deprecating js-ceramic and ComposeDB entirely, shutting down the Ceramic Anchor Service, and
pivoting to Recall, an AI-agent reputation platform; `ceramic-one` remains as a minimal
standalone. ComposeDB-dependent apps were told to migrate or break.

**Mapping (as designed):** P1 no (network streams, not portable bundles) · P2 yes (typed
models, validated) · P3 partial (model relations) · P4 yes · P5 no (pre-agent era) · P6
partial.

**Status:** effectively discontinued (2025).

**Verdict:** a warning: typed decentralized records tied to network infrastructure
(anchoring, indexers) die when the infrastructure's economics fail. SRS's file-based,
infrastructure-free container is the opposite design choice.

## II.8 Noosphere / Subconscious — defunct; the sphere idea remains relevant

Gordon Brander's [Noosphere](https://newsletter.squishy.computer/p/noosphere-a-protocol-for-thought)
proposed the "sphere": a user-owned, key-signed, versioned content space of plain-text notes
with petname-based addressing between spheres — "a protocol for thought" with IPFS-style
content addressing. Subconscious (the app)
[wound down in May 2024](https://newsletter.squishy.computer/p/subconscious-is-winding-down)
("difficult technical headwinds and missed market window"); the
[noosphere repo](https://github.com/subconsciousnetwork/noosphere) is archived (last push
July 2024, `archived: true` per GitHub API). Brander's own post-mortem noted the world had
shifted toward personal AI — i.e., toward exactly the agent-consumption use case SRS is
built for. Spheres were P1-shaped (portable, signed, versioned, manifest-like) but
deliberately untyped (plain subtext notes, untyped slashlinks).

**Mapping:** P1 yes (in design) · P2 no · P3 no · P4 partial · P5 no · P6 partial (open
source, single dead implementation).

**Status:** defunct; successor spirit continues in Chris Joel's "Familiar."

**Verdict:** validated the portable-personal-corpus container; died before adding semantics.
SRS is roughly "Noosphere's sphere + Block Protocol's types + a relation algebra."

## II.9 Obsidian (properties + Bases + JSON Canvas) / Logseq DB — de-facto formats growing type systems

Obsidian's markdown+YAML-frontmatter vault is the largest de-facto portable knowledge
format, and it is getting steadily more typed: properties are typed metadata
(text/number/date/list/checkbox), and
[Bases](https://obsidian.md/changelog/2025-05-21-desktop-v1.9.0/) (core plugin, early access
May 2025, now mature) turns property-bearing notes into database views via an open `.base`
YAML syntax — [effectively a schema-lite database over files](https://obsidian.rocks/getting-started-with-obsidian-bases/).
[JSON Canvas](https://obsidian.md/blog/json-canvas/) (open-sourced March 2024,
[MIT spec](https://github.com/obsidianmd/jsoncanvas)) did the same for spatial data.
Logseq's [DB version](https://github.com/logseq/docs/blob/master/db-version.md) went the
other way: beta [released July 13, 2026](https://discuss.logseq.com/t/whats-new-with-logseq-db-may-16th-2026/35020),
moving from markdown files to a real database with typed properties and classes, with the
markdown version in maintenance mode — trading its portable format for typed power. Across
this family: no validation contract, no stable IDs (links are names, which break on rename),
no typed relations (wikilinks are untyped), no manifest. But it is *the* substrate AI agents
actually read/write today, which is exactly why the "markdown-repo-as-database" pattern in
§II.12 exists.

**Mapping (Obsidian):** P1 partial (a vault is portable but has no manifest/identity) · P2
partial (typed properties, no validation, no versioned types) · P3 no (untyped wikilinks) ·
P4 no (prose is canonical; structure is annotation — the inverse of SRS) · P5 partial (files
are agent-friendly; zero contract) · P6 partial (de-facto open formats; JSON Canvas
genuinely spec'd).

**Status:** extremely active.

**Verdict:** the pragmatic rival: not close architecturally, but close in mindshare. SRS's
pitch against this family is precisely "what breaks when your links are strings and nothing
validates."

## II.10 Portable Text / ProseMirror JSON — structured rich text only

[Portable Text](https://www.portabletext.org/) ([spec](https://github.com/portabletext/portabletext),
stable-in-practice since 2018, formally still a working draft) and ProseMirror/TipTap JSON
both make prose machine-canonical: JSON arrays of typed blocks/marks, rendered to any target
— P4 done properly at the rich-text level, with open specs (P6 partial; Portable Text is
Sanity-stewarded). But scope stops at a single rich-text field: no container, no
cross-document typing, no relations, no agent contract.

**Mapping:** P1 no · P2 partial (typed blocks within text) · P3 no · P4 yes (their whole
point) · P5 no · P6 partial.

**Status:** both active and widely deployed.

**Verdict:** not a competitor but a candidate *component* — an SRS `text` field could
plausibly carry Portable Text-style structured prose instead of flat text.

## II.11 Nostr / ActivityPub — typed portable objects, thin semantics (brief)

[Nostr](https://nostr.org/) events are signed, portable, kind-numbered JSON objects relayed
anywhere; the ["other stuff"](https://svetski.medium.com/beyond-the-feed-503abe5e4b24)
ecosystem (long-form kind 30023, wikis, git collaboration, marketplaces) shows kinds
functioning as a crude open type registry — but validation is by convention, "types" are
integers plus prose [NIPs](https://en.wikipedia.org/wiki/Nostr), tags are stringly-typed.
ActivityPub/ActivityStreams 2.0 gives JSON-LD-typed objects with a vocabulary and
extensibility, but objects live on servers (portability is the ecosystem's known weak point)
and validation is famously loose. Both: P1 no/partial, P2 partial, P3 no (references, not
typed first-class edges), P4 yes, P5 no, P6 yes (open specs, many implementations). Both
active (Nostr growing, Fediverse steady). Verdict: portable *messages*, not portable
*documents*.

## II.12 "Portable objects for AI agents" (2024–2026) — the converging front

This is where new energy is. **[Letta's Agent File (.af)](https://www.letta.com/blog/agent-file)**
(April 2025, [open format](https://github.com/letta-ai/agent-file)) serializes a stateful
agent — memory blocks, tools, config — into a single portable, checkpointable file; it's
"PDF for an agent" rather than "PDF for meaning," but it's the same architectural instinct
(P1 yes, P2 partial, P3 no, P6 partial). **[Basic Memory](https://basicmemory.com/)**
([repo](https://github.com/basicmachines-co/basic-memory)) builds a semantic knowledge graph
as human-readable Markdown files with entity/relation conventions, read/written by agents
over MCP — a markdown-repo-as-database with an explicit agent contract (P5 partial-yes,
P2/P3 partial via conventions, no validation).
**[OpenMemory](https://mem0.ai/blog/state-of-ai-agent-memory-2026)** (Mem0) pitches
local-first portable memory across MCP tools; Zep, LangGraph stores et al. keep structured
memory server-side. Academic work like
["Portable Agent Memory"](https://arxiv.org/html/2605.11032v1) (2026) proposes
provenance-verified memory transfer between heterogeneous agents. Meanwhile the
[markdown-first agent-memory pattern](https://dev.to/whoffagents/multi-agent-memory-without-a-vector-database-the-markdown-first-approach-2lo0)
(AGENTS.md, CLAUDE.md, skills folders) is the folk version: plain files, zero validation,
agent-and-human reading the same bytes. Every one of these has *some* of SRS's six
properties; none has typed validated records + first-class relations + a portable manifest'd
container simultaneously.

**Status:** rapidly evolving; formats are young and mostly single-vendor.

**Verdict:** this is SRS's actual market timing signal — the agent ecosystem is groping
toward portable, validated, human-co-readable structure and currently choosing between
"untyped markdown" and "proprietary memory service."

---

# Part III — Structured-document formats and AI-native conventions

## III.1 Classic structured authoring

### DITA (OASIS)

DITA is the archetype of topic-based semantic markup: typed topic elements with
specialization (a formal type-derivation mechanism), keyref/conref indirection, relationship
tables, and single-source publishing through the DITA Open Toolkit
([dita-ot.org](https://www.dita-ot.org/)). Current standard is still DITA 1.3 (2015, errata
2018); DITA 2.0 remains in OASIS TC working drafts — the most recent public working draft is
WD39, dated 29 August 2024
([groups.oasis-open.org](https://groups.oasis-open.org/discussion/dita-20-specification-working-draft-pdf-uploaded)),
with no evidence of a 2.0 Committee Specification or OASIS Standard as of mid-2026 — a
decade-long revision cycle that is itself a lesson. On AI: the DITA world's 2025–2026 pitch
is "structured content is AI-ready content" — CCMS vendors (Paligo, Author-it, MxContent,
Adobe AEM Guides) now market RAG-ready JSON exports and LLM-assisted authoring on top of
DITA repositories
([paligo.net](https://paligo.net/blog/how-structured-authoring-delivers-ai-ready-content-in-the-age-of-generative-ai/),
[author-it.com](https://www.author-it.com/resources/structured-content-for-ai-llm-documentation),
[cmswire.com](https://www.cmswire.com/content-strategy/what-every-ccms-leader-needs-to-know/)),
but this is AI as consumer/assistant of DITA content, not a validated agent write-path in
the standard itself.

**Mapping:** P1 partial (map + topic source trees are portable, but no standard
container/manifest); P2 yes at element level (grammar-validated typed elements; keys are
scoped names, not UUIDs — identity breaks across repositories, which SRS fixes with UUID
lineages); P3 partial (reltables, conref, keyref are typed link mechanisms but bound to
publishing structure, not arbitrary semantic edges with provenance); P4 yes — single-source
multi-projection is DITA's founding idea and SRS's clearest inheritance; P5 no; P6 yes.

**Status:** healthy-but-plateauing; spec activity slow, tooling active.

**Verdict:** SRS reinvents DITA's projection discipline and improves on its weakest points
(global identity, cross-repo portability, relations as data rather than markup) — but DITA
has 20 years of proof that organizations will pay for exactly this discipline.

### DocBook (OASIS)

Element-rich book/article markup, older lineage than DITA, validated by RELAX NG. DocBook
5.2 became an OASIS Standard on 6 February 2024
([oasis-open.org](https://www.oasis-open.org/2024/02/13/the-docbook-schema-version-5-2-oasis-standard-published/))
— active maintenance, mature, but no record model, no container, no relations beyond
linking, no AI story. **Mapping:** P1 no, P2 element-level only, P3 no, P4 yes, P5 no, P6
yes. **Verdict:** ancestral; validated-markup lineage only.

### TEI (Text Encoding Initiative)

The richest semantic vocabulary in the family — hundreds of typed elements for scholarly
text, plus attributes SRS-adjacent in spirit: `@cert` (confidence), `@resp` (asserting
agent), stand-off annotation pointing into text. Actively maintained on a six-month cycle;
P5 Guidelines reached v4.11.0 on 18 February 2026 ([tei-c.org](https://tei-c.org/guidelines/p5/),
[news](https://tei-c.org/news/2025/09/04/patch-release-tei-guidelines-4-10-2/)).

**Mapping:** P1 no; P2 partial (deep element typing + ODD customization schemas, but
markup-on-text, not field/record structure); P3 partial (stand-off linking and
certainty/responsibility metadata anticipate SRS's relation provenance —
`assertedBy`/`confidence` have a direct TEI ancestor); P4 partial; P5 no; P6 yes.

**Verdict:** the scholarly proof that "semantic claims about content, with provenance" is
viable — but as annotation, not as records.

### JATS (NISO Z39.96)

Journal-article interchange XML; JATS 1.4 was approved as ANSI/NISO Z39.96-2024 on 31
October 2024, adding multi-language document support
([niso.org](https://www.niso.org/publications/z3996-2024-jats),
[jats.nlm.nih.gov](https://jats.nlm.nih.gov/publishing/1.4/)). The entire scholarly pipeline
(PubMed Central, publishers) runs on it. **Mapping:** P1 partial (de-facto article packages,
no spec'd manifest); P2 element-level; P3 no; P4 yes (XML canonical, HTML/PDF rendered); P5
no; P6 yes. **Verdict:** proof that machine-canonical + rendered-projection works at
ecosystem scale in one vertical.

### S1000D (ASD)

Aerospace/defense technical publications — and the classic format *structurally* closest to
SRS: content lives as **data modules**, each with a globally structured identifier (DMC),
status/applicability metadata, held in a **Common Source DataBase (CSDB)**, assembled into
publications via data-module lists, interchanged with formal transfer packages, rendered to
IETP/PDF projections. That is instanceIndex + records + views, circa 2003. Issue 6 is the
current release ([s1000d.org](https://s1000d.org/); the sub-page did not yield a firm Issue
6 date — treat the "latest issue" claim as verified, the release date as not). AI activity
is research/vendor-level automation, not spec-level
([ProQuest example](https://www.proquest.com/scholarly-journals/automation-s1000d-standard-using-artificial/docview/2777751007/se-2)).

**Mapping:** P1 yes-ish (CSDB + interchange packages); P2 yes (validated modules, structured
IDs — though semantic IDs, not opaque UUIDs); P3 partial (typed cross-references and
applicability, not free semantic edges); P4 yes; P5 no; P6 partial (spec free to access,
ecosystem heavily commercial).

**Verdict:** the strongest existence-proof for "repository of identified, validated
record-units with projections" — at the cost of enormous ceremony. SRS is, in one reading,
S1000D's architecture at wiki-weight with an agent write-path.

## III.2 Stencila

Stencila ([stencila.io](https://stencila.io/)) is a platform for "programmable documents":
v2 is a ground-up Rust rewrite in which every document is a tree of typed nodes conforming
to the **Stencila Schema** — "the canonical model for representing documents, data, code and
execution," largely based on schema.org with extensions
([github.com/stencila/stencila](https://github.com/stencila/stencila/blob/main/README.md),
[stencila.io/docs/schema](https://stencila.io/docs/schema/)). Documents are stored via
Automerge CRDTs; codecs project the canonical node tree to/from Markdown, JSON, JSON-LD,
JATS, HTML and more. Critically for this survey, v2's stated aim is to "bake in, rather than
bolt on, new modes of interaction between authors and LLM assistants," including recording
"the actor, human or LLM, that made the change" — i.e., AI-write with provenance is a design
goal, and 2026 releases added a terminal UI for multi-agent chat sessions driving documents
([CHANGELOG](https://github.com/stencila/stencila/blob/main/stencila/CHANGELOG.md), activity
through February 2026).

**Mapping:** P1 partial (self-contained documents and lossless JSON, but no
repository/manifest container concept); P2 yes (typed, schema-validated nodes — node-level
rather than SRS's field-atom level, and no UUID+integer-version lineage discipline); P3 no
(tree containment and cross-refs, not first-class typed edges between independent records);
P4 yes (canonical node model, formats as codec projections); P5 partial-to-yes (explicit
human+LLM co-authoring with edit provenance; no external validating CLI contract as the
agent interface, though the CLI exists); P6 yes (Apache-2.0, schema published
independently).

**Status:** active but small (under 1k GitHub stars; niche scholarly adoption).

**Verdict:** the nearest neighbor on philosophy — typed canonical model, projections,
human+machine authorship — but document-scoped, not repository-scoped, and without the
relation graph.

## III.3 MyST Markdown / Jupyter Book 2 / Curvenote, and Quarto

**MyST/JB2:** MyST Markdown defines typed directives/roles parsed by the MyST Document
Engine into a **standardized JSON AST governed by the MyST Document Specification**; Jupyter
Book 2, released November 2025 as an official Jupyter subproject, is built on it
([discourse announcement](https://discourse.jupyter.org/t/announcement-weve-released-jupyter-book-2/38081),
[blog](https://blog.jupyterbook.org/posts/2025-11-04-why-make-a-major-release/),
[SciPy 2025 paper](https://proceedings.scipy.org/articles/hwcj9957)). Curvenote is the
commercial co-developer and publishing platform, still actively upstreaming (e.g., the
`{anywidget}` AST node, April 2026 — [Jupyter blog](https://blog.jupyter.org/the-myst-anywidget-directive-daa55c348ab2)).

**Mapping:** P1 partial (project config + site bundles, not a semantic container); P2
partial (AST nodes are typed and spec-validated, but content is narrative, not field-typed
records); P3 no; P4 partial — and note the *inversion*: in MyST the human-authored markdown
text is the source of truth and the typed AST is derived, exactly opposite to SRS; P5
partial (machine-consumable AST; no agent write contract); P6 yes.

**Verdict:** the best current example of "typed AST + spec + multi-renderer" in the markdown
world; not a record system.

**Quarto:** Posit's pandoc-based publishing system; Quarto 1.9 (24 March 2026) ships
**LLM-friendly output — generating `llms.txt` and `.llms.md` for websites**
([quarto.org](https://quarto.org/docs/blog/posts/2026-03-24-1.9-release/)), and Quarto 2, a
full Rust rewrite, was announced for late 2026. The llms.txt feature crystallizes the
mainstream pattern: human-canonical source, with an *AI-readable projection* bolted on — the
mirror image of SRS's machine-canonical source with a *human-readable projection*.

**Mapping:** P1 no, P2 no, P3 no, P4 partial-inverted, P5 read-only partial, P6 yes.

**Verdict:** instructive foil, not a neighbor.

## III.4 EPUB / W3C Publishing (brief)

EPUB is the packaging ancestor: an OCF ZIP container with a package document/manifest
listing every member resource — structurally the same move as `.srs` + `manifest.json` +
`instanceIndex`. EPUB 3.3 is a W3C Recommendation (2023) and EPUB 3.4 is in active Working
Draft under the Publishing Maintenance WG (drafts September 2025 and 5 March 2026; charter
runs to February 2027) ([w3.org/TR/epub-34](https://www.w3.org/TR/epub-34/),
[github.com/w3c/epub-specs](https://github.com/w3c/epub-specs)). **Mapping:** P1 yes (the
reference implementation of the idea); P2–P5 no; P6 yes. **Verdict:** container lineage only
— SRS's manifest-with-authoritative-index is EPUB's best idea applied to records instead of
resources.

## III.5 Office formats (brief)

OOXML (ISO/IEC 29500) and ODF remain actively maintained — ODF 1.4 was approved as an OASIS
Standard in late 2025, its 20th anniversary
([documentfoundation.org](https://blog.documentfoundation.org/blog/2025/12/03/tdf-announces-odf-v14-as-oasis-standard/))
— but both are presentation-canonical: the file records what the document looks like, and
every attempt to layer semantics on top died. OOXML's Custom XML data binding — the one
genuinely semantic mechanism — was ripped out of Word after the i4i patent judgment
(2009–2010), Smart Tags were deprecated, and no successor emerged; "semantic office
documents" never had an economic constituency because the renderer, not the data, was the
product. **Mapping:** P1 yes (ZIP + manifest), everything else no. **Verdict:** cautionary:
a container standard without a semantic data model just standardizes the pixels.

## III.6 AI-native document/knowledge conventions, 2024–2026

The ecosystem has converged hard on **markdown-files-as-knowledge** — and almost uniformly
refuses types, IDs, and validation:

- **llms.txt** (Jeremy Howard/Answer.AI, September 2024): a root markdown file curating site
  content for LLMs. 2026 status: ~10% adoption across a 300k-domain SE Ranking sample, but
  **no major model provider consumes it in production and Google has said it won't**
  ([aeo.press state-of report](https://www.aeo.press/ai/the-state-of-llms-txt-in-2026),
  [codersera guide](https://codersera.com/blog/llms-txt-complete-guide-2026/)). Pure
  projection convention: P4 partial (a machine-facing rendering of a human site — SRS
  inverted), everything else no.
- **AGENTS.md** (August 2025, from OpenAI's Codex tooling): "a README for agents." Adopted
  by 60,000+ repos and ~all major coding agents; contributed to the **Agentic AI
  Foundation** (Linux Foundation; co-founded December 2025 by OpenAI, Anthropic, and Block)
  ([openai.com](https://openai.com/index/agentic-ai-foundation/),
  [factory.ai](https://factory.ai/news/agents-md)). Untyped freeform markdown by design:
  P1–P4 no, P5 read-side only, P6 yes (now foundation-stewarded).
- **MCP resources**: the Model Context Protocol's resource primitive gives agents
  URI-addressed, MIME-typed content with subscriptions; spec revisions 2025-06-18
  (structured tool output, resource links) and 2025-11-25 are stable, with a 2026-07-28
  release candidate in flight
  ([blog.modelcontextprotocol.io](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/),
  [changelog](https://modelcontextprotocol.info/specification/2025-11-25/changelog/)). MCP
  is *transport/access*, not a document format — but it is the strongest existing "validated
  agent contract" (P5) pattern, played at the protocol layer where SRS plays it at the CLI
  layer.
- **Agent Skills / SKILL.md** (Anthropic, October 2025; released as an open standard at
  [agentskills.io](https://agentskills.io/) in late 2025, stewarded openly with
  Discord/GitHub governance): a folder with a `SKILL.md` whose YAML frontmatter carries
  `name` and `description` at minimum, plus scripts/references, loaded by progressive
  disclosure. Verified directly from the site: adopted by an extraordinary client list —
  Claude Code, OpenAI Codex, Gemini CLI, Cursor, GitHub Copilot/VS Code, Goose, Letta,
  Databricks, Snowflake, dozens more. **Mapping:** P1 partial (portable folder bundle, no
  manifest); P2 minimal (two required frontmatter fields; no validation of content); P3 no;
  P4 no (markdown is canonical *and* the machine interface); P5 partial (built for agent
  consumption; authoring has no validation contract); P6 yes. This is the fastest-moving
  portable-knowledge-bundle standard in existence — with near-zero semantics.
- **Agent memory conventions** (CLAUDE.md / MEMORY.md / Letta MemFS): markdown files as
  persistent agent memory are now standard practice, with explicit pushback emerging
  ("Markdown is not agent memory," Zep, arguing for typed graph memory —
  [blog.getzep.com](https://blog.getzep.com/markdown-is-not-agent-memory/)). Nobody in this
  convention space has added record identity, versioning, or validation.

**The pattern:** the AI ecosystem has standardized *where knowledge lives* (folders of
markdown) and *how agents load it* (progressive disclosure, well-known paths) while
explicitly rejecting typed/validated content — so far.

## III.7 Portable verifiable claim containers

- **W3C Verifiable Credentials 2.0**: the full seven-spec family (data model, Data
  Integrity, cryptosuites, JOSE/COSE, status lists) reached W3C Recommendation on 15 May
  2025 ([w3.org](https://www.w3.org/news/2025/the-verifiable-credentials-2-0-family-of-specifications-is-now-a-w3c-recommendation/)).
  A VC is a self-contained, signed, typed claim graph (JSON-LD contexts + optional
  `credentialSchema` validation). **Mapping:** P1 partial (self-contained credential, not a
  document repository); P2 yes-ish (typed, optionally schema-validated claims with global
  identifiers); P3 partial (claims are typed subject–property–value triples; not an
  inter-record edge model with confidence/status); P4 no; P5 no; P6 yes. Overlap with SRS:
  `assertedBy`/`confidence`/provenance on relations is VC's problem restated inside a
  document format.
- **C2PA / Content Credentials**: spec line now at 2.x (2.3 January 2026; 2.4 published at
  [spec.c2pa.org](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html)),
  on an ISO fast-track, with 2026 production adoption by OpenAI, Google (Gemini/Search/Chrome
  rollout alongside SynthID), and Canon
  ([eyesift adoption survey](https://www.eyesift.com/faq/c2pa-content-credentials-2026-cryptographic-provenance-adoption/)).
  A C2PA manifest store is literally a signed container of typed assertions with typed
  ingredient relationships (parent/component) — provenance edges over media instead of
  records. **Mapping:** P1 yes (embedded/sidecar manifest container); P2 partial; P3 partial
  (typed ingredient relations, provenance-first); P4 no; P5 no; P6 yes.
- **KERI/ACDC**: the KERI suite — KERI, CESR, and **ACDC (Authentic Chained Data
  Containers)** — was formally ratified by Trust Over IP (now under LF Decentralized Trust)
  in January 2026 ([trustoverip.github.io/kswg-acdc-specification](https://trustoverip.github.io/kswg-acdc-specification/),
  [lfdecentralizedtrust.org](https://www.lfdecentralizedtrust.org/blog/a-day-in-your-life-with-keri)),
  with production use in the vLEI ecosystem. ACDCs are schema-bound
  (self-addressing-identifier-anchored JSON Schema), content-addressed containers whose
  **edge sections are first-class typed links to other ACDCs, forming DAGs with provable
  authorship** — the closest any spec comes to SRS's typed-relation model, but in the
  service of cryptographic chained provenance rather than document semantics. **Mapping:**
  P1 yes; P2 yes (mandatory schemas, stable identifiers); P3 yes-ish (typed, first-class
  chained edges); P4 no; P5 no; P6 yes.

**Verdict for the family:** these solve the *trust* half of "records with provenance" far
more rigorously than SRS, and none of them are authoring/document systems. An SRS repository
whose relations could be exported as VCs or whose records carried C2PA-style signatures
would be complementary, not competitive.

## III.8 The June 2026 "documents/knowledge for AI" entrants — direct-phrasing search

- **OKF — Open Knowledge Format** (Google Cloud, announced 12 June 2026, v0.1): "an open,
  human- and agent-friendly format" packaging organizational knowledge as **directories of
  markdown files with YAML frontmatter** — formalizing Karpathy's "LLM wiki" pattern
  ([cloud.google.com blog](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/),
  [spec on GitHub](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)).
  Verified directly from SPEC.md: identity is **the file path** ("the path of the concept's
  file within the bundle, with the `.md` suffix removed"); exactly **one required field,
  `type`**, whose values "are **not** registered centrally"; "there is no schema registry,
  no central authority, and no required tooling"; relations are plain markdown links where
  "the specific kind of relationship … is conveyed by the surrounding prose, not by the link
  itself"; **no manifest** (optional `index.md`). **Mapping:** P1 partial (portable
  directory, no manifest/authoritative index); P2 minimal (one uncontrolled type label; no
  fields, versions, or validation); P3 no (untyped links; typed edges explicitly deferred to
  "community-driven" future work); P4 no (markdown is simultaneously the human and machine
  form); P5 partial (agents read/write directly, zero validation contract); P6 yes.
  **Verdict:** *the same mission statement as SRS with every design decision inverted* —
  minimum ceremony, maximum adoption surface. It is simultaneously SRS's biggest validation
  (Google asserting that portable human+agent knowledge bundles need a standard) and its
  biggest adoption threat (worse-is-better).
- **DocLang** (LF AI & Data Foundation working group, launched 9 June 2026; founding members
  IBM, NVIDIA, Red Hat, ABBYY, HumanSignal): an open standard for **AI-native document
  representation**, standardizing Docling's `DoclingDocument` model — typed items (texts,
  tables, pictures), reading order, layout, parent/child references via JSON pointers,
  lossless JSON plus Markdown/HTML/DocTags exports
  ([linuxfoundation.org press release](https://www.linuxfoundation.org/press/lf-ai-data-foundation-launches-doclang-specification-working-group-to-advance-an-open-standard-for-ai-native-documents),
  [docling docs](https://docling-project.github.io/docling/concepts/docling_document/)).
  Explicit framing: "PDF, DOCX and JPEG were designed for human consumption, not machine
  interpretation." **Mapping:** P1 partial (single serialized document, no repository); P2
  partial-yes (schema-typed, pydantic/JSON-validated items — but layout types, not semantic
  domain types); P3 partial (structural parent/child pointers only); P4 *inverted* — the
  machine-canonical form is **derived from** human documents by parsing; it is an extraction
  target, not a system of record; P5 read-side yes (built for LLM ingestion), write-side no;
  P6 yes (vendor-neutral governance). **Verdict:** the industry's "PDF for meaning" — but
  meaning *recovered* from documents, not meaning *authored as* documents. DocLang answers
  "what did this PDF say"; SRS answers "what is true, and render me a document."
- **A2A / Agent Cards**: Agent2Agent v1.0 under the Linux Foundation (contributed June 2025;
  150+ supporting orgs by April 2026) uses typed JSON **Agent Cards** at
  `/.well-known/agent-card.json` for capability description
  ([linuxfoundation.org](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents)).
  Discovery metadata, not documents — no further overlap.
- Searches for "PDF for AI," "semantic document format," "machine-readable document
  standard," and "context files standard" surfaced **no other credible spec-level
  contender** — the rest of the results are PDF-parsing vendors (LlamaParse, Unstructured,
  Reducto-class tools) and AEO/SEO content. With moderate confidence: OKF and DocLang are
  the two real 2026 entries in this genre.

## III.9 Historical touchstone

Ted Nelson's Xanadu promised stable addresses, transclusion, and bidirectional typed links
in 1965 and shipped nothing usable in sixty years; Microsoft's OLE compound documents put a
structured-storage container inside every Office file but bound it to one vendor's runtime
and to presentation, not meaning; Apple/IBM's OpenDoc (with its Bento container format)
built genuinely component-based typed documents and was killed in 1997 for want of an
economic ecosystem. The graveyard's three lessons map directly onto SRS's risk register:
(1) semantic ambition without a shippable artifact dies (Xanadu) — SRS's answer is that a
repo is just files plus a CLI; (2) containers bound to one runtime die with the runtime
(OLE/OpenDoc) — SRS's answer is spec independence from the reference implementation;
(3) structured documents lose to unstructured ones unless the structure is what the dominant
reader/writer *wants* — and for the first time since 1997, the dominant new reader/writer
(the AI agent) actually prefers structure, which is the historical discontinuity SRS is
betting on.

---

## Confidence notes

GitHub metrics, W3C/OASIS/NISO publication dates, and spec-text quotations (OKF SPEC.md,
agentskills.io client list) were verified against primary sources on 2026-07-22. Kiro-class
secondary-source caveats from the SDD survey apply equally here: Hypothesis's 2026 momentum
is uncharacterized (stale sources); S1000D Issue 6's release date was not confirmed; the
"no other credible contender" conclusion in III.8 and the negative claims about
standards-records tooling are absence-of-evidence findings from multiple targeted searches,
held with reasonable but not complete confidence. Systems assessed in two parts (Atomic
Data, Block Protocol, OKF) received independent assessments that agreed; the fuller
treatment is cross-referenced from the shorter one.
