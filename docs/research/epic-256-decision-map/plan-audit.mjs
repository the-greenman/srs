#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const batchDir = resolve(here, "batches");
const outputPath = resolve(here, "audit-plan.json");
const firstPass = ["audit-1a", "audit-1b", "audit-1c"];
const secondPass = ["audit-2a", "audit-2b", "audit-2c"];
const auditors = [...firstPass, ...secondPass];
const primaryFamilies = {
  "audit-1a": ["A", "D", "F1"],
  "audit-1b": ["B", "E", "F2"],
  "audit-1c": ["C", "G", "H"],
};

const files = (await readdir(batchDir)).filter((name) => name.endsWith(".json")).sort();
const decisions = [];
for (const file of files) {
  const cards = JSON.parse(await readFile(resolve(batchDir, file), "utf8"));
  if (!Array.isArray(cards)) throw new Error(`${file} must contain an array`);
  for (const card of cards) decisions.push({ ...card, _batch: file });
}

const byId = new Map();
for (const card of decisions) {
  if (byId.has(card.decision_id)) throw new Error(`duplicate ID ${card.decision_id}`);
  byId.set(card.decision_id, card);
}

function flags(card) {
  const reasons = [];
  if (Object.values(card.axes).some((axis) => axis.confidence === "low")) reasons.push("low-confidence");
  if (Object.values(card.axes).some((axis) => axis.direction === "conditional")) reasons.push("conditional");
  if (card.exception_class !== "none") reasons.push("exception-or-contradiction");
  if (card.status === "superseded" || card.supersedes.length) reasons.push("supersession");
  if (card.sources.some((source) => source.kind === "owner-decision")) reasons.push("owner-decision");
  return reasons;
}

function sample(ids) {
  const sorted = [...ids].sort();
  const size = Math.ceil(sorted.length * 0.2);
  const chosen = new Set();
  for (let i = 0; i < size; i += 1) {
    const index = Math.min(sorted.length - 1, Math.floor(((i + 0.5) * sorted.length) / size));
    chosen.add(sorted[index]);
  }
  return [...chosen];
}

const familyIds = {};
for (const card of decisions) {
  familyIds[card.decision_family] ??= [];
  familyIds[card.decision_family].push(card.decision_id);
}
const stratified = Object.fromEntries(
  Object.entries(familyIds).map(([family, ids]) => [family, sample(ids)]),
);

const assignments = Object.fromEntries(auditors.map((name) => [name, new Map()]));
function assign(auditor, id, reason) {
  const reasons = assignments[auditor].get(id) ?? new Set();
  reasons.add(reason);
  assignments[auditor].set(id, reasons);
}

for (const [auditor, families] of Object.entries(primaryFamilies)) {
  for (const family of families) {
    for (const id of stratified[family] ?? []) assign(auditor, id, "stratified-20-percent");
  }
}

const flagged = decisions.filter((card) => flags(card).length);
for (const card of flagged) {
  const offset = [...card.decision_id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % firstPass.length;
  const reviewers = [firstPass[offset], secondPass[(offset + 1) % secondPass.length]];
  for (const reviewer of reviewers) {
    for (const reason of flags(card)) assign(reviewer, card.decision_id, reason);
  }
}

const serializedAssignments = Object.fromEntries(auditors.map((auditor) => [
  auditor,
  [...assignments[auditor]].sort(([left], [right]) => left.localeCompare(right)).map(([id, reasons]) => ({
    decision_id: id,
    family: byId.get(id).decision_family,
    batch: byId.get(id)._batch,
    reasons: [...reasons].sort(),
  })),
]));

const output = {
  generated_from: files.map((file) => `batches/${file}`),
  corpus_cards: decisions.length,
  stratified_sample: Object.fromEntries(Object.entries(stratified).map(([family, ids]) => [family, {
    family_cards: familyIds[family].length,
    required_minimum: Math.ceil(familyIds[family].length * 0.2),
    selected_ids: ids,
  }])),
  flagged_cards: flagged.map((card) => ({ decision_id: card.decision_id, reasons: flags(card) })),
  assignments: serializedAssignments,
};

const text = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--write")) await writeFile(outputPath, text);
else process.stdout.write(text);
