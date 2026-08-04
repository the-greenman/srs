#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ledgerPath = resolve(here, "decision-ledger.json");
const outputPath = resolve(here, "backfill-review-manifest.json");
const effectiveStatuses = new Set(["ratified", "implemented"]);
const eligibleClasses = new Set(["precedent-setting", "reasoned-application"]);

// These decisions were consequential in their moment but do not create active,
// reusable SRS technical guidance. They remain visible for human review rather
// than being silently excluded from the manifest.
const holdReasons = {
  "E256-A15": "One-off package-ID repair; no reusable choice remains after the collision was resolved.",
  "E256-B10": "One-off shadow-retirement cleanup; its durable source-authority lesson is already represented by broader records.",
  "E256-E11": "One legacy-purpose-document disposition; it is not a general migration rule.",
  "E256-F105": "A contextual #273 seed-break trade-off; retain in research until a repeated exception proves it needs its own precedent.",
  "E256-G01": "Epic-specific coordinator assignment; belongs to later formal governance rather than the SRS technical decision log.",
  "E256-G02": "Epic-specific worker and merge-authority arrangement; belongs to later formal governance.",
  "E256-G03": "Epic-specific post-merge follow-up process; belongs to later formal governance.",
  "E256-G08": "Transitional mirror-repair disposition; retain as history unless the same boundary recurs after the migration period.",
  "E256-G13": "Epic-specific work-selection mechanism; belongs to later formal governance.",
  "E256-G14": "Epic-specific merge-authority declaration; belongs to later formal governance.",
};

const lineageOnlyReasons = {
  "E256-F106": "Superseded retained-FieldGroup posture; preserve only if a successor record needs its transition history.",
};

function fail(message) {
  throw new Error(message);
}

function slim(card) {
  return {
    decision_id: card.decision_id,
    family: card.decision_family,
    epic_row: card.epic_row,
    title: card.title,
    effective_date: card.effective_date || null,
    status: card.status,
    decision_class: card.decision_class,
    exception_class: card.exception_class,
    source_urls: card.sources.map((source) => source.url_or_path),
  };
}

function countByFamily(cards) {
  return cards.reduce((counts, card) => {
    counts[card.decision_family] = (counts[card.decision_family] ?? 0) + 1;
    return counts;
  }, {});
}

const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
if (!Array.isArray(ledger.decisions)) fail("decision-ledger.json must contain decisions[]");

const ids = new Set(ledger.decisions.map((card) => card.decision_id));
for (const id of [...Object.keys(holdReasons), ...Object.keys(lineageOnlyReasons)]) {
  if (!ids.has(id)) fail(`review disposition refers to missing decision ${id}`);
}

const initiallyEligible = ledger.decisions.filter((card) =>
  effectiveStatuses.has(card.status) && eligibleClasses.has(card.decision_class),
);
const importCandidates = initiallyEligible.filter((card) => !(card.decision_id in holdReasons));
const hold = initiallyEligible.filter((card) => card.decision_id in holdReasons);
const lineageOnly = ledger.decisions.filter((card) => card.decision_id in lineageOnlyReasons);

const excluded = {
  mechanical_derivations: ledger.decisions
    .filter((card) => card.decision_class === "mechanical-derivation")
    .map(slim),
  proposals: ledger.decisions
    .filter((card) => card.decision_class === "proposal")
    .map(slim),
  rejected_alternatives: ledger.decisions
    .filter((card) => card.decision_class === "rejected-alternative")
    .map(slim),
  unresolved: ledger.decisions
    .filter((card) => card.decision_class === "unresolved")
    .map(slim),
};

if (initiallyEligible.length !== 101) fail(`expected 101 effective eligible cards, found ${initiallyEligible.length}`);
if (hold.length !== 10) fail(`expected 10 held cards, found ${hold.length}`);
if (importCandidates.length !== 91) fail(`expected 91 import candidates, found ${importCandidates.length}`);
if (lineageOnly.length !== 1) fail(`expected one lineage-only card, found ${lineageOnly.length}`);

const manifest = {
  title: "Epic 256 decision-log backfill review manifest",
  status: "review input; does not create or ratify backfilled records",
  generated_from: "decision-ledger.json",
  corpus_snapshot: ledger.metadata?.corpus_snapshot ?? null,
  selection_boundary: {
    decision_rule: "Record active consequential judgment where legitimate alternatives remained and the choice establishes, changes, applies with discretion, excepts, or supersedes guidance that future work may need to understand.",
    mechanical_rule: "Do not record a mechanical derivation: when competent contributors accepting the same governing decisions and evidence have only one valid outcome, record the task, implementation consequence, test, or pull request instead.",
    effective_statuses: [...effectiveStatuses],
    eligible_classes: [...eligibleClasses],
  },
  summary: {
    ledger_cards: ledger.decisions.length,
    initially_eligible: initiallyEligible.length,
    import_candidates: importCandidates.length,
    held_for_human_review: hold.length,
    lineage_only: lineageOnly.length,
    excluded: Object.fromEntries(Object.entries(excluded).map(([key, cards]) => [key, cards.length])),
  },
  import_candidates: {
    by_family: countByFamily(importCandidates),
    decisions: importCandidates.map(slim),
  },
  held_for_human_review: hold.map((card) => ({ ...slim(card), reason: holdReasons[card.decision_id] })),
  lineage_only: lineageOnly.map((card) => ({ ...slim(card), reason: lineageOnlyReasons[card.decision_id] })),
  post_snapshot_note: {
    decision_id: "E256-H03",
    disposition: "The ledger snapshot retains H03 as unresolved, but its [N+1] question was resolved after the snapshot and is already carried by the foundational-values decision record. Do not backfill it as an unresolved historical card.",
  },
  excluded,
};

const text = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--write")) {
  await writeFile(outputPath, text);
} else if (process.argv.includes("--check")) {
  const existing = await readFile(outputPath, "utf8");
  if (existing !== text) fail("backfill-review-manifest.json is stale; run node select-backfill-candidates.mjs --write");
  console.log("backfill review manifest is reproducible");
} else {
  process.stdout.write(text);
}
