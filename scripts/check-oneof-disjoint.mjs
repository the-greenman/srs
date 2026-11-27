#!/usr/bin/env node
/**
 * check-oneof-disjoint.mjs — a `oneOf` over a uuid-format branch and an empty-string `const`
 * must have disjoint branches (srs#1054).
 *
 * `format` is an annotation unless a validator asserts formats, so `{type:string, format:uuid}`
 * also accepts "". Paired with `{const: ""}` under `oneOf`, the empty string matches both and is
 * rejected, which made a loose Protocol (targetType "") impossible to store. The uuid branch must
 * exclude "" itself (`minLength` >= 1 or a `pattern`).
 *
 *   node scripts/check-oneof-disjoint.mjs [root]   # root defaults to the repo root
 */
import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url)));
const dir = join(root, "docs", "schema", "2.0");
const failures = [];

function walk(node, file, path) {
  if (Array.isArray(node)) return node.forEach((n, i) => walk(n, file, `${path}/${i}`));
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.oneOf)) {
    const hasEmpty = node.oneOf.some((b) => b && b.const === "");
    const open = node.oneOf.filter(
      (b) => b && b.type === "string" && b.format === "uuid" && !(b.minLength >= 1) && !b.pattern,
    );
    if (hasEmpty && open.length) failures.push(`${file} ${path}: uuid branch accepts "" and so does const ""`);
  }
  for (const [k, v] of Object.entries(node)) walk(v, file, `${path}/${k}`);
}

for (const f of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "SHA256SUMS")) {
  walk(JSON.parse(readFileSync(join(dir, f), "utf8")), f, "");
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("check-oneof-disjoint: ok");
