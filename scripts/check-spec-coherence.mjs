#!/usr/bin/env node
/**
 * check-spec-coherence.mjs — the spec reads in layers over the concept tree (srs#560, re-cut by the
 * #556 design ruling: tree = `contains`, order = `precedes`, prerequisites = `depends-on`).
 *
 * Five checks, read straight off canonical relations — no bespoke fields or relation types:
 *
 *   1. no-forward-reference  A `depends-on` edge between concepts must point at something already
 *                            introduced: the target must not come later in the tree's linearised
 *                            order (parent before child; siblings ordered by the `precedes` chain).
 *                            Computed over the CONDENSATION of the `depends-on` graph (srs#608):
 *                            the graph is not a DAG — Type⇄FieldAssignment, Relation⇄RelationType-
 *                            Definition, Conformance⇄Extension are genuine 2-cycles whose members
 *                            are introduced together. Inside one strongly-connected component
 *                            nothing is a forward reference; only an edge BETWEEN components can be.
 *                            Two concepts whose relative order the tree does not yet determine are
 *                            reported as "unordered", never as violations — the tree is wired by #563.
 *   2. one-home              No record has two `contains` parents.
 *   3. no-orphan-leaf        Every spec content record (section, subsection, mechanism, invariant,
 *                            example, design-note, table, generated-type-reference) has a `contains`
 *                            parent or is a member of the root container (manifest.container).
 *   4. part-order            A Part is a non-identity member of the root container, ordered by the
 *                            `precedes` chain over those members. No `depends-on` edge may point from
 *                            an earlier Part's `contains`-subtree into a later one. Until #563 hangs
 *                            the concept tree under the Parts no edge falls inside a Part subtree,
 *                            and the check says so rather than inventing structure.
 *   5. no-baked-heading      No string field of a hand-authored leaf starts a line with a markdown
 *                            heading (`# `..`###### `) outside a code fence. Structure lives in the
 *                            tree, not in the prose; root cause is the `content` field's aiGuidance
 *                            (#567). `generated-type-reference` is exempt: its content is a generator
 *                            projection (gen-type-reference-tables.mjs), fixed there or nowhere.
 *
 * Allowlist (scripts/spec-coherence-allowlist.json), same discipline as rfcs/integration-allowlist.json:
 * every entry names its check, the offending id (or `pair` of ids), and a live issue; a violation not
 * on the list fails the run, and so does an entry that no longer matches anything — shrinking is the
 * migration, growing needs an issue. Reads records and relations by walking the trees (RFC-038,
 * tree-authoritative); never shells out to the CLI.
 *
 *   node scripts/check-spec-coherence.mjs [root]   # root defaults to the repo root
 */
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, resolve, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWLIST = join(ROOT, "scripts/spec-coherence-allowlist.json");

const CONCEPT = "com.semanticops.spec/concept";
const LEAF_TYPES = new Set([
  "section", "subsection", "mechanism", "invariant", "example", "design-note", "table",
  "generated-type-reference",
]);
const HEADING_EXEMPT = new Set(["generated-type-reference"]);

// ---- load -----------------------------------------------------------------------------------------
async function walkJson(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkJson(p)));
    else if (e.name.endsWith(".json")) out.push([p, JSON.parse(await readFile(p, "utf8"))]);
  }
  return out;
}

const records = new Map(); // instanceId -> { path, type, fieldValues }
for (const [p, doc] of await walkJson(join(ROOT, "srs/records"))) {
  const id = doc.instanceId;
  if (!id) continue;
  const type = doc.typeName ? `${doc.typeNamespace}/${doc.typeName}` : "note";
  records.set(id, { path: relative(ROOT, p), type, leaf: doc.typeName, fieldValues: doc.fieldValues ?? {} });
}
const relations = (await walkJson(join(ROOT, "srs/relations"))).map(([, r]) => r);
const edges = (type) => relations.filter((r) => r.relationType === type);

const manifest = existsSync(join(ROOT, "srs/manifest.json"))
  ? JSON.parse(await readFile(join(ROOT, "srs/manifest.json"), "utf8"))
  : {};
const rootContainer = manifest.container ?? {};
const rootMembers = new Set([...(rootContainer.memberInstanceIds ?? []), ...(rootContainer.rootInstanceIds ?? [])]);

const name = (id) => records.get(id)?.fieldValues?.title ?? records.get(id)?.path ?? id;
const isConcept = (id) => records.get(id)?.type === CONCEPT;

