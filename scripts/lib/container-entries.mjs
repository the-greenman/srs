// RFC-043 [R1]/[R3]: `Container.memberInstanceIds` is an ordered list of `{instanceId, depth?}` entries.
// `entryIds(c)` is direct(C): the entry ids read flat, in list order. `rootInstanceIds` no longer exists.
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const entryIds = (container) => (container?.memberInstanceIds ?? []).map((e) => e.instanceId);

// RFC-052: the manifest names the root container by `rootContainerId`, and the root is stored at
// `containers/<rootContainerId>.json` like every other container. `{}` when the manifest names no
// root; a named root whose file is missing throws, so a check never passes over an empty root.
export function readRootContainer(repoDir, manifest) {
  const id = manifest?.rootContainerId;
  if (!id) return {};
  const path = join(repoDir, "containers", `${id}.json`);
  if (!existsSync(path)) throw new Error(`manifest.rootContainerId ${id} names no file at ${path} (RFC-052 [R1])`);
  return JSON.parse(readFileSync(path, "utf8"));
}
