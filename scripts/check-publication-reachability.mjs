#!/usr/bin/env node
/**
 * check-publication-reachability.mjs — every catalogued record reaches a reader, fail-closed (#285).
 *
 * The defect this closes is not "a record is wrong", it is "a record is *invisible*": valid,
 * discovered, loading cleanly, reported by `repo validate` as a healthy instance — and reachable
 * from no declared presentation, so no reader ever sees it. `repo validate` is green either way,
 * which is exactly why it went unnoticed: the seven `records/type-definitions/` shadows (one retired
 * by #275, six by this issue) were being read
 * by RFC-031 as authoritative prose for 9 of its 18 mapped entities while the specification
 * published a *different* copy, and one of them (`container.json`) carried a wrong cross-reference
 * the published copy did not. #276's acceptance asked that the nine table records "render
 * identically"; that was never satisfiable, and nothing said so.
 *
 * Reachability is defined ONCE, here, and both the measurement report (`--report`) and the guard
 * read it. Two definitions would drift, and the drift would be silent in the same way.
 *
 * ## What "reachable" means
 *
 * A discovered instance is reachable when some *declared* presentation surface can reach it. Three
 * surfaces exist in this repository, and all three are derived from declarations rather than listed:
 *
 *   1. **Composition sections** — every `compositions/*.json` reachable from every package
 *      manifest in the tree. A `discovery-query` section's roots are the instances whose
 *      `typeNamespace/typeName` equals its `query.typeNamespace`/`query.typeName` (srs#525: the
 *      SectionSource → DiscoveryQuery collapse — succeeds the retired `type-query`/`typeKey`
 *      shape from srs#523/#524, itself renamed from `semanticObjectType`).
 *   2. **Root container membership** — `manifest.container` only (RFC-013's required root container,
 *      the top of structural navigation): `identityInstanceId`, `memberInstanceIds`,
 *      `rootInstanceIds`. A Container under `containers/` is deliberately NOT a surface — see the
 *      note on `containers()` for the wrong verdict that produced.
 *   3. **The RFC-016 invariant projection** — [R1]: every `com.semanticops.spec/invariant` record
 *      MUST appear in the rendered Key Invariants region of each view marked `requiresKeyInvariants`.
 *      This surface is a *post-render injection*, not a view section, so a definition quantifying
 *      only over Compositions would report all 124 invariant records as invisible. They are the
 *      most-published records in the corpus. The projection's scope is imported from
 *      `render-invariants.mjs` rather than restated — see INVARIANT_PROJECTION_ROOT there.
 *
 * From those roots, rendering descends `contains` (source → target) and orders by `precedes`.
 *
 * Two things about that descent are easy to get wrong, and getting either wrong makes this guard
 * report invisible records as published — the precise failure it exists to prevent:
 *
 *   - **`precedes` is not a descent edge.** It sequences siblings that are already reachable. A
 *     record whose only participation is a `precedes` chain is still unpublished.
 *   - **`contains` descent is conditional on `titleFieldId`.** `render_service.rs` gates the
 *     recursive subsection walk on `let structured = section.title_field_id.is_some()` — cited by
 *     that statement rather than by line number, since a line number into another repository is the
 *     staleness class this guard exists to close. A section
 *     without `titleFieldId` renders its query roots and *nothing beneath them*. Both RFC views are
 *     such sections, which is why `rfc-catalog.md` contains not one of the 34 `rfc-change` /
 *     `rfc-proposed-artifact` records that hang off RFC records by `contains` — verified against the
 *     committed export and by re-rendering view 7a000001. An unconditional descent would have
 *     called all 34 published.
 *
 * This is the rule the renderer applies, read off the view declarations rather than hardcoded — a
 * section that gains a `titleFieldId` starts publishing its subtree and the guard follows.
 *
 * ## The exclusion list
 *
 * Some records are deliberately not published — document identity anchors, source notes, artifacts
 * of an unaccepted RFC. That is legitimate, but it must be *recorded*, not inferred from silence.
 * `publication-reachability-exclusions.json` is that record: one typed entry per instance, each
 * carrying a reason and the issue that owns its real resolution. It is data the guard reads, not
 * prose in a comment. An entry naming an instance that is no longer discovered, or one that has
 * since become reachable, is itself an error — a stale exclusion is how a suppression list turns
 * into a permanent blind spot.
 *
 * Node pipeline only, per ADR-004: the pinned binary renders the views but has no notion of "a
 * record no view reaches", and this is an authoring-corpus rule rather than a load-time invariant —
 * a third-party SRS repository is free to hold unpublished records.
 *
 *   node scripts/check-publication-reachability.mjs [root]            # guard: exit 1 on a violation
 *   node scripts/check-publication-reachability.mjs [root] --report   # adds the census, same exit code
 */
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { instancePaths, loadInstances, loadRelations } from "./lib/rfc-038-tree.mjs";
import { INVARIANT_PROJECTION_ROOT, isInInvariantProjectionRoot } from "./render-invariants.mjs";
import { EXPORTED_VIEW_IDS } from "./lib/view-exports.mjs";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const args = process.argv.slice(2);
const REPORT = args.includes("--report");
const rootArg = args.find((a) => !a.startsWith("--"));
const ROOT = rootArg ? resolve(rootArg) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "srs");
const EXCLUSIONS = join(ROOT, "scripts", "publication-reachability-exclusions.json");

