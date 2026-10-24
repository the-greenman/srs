// RFC-043 [R1]/[R3]: `Container.memberInstanceIds` is an ordered list of `{instanceId, depth?}` entries.
// `entryIds(c)` is direct(C): the entry ids read flat, in list order. `rootInstanceIds` no longer exists.
//
// Every script that reads container files reads them through this module (srs#966, srs#949). At
// revision 11 (RFC-051 [R1]) a container is `containers/<containerId>/container.json`, a head without
// `memberInstanceIds`, plus `entries/<instanceId>.json`, one `{containerId, instanceId, parent?, key}`
// each, decoded into the logical `memberInstanceIds` by RFC-051 [R5] (`decodeEntries`). A flat
// `containers/*.json` is not a container at revision 11 (`repo validate` reports it as
// `container-migration-needed`), so it is not read. Callers always see the logical form, never
// `parent` or `key` ([R5]).
//
// ponytail: a JS port of the decode, kept as the bridge #968 A1 recorded; the readers move onto the
// pinned srs CLI once their guard fixtures are CLI-loadable repositories (see srs#949).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export const entryIds = (container) => (container?.memberInstanceIds ?? []).map((e) => e.instanceId);

// RFC-051 [R5]; a port of srs-core `container_decode.rs` (srs-rust#1433) without its diagnostics,
// which `repo validate` reports. Orphans (parent names no entry) and each loop's break (its lowest
// instanceId) go to the top level after the attached parentless entries; siblings by key, then
// instanceId, byte-wise (keys and lowercase UUIDs are ASCII, so `<` is byte order); pre-order walk.
export function decodeEntries(stored) {
  const index = new Map(stored.map((e, i) => [e.instanceId, i]));
  const parent = stored.map((e) => (e.parent == null ? null : index.get(e.parent) ?? null));
  const detached = stored.map((e, i) => e.parent != null && parent[i] === null);
  const state = stored.map(() => 0); // 0 unvisited, 1 on the current walk, 2 done
  for (let start = 0; start < stored.length; start++) {
    const walk = [];
    for (let i = start; i !== null && state[i] !== 2; i = parent[i]) {
      if (state[i] === 1) {
        const loop = walk.slice(walk.indexOf(i));
        const brk = loop.reduce((a, b) => (stored[b].instanceId < stored[a].instanceId ? b : a));
        parent[brk] = null;
        detached[brk] = true;
        break;
      }
      state[i] = 1;
      walk.push(i);
    }
    for (const w of walk) state[w] = 2;
  }
  const cmp = (x, y) => {
    const [a, b] = [stored[x], stored[y]];
    if (a.key !== b.key) return a.key < b.key ? -1 : 1;
    return a.instanceId < b.instanceId ? -1 : a.instanceId > b.instanceId ? 1 : 0;
  };
  const children = stored.map(() => []);
  const top = [];
  const tail = [];
  stored.forEach((_, i) => (parent[i] !== null ? children[parent[i]] : detached[i] ? tail : top).push(i));
  children.forEach((c) => c.sort(cmp));
  const out = [];
  const stack = [...top.sort(cmp), ...tail.sort(cmp)].reverse().map((i) => [i, 0]);
  while (stack.length) {
    const [i, depth] = stack.pop();
    out.push(depth ? { instanceId: stored[i].instanceId, depth } : { instanceId: stored[i].instanceId });
    for (const c of [...children[i]].reverse()) stack.push([c, depth + 1]);
  }
  return out;
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

// One stored container directory `containers/<name>/`, in the logical form. `path` (the head's) is
// relative to the repository root.
function readStored(repoDir, name) {
  const full = join(repoDir, "containers", name);
  const head = readJson(join(full, "container.json"));
  const entriesDir = join(full, "entries");
  const stored = existsSync(entriesDir)
    ? readdirSync(entriesDir).filter((n) => n.endsWith(".json")).map((n) => readJson(join(entriesDir, n)))
    : [];
  return { path: `containers/${name}/container.json`, container: { ...head, memberInstanceIds: decodeEntries(stored) } };
}

// Every container directory under `containers/`, sorted by name. An unreadable one (or a directory
// with no head) is skipped: its diagnostic belongs to `repo validate`, not to the check reading
// memberships.
export function listContainers(repoDir) {
  const dir = join(repoDir, "containers");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!e.isDirectory()) continue;
    try {
      out.push(readStored(repoDir, e.name));
    } catch {
      /* skipped, see above */
    }
  }
  return out;
}

// RFC-052: the manifest names the root container by `rootContainerId`, and the root is stored in
// `containers/` like every other container. A manifest that names no root, or names one that is not
// stored, throws: a check must never pass over an empty root. `readRootStored` also returns its path.
export const readRootContainer = (repoDir, manifest) => readRootStored(repoDir, manifest).container;
export function readRootStored(repoDir, manifest) {
  const id = manifest?.rootContainerId;
  if (!id) throw new Error(`${join(repoDir, "manifest.json")} names no root container: rootContainerId is required (RFC-052 [R1])`);
  if (!existsSync(join(repoDir, "containers", id, "container.json"))) {
    throw new Error(`manifest.rootContainerId ${id} names no container at ${join(repoDir, "containers", id, "container.json")} (RFC-052 [R1], RFC-051 [R1])`);
  }
  return readStored(repoDir, id);
}

// Test fixtures only: store a logical container `{..., memberInstanceIds}` in the RFC-051 [R1]
// directory form. Parents come from depth (RFC-043 [R5]); keys are `b` + two digits in entry order,
// which orders every sibling run correctly (at most 3844 entries). Real data is written by the CLI.
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export function storeContainer(repoDir, container) {
  const { memberInstanceIds = [], ...head } = container;
  const dir = join(repoDir, "containers", container.containerId);
  mkdirSync(join(dir, "entries"), { recursive: true });
  writeFileSync(join(dir, "container.json"), `${JSON.stringify(head)}\n`);
  const path = []; // path[d] = the latest entry at depth d
  memberInstanceIds.forEach(({ instanceId, depth = 0 }, i) => {
    path[depth] = instanceId;
    const key = `b${DIGITS[Math.floor(i / 62)]}${DIGITS[i % 62]}`;
    const entry = { containerId: container.containerId, instanceId, ...(depth ? { parent: path[depth - 1] } : {}), key };
    writeFileSync(join(dir, "entries", `${instanceId}.json`), `${JSON.stringify(entry)}\n`);
  });
  return join(dir, "container.json");
}
