// RFC-043 [R1]/[R3]: `Container.memberInstanceIds` is an ordered list of `{instanceId, depth?}` entries.
// `entryIds(c)` is direct(C): the entry ids read flat, in list order. `rootInstanceIds` no longer exists.
//
// Every script that reads container files reads them through this module, so it serves both stored
// layouts (srs#966, prep for #949):
//   - revision 10 and earlier: `containers/<name>.json`, one file holding `memberInstanceIds`;
//   - revision 11 (RFC-051 [R1]): `containers/<containerId>/container.json`, a head without
//     `memberInstanceIds`, plus `entries/<instanceId>.json`, one `{containerId, instanceId, parent?, key}`
//     each, decoded into the logical `memberInstanceIds` by RFC-051 [R5] (`decodeEntries`).
// Callers always see the logical form, never `parent` or `key` ([R5]).
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
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

// One stored container at `containers/<name>` (a `.json` file or a directory), in the logical form.
// `path` is relative to the repository root.
function readStored(repoDir, name) {
  const full = join(repoDir, "containers", name);
  if (!statSync(full).isDirectory()) return { path: `containers/${name}`, container: readJson(full) };
  const head = readJson(join(full, "container.json"));
  const entriesDir = join(full, "entries");
  const stored = existsSync(entriesDir)
    ? readdirSync(entriesDir).filter((n) => n.endsWith(".json")).sort().map((n) => readJson(join(entriesDir, n)))
    : [];
  return { path: `containers/${name}/container.json`, container: { ...head, memberInstanceIds: decodeEntries(stored) } };
}

// Every container under `containers/`, sorted by stored name. An unreadable one is skipped: its
// diagnostic belongs to `repo validate`, not to the check reading memberships.
export function listContainers(repoDir) {
  const dir = join(repoDir, "containers");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json") && !statSync(join(dir, name)).isDirectory()) continue;
    try {
      out.push(readStored(repoDir, name));
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
  const name = [`${id}.json`, id].find((n) => existsSync(join(repoDir, "containers", n)));
  if (!name) throw new Error(`manifest.rootContainerId ${id} names no container at ${join(repoDir, "containers", id)}[.json] (RFC-052 [R1])`);
  return readStored(repoDir, name);
}