const problems = [];
const fail = (msg) => problems.push(msg);

/**
 * Every Composition the repository declares, discovered through package manifests.
 *
 * Keyed on the manifests rather than on `**\/compositions/*.json`, because a view file that no
 * package declares is not a declared presentation — it renders nothing and must not confer
 * reachability. The walk finds package manifests by presence (RFC-038 Change B), so a package that
 * `packageRefs` omits still contributes: `srs/package/package.json` is exactly such a package (it
 * declared the `ec34f54b` duplicate of `3a000001` until #411 dropped it — declares none today, but
 * the walk still has to find it by presence, not by `packageRefs` membership, for the case where it
 * declares one again).
 */
async function declaredDocumentViews(repoRoot) {
  const views = [];
  const unexported = [];
  const walk = async (dir) => {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((e) => e.isFile() && e.name === "package.json")) {
      let manifest = null;
      try {
        manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
      } catch (error) {
        // Reported, not swallowed, for the same reason as the unparseable view three lines down: a
        // package whose manifest will not load declares no views, so every record its views publish
        // is reported unreachable — 44 of them for `spec-authoring-core` — and not one message says
        // why. Fail-closed in outcome, useless in diagnosis.
        fail(`package manifest does not parse: ${join(dir, "package.json")}: ${error.message}`);
      }
      // srs#523/#524, srs-rust#910: package-manifest.json's kind renamed documentViews -> compositions
      // (rfc-decision-92d2da05). Function/variable names below are unrenamed (matches lib/view-exports.mjs's
      // own park) — only the wire property this reads follows the rename.
      for (const rel of manifest?.compositions ?? []) {
        try {
          const view = JSON.parse(await readFile(join(dir, rel), "utf8"));
          // Declared is not published. `publish-spec.mjs` renders exactly the ids in
          // `lib/view-exports.mjs` (which reads `manifest.renderedPresentations` — #411); a view
          // outside that set produces no artifact, so honouring it would be the same free "publish"
          // lever the `containers/**` glob was. It was not hypothetical: until #411,
          // `srs/package/package.json` declared `srs-spec-document-view` (ec34f54b), a duplicate of
          // `3a000001` that nothing exported — and because a stale exclusion is an error, adding one
          // line to a `documentViews[]` array would not merely silence this guard, it would *demand*
          // the matching exclusions be deleted.
          if (EXPORTED_VIEW_IDS.has(view.id)) views.push({ path: join(dir, rel), view });
          else unexported.push({ path: join(dir, rel), id: view.id });
        } catch {
          // A declared view that will not parse is validate-package.mjs's diagnostic to raise. Not
          // swallowed silently here either: it becomes lost reachability, which the guard reports as
          // unreachable records rather than as a parse error — so record it.
          fail(`declared Composition does not parse: ${join(dir, rel)}`);
        }
      }
    }
    for (const e of entries) {
      if (e.isDirectory() && e.name !== "node_modules" && !e.name.startsWith(".")) {
        await walk(join(dir, e.name));
      }
    }
  };
  await walk(join(repoRoot, "package"));
  return { views, unexported };
}

