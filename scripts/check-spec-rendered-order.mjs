#!/usr/bin/env node
/**
 * check-spec-rendered-order.mjs — unmet-at-reading-position count over the RENDERED order
 * (srs#801, X1; read-through docs/programme/read-through-2026-09-17.md §3, folded in by ruling
 * R1 on srs#787).
 *
 * `check-spec-coherence.mjs` check 1 and `check-spec-readability.mjs` both answer "is this
 * depends-on edge forward?" against orders computed FROM THE TREE (contains/precedes), never read
 * back from an actual rendered file. That is the right check for whether the tree/precedes data is
 * internally consistent, but it cannot catch a defect where the TREE says one order and the
 * COMPOSITION actually renders a different one — a container-subset quirk, an `emptyBehavior: hide`
 * dropping a concept the tree still counts, a typeDispatch gap, or (the case this unit's own change
 * risked) a generated-region injection landing somewhere the tree never modelled at all. This check
 * is independent of both: it re-derives each concept's position by reading the rendered heading
 * order straight out of `docs/spec/srs-spec.md`, then runs the same depends-on forward-reference
 * test against THAT order.
 *
 * Position resolution: for every `com.semanticops.spec/concept` and `.../extension` record with a
 * `title`, scan the rendered file top to bottom for a line that is exactly a markdown heading
 * matching that title (`^#{1,6} <title>$`). Concept titles are not guaranteed globally unique
 * (a handful of headings share literal text — e.g. two records both titled "Validation"), so
 * matching consumes headings in file order and claims each for the first not-yet-positioned
 * concept sharing that title, in the TREE's reading order (check-spec-readability's total order) —
 * used here only to break ties among same-titled concepts, not as the position itself. A concept
 * whose title never appears as a heading (hidden by `emptyBehavior`, or not dispatched) gets no
 * rendered position and is reported as unresolved, not a violation — that is a publication-
 * reachability question, not a reading-order one.
 *
 * Allowlist (scripts/spec-rendered-order-allowlist.json), same discipline as the two checks above:
 * every entry names its check, the offending `pair`, and a live issue; an unlisted violation fails
 * the run, and so does a stale entry.
 *
 *   node scripts/check-spec-rendered-order.mjs [root]   # root defaults to the repo root
 */
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { loadInstances, loadRelations } from "./lib/rfc-038-tree.mjs";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "srs");
const RENDERED = join(ROOT, "docs", "spec", "srs-spec.md");
const ALLOWLIST = join(ROOT, "scripts", "spec-rendered-order-allowlist.json");

const CONCEPT = "com.semanticops.spec/concept";
const EXTENSION = "com.semanticops.spec/extension";

// ---- load -------------------------------------------------------------------------------------
const records = new Map();
for (const { record } of await loadInstances(REPO)) {
  const id = record.instanceId;
  if (!id) continue;
  const type = record.typeName ? `${record.typeNamespace}/${record.typeName}` : "note";
  records.set(id, { type, fieldValues: record.fieldValues ?? {}, createdAt: record.createdAt ?? "" });
}
const relations = (await loadRelations(REPO)).map(({ relation }) => relation);
const name = (id) => records.get(id)?.fieldValues?.title ?? id;
const isConcept = (id) => records.get(id)?.type === CONCEPT;
const isExtension = (id) => records.get(id)?.type === EXTENSION;
const isConceptOrExtension = (id) => isConcept(id) || isExtension(id);

if (!existsSync(RENDERED)) {
  console.error(`✗ Spec rendered order: ${RENDERED} does not exist — run publish-spec.mjs first`);
  process.exit(1);
}
const rendered = (await readFile(RENDERED, "utf8")).replace(/\r\n/g, "\n").split("\n");

