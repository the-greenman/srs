#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(here, "backfill-review-manifest.json");
const outputPath = resolve(here, "backfill-significance-review.json");

function fail(message) {
  throw new Error(message);
}

// Grade S is deliberately small: each item is a project-wide, recurring
// decision pattern that merits its own durable log entry. Grade A decisions
// are also durable, but should be represented by one parent-RFC decision
// record rather than copied as many atomic records. Grade B is load-bearing
// canonical detail. Grade C remains useful evidence and casebook material,
// but does not need continuing decision-log custody.
const grades = {
  S: {
    label: "system-shaping pattern",
    disposition: "direct-record",
    test: "Changes how independent future work is framed across multiple technical areas, or sets a standing boundary between authoritative layers.",
  },
  A: {
    label: "durable pattern, consolidate at parent-RFC level",
    disposition: "parent-rfc-record",
    test: "A reusable, consequential rule, but its proper maintained form is a compact parent-RFC decision rather than a standalone atomic backfill.",
  },
  B: {
    label: "load-bearing canonical detail",
    disposition: "canonical-only",
    test: "A real decision whose long-term custody is the accepted RFC, schema, invariant, or canonical record; a separate log entry would repeat it without adding a new decision boundary.",
  },
  C: {
    label: "contextual application or casebook evidence",
    disposition: "research-casebook-only",
    test: "A local rendering, transition, repair, or application choice that helps explain the history but is not a pattern that needs active decision-log maintenance.",
  },
};

const directRecords = new Set([
  "E256-A01", "E256-A04", "E256-A06", "E256-A09", "E256-A11",
  "E256-B01", "E256-B09", "E256-C01", "E256-D01", "E256-E01",
  "E256-F101", "E256-G05",
]);

const parentClusters = {
  "field-model-and-carrier": [
    "E256-A05", "E256-C04", "E256-C05",
  ],
  "bootstrap-and-emitter-contract": ["E256-A08"],
  "rendering-boundaries": ["E256-B08"],
  "repository-authority-and-validation": [
    "E256-D04", "E256-D05", "E256-D07", "E256-D09", "E256-D10",
    "E256-D12", "E256-D20",
  ],
  "migration-and-cutover": [
    "E256-E02", "E256-E04", "E256-E08", "E256-E09", "E256-E10", "E256-E17",
  ],
  "definition-layer-self-hosting": [
    "E256-F102", "E256-F108", "E256-F122",
  ],
  "instance-authorship-and-federation": ["E256-F201", "E256-F206", "E256-F226"],
  "package-identity": ["E256-A26"],
};

const casebookOnly = new Set([
  "E256-A02", "E256-A03", "E256-A07", "E256-A18", "E256-A19", "E256-A20",
  "E256-B02", "E256-B04", "E256-B05", "E256-B06", "E256-B07", "E256-B11", "E256-B12",
  "E256-C02", "E256-C03", "E256-C08", "E256-C15", "E256-C16", "E256-C17", "E256-C18",
  "E256-D02", "E256-D03", "E256-D06", "E256-D11", "E256-D17", "E256-D19", "E256-D25",
  "E256-E03", "E256-E06", "E256-E07", "E256-E16", "E256-F104", "E256-G04",
]);

const canonicalOnly = new Set([
  "E256-A10", "E256-A12", "E256-A14", "E256-A21", "E256-A23",
  "E256-B03", "E256-B13", "E256-C06", "E256-C10", "E256-C12",
  "E256-D08", "E256-D14", "E256-D15", "E256-D18", "E256-D21", "E256-D22", "E256-D24",
  "E256-E12", "E256-E18", "E256-F107", "E256-F118",
]);

const clusterFor = new Map();
for (const [cluster, ids] of Object.entries(parentClusters)) {
  for (const id of ids) {
    if (clusterFor.has(id)) fail(`${id} appears in multiple parent clusters`);
    clusterFor.set(id, cluster);
  }
}