/**
 * The Containers that are presentation surfaces — which is `manifest.container` and nothing else.
 *
 * RFC-013 makes `manifest.container` the repository's identity object and the top of structural
 * navigation, so its members are reached by a reader navigating the repository. **A Container under
 * `containers/` is not a presentation surface by existing.** It becomes one when a `container-subset`
 * section or a `containerIds` discovery-query filter names it, and this guard refuses both of those
 * rather than resolving them — so any `containers/**` file it honoured would be a free "publish"
 * lever with no reader behind it.
 *
 * That is not hypothetical. All 12 Containers under `srs/containers/` are referenced by nothing at
 * all — not `manifest.container`, not any view, not each other. Honouring them published exactly one
 * record: `records/notes/rfc-001-implementation-prerequisites.json`, sole member of an orphan
 * Container, reported reachable while its 18 siblings in the same directory were recorded as
 * invisible. Adding an id to any of those 12 files would have silenced this guard for that record,
 * with no reason and no issue.
 */
async function containers(repoRoot) {
  const out = [];
  try {
    const manifest = JSON.parse(await readFile(join(repoRoot, "manifest.json"), "utf8"));
    if (manifest.container) out.push({ path: "manifest.json#container", container: manifest.container });
    else fail(`${join(repoRoot, "manifest.json")} declares no root container — required by RFC-013`);
  } catch {
    fail(`cannot read ${join(repoRoot, "manifest.json")}`);
  }
  return out;
}

/**
 * The reachable set, with the surface that first reached each instance recorded so the report can
 * say *why* something is published rather than only that it is.
 */