// ---- a tree-order tiebreak, used only to disambiguate same-titled headings --------------------
const children = new Map();
for (const r of relations) {
  if (r.relationType !== "contains") continue;
  children.set(r.sourceInstanceId, [...(children.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
}
const precedesTo = new Map();
for (const r of relations) {
  if (r.relationType !== "precedes") continue;
  precedesTo.set(r.sourceInstanceId, [...(precedesTo.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
}
function siblingOrder(ids) {
  const set = new Set(ids);
  if (set.size === 0) return [];
  const indeg = new Map([...set].map((id) => [id, 0]));
  const out = new Map([...set].map((id) => [id, []]));
  for (const id of set) {
    for (const t of precedesTo.get(id) ?? []) {
      if (!set.has(t)) continue;
      out.get(id).push(t);
      indeg.set(t, (indeg.get(t) ?? 0) + 1);
    }
  }
  const tiebreak = (id) => `${records.get(id)?.createdAt ?? ""} ${id}`;
  const available = [...set].filter((id) => indeg.get(id) === 0);
  const result = [];
  while (available.length) {
    available.sort((a, b) => (tiebreak(a) < tiebreak(b) ? -1 : tiebreak(a) > tiebreak(b) ? 1 : 0));
    const id = available.shift();
    result.push(id);
    for (const t of out.get(id) ?? []) {
      indeg.set(t, indeg.get(t) - 1);
      if (indeg.get(t) === 0) available.push(t);
    }
  }
  if (result.length !== set.size) return [...set]; // a cycle: not this check's job to report
  return result;
}
const manifest = existsSync(join(REPO, "manifest.json"))
  ? JSON.parse(await readFile(join(REPO, "manifest.json"), "utf8"))
  : {};
const rootContainer = manifest.container ?? {};
const rootMembers = [...new Set([...(rootContainer.memberInstanceIds ?? []), ...(rootContainer.rootInstanceIds ?? [])])];
const identity = rootContainer.identityInstanceId;
const treeOrder = [];
{
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    treeOrder.push(id);
    for (const c of siblingOrder(children.get(id) ?? [])) visit(c);
  };
  for (const p of siblingOrder(rootMembers.filter((m) => m !== identity))) visit(p);
}

// ---- resolve each concept/extension's RENDERED position, by heading text ----------------------
const byTitle = new Map(); // title -> [instanceId...] in tree order (tiebreak for shared titles)
for (const id of treeOrder) {
  if (!isConceptOrExtension(id)) continue;
  const title = records.get(id)?.fieldValues?.title;
  if (!title) continue;
  byTitle.set(title, [...(byTitle.get(title) ?? []), id]);
}
const HEADING_RE = /^#{1,6} (.+)$/;
const renderedPos = new Map(); // instanceId -> line index
for (let i = 0; i < rendered.length; i++) {
  const m = HEADING_RE.exec(rendered[i]);
  if (!m) continue;
  const candidates = byTitle.get(m[1]);
  if (!candidates || candidates.length === 0) continue;
  const id = candidates.shift();
  renderedPos.set(id, i);
}

/** Tarjan's SCC over the depends-on graph restricted to concepts/extensions — same treatment as
 *  check-spec-coherence.mjs check 1 and check-spec-readability.mjs (srs#608: the graph is not a
 *  DAG; three genuine 2-cycles are introduced together and never flagged as forward references). */
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

// ---- the check ----------------------------------------------------------------------------------
const violations = [];
const nodes = [...records.keys()].filter(isConceptOrExtension);
const dep = new Map();
const depEdges = relations.filter(
  (r) => r.relationType === "depends-on" && isConceptOrExtension(r.sourceInstanceId) && isConceptOrExtension(r.targetInstanceId)
);
for (const r of depEdges) dep.set(r.sourceInstanceId, [...(dep.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
const comp = tarjan(nodes, dep);

let within = 0, forward = 0, backward = 0, unresolved = 0;
for (const r of depEdges) {
  const s = r.sourceInstanceId, t = r.targetInstanceId;
  if (comp.get(s) === comp.get(t)) { within++; continue; }
  const ps = renderedPos.get(s), pt = renderedPos.get(t);
  if (ps === undefined || pt === undefined) { unresolved++; continue; }
  if (pt > ps) {
    forward++;
    violations.push({
      pair: [s, t],
      message: `"${name(s)}" (rendered line ${ps + 1}) is read before "${name(t)}" (rendered line ${pt + 1}) but depends on it (${r.relationId})`,
    });
  } else backward++;
}
console.log(
  `  unmet-at-reading-position: ${depEdges.length} depends-on edges over ${nodes.length} concepts/extensions: ` +
    `${forward} unmet at the rendered reading position, ${backward} met, ${within} within one component` +
    (unresolved ? `, ${unresolved} unresolved (no rendered heading found)` : "")
);

// ---- allowlist reconciliation ---------------------------------------------------------------------
const allow = existsSync(ALLOWLIST) ? JSON.parse(await readFile(ALLOWLIST, "utf8")).entries ?? [] : [];
const keyOf = (e) => e.pair.join("->");
const allowed = new Map();
const problems = [];
for (const e of allow) {
  if (!e.pair || !/#\d+/.test(e.issue ?? "")) {
    problems.push(`allowlist entry ${JSON.stringify(e)} needs pair and an issue reference`);
    continue;
  }
  allowed.set(keyOf(e), e);
}
const seen = new Set();
for (const v of violations) {
  const k = v.pair.join("->");
  if (allowed.has(k)) seen.add(k);
  else problems.push(v.message);
}
for (const k of allowed.keys()) {
  if (!seen.has(k)) problems.push(`allowlist entry ${k} no longer matches a violation — remove it (shrink discipline)`);
}
console.log(`  allowlist: holding ${seen.size} of ${violations.length} unmet-at-reading-position violation(s)`);

if (problems.length) {
  console.error(`\n✗ Spec rendered order: ${problems.length} problem(s) not covered by scripts/spec-rendered-order-allowlist.json`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(`  Fix the rendering (or the relation), or add an entry citing a live issue to the allowlist.`);
  process.exit(1);
}
console.log(`✓ Spec rendered order holds (${seen.size} known unmet-at-reading-position violation(s) allowlisted).`);
