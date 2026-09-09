#!/usr/bin/env node
/**
 * check-pr-classification.mjs — the `Mode · Cell · Door` line a PR body states is checked against
 * the closed vocabularies it claims to draw from, and against the PR's own `gate:*` label (srs#716).
 *
 * The autonomy contract on srs#580 grants merge rights from mode × door, and the PR body's
 * classification line is the machine-readable statement of that claim — but until this check
 * existed, nothing verified it. srs#716 found the gap by drift: four artifacts (#682, #709, #714,
 * PR #715) were classified with an invented cell, "♓ Presentation" (there is no Presentation cell
 * — the twelve are named in scripts/lib/pattern-grid-cells.json), and it propagated through three
 * issues and a PR before a worker noticed the mismatch. Two of the three fields (Cell, Door) were
 * free text against a closed vocabulary; the third (Mode) already had a declared vocabulary
 * (scripts/lib/decision-modes.mjs) but nothing read the PR body against it. This is the
 * enforcement half.
 *
 * What is checked, against the LAST classification line found in the body (a PR body accretes
 * sections as work continues — see PR #693's "Reconciliation" addendum — so the most recent
 * statement is the authoritative one, not the first draft):
 *   - Mode:  one of scripts/lib/decision-modes.json's declared modes (rfc-decision-7caca3a1).
 *   - Cell:  one or more tokens, each the cell's glyph, its name, or "glyph name" together,
 *            resolving via scripts/lib/pattern-grid-cells.json (accept the glyph, the name, or
 *            both) — rejecting anything else by name, listing the twelve.
 *   - Door:  one of "1", "2", "3", "non-normative" (CLAUDE.md's three doors, plus the autonomy
 *            contract's non-normative carve-out).
 *   - Label consistency: a `gate:auto-merge` label requires mode ∈ {clear, complicated} AND
 *     door ∈ {1, non-normative} (the autonomy contract on srs#580, table row 1). A PR carrying
 *     that label whose stated classification does not meet this is rejected, naming both the
 *     label and the classification that contradicts it.
 *
 * Input is the PR body text and the PR's labels, not a fixture tree — there is nothing under this
 * repository's own tree to walk. Two ways to supply them, so the same code path serves both CI
 * (env vars — never argv, so nothing under the PR author's control is ever shell-interpolated) and
 * the negative test (tests/guards/run.mjs, fixture files as explicit args, matching the sibling
 * guards' `[root]` convention):
 *   node scripts/check-pr-classification.mjs <body-file> [comma,separated,labels]
 *   PR_BODY=<text> PR_LABELS=<JSON array or comma-separated> node scripts/check-pr-classification.mjs
 *
 * ci-only tier (scripts/checks.json): reached only by the CI workflow step that owns the PR event
 * context, never by `node scripts/validate-all.mjs`. rfc-decision-19997e24 names this tier's own
 * accepted cost — the registry can declare a ci-only check but cannot enforce that some workflow
 * actually runs it; wiring that workflow step is this unit's job, not this script's.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadDecisionModes } from "./lib/decision-modes.mjs";
import { loadCellSlugs, loadCellGlyphMap } from "./lib/pattern-grid-cells.mjs";

// The autonomy contract's own rule (srs#580 table row 1), not a second copy of either vocabulary —
// which modes/doors PERMIT gate:auto-merge is a domain rule, distinct from which modes/doors are
// LEGAL at all (the vocabularies above).
const AUTOMERGE_MODES = new Set(["clear", "complicated"]);
const AUTOMERGE_DOORS = new Set(["1", "non-normative"]);
const LEGAL_DOORS = new Set(["1", "2", "3", "non-normative"]);

const CONTRACT_POINTER =
  "the autonomy contract, srs#580 (\"Mode clear/complicated and Door 1 or non-normative -> agent merges on green\")";

/** Strip markdown emphasis/code markers that vary across observed PR bodies (bold, backticks). */
function stripMarkup(text) {
  return text.replace(/[*`]/g, "");
}

/**
 * Find every candidate classification line/segment in the body: a stretch of text containing
 * "Mode:", "Cell:", and "Door:" labels, in that order, with no intervening blank line — matches
 * both the single-line form and the "**Mode: x · Cell: y · Door: z** — `gate:...`" bolded form
 * once markup is stripped. Returns the raw (un-stripped) matches so downstream parsing can still
 * see punctuation, in the order they appear in the body — last is authoritative.
 */
function findClassificationLines(bodyRaw) {
  const body = stripMarkup(bodyRaw);
  const re = /Mode\s*:\s*[^\n]*?Cell\s*:\s*[^\n]*?Door\s*:\s*[^\n]*/gi;
  return [...body.matchAll(re)].map((m) => m[0]);
}

/** Extract the value after a `Label:` marker, up to the next known marker, "·", "—", or "(". */
function extractField(line, label, { stopAtParen = false } = {}) {
  const markerRe = new RegExp(`${label}\\s*:\\s*`, "i");
  const markerMatch = markerRe.exec(line);
  if (!markerMatch) return null;
  let rest = line.slice(markerMatch.index + markerMatch[0].length);
  // Cut at the next field marker, the "·" or "|" separator (both observed in the live corpus —
  // srs#716's corpus scan found a batch of PRs using "|" throughout), an em/en-dash, or
  // (optionally) an opening paren — whichever comes first. Door's trailing citation
  // ("1 (executes ...)") relies on the caller NOT stopping at "(" so the digit/word is still
  // followed by a boundary; Cell tokens never legitimately contain "(", so callers of Cell may
  // stop there too without loss.
  const stopPattern = stopAtParen
    ? /(?:Mode|Cell|Door)\s*:|·|\||—|–|\(/i
    : /(?:Mode|Cell|Door)\s*:|·|\||—|–/i;
  const stopMatch = stopPattern.exec(rest);
  if (stopMatch) rest = rest.slice(0, stopMatch.index);
  return rest.trim();
}

/** Parse the Cell value into its comma-separated tokens, each resolved to a slug or null. */
async function resolveCellTokens(cellValue) {
  const slugs = await loadCellSlugs();
  const glyphMap = await loadCellGlyphMap();
  const tokens = cellValue
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return tokens.map((token) => {
    const glyph = [...token].find((ch) => glyphMap.has(ch));
    const namePart = token
      .replace(/[♈♉♊♋♌♍♎♏♐♑♒♓]/g, "")
      .trim()
      .toLowerCase();
    const byGlyph = glyph ? glyphMap.get(glyph) : null;

    // Glyph only (no accompanying name text) — resolve on the glyph alone.
    if (byGlyph && namePart.length === 0) {
      return { token, slug: byGlyph, reason: null };
    }

    // Name text is present (with or without a glyph): it must itself resolve to one of the
    // twelve. A glyph that resolves while the paired name text does not (e.g. "♓ Presentation" —
    // ♓ is a real glyph, "Presentation" is not a real cell) is the exact defect srs#716 found by
    // drift, and must fail rather than silently falling back to the glyph.
    if (namePart.length > 0) {
      const byName = slugs.has(namePart) ? namePart : null;
      if (!byName) {
        return {
          token,
          slug: null,
          reason: byGlyph
            ? `glyph names "${byGlyph}" but the accompanying text "${namePart}" is not one of the twelve`
            : `"${namePart}" is not one of the twelve`,
        };
      }
      if (byGlyph && byGlyph !== byName) {
        return { token, slug: null, reason: `glyph names "${byGlyph}" but the text names "${byName}"` };
      }
      return { token, slug: byName, reason: null };
    }

    return { token, slug: null, reason: null };
  });
}

function normalizeDoor(doorValue) {
  const m = /^(non-normative|nonnormative|[123])\b/i.exec(doorValue.trim());
  if (!m) return null;
  const raw = m[1].toLowerCase();
  return raw === "nonnormative" ? "non-normative" : raw;
}

async function main() {
  const [, , bodyArg, labelsArg] = process.argv;

  let bodyRaw;
  if (bodyArg) {
    bodyRaw = await readFile(resolve(bodyArg), "utf8");
  } else if (typeof process.env.PR_BODY === "string") {
    bodyRaw = process.env.PR_BODY;
  } else {
    console.log("\n✗ No PR body supplied — pass a body-file argument or set PR_BODY.");
    process.exit(1);
    return;
  }

  let labels;
  const labelsSource = labelsArg ?? process.env.PR_LABELS;
  if (!labelsSource) {
    labels = [];
  } else {
    try {
      const parsed = JSON.parse(labelsSource);
      labels = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      labels = labelsSource
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }
  }

  console.log("PR classification line (srs#716)");
  console.log(`  labels: ${labels.length > 0 ? labels.join(", ") : "(none)"}`);

  const candidates = findClassificationLines(bodyRaw);
  if (candidates.length === 0) {
    console.log(
      `\n✗ No "Mode: ... Cell: ... Door: ..." classification line found in the PR body. Every ` +
        `PR states its mode, cell and door — see CLAUDE.md ("which door") and ${CONTRACT_POINTER}.`,
    );
    process.exit(1);
    return;
  }

  const line = candidates[candidates.length - 1];
  console.log(`  classification line: ${line.trim()}`);

  const modeValue = extractField(line, "Mode");
  const cellValue = extractField(line, "Cell", { stopAtParen: true });
  const doorValue = extractField(line, "Door");

  const problems = [];

  const legalModes = await loadDecisionModes();
  const mode = modeValue ? modeValue.toLowerCase() : null;
  if (!mode || !legalModes.has(mode)) {
    problems.push(
      `Mode "${modeValue ?? "(missing)"}" is not one of ${[...legalModes].join(", ")} ` +
        `(rfc-decision-7caca3a1).`,
    );
  }

  let cellResolutions = [];
  if (!cellValue) {
    problems.push(`Cell value is missing.`);
  } else {
    cellResolutions = await resolveCellTokens(cellValue);
    const slugs = await loadCellSlugs();
    for (const { token, slug, reason } of cellResolutions) {
      if (!slug) {
        problems.push(
          `Cell token "${token}" does not name one of the twelve Pattern Grid cells ` +
            `(${[...slugs].join(", ")})${reason ? ` — ${reason}` : ""}.`,
        );
      }
    }
    if (cellResolutions.length === 0) {
      problems.push(`Cell value "${cellValue}" named no tokens.`);
    }
  }

  const door = doorValue ? normalizeDoor(doorValue) : null;
  if (!door || !LEGAL_DOORS.has(door)) {
    problems.push(
      `Door "${doorValue ?? "(missing)"}" is not one of ${[...LEGAL_DOORS].join(", ")} (CLAUDE.md, ` +
        `"which door").`,
    );
  }

  const hasAutoMergeLabel = labels.some((l) => l === "gate:auto-merge");
  if (hasAutoMergeLabel && mode && door && legalModes.has(mode) && LEGAL_DOORS.has(door)) {
    const modeOk = AUTOMERGE_MODES.has(mode);
    const doorOk = AUTOMERGE_DOORS.has(door);
    if (!modeOk || !doorOk) {
      problems.push(
        `Label "gate:auto-merge" contradicts the stated classification (mode "${mode}", door ` +
          `"${door}") — ${CONTRACT_POINTER} permits gate:auto-merge only for mode ∈ ` +
          `{${[...AUTOMERGE_MODES].join(", ")}} AND door ∈ {${[...AUTOMERGE_DOORS].join(", ")}}.`,
      );
    }
  }

  if (problems.length > 0) {
    console.log("");
    for (const problem of problems) console.log(`  ✗ ${problem}`);
    console.log(`\n✗ ${problems.length} problem(s) with the PR classification line.`);
    process.exit(1);
    return;
  }

  console.log(
    `\n✓ Classification line is well-formed: mode "${mode}", cell(s) ` +
      `${cellResolutions.map((r) => r.slug).join(", ")}, door "${door}"` +
      `${hasAutoMergeLabel ? ", consistent with its gate:auto-merge label" : ""}.`,
  );
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
