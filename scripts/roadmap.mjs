#!/usr/bin/env node
// Owner strategic map: committed structure plus a REST-only GitHub status overlay.
// It intentionally has no Project-v2 or board-manager dependency.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const OWNER = process.env.SRS_ROADMAP_OWNER || "the-greenman";
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const MODEL_PATH = resolve(SCRIPT_DIR, "../docs/strategy/roadmap.json");
const MARKDOWN_PATH = resolve(SCRIPT_DIR, "../docs/strategy/roadmap.md");
const TASK_ROLES = new Set(["gate", "evidence", "supporting", "later"]);
const BOUNDARY_FIELDS = ["track", "name", "actor", "promise", "durableArtifact", "entryCriteria", "includedCapabilities", "exclusions", "walkthrough", "compatibilityPromise", "stableAfter", "tasks"];
const PIPELINE_STAGE_FIELDS = ["id", "name", "groupNeed", "promise", "semanticAdds", "blueprintAdds", "doesNotIntroduce", "requires", "releaseAlignment", "executionAnchors", "activationTrigger"];

function issueRef(ref) {
  const match = /^([^#\s]+)#(\d+)$/.exec(ref || "");
  if (!match) throw new Error(`invalid issue reference: ${ref}`);
  return { ref, repo: match[1], number: Number(match[2]) };
}

function issueUrl(ref) {
  const { repo, number } = issueRef(ref);
  return `https://github.com/${OWNER}/${repo}/issues/${number}`;
}

function issueLink(ref) { return `[#${issueRef(ref).number}](${issueUrl(ref)})`; }
function cell(value) { return String(value).replaceAll("|", "\\|").replaceAll("\n", " "); }
function id(value) { return String(value).replace(/[^A-Za-z0-9_]/g, "_"); }
function mermaid(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("[", "(").replaceAll("]", ")").replace(/\r?\n/g, "<br/>"); }

function model(path = MODEL_PATH) { return JSON.parse(readFileSync(path, "utf8")); }

function validateRoadmap(data) {
  const errors = [], warnings = [];
  const capabilities = new Set(data.capabilities || []);
  const tracks = new Set((data.tracks || []).map((track) => track.id));
  if (!data.version) errors.push("missing version");
  if (!data.bootstrapStatus) errors.push("missing bootstrapStatus");
  for (const field of ["name", "role", "architecture", "boundaries", "modes", "predecessor"]) {
    const value = data.applicationStrategy?.[field];
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) errors.push(`applicationStrategy: missing ${field}`);
  }
  if (data.mission?.status !== "ratified") errors.push("mission must be ratified");
  for (const field of ["purpose", "muDemocracy", "srs", "humanAiConstitution", "roadmapTests"]) {
    const value = data.mission?.[field];
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) errors.push(`mission: missing ${field}`);
  }
  if (!tracks.size) errors.push("missing tracks");
  const boundaryIds = new Set();
  const byId = new Map();
  for (const boundary of data.boundaries || []) {
    if (!boundary.id || boundaryIds.has(boundary.id)) errors.push(`duplicate boundary id: ${boundary.id || "(blank)"}`);
    boundaryIds.add(boundary.id); byId.set(boundary.id, boundary);
    for (const field of BOUNDARY_FIELDS) {
      const value = boundary[field];
      if (value == null || value === "" || (Array.isArray(value) && !value.length)) errors.push(`${boundary.id}: missing ${field}`);
    }
    if (!tracks.has(boundary.track)) errors.push(`${boundary.id}: unknown track ${boundary.track}`);
    for (const capability of boundary.includedCapabilities || []) if (!capabilities.has(capability)) errors.push(`${boundary.id}: unknown capability ${capability}`);
    const taskRefs = new Set();
    for (const task of boundary.tasks || []) {
      try { issueRef(task.ref); } catch (error) { errors.push(`${boundary.id}: ${error.message}`); }
      if (!TASK_ROLES.has(task.role)) errors.push(`${boundary.id}: invalid task role ${task.role}`);
      if (taskRefs.has(task.ref)) errors.push(`${boundary.id}: duplicate task ${task.ref}`);
      taskRefs.add(task.ref);
    }
    if (!(boundary.tasks || []).some((task) => task.role === "gate")) errors.push(`${boundary.id}: no gate task`);
    for (const gap of boundary.gaps || []) if (!gap.title || !gap.owner || !gap.trigger) errors.push(`${boundary.id}: incomplete gap`);
  }
  for (const boundary of data.boundaries || []) for (const required of boundary.requires || []) {
    if (!boundaryIds.has(required)) errors.push(`${boundary.id}: requires unknown boundary ${required}`);
  }
  const visiting = new Set(), visited = new Set();
  const visit = (boundaryId) => {
    if (visiting.has(boundaryId)) { errors.push(`boundary dependency cycle at ${boundaryId}`); return; }
    if (visited.has(boundaryId)) return;
    visiting.add(boundaryId);
    for (const required of byId.get(boundaryId)?.requires || []) visit(required);
    visiting.delete(boundaryId); visited.add(boundaryId);
  };
  for (const boundaryId of boundaryIds) visit(boundaryId);
  const pipelineIds = new Set(), allPipelineStageIds = new Set();
  for (const pipeline of data.capabilityPipelines || []) {
    if (!pipeline.id || pipelineIds.has(pipeline.id)) errors.push(`duplicate capability pipeline id: ${pipeline.id || "(blank)"}`);
    pipelineIds.add(pipeline.id);
    for (const field of ["name", "purpose", "stages"]) {
      const value = pipeline[field];
      if (value == null || value === "" || (Array.isArray(value) && !value.length)) errors.push(`${pipeline.id}: missing ${field}`);
    }
    const stageIds = new Set(), stages = new Map();
    for (const stage of pipeline.stages || []) {
      if (!stage.id || stageIds.has(stage.id)) errors.push(`${pipeline.id}: duplicate stage id: ${stage.id || "(blank)"}`);
      stageIds.add(stage.id); stages.set(stage.id, stage);
      if (allPipelineStageIds.has(stage.id)) errors.push(`duplicate capability stage id: ${stage.id || "(blank)"}`);
      allPipelineStageIds.add(stage.id);
      for (const field of PIPELINE_STAGE_FIELDS) {
        const value = stage[field];
        if (value == null || value === "" || (Array.isArray(value) && !value.length && !["requires", "releaseAlignment", "executionAnchors"].includes(field))) errors.push(`${pipeline.id}/${stage.id}: missing ${field}`);
      }
      if ((stage.executionAnchors || []).length > 3) errors.push(`${pipeline.id}/${stage.id}: more than three execution anchors`);
      for (const ref of stage.executionAnchors || []) try { issueRef(ref); } catch (error) { errors.push(`${pipeline.id}/${stage.id}: ${error.message}`); }
      for (const boundaryId of stage.releaseAlignment || []) if (!boundaryIds.has(boundaryId)) errors.push(`${pipeline.id}/${stage.id}: aligns to unknown boundary ${boundaryId}`);
    }
    for (const stage of pipeline.stages || []) for (const required of stage.requires || []) {
      if (!stageIds.has(required)) errors.push(`${pipeline.id}/${stage.id}: requires unknown stage ${required}`);
    }
    const stageVisiting = new Set(), stageVisited = new Set();
    const visitStage = (stageId) => {
      if (stageVisiting.has(stageId)) { errors.push(`${pipeline.id}: capability dependency cycle at ${stageId}`); return; }
      if (stageVisited.has(stageId)) return;
      stageVisiting.add(stageId);
      for (const required of stages.get(stageId)?.requires || []) visitStage(required);
      stageVisiting.delete(stageId); stageVisited.add(stageId);
    };
    for (const stageId of stageIds) visitStage(stageId);
  }
  const modeIds = new Set();
  for (const mode of data.applicationStrategy?.modes || []) {
    if (!mode.id || modeIds.has(mode.id)) errors.push(`applicationStrategy: duplicate mode id: ${mode.id || "(blank)"}`);
    modeIds.add(mode.id);
    if (!mode.name) errors.push(`applicationStrategy/${mode.id}: missing name`);
    for (const capability of mode.capabilities || []) if (!capabilities.has(capability)) errors.push(`applicationStrategy/${mode.id}: unknown capability ${capability}`);
    for (const stageId of mode.servesStages || []) if (!allPipelineStageIds.has(stageId)) errors.push(`applicationStrategy/${mode.id}: serves unknown stage ${stageId}`);
  }
  const known = new Set(data.knownEpicRefs || []), mapped = new Set();
  for (const epic of data.epics || []) {
    try { issueRef(epic.ref); } catch (error) { errors.push(`epic: ${error.message}`); continue; }
    if (mapped.has(epic.ref)) errors.push(`duplicate epic: ${epic.ref}`);
    mapped.add(epic.ref);
    if (!known.has(epic.ref)) warnings.push(`mapped epic absent from knownEpicRefs: ${epic.ref}`);
    for (const capability of epic.capabilities || []) if (!capabilities.has(capability)) errors.push(`${epic.ref}: unknown capability ${capability}`);
    if (!epic.disposition || !epic.role) errors.push(`${epic.ref}: missing disposition or role`);
  }
  for (const ref of known) if (!mapped.has(ref)) errors.push(`unmapped epic: ${ref}`);
  for (const ref of mapped) if (!known.has(ref)) warnings.push(`unrecognised mapped epic: ${ref}`);
  return { errors, warnings };
}

