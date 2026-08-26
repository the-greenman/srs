#!/usr/bin/env node
/**
 * validate-census.mjs — checks a committed census-*.json file against census.schema.json's
 * shape (srs#471). Hand-rolled rather than a generic JSON-Schema engine (no ajv dependency
 * exists in this repo's Node pipeline) — the checks below are the schema's constraints made
 * explicit, not a re-derivation of them; keep the two in sync by hand if either changes.
 *
 * Usage: node scripts/grid-census/validate-census.mjs <path-to-census-file>
 */
import { readFile } from 'fs/promises';
import { loadCellSlugs } from '../lib/pattern-grid-cells.mjs';

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node validate-census.mjs <path-to-census-file>');
    process.exit(1);
  }

  const doc = JSON.parse(await readFile(path, 'utf8'));
  const errors = [];
  const req = (cond, msg) => {
    if (!cond) errors.push(msg);
  };

  req(typeof doc.cycle === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(doc.cycle), 'cycle must be a YYYY-MM-DD string');
  req(typeof doc.sourceManifest === 'string' && doc.sourceManifest.length > 0, 'sourceManifest must be a non-empty string');
  req(Array.isArray(doc.labelSet) && doc.labelSet.length > 0, 'labelSet must be a non-empty array');
  req(new Set(doc.labelSet).size === doc.labelSet.length, 'labelSet must have unique entries');

  const slugSet = await loadCellSlugs();
  const declaredLabelSet = new Set(doc.labelSet);
  req(
    declaredLabelSet.size === slugSet.size && [...slugSet].every((s) => declaredLabelSet.has(s)),
    'labelSet must exactly match scripts/lib/pattern-grid-cells.mjs (the single source of truth)'
  );

  req(doc.counts && typeof doc.counts === 'object', 'counts must be an object');
  if (doc.counts) {
    req(Number.isInteger(doc.counts.total) && doc.counts.total >= 0, 'counts.total must be a non-negative integer');
    req(Number.isInteger(doc.counts.none) && doc.counts.none >= 0, 'counts.none must be a non-negative integer');
    req(doc.counts.byCell && typeof doc.counts.byCell === 'object', 'counts.byCell must be an object');
    req(doc.counts.bySource && typeof doc.counts.bySource === 'object', 'counts.bySource must be an object');
  }

  req(Array.isArray(doc.entries), 'entries must be an array');
  const validSources = new Set(['invariant', 'decision', 'subsection-rule']);
  const validConfidence = new Set(['high', 'medium', 'low']);
  const validStatus = new Set(['unreviewed', 'reviewed']);
  const seenIds = new Set();
  if (Array.isArray(doc.entries)) {
    for (const [i, e] of doc.entries.entries()) {
      const where = `entries[${i}] (id=${e && e.id})`;
      req(e && typeof e.id === 'string' && e.id.length > 0, `${where}: id must be a non-empty string`);
      req(e && validSources.has(e.source), `${where}: source must be one of invariant|decision|subsection-rule`);
      req(e && typeof e.file === 'string' && e.file.length > 0, `${where}: file must be a non-empty string`);
      req(e && (e.cell === null || (typeof e.cell === 'string' && slugSet.has(e.cell))), `${where}: cell must be null or a valid slug`);
      req(e && validConfidence.has(e.confidence), `${where}: confidence must be high|medium|low`);
      req(e && typeof e.note === 'string', `${where}: note must be a string`);
      req(e && validStatus.has(e.status), `${where}: status must be unreviewed|reviewed`);
      if (e && e.id) {
        req(!seenIds.has(e.id), `${where}: duplicate id`);
        seenIds.add(e.id);
      }
    }
    if (doc.counts) {
      req(doc.counts.total === doc.entries.length, 'counts.total must equal entries.length');
      const actualNone = doc.entries.filter((e) => e.cell === null).length;
      req(doc.counts.none === actualNone, `counts.none (${doc.counts.none}) must equal actual none-count (${actualNone})`);

      const actualByCell = {};
      const actualBySource = {};
      for (const e of doc.entries) {
        if (e.cell !== null) actualByCell[e.cell] = (actualByCell[e.cell] ?? 0) + 1;
        actualBySource[e.source] = (actualBySource[e.source] ?? 0) + 1;
      }
      for (const slug of slugSet) {
        const declared = doc.counts.byCell?.[slug] ?? 0;
        const actual = actualByCell[slug] ?? 0;
        req(declared === actual, `counts.byCell.${slug} (${declared}) must equal actual count (${actual})`);
      }
      for (const key of new Set([...Object.keys(doc.counts.bySource ?? {}), ...Object.keys(actualBySource)])) {
        const declared = doc.counts.bySource?.[key] ?? 0;
        const actual = actualBySource[key] ?? 0;
        req(declared === actual, `counts.bySource.${key} (${declared}) must equal actual count (${actual})`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`${path}: ${errors.length} schema violation(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`${path}: valid (${doc.entries.length} entries).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