async function reachability(repoRoot) {
  const instances = await loadInstances(repoRoot);
  const byId = new Map();
  for (const { path, record } of instances) {
    if (record?.instanceId) byId.set(record.instanceId, path);
  }

  const pathOf = new Map();
  const tier2 = new Set();
  for (const { path, record } of instances) {
    if (!record?.instanceId) continue;
    // Finding: everything here is keyed by instanceId, so two files sharing one id collapse to a
    // single node and the second is never reported. `repo validate` catches it; `validate-all` — the
    // pipeline this guard runs in — does not.
    if (pathOf.has(record.instanceId)) {
      fail(
        `duplicate instanceId ${record.instanceId}: ${pathOf.get(record.instanceId)} and ${path} — ` +
          `reachability is keyed by id, so one of them is invisible to this check`,
      );
    }
    pathOf.set(record.instanceId, path);
    if (record.typeId) tier2.add(record.instanceId);
  }

  const contains = new Map();
  for (const { relation } of await loadRelations(repoRoot)) {
    if (relation.relationType !== "contains") continue;
    if (!contains.has(relation.sourceInstanceId)) contains.set(relation.sourceInstanceId, []);
    contains.get(relation.sourceInstanceId).push(relation.targetInstanceId);
  }

  // Surface 1 — Composition discovery-query sections. `descends` records whether the section's roots
  // also publish their `contains` subtree; see the header note on `titleFieldId`.
  const roots = [];
  const { views, unexported } = await declaredDocumentViews(repoRoot);
  const queried = new Map(); // typeNamespace/typeName -> { descends, via }
  for (const { path, view } of views) {
    for (const section of view.sections ?? []) {
      // `composition.json` admits two source kinds; only `discovery-query` is used in this
      // repository (srs#525 collapsed the retired `type-query` into it), so only it is
      // implemented. The other kind is refused rather than skipped. Skipping is fail-closed
      // here — an unread section can only shrink the reachable set, so it surfaces as a false
      // violation rather than a missed one — but it would report the *wrong reason*, sending
      // whoever hits it hunting for a missing relation instead of an unimplemented source kind.
      // It is also how a guard quietly stops covering the thing it was written for.
      const kind = section.source?.type;
      if (kind !== "discovery-query") {
        fail(
          `${path} section "${section.sectionId}" uses source kind "${kind}", which this guard does ` +
            `not resolve — implement it here, or the records it publishes will be reported unreachable`,
        );
        continue;
      }
      const query = section.source?.query ?? {};
      const ns = query.typeNamespace;
      const name = query.typeName;
      if (!ns || !name) {
        fail(
          `${path} section "${section.sectionId}" is a discovery-query with no query.typeNamespace/` +
            `query.typeName (the DiscoveryQuery axes this guard resolves)`,
        );
        continue;
      }
      const t = `${ns}/${name}`;
      // A DiscoveryQuery may also carry `lifecycleState`, `lifecycleStates`, `excludeLifecycleStates`
      // (ext:discovery, srs#525) alongside SectionSource's own `containerIds`/`containerScope`
      // arrangement, and `render_service.rs` applies every one of them. This guard resolves the
      // type alone, so a filtered section would confer reachability on records it never renders —
      // fail-OPEN, unlike the unresolved source kinds above. Refused for that reason: a section
      // that excludes `archived` records would otherwise let every archived record in the type
      // read as published.
      const QUERY_FILTERS = ["lifecycleState", "lifecycleStates", "excludeLifecycleStates"];
      const SOURCE_FILTERS = ["containerIds", "containerScope"];
      // Refused on filters that actually narrow, not on their presence. The renderer discards an
      // empty list, ignores a null, and treats `containerScope: "repository"` as "no container
      // filtering" — so the *most explicit* spelling of "this section filters nothing" would
      // otherwise be the one spelling this guard rejects.
      const narrows = (k, v) => {
        if (v === undefined || v === null) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (k === "containerScope") return v !== "repository";
        return true;
      };
      const applied = [
        ...QUERY_FILTERS.filter((k) => narrows(k, query[k])),
        ...SOURCE_FILTERS.filter((k) => narrows(k, section.source[k])),
      ];
      if (applied.length) {
        fail(
          `${path} section "${section.sectionId}" filters its discovery-query by ${applied.join(", ")}, ` +
            `which this guard does not apply — resolving the type alone would report records the ` +
            `section filters out as published`,
        );
        continue;
      }
      const descends = section.titleFieldId !== undefined && section.titleFieldId !== null;
      const prior = queried.get(t);
      // A type queried by several sections publishes its subtree if ANY of them is structured.
      if (!prior || (descends && !prior.descends)) {
        queried.set(t, { descends, via: `${view.namespace}/${view.name}#${section.sectionId}` });
      }
    }
  }
  for (const { path, record } of instances) {
    const q = queried.get(`${record?.typeNamespace}/${record?.typeName}`);
    if (q) roots.push({ id: record.instanceId, surface: `composition discovery-query ${q.via}`, path, descends: q.descends });
  }

  // Surface 2 — Container membership.
  for (const { path, container } of await containers(repoRoot)) {
    const members = [
      ...(container.identityInstanceId ? [container.identityInstanceId] : []),
      ...(container.memberInstanceIds ?? []),
      ...(container.rootInstanceIds ?? []),
    ];
    for (const id of members) roots.push({ id, surface: `container ${path}`, path: byId.get(id) });
  }

  // Surface 3 — the RFC-016 invariant projection.
  for (const path of await instancePaths(repoRoot)) {
    if (!path.startsWith(`${INVARIANT_PROJECTION_ROOT}/`)) continue;
    // `renderInvariants` does a flat `readdir` of the root and keeps `*.json`, so a file in a
    // SUBdirectory is not projected. Treating the root as a path prefix would call it published.
    if (!isInInvariantProjectionRoot(path)) {
      fail(
        `${path} is under ${INVARIANT_PROJECTION_ROOT}/ but in a subdirectory, which the RFC-016 ` +
          `projection does not read — it is published by nothing`,
      );
      continue;
    }
    {
      const id = instances.find((i) => i.path === path)?.record?.instanceId;
      if (id) roots.push({ id, surface: "RFC-016 [R1] invariant projection", path });
    }
  }

  // Descent: `contains`, and only from roots whose surface actually descends. See the header note.
  const surfaceOf = new Map();
  const stack = [];
  for (const r of roots) {
    if (!surfaceOf.has(r.id)) surfaceOf.set(r.id, r.surface);
    if (r.descends) stack.push(r.id);
  }
  while (stack.length) {
    const id = stack.pop();
    for (const target of contains.get(id) ?? []) {
      if (surfaceOf.has(target)) continue;
      // The renderer's descent resolves each child through a Tier-2 lookup, so a `contains` edge to
      // a Note publishes nothing — it makes the whole view fail to render ("missing field
      // 'typeId'"). Treating every target as published would report the corpus green at the moment
      // every document stopped being produced.
      const targetPath = pathOf.get(target);
      if (targetPath !== undefined && !tier2.has(target)) {
        fail(
          `relations: \`contains\` from a published record to ${targetPath}, which is not a Tier-2 ` +
            `Record — the renderer resolves children as Records, so this publishes nothing and ` +
            `aborts the view`,
        );
        continue;
      }
      surfaceOf.set(target, `contains from ${surfaceOf.get(id)}`);
      stack.push(target);
    }
  }

  const reachable = [];
  const unreachable = [];
  for (const { path, record } of instances) {
    const id = record?.instanceId;
    (id && surfaceOf.has(id) ? reachable : unreachable).push({ path, id, surface: id ? surfaceOf.get(id) : null });
  }
  return { instances, views, unexported, reachable, unreachable, surfaceOf };
}

