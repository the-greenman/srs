#!/usr/bin/env node
/**
 * assemble-census.mjs — merge classification results (produced per rubric-batch by
 * scripts/grid-census/classify-prompt.md) with the deterministic input manifest
 * (census-input.json), validate against census.schema.json, compute the counts table, and write
 * the cycle's committed census file (srs#471).
 *
 * Usage: node scripts/grid-census/assemble-census.mjs <cycle-date> <results-dir>
 *   <cycle-date>  YYYY-MM-DD label for this cycle (used in the output filename and the
 *                 census.cycle field).
 *   <results-dir> directory containing one or more `*.json` files, each a JSON array of
 *                 `{id, cell, confidence, note}` objects (one file per classification batch —
 *                 batch boundaries are a run-time convenience and carry no meaning in the
 *                 output, so results are merged by id, not by file or order).
 *
 * Classification itself is not scripted here (srs#471 scope item 3: "run classification via
 * subagent(s)") — an LLM call is not a deterministic, re-runnable step, so it happens once per
 * cycle via the classify-prompt.md rubric and its output is committed as data. This script is
 * the deterministic half: given a fixed set of classification results, it always produces the
 * same census file.
 */
import { readFile, readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadCellSlugs } from '../lib/pattern-grid-cells.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT_MANIFEST = join(__dirname, 'census-input.json');

async function loadResults(resultsDir) {
  const files = (await readdir(resultsDir)).filter((f) => f.endsWith('.json')).sort();
  const byId = new Map();
  for (const file of files) {
    const arr = JSON.parse(await readFile(join(resultsDir, file), 'utf8'));
    if (!Array.isArray(arr)) throw new Error(`${file}: expected a JSON array of classifications`);
    for (const item of arr) {
      if (!item || typeof item.id !== 'string') {
        throw new Error(`${file}: classification entry missing string "id": ${JSON.stringify(item)}`);
      }
      if (byId.has(item.id)) {
        throw new Error(`Duplicate classification for id "${item.id}" (in ${file} and elsewhere)`);
      }
      byId.set(item.id, item);
    }
  }
  return byId;
}

async function main() {
  const [, , cycle, resultsDirArg] = process.argv;
  if (!cycle || !resultsDirArg) {
    console.error('Usage: node assemble-census.mjs <cycle-date YYYY-MM-DD> <results-dir>');
    process.exit(1);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cycle)) {
    console.error(`cycle "${cycle}" must be YYYY-MM-DD`);
    process.exit(1);
  }

  const slugSet = await loadCellSlugs();
  const labelSet = [...slugSet].sort();

  const manifest = JSON.parse(await readFile(INPUT_MANIFEST, 'utf8'));
  const results = await loadResults(resultsDirArg);

  const missing = [];
  const invalidCell = [];
  const invalidConfidence = [];
  const entries = [];

  for (const stmt of manifest.statements) {
    const r = results.get(stmt.id);
    if (!r) {
      missing.push(stmt.id);
      continue;
    }
    if (r.cell !== null && !slugSet.has(r.cell)) invalidCell.push({ id: stmt.id, cell: r.cell });
    if (!['high', 'medium', 'low'].includes(r.confidence)) {
      invalidConfidence.push({ id: stmt.id, confidence: r.confidence });
    }
    entries.push({
      id: stmt.id,
      source: stmt.source,
      file: stmt.file,
      cell: r.cell,
      confidence: r.confidence,
      note: r.note ?? '',
      status: 'unreviewed',
    });
  }

  const extra = [...results.keys()].filter((id) => !manifest.statements.some((s) => s.id === id));

  if (missing.length || invalidCell.length || invalidConfidence.length || extra.length) {
    if (missing.length) console.error(`Missing classification for ${missing.length} ids:`, missing.slice(0, 10));
    if (invalidCell.length) console.error(`Invalid cell values:`, invalidCell.slice(0, 10));
    if (invalidConfidence.length) console.error(`Invalid confidence values:`, invalidConfidence.slice(0, 10));
    if (extra.length) console.error(`Classification ids not in the input manifest:`, extra.slice(0, 10));
    process.exit(1);
  }

  const byCell = Object.fromEntries(labelSet.map((s) => [s, 0]));
  let none = 0;
  const bySource = {};
  for (const e of entries) {
    if (e.cell === null) none += 1;
    else byCell[e.cell] += 1;
    bySource[e.source] = (bySource[e.source] ?? 0) + 1;
  }

  const census = {
    $schema: './census.schema.json',
    cycle,
    sourceManifest: 'scripts/grid-census/census-input.json',
    labelSet,
    counts: {
      total: entries.length,
      byCell,
      none,
      bySource,
    },
    entries,
  };

  const outPath = join(__dirname, `census-${cycle}.json`);
  await writeFile(outPath, JSON.stringify(census, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outPath}: ${entries.length} entries, ${none} unclassified (none), byCell=`, byCell);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
