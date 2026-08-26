#!/usr/bin/env node
/**
 * compute-counts.mjs — the four readings of a census file (rfc-decision-8f5aca2c: per row, per
 * column, per modality diagonal, per polarity axis), plus the list of `none`-classified
 * statements (each one a finding, per rubric rule 2).
 *
 * Mechanical only: this script does not write the diff-against-the-hand-census commentary. The
 * 2026-08-21 hand census (rfc-decision-8f5aca2c's decision_statement) is a *qualitative*,
 * principle-coverage snapshot (columns/diagonals characterized as strong/middling/thin, not
 * counted); this script's counts are *corpus-placement* counts. Reading the two against each
 * other is a judgment call for the cycle write-up (the PR body / srs#435 comment), not something
 * this script should collapse into a false numeric diff.
 *
 * Usage: node scripts/grid-census/compute-counts.mjs <path-to-census-file>
 */
import { readFile } from 'fs/promises';
import { loadCellSlugs } from '../lib/pattern-grid-cells.mjs';

// The grid geometry (docs/charter/decision-compass.md), reading order 1-12. The twelve cell
// *names* are cross-checked against scripts/lib/pattern-grid-cells.mjs at startup (below) so a
// renamed or added slug fails loudly here instead of silently bucketing into a null row/column/
// diagonal/axis; the row/column/diagonal/axis *geometry* itself has no machine-readable source
// beyond the Decision Compass prose, so it stays hand-transcribed.
const GRID = {
  Individual: { Fire: 'versioning', Earth: 'identity', Air: 'description', Water: 'attribution' },
  Relational: { Fire: 'succession', Earth: 'containment', Air: 'reference', Water: 'assertion' },
  Systemic: { Fire: 'governance', Earth: 'repository', Air: 'conformance', Water: 'portability' },
};
const READING_ORDER = [
  'versioning', 'identity', 'description', 'attribution',
  'succession', 'containment', 'reference', 'assertion',
  'governance', 'repository', 'conformance', 'portability',
];
const DIAGONALS = {
  Cardinal: ['versioning', 'attribution', 'reference', 'repository'],
  Fixed: ['identity', 'succession', 'assertion', 'conformance'],
  Mutable: ['description', 'containment', 'governance', 'portability'],
};
const AXES = [
  ['versioning', 'reference'],
  ['identity', 'assertion'],
  ['description', 'governance'],
  ['attribution', 'repository'],
  ['succession', 'conformance'],
  ['containment', 'portability'],
];

function rowOf(cell) {
  for (const [row, cols] of Object.entries(GRID)) {
    if (Object.values(cols).includes(cell)) return row;
  }
  return null;
}
function columnOf(cell) {
  for (const row of Object.values(GRID)) {
    for (const [col, c] of Object.entries(row)) {
      if (c === cell) return col;
    }
  }
  return null;
}
function diagonalOf(cell) {
  for (const [name, cells] of Object.entries(DIAGONALS)) {
    if (cells.includes(cell)) return name;
  }
  return null;
}
function axisOf(cell) {
  const idx = AXES.findIndex((pair) => pair.includes(cell));
  return idx === -1 ? null : `${AXES[idx][0]}-${AXES[idx][1]}`;
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node compute-counts.mjs <path-to-census-file>');
    process.exit(1);
  }
  const slugSet = await loadCellSlugs();
  const geometryCells = new Set(READING_ORDER);
  const geometryDrift = [...slugSet].filter((s) => !geometryCells.has(s));
  if (geometryDrift.length > 0) {
    throw new Error(
      `pattern-grid-cells.mjs declares slugs this script's hardcoded geometry doesn't know: ${geometryDrift.join(', ')} — update GRID/DIAGONALS/AXES/READING_ORDER above`
    );
  }

  const doc = JSON.parse(await readFile(path, 'utf8'));
  const placed = doc.entries.filter((e) => e.cell !== null);
  const noneEntries = doc.entries.filter((e) => e.cell === null);

  const byRow = {};
  const byColumn = {};
  const byDiagonal = {};
  const byAxis = {};
  for (const e of placed) {
    const row = rowOf(e.cell);
    const col = columnOf(e.cell);
    const diag = diagonalOf(e.cell);
    const axis = axisOf(e.cell);
    if (row === null || col === null || diag === null || axis === null) {
      throw new Error(`Entry "${e.id}" carries cell "${e.cell}", which this script's geometry does not recognize`);
    }
    byRow[row] = (byRow[row] ?? 0) + 1;
    byColumn[col] = (byColumn[col] ?? 0) + 1;
    byDiagonal[diag] = (byDiagonal[diag] ?? 0) + 1;
    byAxis[axis] = (byAxis[axis] ?? 0) + 1;
  }

  const byCellOrdered = Object.fromEntries(READING_ORDER.map((c) => [c, doc.counts.byCell[c] ?? 0]));

  const report = {
    cycle: doc.cycle,
    total: doc.entries.length,
    placed: placed.length,
    none: noneEntries.length,
    byCellReadingOrder: byCellOrdered,
    byRow,
    byColumn,
    byDiagonal,
    byAxis,
    noneEntries: noneEntries.map((e) => ({ id: e.id, source: e.source, note: e.note })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
