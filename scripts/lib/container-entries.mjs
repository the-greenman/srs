// RFC-043 [R1]/[R3]: `Container.memberInstanceIds` is an ordered list of `{instanceId, depth?}` entries.
// `entryIds(c)` is direct(C): the entry ids read flat, in list order. `rootInstanceIds` no longer exists.
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const entryIds = (container) => (container?.memberInstanceIds ?? []).map((e) => e.instanceId);

// RFC-052: the manifest names the root container by `rootContainerId`, and the root is stored at
// `containers/<rootContainerId>.json` like every other container. `{}` when either is absent.
export function readRootContainer(repoDir, manifest) {
  const id = manifest?.rootContainerId;
  const path = id && join(repoDir, "containers", `${id}.json`);
  return path && existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}