async function loadExclusions() {
  if (!existsSync(EXCLUSIONS)) {
    fail(`missing exclusion list: ${EXCLUSIONS} — a repository with no unpublished records still declares an empty one`);
    return [];
  }
  let doc;
  try {
    doc = JSON.parse(await readFile(EXCLUSIONS, "utf8"));
  } catch (error) {
    fail(`exclusion list does not parse: ${EXCLUSIONS}: ${error.message}`);
    return [];
  }
  const entries = doc?.exclusions;
  if (!Array.isArray(entries)) {
    fail(`exclusion list has no "exclusions" array: ${EXCLUSIONS}`);
    return [];
  }
  // Typed, not free prose: every entry must carry the instance it excludes, why, and the issue that
  // owns its real resolution. A reason-less entry is an allowlist, which is the thing this is not.
  const valid = [];
  const seen = new Set();
  for (const [i, e] of entries.entries()) {
    const where = `${EXCLUSIONS} exclusions[${i}]`;
    const missing = ["instanceId", "path", "reason", "issue"].filter((k) => typeof e?.[k] !== "string" || !e[k].trim());
    if (missing.length) {
      fail(`${where} is missing required properties: ${missing.join(", ")}`);
      continue;
    }
    // `#<number>`, matching the issue-number requirement the sibling allowlist in
    // check-idl-schema-conformance.mjs enforces for the same reason: "later" is not a tracking issue,
    // and a suppression nobody can navigate back to is how the list stops shrinking.
    if (!/^#[1-9]\d*$/.test(e.issue)) {
      fail(`${where} issue "${e.issue}" is not a GitHub issue reference of the form #<number>`);
      continue;
    }
    if (seen.has(e.instanceId)) {
      fail(`${where} duplicates the exclusion for ${e.instanceId} — one entry per instance`);
      continue;
    }
    seen.add(e.instanceId);
    valid.push(e);
  }
  return valid;
}

