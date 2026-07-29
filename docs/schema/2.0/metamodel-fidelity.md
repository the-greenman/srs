# Meta-model fidelity dashboard

**Normative** (RFC-033 Change D / [R5]). Enumerates every SRS meta-model feature and how faithfully each
supported **emitter** expresses it when projecting the self-hosted meta-model
(`com.semanticops.srs/metamodel`) to a target artifact.

- **authoritative** — the emitter expresses the feature faithfully; its projection round-trips and is
  comparable to the frozen seed for that feature (annotations aside).
- **approximated** — the emitter cannot fully express the feature; it emits the closest permissible shape and
  the **authoritative form lives in the frozen seed plus the semantic validator** (`validateFieldType`, R1–R11
  in `scripts/lib/rfc-032-fieldtype.mjs`, and cross-field validation). An emitter MUST NOT silently drop an
  approximated feature — it MUST emit the documented lossy shape and this table MUST record the loss ([R5]).

**This dashboard is about emitter *expressiveness*, not metamodel *coverage*.** It classifies features of the
whole frozen seed, including some the metamodel package defers from v1.0.0 coverage (RFC-033 Change A) — e.g.
`CrossFieldRule` appears here even though `type.validationRules` is a deferred facet. The two axes are
orthogonal: *can the emitter express it* (here) vs *does the metamodel describe it yet* (Change A coverage).

The only **NOW** emitter is JSON Schema 2020-12 (the `projectField` stand-in in
`scripts/lib/rfc-032-fieldtype.mjs`; the full emitter is #259). Protobuf / TypeScript / Rust columns are
seeded as **future** so the discipline is in place before those emitters exist (LinkML's per-generator
fidelity discipline — see `docs/research/alignment-opportunities.md`, LinkML entry).

| Meta-model feature | JSON Schema 2020-12 | protobuf (future) | TypeScript (future) | Rust (future) | Authoritative source when approximated |
|---|---|---|---|---|---|
| scalar datatypes (`string`/`number`/`integer`/`boolean`/`date`/`date-time`) | **authoritative** | authoritative | authoritative | authoritative | — |
| `format` (`uri`/`uuid`/`email`/`markdown`) | **authoritative** | approximated (no format) | approximated (alias) | approximated (newtype) | frozen seed `format` + validation |
| `cardinality:list` + `minItems`/`maxItems` | **authoritative** | approximated (`repeated`, no bounds) | approximated (`T[]`, no bounds) | approximated (`Vec<T>`, no bounds) | frozen seed bounds + validation |
| `valueDomain:closed` → `enum` (inline `allowedValues`) | **authoritative** | authoritative (`enum`) | authoritative (union) | authoritative (`enum`) | — |
| `vocabularyRef` (configurable range) → `enum` snapshot | **approximated** — the emitted `enum` is a snapshot of the vocabulary's effective Term keys at generation time; the configurable nature is not in the artifact | approximated | approximated | approximated | the package `Vocabulary` (RFC-006) + regenerate discipline |
| `constraints` (`minLength`/`maxLength`/`pattern`/`minimum`/`maximum`) | **authoritative** | approximated (no constraints) | approximated (no constraints) | approximated (no constraints) | frozen seed `constraints` + validation |
| `datatype:ref`, `mode:inline` → nested schema | **authoritative** (`$ref` to `$defs`; the `$defs` key is emitter-owned per RFC-032 Change G — semantic, not string, equality) | authoritative (message) | authoritative (interface) | authoritative (struct) | — |
| `datatype:ref`, `mode:reference` → id | **approximated** — `{string, format:uuid, x-srs-range-type}`; the referent's Type constraint is not enforced by the string+uuid shape | approximated (string id) | approximated (string id) | approximated (typed newtype possible) | [R5] + reference-integrity validation (#242) |
| `datatype:dependent` | **approximated** — deliberately lossy (broad permissible `{}`) per RFC-032 Change G | approximated | approximated | approximated | R6 validation obligation |
| `datatype:map` → `{object, additionalProperties}` | **authoritative** | authoritative (`map<>` for scalar; `Any` for open) | authoritative (`Record<>`) | authoritative (`HashMap`) | — |
| entity-level conditional co-occurrence (`allOf`/`if`/`then` for R2/R3/R9/R10) | **approximated** — `projectField` emits per-field fragments, not the entity-level conditional envelope; the frozen seed hand-authors the `allOf` | approximated | approximated | approximated | frozen seed `allOf` + `validateFieldType` R1–R11 |
| cross-field validation (`CrossFieldRule`, RFC-019) | **approximated** — no JSON Schema construct | approximated | approximated | approximated | RFC-019 cross-field validation |
| Type-graph cycle rejection (RFC-032 [R7]) | **approximated** — no JSON Schema construct | approximated | approximated | approximated | [R7] load-time analysis |
| `additionalProperties:false`, `required[]` | **authoritative** | authoritative | authoritative | authoritative | — |

## Verification

The **JSON Schema 2020-12** column is machine-checked by `scripts/rfc-033-closure-test.mjs` (run under
`scripts/validate-all.mjs`): every *authoritative* row's `projectField` output matches the frozen seed's
fragment (annotations stripped); every *approximated* row renders in the documented lossy shape and is asserted
**not** to equal the seed. The `future` columns are declarative until their emitters land (#259 designs the IR
so they slot in), at which point each MUST be filled in by the same discipline.
