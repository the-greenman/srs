#!/usr/bin/env node
/**
 * Deterministic extraction of the normative corpus into statement-units for grid
 * classification (srs#471, rfc-decision-b9d7096e "MECHANIZED BALANCE").
 *
 * Three sources, one statement-unit per instance:
 *   - srs/records/invariants/*.json        -> fieldValues.normative_statement
 *   - srs/records/tier-2/rfc-decision-*.json -> fieldValues.decision_statement
 *   - srs/records/subsections/*.json       -> normative rule text inside
 *     fieldValues.content: paragraphs/list-items carrying an RFC-2119 modal keyword
 *     (MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, REQUIRED). Subsection prose is
 *     not pre-segmented into "[R-n]/[N+n] blocks" in the source records (those bracket tags are
 *     citations to RFC rule numbers scattered through free text, not block delimiters) — so a
 *     rule block here is whatever paragraph or list item makes a normative claim, and the ids are
 *     synthetic (`<subsection-file>#r<n>`, stable because paragraph order is stable). Any
 *     `[R-n]`/`[N+n]` tag cited inside the block is carried as `ruleTag` for traceability, not
 *     used as the id.
 *
 * Output is the committed input manifest, scripts/grid-census/census-input.json. Re-running this
 * script over an unchanged tree must reproduce byte-identical output — no wall-clock timestamp is
 * written, and object/array ordering follows filesystem sort order throughout.
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUT_PATH = join(__dirname, 'census-input.json');

const MODAL_RE = /\b(MUST NOT|MUST|SHALL NOT|SHALL|SHOULD NOT|SHOULD|REQUIRED)\b/;
const RULE_TAG_RE = /\[(R[0-9]+|N\+[0-9]+)\]/;

async function listJsonFiles(relDir) {
  const abs = join(REPO_ROOT, relDir);
  const entries = await readdir(abs, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name)
    .sort();
}

async function extractInvariants() {
  const files = await listJsonFiles('srs/records/invariants');
  const out = [];
  for (const file of files) {
    const relPath = `srs/records/invariants/${file}`;
    const doc = JSON.parse(await readFile(join(REPO_ROOT, relPath), 'utf8'));
    const fv = doc.fieldValues;
    out.push({
      id: fv.invariant_number,
      source: 'invariant',
      file: relPath,
      instanceId: doc.instanceId,
      title: fv.title ?? null,
      text: fv.normative_statement,
    });
  }
  return out;
}

async function extractDecisions() {
  const files = await listJsonFiles('srs/records/tier-2');
  const out = [];
  for (const file of files) {
    if (!file.startsWith('rfc-decision-')) continue;
    const relPath = `srs/records/tier-2/${file}`;
    const doc = JSON.parse(await readFile(join(REPO_ROOT, relPath), 'utf8'));
    const fv = doc.fieldValues;
    const shortId = doc.instanceId.split('-')[0];
    out.push({
      id: `rfc-decision-${shortId}`,
      source: 'decision',
      file: relPath,
      instanceId: doc.instanceId,
      title: fv.title ?? null,
      text: fv.decision_statement,
    });
  }
  return out;
}

/**
 * Split subsection markdown content into paragraph/list-item blocks, in document order.
 * Fenced code blocks (pseudo-IDL, JSON, TypeScript illustrations) are dropped entirely — a code
 * comment containing "REQUIRED" is schema illustration, not normative prose, and would otherwise
 * be misread as a rule statement.
 */
function splitBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let current = [];
  let inFence = false;
  const flush = () => {
    if (current.length > 0) {
      blocks.push(current.join('\n').trim());
      current = [];
    }
  };
  const isListStart = (line) => /^(\s*)([-*]|\d+\.)\s+/.test(line);
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      flush();
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (line.trim() === '') {
      flush();
      continue;
    }
    if (isListStart(line) && current.length > 0) {
      // A new top-level list item starts a new block, unless it's a nested continuation
      // (indented relative to a bare bullet marker is still treated as a fresh item here —
      // subsection lists in this corpus are not deep enough to need nested grouping).
      flush();
    }
    current.push(line);
  }
  flush();
  return blocks.filter((b) => b.length > 0);
}

async function extractSubsectionRules() {
  const files = await listJsonFiles('srs/records/subsections');
  const out = [];
  for (const file of files) {
    const relPath = `srs/records/subsections/${file}`;
    const doc = JSON.parse(await readFile(join(REPO_ROOT, relPath), 'utf8'));
    const content = doc.fieldValues.content ?? '';
    const slug = basename(file, '.json');
    const blocks = splitBlocks(content);
    let n = 0;
    for (const block of blocks) {
      if (!MODAL_RE.test(block)) continue;
      n += 1;
      const tagMatch = block.match(RULE_TAG_RE);
      out.push({
        id: `${slug}#r${n}`,
        source: 'subsection-rule',
        file: relPath,
        instanceId: doc.instanceId,
        title: doc.fieldValues.title ?? null,
        ruleTag: tagMatch ? tagMatch[1] : null,
        text: block,
      });
    }
  }
  return out;
}

async function main() {
  const [invariants, decisions, subsectionRules] = await Promise.all([
    extractInvariants(),
    extractDecisions(),
    extractSubsectionRules(),
  ]);

  const statements = [...invariants, ...decisions, ...subsectionRules];

  const manifest = {
    $comment:
      'Deterministic extraction of the normative corpus (srs#471). Re-run: node scripts/grid-census/extract-corpus.mjs. Two runs over an unchanged tree must be byte-identical.',
    counts: {
      invariant: invariants.length,
      decision: decisions.length,
      'subsection-rule': subsectionRules.length,
      total: statements.length,
    },
    statements,
  };

  await writeFile(OUT_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(
    `Extracted ${statements.length} statement-units (${invariants.length} invariants, ${decisions.length} decisions, ${subsectionRules.length} subsection rules) -> ${OUT_PATH}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
