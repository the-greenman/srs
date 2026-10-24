#!/usr/bin/env node
/**
 * tests/container-entries/run.mjs — the shared container reader decodes the revision-11 layout (srs#966, srs#949).
 *
 * 1. `decodeEntries` reproduces srs-core's RFC-051 [R5] decode vectors (container_decode.rs,
 *    srs-rust#1433): orphans, loops, detached ordering, equal keys.
 * 2. Every container of the spec corpus (stored by the CLI's migration), re-stored by the fixture
 *    writer `storeContainer` (parent from depth, keys in entry order), reads back through
 *    `listContainers` and `readRootContainer` with the same logical form: the guards' fixture writer
 *    and the reader agree on the corpus.
 */
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { decodeEntries, listContainers, readRootContainer, storeContainer } from "../../scripts/lib/container-entries.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let failures = 0;
const same = (label, got, want) => {
  const [g, w] = [JSON.stringify(got), JSON.stringify(want)];
  if (g !== w) {
    failures++;
    console.error(`✗ ${label}\n    got  ${g}\n    want ${w}`);
  }
};

// 1. srs-core vectors: [id, parent, key] in; [id, depth] out.
const decode = (entries) => decodeEntries(entries.map(([instanceId, parent, key]) => ({ instanceId, ...(parent ? { parent } : {}), key })));
const shape = (spec) => spec.map(([instanceId, depth]) => (depth ? { instanceId, depth } : { instanceId }));
same("orphan and its descendants follow the attached top level",
  decode([["o", "gone", "a0"], ["c", "o", "a0"], ["t", null, "a5"], ["u", "t", "a0"]]),
  shape([["t", 0], ["u", 1], ["o", 0], ["c", 1]]));
same("dangling pointer is an orphan", decode([["x", "missing", "a0"]]), shape([["x", 0]]));
same("loop with a tail breaks at the lowest id",
  decode([["r", null, "a0"], ["b", "d", "a0"], ["c", "b", "a0"], ["d", "c", "a0"], ["t", "c", "a1"]]),
  shape([["r", 0], ["b", 0], ["c", 1], ["d", 2], ["t", 2]]));
same("loop with no attached entry", decode([["y", "x", "a0"], ["x", "y", "a0"]]), shape([["x", 0], ["y", 1]]));
same("self loop", decode([["self", "self", "a0"]]), shape([["self", 0]]));
same("detached entries sort among themselves by key",
  decode([["o", "gone", "a2"], ["x", "x", "a1"], ["p", null, "a9"]]),
  shape([["p", 0], ["x", 0], ["o", 0]]));
same("equal keys order by instanceId byte-wise",
  decode([["b", null, "a0"], ["B", null, "a0"], ["a", null, "a0"], ["z", null, "Zz"]]),
  shape([["z", 0], ["B", 0], ["a", 0], ["b", 0]]));

// 2. Round trip of the real corpus through the fixture writer.
const spec = join(REPO, "srs");
const flat = listContainers(spec);
const tmp = mkdtempSync(join(tmpdir(), "container-entries-"));
try {
  for (const { container } of flat) storeContainer(tmp, container);
  // Logical equality: an absent memberInstanceIds is the empty outline, and property order is not data.
  const norm = (c) => Object.fromEntries(Object.entries({ memberInstanceIds: [], ...c }).sort(([a], [b]) => (a < b ? -1 : 1)));
  const byId = (list) => Object.fromEntries(list.map(({ container }) => [container.containerId, norm(container)]));
  const [want, got] = [byId(flat), byId(listContainers(tmp))];
  same("container count", Object.keys(got).length, Object.keys(want).length);
  for (const id of Object.keys(want)) same(`container ${id} round-trips`, got[id], want[id]);
  const manifest = JSON.parse(readFileSync(join(spec, "manifest.json"), "utf8"));
  same("root container round-trips", norm(readRootContainer(tmp, manifest)), norm(readRootContainer(spec, manifest)));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n✗ ${failures} container-entries case(s) failed`);
  process.exit(1);
}
if (flat.length === 0) {
  console.error("✗ container-entries: no corpus container was read");
  process.exit(1);
}
console.log(`✓ container-entries: 7 decode vectors; ${flat.length} corpus containers round-trip through the fixture writer`);
