import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MARKDOWN_PATH, MODEL_PATH, auditRoadmap, collectStatus, renderRoadmap, renderStatus, validateRoadmap } from "./roadmap.mjs";
import { buildRoadmapIndex, capabilityArchitecture, materializeSrsProjection, rehydrateSrsProjection } from "../docs/strategy/roadmap-model.mjs";

const roadmap = JSON.parse(readFileSync(MODEL_PATH, "utf8"));
const statusFixture = JSON.parse(readFileSync(new URL("./fixtures/roadmap-status.json", import.meta.url), "utf8"));

test("two-track roadmap has complete ratified contracts", () => {
  const check = validateRoadmap(roadmap);
  assert.deepEqual(check.errors, []);
  assert.deepEqual(roadmap.tracks.map((track) => track.id), ["F", "P"]);
  assert.deepEqual(roadmap.boundaries.map((boundary) => boundary.id), ["F1", "F2", "F3", "P1", "P2", "P3"]);
  assert.equal(roadmap.applicationStrategy.name, "srs-web / app.mudemocracy.org");
  assert.deepEqual(roadmap.applicationStrategy.modes.map((mode) => mode.id), [
    "repository-inspection",
    "container-workspace",
    "shared-facilitation",
    "blueprint-authoring"
  ]);
  assert.deepEqual(roadmap.capabilityPipelines.map((pipeline) => pipeline.id), ["governance-practice", "semantic-document-practice"]);
  assert.deepEqual(roadmap.capabilityPipelines[0].stages.map((stage) => stage.id), ["G1", "G2", "G3", "G4", "G5", "G6", "G7"]);
  assert.deepEqual(roadmap.capabilityPipelines[1].stages.map((stage) => stage.id), ["D1", "D2", "D3", "D4", "D5"]);
  assert.equal(roadmap.reality.asOf, "2026-08-15");
  const boundaryAssessments = roadmap.assessments.filter((assessment) => assessment.kind === "boundary-assessment");
  assert.equal(boundaryAssessments.length, 19);
  assert.deepEqual(new Set(boundaryAssessments.map((check) => check.state)), new Set(["proven", "partial", "planned", "prototype"]));
  assert.equal(roadmap.knownEpicRefs.length, 16);
  assert.equal(roadmap.epics.length, 16);
  assert.equal(roadmap.standardContracts.filter((contract) => !roadmap.links.some((link) => link.type === "contains" && link.to === contract.id)).length, 4);
  assert.ok(roadmap.assessments.every((assessment) => assessment.assessedAt && assessment.reviewBy && assessment.evidence.every((item) => item.type && item.ref)));
  assert.equal(roadmap.standardContracts.find((contract) => contract.id === "addressability").instanceId, "a10d49a3-06ae-5690-ad9b-81edd6886b6d");
});

test("validation rejects invalid task roles, missing issue references and dependency cycles", () => {
  const invalid = structuredClone(roadmap);
  invalid.boundaries[0].tasks[0].role = "maybe";
  invalid.boundaries[1].tasks[0].ref = "not an issue";
  invalid.links.push({ type: "depends-on", from: "F1", to: "F2" });
  delete invalid.applicationStrategy.architecture;
  invalid.links.push({ type: "depends-on", from: "G1", to: "G7" });
  invalid.applicationStrategy.modes[0].servesStages = ["G99"];
  invalid.assessments.find((assessment) => assessment.kind === "boundary-assessment").state = "wishful";
  invalid.links.find((link) => link.type === "com.semanticops.strategy/assesses" && link.from === "f1-regeneration").to = "F99";
  invalid.standardContracts[0].stability = "eventually";
  invalid.links.find((link) => link.type === "contains" && link.to === "identity-and-references").from = "missing-contract";
  invalid.standardContracts.find((contract) => contract.id === "addressability").content = "copied normative prose";
  invalid.assessments.find((assessment) => assessment.kind === "contract-assessment").implementation = "almost";
  const errors = validateRoadmap(invalid).errors.join("\n");
  assert.match(errors, /invalid task role/);
  assert.match(errors, /invalid issue reference/);
  assert.match(errors, /boundary dependency cycle/);
  assert.match(errors, /applicationStrategy: missing architecture/);
  assert.match(errors, /capability dependency cycle/);
  assert.match(errors, /serves unknown stage G99/);
  assert.match(errors, /invalid state wishful/);
  assert.match(errors, /unknown target F99/);
  assert.match(errors, /unknown stability eventually/);
  assert.match(errors, /unknown source missing-contract/);
  assert.match(errors, /must reference, not duplicate, normative content/);
  assert.match(errors, /invalid implementation maturity almost/);
});