async function main() {
  const { instances, views, unexported, reachable, unreachable, surfaceOf } = await reachability(REPO);
  const exclusions = await loadExclusions();
  const excludedById = new Map(exclusions.map((e) => [e.instanceId, e]));
  const discovered = new Set(instances.map((i) => i.record?.instanceId).filter(Boolean));

  // A floor. Every other failure mode here is "too many unreachable"; this one is "the walk found
  // nothing", which would otherwise read as a clean bill of health.
  if (instances.length === 0) fail(`no instances discovered under ${REPO} — the walk found nothing`);
  if (views.length === 0) fail(`no Composition is declared by any package under ${REPO}/package`);

  const undeclared = unreachable.filter((u) => !excludedById.has(u.id));
  for (const u of undeclared) {
    fail(
      `${u.path} is discovered but unreachable from every declared presentation — publish it, ` +
        `or record its invisibility in scripts/publication-reachability-exclusions.json with a reason`,
    );
  }

  // Stale exclusions are errors in both directions. An entry for an instance that no longer exists
  // is dead weight; an entry for one that has since become reachable is a suppression that would
  // hide the next regression at that path.
  const pathOf = new Map(instances.map((i) => [i.record?.instanceId, i.path]));
  for (const e of exclusions) {
    if (!discovered.has(e.instanceId)) {
      fail(`stale exclusion: ${e.path} (${e.instanceId}) is no longer a discovered instance — remove the entry`);
    } else if (surfaceOf.has(e.instanceId)) {
      fail(
        `stale exclusion: ${e.path} is now reachable via ${surfaceOf.get(e.instanceId)} — remove the entry`,
      );
    } else if (pathOf.get(e.instanceId) !== e.path) {
      // Matching is by `instanceId`, so without this the `path` is decorative: rename or move an
      // excluded record and the suppression follows the UUID silently while the census — the artifact
      // read to decide what #274/#285 must fix — keeps pointing at a file that is no longer there.
      fail(
        `stale exclusion: ${e.instanceId} is excluded as "${e.path}" but is stored at ` +
          `"${pathOf.get(e.instanceId)}" — update the entry`,
      );
    }
  }

  if (REPORT) {
    const dirOf = (p) => p.split("/").slice(0, -1).join("/");
    const rows = new Map();
    for (const i of instances) {
      const d = dirOf(i.path);
      if (!rows.has(d)) rows.set(d, { total: 0, reachable: 0, excluded: 0, undeclared: 0 });
      const r = rows.get(d);
      r.total++;
      if (surfaceOf.has(i.record?.instanceId)) r.reachable++;
      else if (excludedById.has(i.record?.instanceId)) r.excluded++;
      else r.undeclared++;
    }
    console.log(`# Publication reachability — ${REPO}`);
    console.log(`\ninstances discovered : ${instances.length}`);
    console.log(`Compositions published    : ${views.length}`);
    for (const u of unexported) {
      // Reported, not failed: a view declared by a package but rendered by nothing publishes no
      // record, which is this guard's concern and is handled by not counting it. Whether such a view
      // should exist at all is a corpus question (#285), not this check's to force.
      console.log(`  declared but never exported: ${u.path} (${u.id}) — publishes nothing`);
    }
    console.log(`reachable             : ${reachable.length}`);
    console.log(`unreachable           : ${unreachable.length}`);
    console.log(`  declared invisible  : ${unreachable.length - undeclared.length}`);
    console.log(`  UNDECLARED          : ${undeclared.length}`);
    console.log(`\n| directory | total | reachable | declared invisible | undeclared |`);
    console.log(`|---|---:|---:|---:|---:|`);
    for (const [d, r] of [...rows].sort()) {
      console.log(`| \`${d}\` | ${r.total} | ${r.reachable} | ${r.excluded} | ${r.undeclared} |`);
    }
    console.log(`\n## Unreachable instances\n`);
    for (const u of [...unreachable].sort((a, b) => a.path.localeCompare(b.path))) {
      const e = excludedById.get(u.id);
      console.log(`- \`${u.path}\` — ${e ? `declared invisible (${e.issue}): ${e.reason}` : "**UNDECLARED**"}`);
    }
  }

  if (problems.length) {
    console.error(`\n✗ Publication reachability (#285): ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `✓ Every discovered record is reachable from a declared presentation or declared invisible ` +
      `(${reachable.length} reachable, ${unreachable.length} declared invisible, of ${instances.length})`,
  );
}

await main();
