import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MARKDOWN_PATH, MODEL_PATH, collectStatus, renderRoadmap, renderStatus, validateRoadmap } from "./roadmap.mjs";

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
  assert.deepEqual(roadmap.capabilityPipelines.map((pipeline) => pipeline.id), ["governance-practice"]);
  assert.deepEqual(roadmap.capabilityPipelines[0].stages.map((stage) => stage.id), ["G1", "G2", "G3", "G4", "G5", "G6", "G7"]);
  assert.equal(roadmap.knownEpicRefs.length, 16);
  assert.equal(roadmap.epics.length, 16);
});

test("validation rejects invalid task roles, missing issue references and dependency cycles", () => {
  const invalid = structuredClone(roadmap);
  invalid.boundaries[0].tasks[0].role = "maybe";
  invalid.boundaries[1].tasks[0].ref = "not an issue";
  invalid.boundaries[0].requires = ["F2"];
  delete invalid.applicationStrategy.architecture;
  invalid.capabilityPipelines[0].stages[0].requires = ["G7"];
  invalid.applicationStrategy.modes[0].servesStages = ["G99"];
  const errors = validateRoadmap(invalid).errors.join("\n");
  assert.match(errors, /invalid task role/);
  assert.match(errors, /invalid issue reference/);
  assert.match(errors, /boundary dependency cycle/);
  assert.match(errors, /applicationStrategy: missing architecture/);
  assert.match(errors, /capability dependency cycle/);
  assert.match(errors, /serves unknown stage G99/);
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
  assert.match(rendered, /paused origin prototype and research corpus/);
  assert.match(rendered, /Governance-practice capability pipeline/);
  assert.match(rendered, /G1: Simple decision log/);
  assert.match(rendered, /G6: Facilitated practice/);
  assert.match(rendered, /CP_governance_practice_G6 --> CP_governance_practice_G7/);
  assert.match(rendered, /\| \[#384\].*\| gate \|/);
  assert.match(rendered, /TSS schema and transcript-ingestion contract/);
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