function renderRoadmap(data) {
  const check = validateRoadmap(data);
  if (check.errors.length) throw new Error(`roadmap invalid:\n- ${check.errors.join("\n- ")}`);
  const lines = [
    "# SRS owner strategic map", "",
    "> Generated from `roadmap.json` by `node scripts/roadmap.mjs --write`. Do not edit this file directly.", "",
    data.purpose, "",
    `> Bootstrap status: ${data.bootstrapStatus}`, "",
    "## Mission and roadmap constitution", "",
    `**Status:** Ratified on ${data.mission.ratifiedOn}. ${data.mission.decisionAuthority}`, "",
    `> ${data.mission.purpose}`, "",
    `**μDemocracy:** ${data.mission.muDemocracy}`, "",
    `**SRS:** ${data.mission.srs}`, "",
    "## First usable application", "",
    `**${data.applicationStrategy.name}** — ${data.applicationStrategy.role}`, "",
    `**Architecture:** ${data.applicationStrategy.architecture}`, "",
    "### Boundary rules", "",
    ...data.applicationStrategy.boundaries.flatMap((boundary) => [`- ${boundary}`, ""]),
    "### Modes over the shared substrate", "",
    ...data.applicationStrategy.modes.flatMap((mode) => [`- ${mode.name}`, ""]),
    "### Origin prototype", "",
    data.applicationStrategy.predecessor, "",
    "### Human–AI constitution", "",
    `> ${data.mission.humanAiConstitution}`, "",
    "### Roadmap test", "",
    "Every boundary and gate task is judged against these questions:", "",
    ...data.mission.roadmapTests.flatMap((test, index) => [`${index + 1}. ${test}`, ""]),
    "## Two release tracks", "", "```mermaid", "flowchart LR"
  ];
  for (const track of data.tracks) {
    lines.push(`  subgraph ${track.id}["${mermaid(track.name)}"]`);
    for (const boundary of data.boundaries.filter((item) => item.track === track.id)) lines.push(`    ${boundary.id}["${mermaid(`${boundary.id}: ${boundary.name}`)}"]`);
    lines.push("  end");
  }
  for (const boundary of data.boundaries) for (const required of boundary.requires || []) lines.push(`  ${required} --> ${boundary.id}`);
  lines.push("```", "", "F2 is the first concentrated post-kernel effort. P1 and P2 may progress after F1; P3 requires both F2 and P2.", "");
  for (const track of data.tracks) {
    lines.push(`## ${track.name}`, "", track.purpose, "");
    for (const boundary of data.boundaries.filter((item) => item.track === track.id)) {
      lines.push(`### ${boundary.id} — ${boundary.name}`, "", `**Actor:** ${boundary.actor}`, "", `**Promise:** ${boundary.promise}`, "", `**Durable artifact:** ${boundary.durableArtifact}`, "", `**Entry criteria:** ${boundary.entryCriteria.join("; ")}`, "", `**Included capabilities:** ${boundary.includedCapabilities.join(", ")}`, "", `**Explicit exclusions:** ${boundary.exclusions.join("; ")}`, "", `**End-to-end walkthrough:** ${boundary.walkthrough}`, "", `**Compatibility promise:** ${boundary.compatibilityPromise}`, "", `**What becomes stable:** ${boundary.stableAfter}`, "", "| Task | Role |", "| --- | --- |");
      for (const task of boundary.tasks) lines.push(`| ${issueLink(task.ref)} | ${task.role} |`);
      if (boundary.gaps?.length) {
        lines.push("", "**Known gaps**", "", "| Gap | Owner | Activation trigger |", "| --- | --- | --- |");
        for (const gap of boundary.gaps) lines.push(`| ${cell(gap.title)} | ${cell(gap.owner)} | ${cell(gap.trigger)} |`);
      }
      lines.push("");
    }
  }
  lines.push("## Governance-practice capability pipeline", "", "This is the group adoption path, not another release plan or issue hierarchy. Each stage adds only the next semantic and procedural capability a group needs; issue anchors identify active execution work without containing its implementation tree.", "");
  for (const pipeline of data.capabilityPipelines || []) {
    lines.push(`### ${pipeline.name}`, "", pipeline.purpose, "", "```mermaid", "flowchart LR");
    for (const stage of pipeline.stages) lines.push(`  CP_${id(pipeline.id)}_${stage.id}["${mermaid(`${stage.id}: ${stage.name}`)}"]`);
    for (const stage of pipeline.stages) for (const required of stage.requires || []) lines.push(`  CP_${id(pipeline.id)}_${required} --> CP_${id(pipeline.id)}_${stage.id}`);
    lines.push("```");
    lines.push("", "| Stage | Capability promise | Release alignment | Activation trigger |", "| --- | --- | --- | --- |");
    for (const stage of pipeline.stages) lines.push(`| ${stage.id} — ${cell(stage.name)} | ${cell(stage.promise)} | ${cell((stage.releaseAlignment || []).join(", ") || "future")} | ${cell(stage.activationTrigger)} |`);
    for (const stage of pipeline.stages) {
      const anchors = (stage.executionAnchors || []).map(issueLink).join(", ") || "None — remember until activated";
      lines.push("", `#### ${stage.id} — ${stage.name}`, "", `**Group need:** ${stage.groupNeed}`, "", `**Semantic additions:** ${stage.semanticAdds.join("; ")}`, "", `**Blueprint additions:** ${stage.blueprintAdds.join("; ")}`, "", `**Does not introduce:** ${stage.doesNotIntroduce.join("; ")}`, "", `**Execution anchors:** ${anchors}`, "");
    }
  }
  lines.push("## Capability map", "", "```mermaid", "flowchart LR", "  S[\"Semantic sovereignty\"]");
  for (const capability of data.capabilities) lines.push(`  S --> C_${id(capability)}["${mermaid(capability)}"]`);
  for (const epic of data.epics) {
    const epicId = `E_${id(epic.ref)}`;
    lines.push(`  ${epicId}["${mermaid(`${epic.ref}: ${epic.name}`)}"]`);
    for (const capability of epic.capabilities) lines.push(`  C_${id(capability)} -.-> ${epicId}`);
  }
  lines.push("```", "", `Delivery surfaces across all branches: ${data.deliverySurfaces.join(", ")}.`, "", "## Epic and workstream disposition", "", "| Epic | Disposition | Role | Rationale |", "| --- | --- | --- | --- |");
  for (const epic of data.epics) lines.push(`| ${issueLink(epic.ref)} ${cell(epic.name)} | ${epic.disposition} | ${cell(epic.role)} | ${cell(epic.notes)} |`);
  lines.push("", "## Use", "", "- Regenerate: `node scripts/roadmap.mjs --write`.", "- Verify generated output: `node scripts/roadmap.mjs --check`.", "- Overlay live GitHub state: `node scripts/roadmap.mjs --status`.", "");
  return lines.join("\n");
}

