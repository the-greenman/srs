#!/usr/bin/env node
/**
 * tests/field-identity/run.mjs — runs conformance/field-identity/scenarios.json (RFC-053, a Field's
 * id travels beside its name, srs#1007) against the pinned srs CLI on conformance/field-identity/
 * fixture-repo.
 *
 *   facets       `find` reports per-Field facets ([R3], [R5]): one facet per Field id, a facet
 *                spanning Types, only closed Fields, ascending-fieldId tie order.
 *   projections  `type schema` (the authoring projection) carries `x-srs-field-id` at every depth
 *                ([R1], [R2]) and reports no diagnostic for a resolvable Type ([R6]).
 *
 * A build from before RFC-053 reports facets without `fieldId` and properties without
 * `x-srs-field-id`, so this check fails there and passes from the first build that implements it.
 *
 *   export $(node scripts/fetch-pinned-srs.mjs)
 *   node tests/field-identity/run.mjs
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { resolveSrsCli } from "../../scripts/lib/pinned-srs.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(REPO, "conformance/field-identity");
const FIXTURE = join(DIR, "fixture-repo");
const SRS = await resolveSrsCli();
const doc = JSON.parse(readFileSync(join(DIR, "scenarios.json"), "utf8"));

function srs(args) {
  const r = spawnSync(SRS, [...args, "--repo", FIXTURE], { encoding: "utf8" });
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw new Error(`srs ${args.join(" ")}: no JSON (${r.status}) ${r.stderr}`);
  }
}

let failed = 0;
function check(id, problems) {
  if (problems.length === 0) return console.log(`ok   ${id}`);
  failed++;
  console.log(`FAIL ${id}`);
  for (const p of problems) console.log(`       ${p}`);
}

for (const s of doc.facets) {
  const env = srs(["find", ...s.find]);
  const facets = env.ok ? (env.payload.result.facets?.fields ?? []) : null;
  const problems = [];
  if (!facets) problems.push(`find failed: ${JSON.stringify(env.diagnostics)}`);
  else {
    const ids = facets.map((f) => f.fieldId);
    if (s.expectFacets) {
      for (const [fieldId, want] of Object.entries(s.expectFacets)) {
        const got = facets.find((f) => f.fieldId === fieldId);
        if (!got) problems.push(`no facet for fieldId ${fieldId}`);
        else {
          if (got.field !== want.field) problems.push(`${fieldId}: field ${got.field}, want ${want.field}`);
          const counts = Object.fromEntries(got.values.map((v) => [v.value, v.count]));
          if (JSON.stringify(counts) !== JSON.stringify(want.values) && !sameCounts(counts, want.values))
            problems.push(`${fieldId}: values ${JSON.stringify(counts)}, want ${JSON.stringify(want.values)}`);
        }
      }
    }
    for (const fieldId of s.expectNoFacetFor ?? []) if (ids.includes(fieldId)) problems.push(`unexpected facet for ${fieldId}`);
    if (s.expectOrderAmong) {
      const at = s.expectOrderAmong.map((i) => ids.indexOf(i));
      if (at.includes(-1) || at.some((v, i) => i > 0 && v <= at[i - 1]))
        problems.push(`order among ${s.expectOrderAmong.join(", ")} was ${ids.join(", ")}`);
    }
    if (s.expectUniqueFieldIds) {
      if (new Set(ids).size !== ids.length) problems.push(`duplicate fieldId in ${ids.join(", ")}`);
      for (const f of facets) if (!f.fieldId || !f.field) problems.push(`facet missing fieldId or field: ${JSON.stringify(f)}`);
    }
  }
  check(s.id, problems);
}

function sameCounts(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => a[k] === b[k]);
}

for (const s of doc.projections) {
  const env = srs(["type", "schema", s.typeId]);
  const problems = [];
  if (!env.ok) problems.push(`type schema failed: ${JSON.stringify(env.diagnostics)}`);
  else {
    const props = env.payload.schema.properties ?? {};
    for (const [key, want] of Object.entries(s.expectIds ?? {}))
      if (props[key]?.["x-srs-field-id"] !== want) problems.push(`${key}: x-srs-field-id ${props[key]?.["x-srs-field-id"]}, want ${want}`);
    for (const [key, nested] of Object.entries(s.expectNested ?? {}))
      for (const [k, want] of Object.entries(nested)) {
        const got = props[key]?.properties?.[k]?.["x-srs-field-id"];
        if (got !== want) problems.push(`${key}.${k}: x-srs-field-id ${got}, want ${want}`);
      }
    if (s.expectPropertyKeys && JSON.stringify(Object.keys(props)) !== JSON.stringify(s.expectPropertyKeys))
      problems.push(`properties ${Object.keys(props).join(", ")}, want ${s.expectPropertyKeys.join(", ")}`);
    if (s.expectDiagnostics !== undefined && (env.payload.diagnosticsStructured ?? []).length !== s.expectDiagnostics)
      problems.push(`diagnostics ${JSON.stringify(env.payload.diagnosticsStructured)}`);
  }
  check(s.id, problems);
}

const n = doc.facets.length + doc.projections.length;
console.log(`${n - failed}/${n} RFC-053 scenarios hold (${doc.owed.length} owed, see scenarios.json)`);
process.exit(failed ? 1 : 0);
