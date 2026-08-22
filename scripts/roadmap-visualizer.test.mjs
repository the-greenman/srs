import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRoadmapGraph, buildRoadmapIndex, capabilityArchitecture, issueUrl, nodeGroups, pipelineLayout, prerequisites, relatedNodes } from "../docs/strategy/roadmap-model.mjs";

const roadmap = JSON.parse(readFileSync(new URL("../docs/strategy/roadmap.json", import.meta.url), "utf8"));
const graph = buildRoadmapGraph(roadmap);

test("visualizer graph represents the two release tracks and governance pipeline", () => {
  assert.equal(graph.nodes.get("release:F2").type, "release");
  assert.equal(graph.nodes.get("stage:governance-practice:G7").type, "stage");
  assert.equal(graph.nodes.get("stage:semantic-document-practice:D5").type, "stage");
  assert.equal(graph.nodes.get("mode:shared-facilitation").type, "mode");
  assert.equal(graph.nodes.get("reality:p2-manual-protocol").type, "reality");
  assert.equal(graph.nodes.get("contract:addressability").type, "contract");
  assert.ok(graph.edges.some((edge) => edge.from === "release:F1" && edge.to === "release:F2" && edge.kind === "requires"));
  assert.ok(graph.edges.some((edge) => edge.from === "stage:governance-practice:G6" && edge.to === "stage:governance-practice:G7" && edge.kind === "requires"));
  assert.ok(graph.edges.some((edge) => edge.from === "stage:semantic-document-practice:D3" && edge.to === "stage:semantic-document-practice:D5" && edge.kind === "requires"));
});

test("release and practice prerequisites remain explicit and transitive", () => {
  assert.deepEqual(prerequisites(graph, "release:F2"), ["release:F1"]);
  assert.deepEqual(new Set(prerequisites(graph, "stage:governance-practice:G5")), new Set([
    "stage:governance-practice:G4",
    "stage:governance-practice:G3",
    "stage:governance-practice:G2",
    "stage:governance-practice:G1"
  ]));
  assert.deepEqual(new Set(prerequisites(graph, "stage:governance-practice:G7")), new Set([
    "stage:governance-practice:G6",
    "stage:governance-practice:G3",
    "stage:governance-practice:G2",
    "stage:governance-practice:G1"
  ]));
  assert.deepEqual(new Set(prerequisites(graph, "stage:semantic-document-practice:D5")), new Set([
    "stage:semantic-document-practice:D4",
    "stage:semantic-document-practice:D3",
    "stage:semantic-document-practice:D2",
    "stage:semantic-document-practice:D1"
  ]));
});

test("relationship explorer keeps direct relationships separate from context", () => {
  const p2 = relatedNodes(graph, "release:P2");
  assert.ok(p2.direct.has("stage:governance-practice:G3"));
  assert.ok(p2.direct.has("stage:governance-practice:G6"));
  assert.ok(p2.direct.has("capability:Work With Meaning"));
  assert.ok(p2.direct.has("work:muDemocracy.org#66"));

  const g7 = relatedNodes(graph, "stage:governance-practice:G7");
  assert.ok(g7.direct.has("release:P3"));
  assert.ok(g7.direct.has("mode:shared-facilitation"));
  assert.ok(g7.direct.has("work:muDemocracy.org#60"));
  assert.ok(g7.secondary.has("capability:Collaborate With AI"));

  const groups = nodeGroups(graph, "release:P2");
  assert.ok(groups.stage.some(({ node }) => node.id === "stage:governance-practice:G6"));
  assert.ok(groups.work.some(({ node }) => node.id === "work:muDemocracy.org#66"));
  assert.ok(!groups.work.some(({ node }) => node.id === "work:srs#384"));
  assert.ok(groups.reality.some(({ node }) => node.id === "reality:p2-manual-protocol"));
});

test("issue links are derived only from valid repository issue references", () => {
  assert.equal(issueUrl("srs#256"), "https://github.com/the-greenman/srs/issues/256");
  assert.equal(issueUrl("muDemocracy.org#60"), "https://github.com/the-greenman/muDemocracy.org/issues/60");
  assert.equal(issueUrl("not a ref"), null);
});

test("pipeline layout is derived from requires rather than named governance stages", () => {
  const pipeline = { stages: [
    { id: "start", requires: [] },
    { id: "left", requires: ["start"] },
    { id: "right", requires: ["start"] },
    { id: "join", requires: ["left", "right"] }
  ] };
  assert.deepEqual(pipelineLayout(pipeline).map(({ stage, rank }) => [stage.id, rank]), [["start", 0], ["left", 1], ["right", 1], ["join", 2]]);
  const index = buildRoadmapIndex(roadmap);
  assert.equal(index.stageNodeIds.get("D5"), "stage:semantic-document-practice:D5");
});

test("capability architecture is a validated, data-derived tree", () => {
  const tree = capabilityArchitecture(buildRoadmapIndex(roadmap));
  const kernel = tree.find((item) => item.node.id === "semantic-kernel");
  assert.ok(kernel);
  assert.ok(kernel.children.some((item) => item.node.id === "projection-boundary"));
  assert.ok(tree.some((item) => item.node.id === "portable-publication"));
  assert.ok(tree.some((item) => item.node.id === "practice-extensions"));
  const practice = tree.find((item) => item.node.id === "practice-extensions");
  assert.ok(practice.children.some((item) => item.node.id === "addressability"));
});