function ghJson(args) { return JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })); }

function githubClient() {
  const cache = new Map();
  const read = (ref) => {
    if (cache.has(ref)) return cache.get(ref);
    const { repo, number } = issueRef(ref);
    const issue = ghJson(["api", `repos/${OWNER}/${repo}/issues/${number}`]);
    const blockers = ghJson(["api", "--paginate", `repos/${OWNER}/${repo}/issues/${number}/dependencies/blocked_by`]);
    const row = { ref, state: issue.state, title: issue.title, labels: (issue.labels || []).map((label) => label.name), blockers: (blockers || []).map((item) => ({ ref: `${item.repository?.name || repo}#${item.number}`, state: item.state })) };
    cache.set(ref, row); return row;
  };
  return { read };
}

function collectStatus(data, client) {
  const refs = [...new Set(data.boundaries.flatMap((boundary) => boundary.tasks.map((task) => task.ref)))];
  const rows = new Map();
  for (const ref of refs) rows.set(ref, client.read(ref));
  return rows;
}

function closed(row) { return String(row.state).toLowerCase() === "closed"; }

function renderStatus(data, rows) {
  const lines = ["SRS owner strategic map — live overlay", "", "Only explicit mapped tasks are fetched; native sub-issue descendants are not inferred as release gates.", ""];
  for (const track of data.tracks) {
    lines.push(track.name);
    for (const boundary of data.boundaries.filter((item) => item.track === track.id)) {
      const tasks = boundary.tasks.map((task) => ({ ...task, row: rows.get(task.ref) })).filter((task) => task.row);
      const gates = tasks.filter((task) => task.role === "gate");
      const done = gates.filter((task) => closed(task.row)).length;
      const blockers = tasks.flatMap((task) => task.row.blockers.filter((blocker) => String(blocker.state).toLowerCase() === "open").map((blocker) => `${task.ref} blocked by ${blocker.ref}`));
      lines.push(`- ${boundary.id} ${boundary.name}: ${done}/${gates.length} gate task(s) closed${blockers.length ? ` · ${blockers.length} open native blocker(s)` : ""}`);
    }
    lines.push("");
  }
  lines.push(`Fetched ${rows.size} explicit task issue(s).`);
  return lines.join("\n");
}

function run(argv) {
  const modes = ["--write", "--check", "--status"].filter((flag) => argv.includes(flag));
  if (modes.length !== 1) throw new Error("usage: roadmap.mjs --write | --check | --status");
  const data = model();
  const check = validateRoadmap(data);
  if (check.errors.length) throw new Error(`roadmap invalid:\n- ${check.errors.join("\n- ")}`);
  if (modes[0] === "--write") { writeFileSync(MARKDOWN_PATH, renderRoadmap(data)); console.log(`wrote ${MARKDOWN_PATH}`); return; }
  if (modes[0] === "--check") {
    const actual = existsSync(MARKDOWN_PATH) ? readFileSync(MARKDOWN_PATH, "utf8") : "";
    if (actual !== renderRoadmap(data)) throw new Error("roadmap output is stale; run: node scripts/roadmap.mjs --write");
    console.log("roadmap is current"); return;
  }
  console.log(renderStatus(data, collectStatus(data, githubClient())));
}

export { MODEL_PATH, MARKDOWN_PATH, issueRef, validateRoadmap, renderRoadmap, collectStatus, renderStatus };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(process.argv.slice(2)); }
  catch (error) { console.error(`roadmap: ${error.message}`); process.exitCode = 1; }
}
