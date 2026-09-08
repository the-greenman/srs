#!/usr/bin/env node
/**
 * part-container-membership.mjs — computes each Part's declared container membership (srs#563,
 * RFC-042 [R7]) by walking the `contains` tree from the Part concept, the same walk
 * check-spec-coherence.mjs check 4 (part-order) uses to build `partOf`.
 *
 * A Part container's `memberInstanceIds` is the Part's full `contains`-subtree, EXCLUDING the
 * Part concept itself (which is the container's `anchorInstanceId` / sole `rootInstanceIds`
 * entry — I-82, srs-rust#460: an anchor must not also be a member).
 *
 * Usage:
 *   node scripts/part-container-membership.mjs [root]              # print computed membership per Part
 *   node scripts/part-container-membership.mjs [root] --check       # exit 1 on drift vs containers/*.json
 */
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, resolve, relative } from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const CHECK = process.argv.includes("--check");
const ROOT = args[0] ? resolve(args[0]) : resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const records = new Map();
for (const [p, doc] of await walkJson(join(ROOT, "srs/records"))) {
  if (doc.instanceId) records.set(doc.instanceId, { path: relative(ROOT, p), fieldValues: doc.fieldValues ?? {} });
}
const relations = (await walkJson(join(ROOT, "srs/relations"))).map(([, r]) => r);
const children = new Map();
for (const r of relations) {
  if (r.relationType === "contains") {
    children.set(r.sourceInstanceId, [...(children.get(r.sourceInstanceId) ?? []), r.targetInstanceId]);
  }
}
function subtree(id) {
  const seen = new Set();
  const stack = [...(children.get(id) ?? [])]; // exclude id itself — anchor is not a member
  while (stack.length) {
    const x = stack.pop();
    if (seen.has(x)) continue;
    seen.add(x);
    for (const c of children.get(x) ?? []) stack.push(c);
  }
  return seen;
}

const manifest = JSON.parse(await readFile(join(ROOT, "srs/manifest.json"), "utf8"));
const rootContainer = manifest.container ?? {};
const identity = rootContainer.identityInstanceId;
const parts = (rootContainer.memberInstanceIds ?? []).filter((m) => m !== identity);

const containerFiles = await walkJson(join(ROOT, "srs/containers"));
const containersByAnchor = new Map();
for (const [p, c] of containerFiles) {
  if (c.anchorInstanceId) containersByAnchor.set(c.anchorInstanceId, { path: relative(ROOT, p), doc: c });
}

let drift = 0;
for (const partId of parts) {
  const computed = [...subtree(partId)].sort();
  const title = records.get(partId)?.fieldValues?.title ?? partId;
  const entry = containersByAnchor.get(partId);
  if (!entry) {
    console.log(`${title} (${partId}): NO Part container found (anchorInstanceId=${partId})`);
    drift++;
    continue;
  }
  const declared = [...(entry.doc.memberInstanceIds ?? [])].sort();
  const same = computed.length === declared.length && computed.every((id, i) => id === declared[i]);
  console.log(`${title}: ${computed.length} computed, ${declared.length} declared${same ? " (match)" : " (DRIFT)"}`);
  if (!same) drift++;
}

if (CHECK) {
  if (drift > 0) {
    console.error(`\n✗ ${drift} Part container(s) drifted from their computed contains-subtree`);
    process.exit(1);
  }
  console.log(`\n✓ all ${parts.length} Part containers match their computed contains-subtree`);
}
