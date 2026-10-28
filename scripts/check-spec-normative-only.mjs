#!/usr/bin/env node
/**
 * check-spec-normative-only.mjs — the specification carries only what is needed to use it; the
 * unified document carries the rationale (srs#982, owner ruling 2026-10-28).
 *
 * The two outputs converged once already, silently: RFC-042 Change G (bc18336, #693) moved both
 * compositions onto the Part containers and design-note leaves began rendering in docs/spec/srs-spec.md
 * too, leaving it byte-identical to srs-unified.md. Nothing failed. This check fails when
 * docs/spec/srs-spec.md
 *   1. has a heading that is exactly a `com.semanticops.spec/design-note` title,
 *   2. has a `**Rationale**:` line (the invariant `rationale` field), or
 *   3. is byte-identical to docs/spec/srs-unified.md.
 */
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadInstances } from "./lib/rfc-038-tree.mjs";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = `${ROOT}/srs`;

const spec = await readFile(`${ROOT}/docs/spec/srs-spec.md`, "utf8");
const unified = await readFile(`${ROOT}/docs/spec/srs-unified.md`, "utf8");

const designNoteTitles = new Set(
  (await loadInstances(REPO))
    .filter(({ record }) => record?.typeNamespace === "com.semanticops.spec" && record?.typeName === "design-note")
    .map(({ record }) => record.fieldValues?.title)
    .filter(Boolean),
);

const problems = [];
if (designNoteTitles.size === 0) problems.push("no design-note records found: the check would pass vacuously");
for (const line of spec.split("\n")) {
  const heading = line.match(/^#{1,6} (.+)$/)?.[1];
  if (heading && designNoteTitles.has(heading)) problems.push(`design-note heading in srs-spec.md: "${heading}"`);
  if (line.startsWith("**Rationale**:")) problems.push(`invariant rationale in srs-spec.md: ${line.slice(0, 80)}…`);
}
if (spec === unified) problems.push("srs-spec.md is byte-identical to srs-unified.md");

if (problems.length) {
  console.log(`\n✗ Spec normative-only (srs#982): ${problems.length} problem(s)\n`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ srs-spec.md carries no rationale (${designNoteTitles.size} design-note titles checked) and differs from srs-unified.md`);