for (const id of directRecords) {
  if (clusterFor.has(id) || casebookOnly.has(id)) fail(`${id} has conflicting significance dispositions`);
}
for (const id of casebookOnly) {
  if (clusterFor.has(id)) fail(`${id} has conflicting significance dispositions`);
}
for (const id of canonicalOnly) {
  if (clusterFor.has(id) || casebookOnly.has(id) || directRecords.has(id)) {
    fail(`${id} has conflicting significance dispositions`);
  }
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const candidates = manifest.import_candidates?.decisions;
if (!Array.isArray(candidates)) fail("backfill review manifest must contain import_candidates.decisions[]");
if (candidates.length !== 91) fail(`expected 91 candidates, found ${candidates.length}`);

const candidateIds = new Set(candidates.map((card) => card.decision_id));
for (const id of [...directRecords, ...clusterFor.keys(), ...casebookOnly, ...canonicalOnly]) {
  if (!candidateIds.has(id)) fail(`significance disposition refers to non-candidate ${id}`);
}

function gradeFor(id) {
  if (directRecords.has(id)) return "S";
  if (clusterFor.has(id)) return "A";
  if (casebookOnly.has(id)) return "C";
  if (canonicalOnly.has(id)) return "B";
  fail(`candidate ${id} has no significance disposition`);
}

const decisions = candidates.map((card) => {
  const grade = gradeFor(card.decision_id);
  return {
    ...card,
    significance_grade: grade,
    significance: grades[grade],
    consolidation_cluster: clusterFor.get(card.decision_id) ?? null,
  };
});

const assigned = new Set([...directRecords, ...clusterFor.keys(), ...casebookOnly, ...canonicalOnly]);
if (assigned.size !== candidates.length) fail(`expected every candidate to be classified; classified ${assigned.size} of ${candidates.length}`);

const byGrade = Object.fromEntries(Object.keys(grades).map((grade) => [
  grade,
  decisions.filter((card) => card.significance_grade === grade).length,
]));

const output = {
  title: "Epic 256 decision-log significance review",
  status: "review judgment; no backfilled decision records are created or ratified by this file",
  generated_from: "backfill-review-manifest.json",
  purpose: "Keep the decision log small enough to remain a living source of guidance. Significance measures recurring decision-pattern value, not effort, implementation size, or historical frequency.",
  rubric: grades,
  policy: {
    immediate_backfill_scope: "Only Grade S cards are candidates for direct records in the first backfill wave.",
    consolidation_scope: "Grade A cards should be represented through eight compact parent-RFC records if and when their parent records are backfilled; do not make one record per atomic card.",
    canonical_scope: "Grade B cards remain discoverable through their canonical sources and this ledger; they create no separate record.",
    casebook_scope: "Grade C cards remain as research evidence and may be selected as illustrative casebook examples.",
    mechanical_boundary: "No mechanical derivation is included; this review begins from the prior 91 consequential, effective candidates.",
  },
  summary: {
    candidates_reviewed: decisions.length,
    by_significance_grade: byGrade,
    direct_record_candidates: byGrade.S,
    prospective_parent_rfc_records: Object.keys(parentClusters).length,
    avoided_atomic_records: byGrade.A + byGrade.B + byGrade.C,
  },
  parent_rfc_consolidation_clusters: Object.entries(parentClusters).map(([cluster, ids]) => ({
    cluster,
    atomic_decision_ids: ids,
    candidate_count: ids.length,
  })),
  decisions,
};

const text = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--write")) {
  await writeFile(outputPath, text);
} else if (process.argv.includes("--check")) {
  const existing = await readFile(outputPath, "utf8");
  if (existing !== text) fail("backfill-significance-review.json is stale; run node grade-backfill-significance.mjs --write");
  console.log("backfill significance review is reproducible");
} else {
  process.stdout.write(text);
}
