#!/usr/bin/env node
/**
 * check-agent-readability.mjs — an agent with only a fetch tool can read the published specification
 * (srs#983). docs/llms.txt and docs/agents/**.md are generated from docs/spec/srs-spec.md by
 * scripts/lib/agent-pages.mjs; this check fails when
 *   0. they are stale: regenerating them from the committed spec gives different files,
 *   1. a page under docs/agents/ reaches PAGE_LIMIT characters,
 *   2. a link in llms.txt or on a page does not resolve to a file under docs/,
 *   3. a page says "see below" or "see above" outside a code block (on a split page the target may
 *      be on another page), or
 *   4. a backticked identifier (`PascalCase`) on a page or in the glossary is defined nowhere in the
 *      published set: no glossary entry and no heading names it. KNOWN_UNDEFINED is the debt at
 *      srs#983's merge; it may only shrink (an entry that has become defined is reported too).
 * Each rule is exercised against a synthetic page before the real check runs, so a rule that stops
 * firing is itself a failure.
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { dirname, join, posix, resolve } from "path";
import { fileURLToPath } from "url";
import { buildAgentPages, PAGE_LIMIT } from "./lib/agent-pages.mjs";

const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "docs");

// ponytail: a frozen list, not a definitions registry; srs#987 defines or removes each.
const KNOWN_UNDEFINED = new Set([
  "ChangelogCollection", "ChangelogEntry", "Created", "DependencyRef", "ExactTypeRef", "FieldGroup",
  "FieldGroupEntry", "FieldGroupValue", "FieldValueEntry", "ProjectedFieldGroup", "ProjectedGroupEntry",
  "ProjectedPropertyRow", "ProjectedRecord", "Revision", "Status", "TagDefinition", "Tags",
  "TemplateFacilitationStep", "TypedRecord", "Updated",
]);

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const unfenced = (text) => text.replace(/^```[\s\S]*?^```/gm, "");

/** @param files Map of docs-relative path → content; @param exists docs-relative path → boolean. */
function problemsIn(files, glossary, exists, knownUndefined) {
  const problems = [];
  const defined = new Set();
  for (const text of [glossary, ...files.values()]) {
    for (const [, heading] of unfenced(text).matchAll(/^#+ (.+)$/gm)) {
      defined.add(norm(heading));
      for (const [, id] of heading.matchAll(/`([A-Za-z][A-Za-z0-9]*)`/g)) defined.add(norm(id));
    }
  }
  const undefinedTerms = new Set();
  for (const [path, text] of files) {
    if (path.startsWith("agents/") && text.length >= PAGE_LIMIT) {
      problems.push(`${path}: ${text.length} characters, the limit is under ${PAGE_LIMIT}`);
    }
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:/.test(target) && !target.startsWith("https://srs.semanticops.com/")) continue;
      const bare = target.replace(/^https:\/\/srs\.semanticops\.com/, "").split("#")[0];
      if (!bare) continue;
      const resolved = bare.startsWith("/") ? bare.slice(1) : posix.join(posix.dirname(path), bare);
      if (!exists(resolved)) problems.push(`${path}: link ${target} does not resolve`);
    }
    if (!path.startsWith("agents/")) continue;
    for (const m of unfenced(text).matchAll(/see (below|above)/gi)) problems.push(`${path}: dangling pointer "${m[0]}"`);
    for (const [, id] of unfenced(text).matchAll(/`([A-Z][a-z]+(?:[A-Z][a-z0-9]*)+|[A-Z][a-z]{3,})`/g)) {
      if (!defined.has(norm(id))) undefinedTerms.add(id);
    }
  }
  for (const [, id] of unfenced(glossary).matchAll(/`([A-Z][a-z]+(?:[A-Z][a-z0-9]*)+|[A-Z][a-z]{3,})`/g)) {
    if (!defined.has(norm(id))) undefinedTerms.add(id);
  }
  for (const id of undefinedTerms) {
    if (!knownUndefined.has(id)) problems.push(`\`${id}\` is used but has no glossary entry or heading`);
  }
  for (const id of knownUndefined) {
    if (!undefinedTerms.has(id)) problems.push(`\`${id}\` is in KNOWN_UNDEFINED but no longer undefined: remove it`);
  }
  return problems;
}

function selfTest() {
  const ok = new Map([["agents/a.md", "# A\n\nSee [B](/agents/b.md).\n"], ["agents/b.md", "# B\n"]]);
  const has = (p) => ok.has(p);
  const cases = {
    "page size": new Map([...ok, ["agents/a.md", "# A\n" + "x".repeat(PAGE_LIMIT)]]),
    "link": new Map([...ok, ["agents/a.md", "# A\n\n[gone](/agents/gone.md)\n"]]),
    "see below": new Map([...ok, ["agents/a.md", "# A\n\nThe rule, see below.\n"]]),
    "glossary term": new Map([...ok, ["agents/a.md", "# A\n\nA `SourceAnchor` names a span.\n"]]),
  };
  const failures = [];
  if (problemsIn(ok, "", has, new Set()).length) failures.push("a clean page set reports problems");
  for (const [rule, files] of Object.entries(cases)) {
    if (!problemsIn(files, "", has, new Set()).length) failures.push(`the ${rule} rule did not fire`);
  }
  return failures;
}

function listDocs(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listDocs(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  );
}

const problems = selfTest();
const manifest = JSON.parse(readFileSync(join(ROOT, "srs", "manifest.json"), "utf8"));
const expected = buildAgentPages(readFileSync(join(DOCS, "spec", "srs-spec.md"), "utf8"), manifest);
const committed = new Map(
  [...(existsSync(join(DOCS, "agents")) ? listDocs(join(DOCS, "agents"), "agents/") : []), "llms.txt"]
    .filter((p) => existsSync(join(DOCS, p)))
    .map((p) => [p, readFileSync(join(DOCS, p), "utf8")]),
);
for (const [path, content] of expected) {
  if (committed.get(path) !== content) problems.push(`${path} is stale or missing: run node scripts/publish-spec.mjs`);
}
for (const path of committed.keys()) {
  if (!expected.has(path)) problems.push(`${path} is not generated from the spec: remove it`);
}
const glossary = readFileSync(join(DOCS, "spec", "srs-glossary.md"), "utf8");
problems.push(...problemsIn(expected, glossary, (p) => existsSync(join(DOCS, p)), KNOWN_UNDEFINED));

if (problems.length) {
  console.log(`\n✗ Agent readability (srs#983): ${problems.length} problem(s)\n`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ ${expected.size - 1} agent pages and llms.txt are current, each page under ${PAGE_LIMIT} characters, every link resolves`);