// ---- graph helpers --------------------------------------------------------------------------------
const parents = new Map(); // child -> [parent...]
const children = new Map(); // parent -> [child...]
for (const r of edges("contains")) {
  parents.set(r.targetInstanceId, [...(parents.get(r.targetInstanceId) ?? []), r.sourceInstanceId].sort());
  children.set(r.sourceInstanceId, [...(children.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
}
const precedes = new Map();
for (const r of edges("precedes")) {
  precedes.set(r.sourceInstanceId, [...(precedes.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
}
/** a reaches b through the `precedes` chain */
function precedesReach(a, b) {
  const seen = new Set();
  const stack = [a];
  while (stack.length) {
    const x = stack.pop();
    for (const y of precedes.get(x) ?? []) {
      if (y === b) return true;
      if (!seen.has(y)) { seen.add(y); stack.push(y); }
    }
  }
  return false;
}
/** all ids in the `contains` subtree rooted at id (inclusive) */
function subtree(id) {
  const seen = new Set([id]);
  const stack = [id];
  while (stack.length) {
    for (const c of children.get(stack.pop()) ?? []) if (!seen.has(c)) { seen.add(c); stack.push(c); }
  }
  return seen;
}

/** Tarjan's SCC over the depends-on graph restricted to concepts. Returns id -> component index. */
function tarjan(nodes, out) {
  let index = 0;
  const idx = new Map(), low = new Map(), onStack = new Set(), stack = [], comp = new Map();
  let ncomp = 0;
  const strong = (v) => {
    idx.set(v, index); low.set(v, index); index++;
    stack.push(v); onStack.add(v);
    for (const w of out.get(v) ?? []) {
      if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      let w;
      do { w = stack.pop(); onStack.delete(w); comp.set(w, ncomp); } while (w !== v);
      ncomp++;
    }
  };
  for (const v of nodes) if (!idx.has(v)) strong(v);
  return comp;
}

// ---- checks ---------------------------------------------------------------------------------------
const violations = []; // { check, key, message }
const report = (check, key, message) => violations.push({ check, key, message });
const summary = {};

// 1. no-forward-reference
{
  const concepts = [...records.keys()].filter(isConcept);
  const dep = new Map();
  const depEdges = edges("depends-on").filter((r) => isConcept(r.sourceInstanceId) && isConcept(r.targetInstanceId));
  for (const r of depEdges) dep.set(r.sourceInstanceId, [...(dep.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
  const comp = tarjan(concepts, dep);
  const nComps = new Set(comp.values()).size;

  // Root-to-node path through concept-typed `contains` parents (first parent when there are several;
  // check 2 reports the multiplicity).
  const pathOf = (id) => {
    const path = [id];
    const seen = new Set(path);
    let p = (parents.get(id) ?? []).find(isConcept);
    while (p && !seen.has(p)) { path.unshift(p); seen.add(p); p = (parents.get(p) ?? []).find(isConcept); }
    return path;
  };
  /** -1: a before b, 1: b before a, 0: the tree does not yet determine it */
  const order = (a, b) => {
    const pa = pathOf(a), pb = pathOf(b);
    let i = 0;
    while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++;
    if (i === pa.length) return -1; // a is an ancestor of b
    if (i === pb.length) return 1;
    if (precedesReach(pa[i], pb[i])) return -1;
    if (precedesReach(pb[i], pa[i])) return 1;
    return 0;
  };
  let within = 0, unordered = 0, forward = 0, ok = 0;
  for (const r of depEdges) {
    const s = r.sourceInstanceId, t = r.targetInstanceId;
    if (comp.get(s) === comp.get(t)) { within++; continue; } // one SCC: introduced together (#608)
    const o = order(s, t);
    if (o === 0) { unordered++; continue; }
    if (o === -1) {
      forward++;
      report("no-forward-reference", `${s}->${t}`,
        `"${name(s)}" is introduced before "${name(t)}" but depends on it (${r.relationId}) — move the target earlier in the tree or drop the edge`);
    } else ok++;
  }
  summary["no-forward-reference"] =
    `${depEdges.length} depends-on edges over ${concepts.length} concepts in ${nComps} components: ` +
    `${forward} forward, ${ok} backward, ${within} within one component, ${unordered} unordered by the tree`;
}

// 2. one-home
{
  let multi = 0;
  for (const [id, ps] of parents) {
    if (ps.length > 1) {
      multi++;
      report("one-home", id, `"${name(id)}" has ${ps.length} contains parents: ${ps.map(name).join(", ")}`);
    }
  }
  summary["one-home"] = `${parents.size} records with a contains parent, ${multi} with more than one`;
}

// 3. no-orphan-leaf
{
  const byType = {};
  let orphans = 0, leaves = 0;
  for (const [id, rec] of records) {
    if (!LEAF_TYPES.has(rec.leaf)) continue;
    leaves++;
    if (parents.has(id) || rootMembers.has(id)) continue;
    orphans++;
    byType[rec.leaf] = (byType[rec.leaf] ?? 0) + 1;
    report("no-orphan-leaf", id, `${rec.leaf} "${name(id)}" (${rec.path}) has no contains parent`);
  }
  const detail = Object.entries(byType).map(([t, n]) => `${t}: ${n}`).join(", ");
  summary["no-orphan-leaf"] = `${leaves} leaves, ${orphans} without a home${detail ? ` (${detail})` : ""}`;
}

// 4. part-order
{
  const identity = rootContainer.identityInstanceId;
  const parts = [...rootMembers].filter((m) => m !== identity);
  const before = (a, b) => precedesReach(a, b);
  parts.sort((a, b) => (before(a, b) ? -1 : before(b, a) ? 1 : 0));
  const partOf = new Map();
  parts.forEach((p, i) => { for (const m of subtree(p)) if (!partOf.has(m)) partOf.set(m, i); });
  let inside = 0, bad = 0;
  for (const r of edges("depends-on")) {
    const ps = partOf.get(r.sourceInstanceId), pt = partOf.get(r.targetInstanceId);
    if (ps === undefined || pt === undefined) continue;
    inside++;
    if (ps < pt) {
      bad++;
      report("part-order", `${r.sourceInstanceId}->${r.targetInstanceId}`,
        `"${name(r.sourceInstanceId)}" (Part ${ps + 1}: ${name(parts[ps])}) depends on "${name(r.targetInstanceId)}" in later Part ${pt + 1}: ${name(parts[pt])}`);
    }
  }
  summary["part-order"] = parts.length === 0
    ? "no Parts declared (manifest.container has no non-identity members) — nothing to check"
    : `${parts.length} Parts, ${inside} depends-on edges inside Part subtrees, ${bad} pointing forward` +
      (inside === 0 ? " — vacuous until #563 hangs the concept tree under the Parts" : "");
}

// 5. no-baked-heading
{
  let headings = 0, files = 0;
  for (const [id, rec] of records) {
    if (!LEAF_TYPES.has(rec.leaf) || HEADING_EXEMPT.has(rec.leaf)) continue;
    let n = 0;
    for (const [field, value] of Object.entries(rec.fieldValues)) {
      if (typeof value !== "string") continue;
      let fence = false;
      for (const line of value.split(/\r?\n/)) {
        if (/^\s*```/.test(line)) fence = !fence;
        else if (!fence && /^#{1,6} /.test(line)) n++;
      }
      if (n) report("no-baked-heading", id, `${rec.leaf} "${name(id)}" (${rec.path}) bakes ${n} markdown heading(s) into \`${field}\``);
    }
    if (n) { headings += n; files++; }
  }
  summary["no-baked-heading"] = `${headings} baked headings in ${files} leaf records`;
}

// ---- allowlist reconciliation ---------------------------------------------------------------------
const allow = existsSync(ALLOWLIST) ? JSON.parse(await readFile(ALLOWLIST, "utf8")).entries ?? [] : [];
const keyOf = (e) => `${e.check}:${e.pair ? e.pair.join("->") : e.id}`;
const allowed = new Map();
const problems = [];
for (const e of allow) {
  if (!e.check || !(e.id || e.pair) || !/#\d+/.test(e.issue ?? "")) {
    problems.push(`allowlist entry ${JSON.stringify(e)} needs check, id|pair, and an issue reference`);
    continue;
  }
  allowed.set(keyOf(e), e);
}
const seen = new Set();
for (const v of violations) {
  const k = `${v.check}:${v.key}`;
  if (allowed.has(k)) seen.add(k);
  else problems.push(`[${v.check}] ${v.message}`);
}
for (const k of allowed.keys()) {
  if (!seen.has(k)) problems.push(`allowlist entry ${k} no longer matches a violation — remove it (shrink discipline)`);
}

for (const [check, line] of Object.entries(summary)) console.log(`  ${check}: ${line}`);
console.log(`  allowlist: holding ${seen.size} of ${violations.length} violation(s)`);

if (problems.length) {
  console.error(`\n✗ Spec coherence: ${problems.length} problem(s) not covered by scripts/spec-coherence-allowlist.json`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(`  Fix the record/relation, or add an entry citing a live issue to the allowlist.`);
  process.exit(1);
}
console.log(`✓ Spec coherence over the concept tree holds (${seen.size} known violation(s) allowlisted).`);
