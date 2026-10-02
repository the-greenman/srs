#!/usr/bin/env node
/**
 * check-actor-defs-identical.mjs — the three `$defs/Actor` entries are byte-identical (RFC-046 [R1]).
 *
 * The committed schemas use no cross-file `$ref`, so the Actor shape is repeated in record.json,
 * note.json and relation.json. Extracts each entry's exact source text (not a parsed re-serialisation,
 * which would hide whitespace drift) and fails if any copy is missing or differs.
 *
 *   node scripts/check-actor-defs-identical.mjs [root]
 */
import { readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = process.argv[2] ? resolve(process.argv[2]) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["record.json", "note.json", "relation.json"];

// The entry runs from `    "Actor": {` to the next 4-space-indented closing `    },` or `    }`.
const entry = (src) => src.match(/^ {4}"Actor": \{\n[\s\S]*?\n {4}\},?$/m)?.[0].replace(/,$/, "");

const copies = FILES.map((f) => [f, entry(readFileSync(join(ROOT, "docs/schema/2.0", f), "utf8"))]);
const bad = copies.filter(([, e]) => e === undefined || e !== copies[0][1]);

if (bad.length) {
  bad.forEach(([f, e]) => console.log(`  ✗ ${f}: $defs/Actor ${e === undefined ? "missing" : `differs from ${FILES[0]}`}`));
  console.log("\n✗ RFC-046 [R1]: the $defs/Actor entries in record.json, note.json and relation.json must be byte-identical.");
  process.exit(1);
}
console.log(`✓ $defs/Actor is byte-identical in ${FILES.join(", ")} (RFC-046 [R1])`);
