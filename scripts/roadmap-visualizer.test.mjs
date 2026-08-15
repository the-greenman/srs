import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRoadmapGraph, issueUrl, nodeGroups, prerequisites, relatedNodes } from "../docs/strategy/roadmap-view-model.mjs";

const roadmap = JSON.parse(readFileSync(new URL("../docs/strategy/roadmap.json", import.meta.url), "utf8"));
const graph = buildRoadmapGraph(roadmap);

test("visualizer graph represents the two release tracks and governance pipeline", () => {
  assert.equal(graph.nodes.get("release:F2").type, "release");
  assert.equal(graph.nodes.get("stage:governance-practice:G7").type, "stage");
  assert.equal(graph.nodes.get("mode:shared-facilitation").type, "mode");
  assert.ok(graph.edges.some((edge) => edge.from === "release:F1" && edge.to === "release:F2" && edge.kind === "requires"));
  assert.ok(graph.edges.some((edge) => edge.from === "stage:governance-practice:G6" && edge.to === "stage:governance-practice:G7" && edge.kind === "requires"));
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
});

test("issue links are derived only from valid repository issue references", () => {
  assert.equal(issueUrl("srs#256"), "https://github.com/the-greenman/srs/issues/256");
  assert.equal(issueUrl("muDemocracy.org#60"), "https://github.com/the-greenman/muDemocracy.org/issues/60");
  assert.equal(issueUrl("not a ref"), null);
});
