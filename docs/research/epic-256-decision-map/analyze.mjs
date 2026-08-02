#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ledgerPath = resolve(here, "decision-ledger.json");
const outputPath = resolve(here, "cube-analysis.json");
const write = process.argv.includes("--write");
const check = process.argv.includes("--check");

const axisDefinitions = {
  integrity_expression: ["integrity", "expression"],
  continuity_evolution: ["continuity", "evolution"],
  coherence_autonomy: ["coherence", "autonomy"],
};
const countableConfidence = new Set(["high", "medium"]);
const eligibleClasses = new Set(["precedent-setting", "reasoned-application"]);
const eligibleStatuses = new Set(["ratified", "implemented"]);

function fail(message) {
  throw new Error(message);
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function validateLedger(ledger) {
  if (!ledger || typeof ledger !== "object" || !Array.isArray(ledger.decisions)) {
    fail("decision-ledger.json must be an object with a decisions array");
  }
  const ids = new Set();
  for (const [index, card] of ledger.decisions.entries()) {
    const at = `decisions[${index}]`;
    if (!/^E256-(?:[A-EG-H]|F[12])[0-9]{2,3}$/.test(card.decision_id ?? "")) {
      fail(`${at}: invalid decision_id ${card.decision_id}`);
    }
    if (ids.has(card.decision_id)) fail(`${at}: duplicate decision_id ${card.decision_id}`);
    ids.add(card.decision_id);
    if (!Array.isArray(card.task_refs)) fail(`${at}: task_refs must be an array`);
    if (!Array.isArray(card.sources) || card.sources.length === 0) fail(`${at}: sources must not be empty`);
    for (const [axis, poles] of Object.entries(axisDefinitions)) {
      const coding = card.axes?.[axis];
      if (!coding) fail(`${at}: missing axis ${axis}`);
      const allowed = new Set([...poles, "balanced", "conditional", "unknown", "not-applicable"]);
      if (!allowed.has(coding.direction)) fail(`${at}: invalid ${axis} direction ${coding.direction}`);
      if (!new Set(["high", "medium", "low"]).has(coding.confidence)) fail(`${at}: invalid confidence`);
    }
    const directional = Object.entries(axisDefinitions).filter(([axis, poles]) => {
      const coding = card.axes[axis];
      return poles.includes(coding.direction) && countableConfidence.has(coding.confidence);
    }).map(([axis]) => axis);
    const expected = ["centre", "axis", "edge", "vertex"][directional.length];
    if (card.cube?.dimensionality !== expected) {
      fail(`${at}: cube dimensionality ${card.cube?.dimensionality} should be ${expected}`);
    }
    if (!Array.isArray(card.cube.coordinate) || card.cube.coordinate.length !== directional.length) {
      fail(`${at}: cube coordinate must contain ${directional.length} directions`);
    }
  }
}

function isEligible(card) {
  return eligibleClasses.has(card.decision_class) && eligibleStatuses.has(card.status);
}

function axisAnalysis(decisions, axis, poles, reversalAssessment) {
  const eligible = decisions.filter(isEligible);
  const countable = eligible.filter((card) => {
    const coding = card.axes[axis];
    return poles.includes(coding.direction) && countableConfidence.has(coding.confidence);
  });
  const excludedEligible = eligible.filter((card) => !countable.includes(card));
  const allRelevantUnresolved = decisions.filter((card) =>
    card.status === "unresolved" && card.axes[axis].relevance !== "unexpressed",
  );
  const assessedIds = reversalAssessment?.plausibly_reversing_ids;
  const unresolvedCandidates = Array.isArray(assessedIds)
    ? allRelevantUnresolved.filter((card) => assessedIds.includes(card.decision_id))
    : allRelevantUnresolved;
  const directionCounts = Object.fromEntries(poles.map((pole) => [pole, 0]));
  const familyCounts = {};
  for (const card of countable) {
    const direction = card.axes[axis].direction;
    directionCounts[direction] += 1;
    familyCounts[card.decision_family] ??= Object.fromEntries(poles.map((pole) => [pole, 0]));
    familyCounts[card.decision_family][direction] += 1;
  }
  const ordered = [...poles].sort((a, b) => directionCounts[b] - directionCounts[a]);
  const winner = directionCounts[ordered[0]] === directionCounts[ordered[1]] ? null : ordered[0];
  const familyMajorities = {};
  for (const [family, counts] of Object.entries(familyCounts)) {
    familyMajorities[family] = counts[poles[0]] === counts[poles[1]]
      ? "tie"
      : counts[poles[0]] > counts[poles[1]] ? poles[0] : poles[1];
  }
  const decisiveFamilies = Object.values(familyMajorities).filter((value) => value !== "tie");
  const decisionShare = winner ? directionCounts[winner] / countable.length : 0;
  const familyShare = winner && decisiveFamilies.length
    ? decisiveFamilies.filter((value) => value === winner).length / decisiveFamilies.length
    : 0;
  const robustShare = winner
    ? directionCounts[winner] / (countable.length + excludedEligible.length + unresolvedCandidates.length)
    : 0;
  const minimumCoverage = countable.length >= 5 && Object.keys(familyCounts).length >= 3;
  const strong = minimumCoverage && decisionShare >= 0.8 && familyShare >= 0.75 && robustShare >= 0.7;
  const primary = minimumCoverage && decisionShare >= 0.7 && familyShare >= 0.6 && robustShare >= 0.7;
  const classification = strong ? "strong-bias"
    : primary ? "primary-bias"
      : minimumCoverage && winner ? "tendency"
        : minimumCoverage ? "mixed"
          : "insufficient-evidence";
  return {
    poles,
    eligible_decisions: eligible.length,
    counted_decisions: countable.length,
    excluded_eligible_decisions: excludedEligible.length,
    excluded_ids: excludedEligible.map((card) => card.decision_id),
    unresolved_candidate_decisions: unresolvedCandidates.length,
    unresolved_candidate_ids: unresolvedCandidates.map((card) => card.decision_id),
    unresolved_reversal_assessment: Array.isArray(assessedIds) ? "explicit" : "conservative-all-relevant",
    unresolved_reversal_rationale: reversalAssessment?.rationale ?? "No synthesis assessment supplied; every relevant unresolved card is treated as potentially reversing.",
    direction_counts: directionCounts,
    family_counts: familyCounts,
    family_majorities: familyMajorities,
    family_span: Object.keys(familyCounts).length,
    winner,
    decision_share: round(decisionShare),
    family_majority_share: round(familyShare),
    worst_case_share_if_excluded_oppose: round(robustShare),
    robust_to_excluded_evidence: robustShare >= 0.7,
    classification,
  };
}

function analyze(ledger) {
  const decisions = ledger.decisions;
  const statusCounts = {};
  const classCounts = {};
  const familyCounts = {};
  const occupancy = { vertex: 0, edge: 0, axis: 0, centre: 0 };
  const coordinateCounts = {};
  for (const card of decisions) {
    statusCounts[card.status] = (statusCounts[card.status] ?? 0) + 1;
    classCounts[card.decision_class] = (classCounts[card.decision_class] ?? 0) + 1;
    familyCounts[card.decision_family] = (familyCounts[card.decision_family] ?? 0) + 1;
    occupancy[card.cube.dimensionality] += 1;
    const key = card.cube.coordinate.length ? card.cube.coordinate.join("|") : "centre";
    coordinateCounts[key] = (coordinateCounts[key] ?? 0) + 1;
  }
  return {
    generated_from: "decision-ledger.json",
    methodology_version: ledger.methodology_version ?? "1.0",
    corpus: {
      total_decisions: decisions.length,
      eligible_bias_decisions: decisions.filter(isEligible).length,
      status_counts: statusCounts,
      class_counts: classCounts,
      family_counts: familyCounts,
    },
    axes: Object.fromEntries(
      Object.entries(axisDefinitions).map(([axis, poles]) => [
        axis,
        axisAnalysis(decisions, axis, poles, ledger.bias_reversal_assessment?.[axis]),
      ]),
    ),
    cube: { occupancy, coordinate_counts: coordinateCounts },
    exceptions: {
      counts: decisions.reduce((counts, card) => {
        counts[card.exception_class] = (counts[card.exception_class] ?? 0) + 1;
        return counts;
      }, {}),
      ids: decisions.filter((card) => card.exception_class !== "none").map((card) => card.decision_id),
    },
    unresolved_ids: decisions.filter((card) => card.status === "unresolved").map((card) => card.decision_id),
  };
}

const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
validateLedger(ledger);
const output = `${JSON.stringify(analyze(ledger), null, 2)}\n`;

if (write) {
  await writeFile(outputPath, output);
} else if (check) {
  const existing = await readFile(outputPath, "utf8");
  if (existing !== output) fail("cube-analysis.json is stale; run node analyze.mjs --write");
  console.log("decision ledger is valid and cube-analysis.json is reproducible");
} else {
  process.stdout.write(output);
}
