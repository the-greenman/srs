#!/usr/bin/env node
/**
 * check-discovery-query-defs-identical.mjs — composition.json's copy of DiscoveryQuery matches discovery.json (RFC-056 Change E).
 *
 * composition.json carries its own copy of `$defs/DiscoveryQuery` and the defs it references, because
 * scripts/lib/json-schema-lite.mjs resolves only local '#/...' refs. Compares the parsed defs, ignoring
 * the copy's `$comment`, and fails if any is missing or differs.
 *
 *   node scripts/check-discovery-query-defs-identical.mjs [root]
 */
import { readFileSync } from "fs";
import { isDeepStrictEqual } from "util";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = process.argv[2] ? resolve(process.argv[2]) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFS = ["DiscoveryQuery", "FieldFilter", "FieldFilterValues", "FieldFilterBound"];
const load = (f) => JSON.parse(readFileSync(join(ROOT, "docs/schema/2.0", f), "utf8")).$defs ?? {};
const strip = (d) => {
  if (d === undefined) return d;
  const { $comment, ...rest } = d;
  return rest;
};

const canon = load("discovery.json");
const copy = load("composition.json");
const bad = DEFS.filter((k) => canon[k] === undefined || !isDeepStrictEqual(strip(canon[k]), strip(copy[k])));

if (bad.length) {
  bad.forEach((k) => console.log(`  ✗ $defs/${k}: ${canon[k] === undefined ? "missing from discovery.json" : copy[k] === undefined ? "missing from composition.json" : "differs"}`));
  console.log("\n✗ RFC-056 Change E: composition.json's DiscoveryQuery defs must match discovery.json (ignoring $comment).");
  process.exit(1);
}
console.log(`✓ composition.json matches discovery.json for ${DEFS.map((k) => `$defs/${k}`).join(", ")} (RFC-056 Change E)`);