test("Markdown is deterministic and renders separate tracks, explicit tasks and gaps", () => {
  const rendered = renderRoadmap(roadmap);
  assert.equal(renderRoadmap(roadmap), rendered);
  assert.equal(readFileSync(MARKDOWN_PATH, "utf8"), rendered);
  assert.match(rendered, /subgraph F\["Sovereignty"\]/);
  assert.match(rendered, /subgraph P\["Decision practice"\]/);
  assert.match(rendered, /F2 --> F3/);
  assert.match(rendered, /F2 --> P3/);
  assert.match(rendered, /First usable application/);
  assert.match(rendered, /One repository runtime and one canonical edit, save, import and export path/);
  assert.match(rendered, /earlier prototype and research corpus/);
  assert.match(rendered, /Capability paths/);
  assert.match(rendered, /SRS capability architecture/);
  assert.match(rendered, /Lock before F1/);
  assert.match(rendered, /Portable semantic publication/);
  assert.match(rendered, /G1: Simple decision log/);
  assert.match(rendered, /G6: Facilitated practice/);
  assert.match(rendered, /Semantic document practice/);
  assert.match(rendered, /D5: Portable semantic publication/);
  assert.match(rendered, /CP_governance_practice_G6 --> CP_governance_practice_G7/);
  assert.match(rendered, /\| \[#384\].*\| gate \|/);
  assert.match(rendered, /TSS schema and transcript-ingestion contract/);
  assert.match(rendered, /Current evidence/);
  assert.match(rendered, /Assessed evidence snapshot as of 2026-08-15/);
});

test("shared roadmap index resolves cross-pipeline evidence without UI-specific lookups", () => {
  const index = buildRoadmapIndex(roadmap);
  assert.equal(index.stageNodeIds.get("D3"), "stage:semantic-document-practice:D3");
  assert.ok(index.checksByStage.get("D3").some((check) => check.id === "f1-musrs-document-corpus"));
  assert.ok(index.modesByStage.get("D3").some((mode) => mode.id === "blueprint-authoring"));
  assert.equal(index.checksByBoundary.get("F2").length, 3);
  assert.equal(index.contractChildrenById.get(null).length, 4);
  assert.equal(capabilityArchitecture(index)[0].node.id, "semantic-kernel");
});

test("audit distinguishes missing local targets, manual evidence, and review due dates", () => {
  const rows = auditRoadmap(roadmap, "2026-11-19");
  assert.ok(rows.some((row) => row.evidence.type === "command" && row.result === "manual"));
  assert.ok(rows.filter((row) => row.check.assessedAt).every((row) => row.review === "overdue"));
  const invalid = structuredClone(roadmap);
  invalid.assessments[0].evidence = [{ type: "repo-path", ref: "docs/definitely-not-a-roadmap-target" }];
  assert.equal(auditRoadmap(invalid, "2026-08-15")[0].result, "missing");
  const external = structuredClone(roadmap);
  external.assessments[0].evidence = [{ type: "repo-path", ref: "sibling-repo/definitely-not-here" }];
  assert.equal(auditRoadmap(external, "2026-08-15")[0].result, "external");
});

test("logical projection round-trips stable entities and explicit relations", () => {
  const index = buildRoadmapIndex(roadmap);
  const materialized = materializeSrsProjection(index);
  const restored = rehydrateSrsProjection(materialized);
  assert.equal(materialized.records.find((record) => record.fieldValues.strategy_key === "addressability").instanceId, "a10d49a3-06ae-5690-ad9b-81edd6886b6d");
  assert.ok(materialized.relations.every((relation) => /^[0-9a-f-]{36}$/i.test(relation.relationId)));
  assert.deepEqual(restored.entityKeys, [...index.entitiesById.keys()].sort());
  assert.deepEqual(restored.links, [...roadmap.links].sort((a, b) => `${a.type}:${a.from}:${a.to}`.localeCompare(`${b.type}:${b.from}:${b.to}`)));
});

test("live status reads explicit tasks only and leaves unrelated descendants alone", () => {
  const explicit = new Set(roadmap.boundaries.flatMap((boundary) => boundary.tasks.map((task) => task.ref)));
  assert.ok(!explicit.has(statusFixture.unrelatedDescendant), "fixture descendant must remain unmapped");
  const calls = [];
  const client = {
    read(ref) {
      calls.push(ref);
      if (!explicit.has(ref)) throw new Error(`unexpected descendant read: ${ref}`);
      return { ref, state: ref === "srs#256" ? "closed" : "open", title: ref, labels: [], blockers: ref === statusFixture.nativeBlocker[0] ? [{ ref: statusFixture.nativeBlocker[1], state: "closed" }] : [] };
    }
  };
  const rows = collectStatus(roadmap, client);
  assert.equal(rows.size, explicit.size);
  assert.equal(calls.length, explicit.size);
  const status = renderStatus(roadmap, rows);
  assert.match(status, /Only explicit mapped tasks are fetched/);
  assert.match(status, /F1 Coherent Semantic Kernel: 1\/1 gate task\(s\) closed/);
});

test("status rendering retains an open native blocker", () => {
  const data = structuredClone(roadmap);
  data.boundaries = [data.boundaries.find((boundary) => boundary.id === "F2")];
  const rows = collectStatus(data, { read(ref) { return { ref, state: "open", title: ref, labels: [], blockers: ref === "srs#384" ? [{ ref: "srs#256", state: "open" }] : [] }; } });
  assert.match(renderStatus(data, rows), /1 open native blocker/);
});
