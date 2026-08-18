import { buildRoadmapGraph, buildRoadmapIndex, capabilityArchitecture, contractRequirements, evidenceReview, issueUrl, nodeGroups, pipelineLayout, prerequisites, relatedNodes } from "./roadmap-model.mjs";

const app = document.querySelector("#roadmap-app");
let roadmap;
let graph;
let index;
let graphObserver;
const state = { view: "boundaries", pinned: null, preview: null };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character]);
}

function list(items) {
  return items?.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p class=\"muted\">None.</p>";
}

function nodeFor(id) { return graph.nodes.get(id); }
function stageNodeId(stageId) { return index.stageNodeIds.get(stageId); }
function focusId() { return state.preview || state.pinned || defaultFocus(); }
function defaultFocus() {
  const firstStage = roadmap.capabilityPipelines.flatMap((pipeline) => pipeline.stages)[0];
  const relatedStage = roadmap.capabilityPipelines.flatMap((pipeline) => pipeline.stages).find((stage) => index.targets(stage.id, "depends-on").length) || firstStage;
  return state.view === "pipeline" ? stageNodeId(firstStage.id) : state.view === "relationships" ? stageNodeId(relatedStage.id) : `release:${roadmap.boundaries[0].id}`;
}
function nodeIdForRef(ref) { return `work:${ref}`; }

function realityChecks(boundaryId) { return index.checksByBoundary.get(boundaryId) || []; }
function realityState(id) { return index.statesById.get(id)?.label || id; }
function realityCounts(boundaryId) {
  return Object.fromEntries(roadmap.reality.states.map((state) => [state.id, realityChecks(boundaryId).filter((check) => check.state === state.id).length]));
}
function alignedStagesForBoundary(boundaryId) { return [...index.stagesById.values()].filter(({ stage }) => index.targets(stage.id, "com.semanticops.strategy/aligns-with").includes(boundaryId)); }
function stageEvidenceState(stageId) {
  const evidence = index.checksByStage.get(stageId) || [];
  const rank = { proven: 4, partial: 3, prototype: 2, planned: 1 };
  return evidence.reduce((best, check) => rank[check.state] > rank[best] ? check.state : best, "unassessed");
}
function alignedPracticeMeter(boundaryId) {
  const stages = alignedStagesForBoundary(boundaryId);
  if (!stages.length) return "";
  return `<span class="document-practice-meter" aria-label="Semantic document practice evidence">${stages.map((stage) => {
    const state = stageEvidenceState(stage.id);
    return `<i class="document-stage ${escapeHtml(state)}" title="${escapeHtml(`${stage.id} — ${stage.name}: ${state === "unassessed" ? "no current evidence asserted" : realityState(state)}`)}">${escapeHtml(stage.id)}</i>`;
  }).join("")}</span>`;
}
function realityMeter(boundaryId) {
  const checks = realityChecks(boundaryId);
  const counts = realityCounts(boundaryId);
  const label = roadmap.reality.states.filter((state) => counts[state.id]).map((state) => `${counts[state.id]} ${state.id}`).join(" · ");
  return `<span class="reality-meter" aria-label="Current evidence: ${escapeHtml(label)}">${checks.map((check) => `<i class="reality-block ${escapeHtml(check.state)}" title="${escapeHtml(`${realityState(check.state)}: ${check.title}`)}"></i>`).join("")}</span><span class="reality-label">${escapeHtml(label)}</span>`;
}
function evidenceList(evidence) {
  return `<ul class="evidence-list">${evidence.map((item) => {
    const url = item.type === "issue" ? issueUrl(item.ref) : item.type === "url" ? item.ref : null;
    const ref = url ? `<a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(item.ref)} ↗</a>` : escapeHtml(item.ref);
    return `<li><span>${escapeHtml(item.kind || item.type)}</span>${ref}</li>`;
  }).join("")}</ul>`;
}

function reviewLabel(check) {
  const review = evidenceReview(check);
  return `<span class="review-label ${escapeHtml(review)}">assessed ${escapeHtml(check.assessedAt)} · review ${escapeHtml(check.reviewBy)}${review === "current" ? "" : ` · ${escapeHtml(review)}`}</span>`;
}

function modesForStage(stageId) { return index.modesByStage.get(stageId) || []; }
function sourceHref(ref) { return ref.startsWith("http") ? ref : ref.startsWith("docs/") ? `../${ref.slice(5)}` : `../../${ref}`; }
function sourceTags(sources) { return `<div class="tag-list">${sources.map((source) => { const ref = typeof source === "string" ? source : source.ref; return `<a class="tag" href="${escapeHtml(sourceHref(ref))}">${escapeHtml(ref.split("/").at(-1))}</a>`; }).join("")}</div>`; }

function tag(text, nodeId) {
  return nodeId && nodeFor(nodeId) ? `<button class="tag" type="button" data-focus-node="${escapeHtml(nodeId)}">${escapeHtml(text)}</button>` : `<span class="tag">${escapeHtml(text)}</span>`;
}

function workTags(refs) {
  if (!refs?.length) return "<p class=\"muted\">No related work is mapped yet.</p>";
  return `<div class="tag-list">${refs.map((ref) => `<a class="tag" href="${issueUrl(ref)}" target="_blank" rel="noreferrer">${escapeHtml(ref)}</a>`).join("")}</div>`;
}

function detail(node) {
  if (!node) return "<p class=\"muted\">Select a card to inspect its place in the roadmap.</p>";
  const prerequisiteNodes = prerequisites(graph, node.id).map(nodeFor).filter(Boolean);
  const prerequisiteTags = prerequisiteNodes.length ? `<div class="tag-list">${prerequisiteNodes.map((item) => tag(item.title, item.id)).join("")}</div>` : "<p class=\"muted\">This is a starting point.</p>";
  if (node.type === "release") {
    const b = node.boundary;
    return `<p class="eyebrow">Release boundary</p><h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(b.promise)}</p>
      <h3>Actor</h3><p>${escapeHtml(b.actor)}</p>
      <h3>Prerequisites</h3>${prerequisiteTags}
      <h3>What becomes stable</h3><p>${escapeHtml(b.stableAfter)}</p>
      <h3>Explicit exclusions</h3>${list(b.exclusions)}
      <h3>Walkthrough</h3><p>${escapeHtml(b.walkthrough)}</p>
      <h3>Capabilities</h3><div class="tag-list">${b.includedCapabilities.map((capability) => tag(capability, `capability:${capability}`)).join("")}</div>
      <h3>Current evidence</h3><div class="reality-meter-detail">${realityMeter(b.id)}</div><div class="tag-list">${realityChecks(b.id).map((check) => tag(check.title, `reality:${check.id}`)).join("")}</div>
      ${alignedStagesForBoundary(b.id).length ? `<h3>Aligned practice stages</h3><div class="document-practice-detail">${alignedPracticeMeter(b.id)}${alignedStagesForBoundary(b.id).map(({ stage }) => tag(`${stage.id} — ${stage.name}`, stageNodeId(stage.id))).join("")}</div>` : ""}
      <h3>Gate and supporting work</h3>${workTags(b.tasks.map((task) => task.ref))}
      ${b.gaps?.length ? `<h3>Known gaps</h3>${list(b.gaps.map((gap) => `${gap.title}: ${gap.trigger}`))}` : ""}`;
  }
  if (node.type === "stage") {
    const s = node.stage;
    const cumulative = [...prerequisiteNodes, node].filter((item) => item.type === "stage");
    const available = [...new Set(cumulative.flatMap((item) => item.stage.semanticAdds))];
    return `<p class="eyebrow">${escapeHtml(node.pipeline.name)} stage</p><h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(s.promise)}</p>
      <h3>Group need</h3><p>${escapeHtml(s.groupNeed)}</p>
      <h3>Prerequisite stages</h3>${prerequisiteTags}
      <h3>New here</h3>${list(s.semanticAdds)}
      <h3>Available by this stage</h3>${list(available)}
      <h3>Blueprint additions</h3>${list(s.blueprintAdds)}
      <h3>Does not introduce</h3>${list(s.doesNotIntroduce)}
      <h3>Release alignment</h3><div class="tag-list">${(index.targets(s.id, "com.semanticops.strategy/aligns-with").length ? index.targets(s.id, "com.semanticops.strategy/aligns-with") : ["future"]).map((release) => release === "future" ? tag(release) : tag(release, `release:${release}`)).join("")}</div>
      <h3>Application modes</h3><div class="tag-list">${modesForStage(s.id).map((mode) => tag(mode.name, `mode:${mode.id}`)).join("") || "<span class=\"muted\">No direct mode.</span>"}</div>
      <h3>Related work</h3>${workTags(s.executionAnchors)}
      ${s.research?.length ? `<h3>Research foundations</h3>${list(s.research.map((research) => `${research.takeaway} (${research.source})`))}` : ""}
      <h3>Activation trigger</h3><p>${escapeHtml(s.activationTrigger)}</p>`;
  }
  if (node.type === "mode") {
    const m = node.mode;
    return `<p class="eyebrow">SRS-web mode</p><h2>${escapeHtml(m.name)}</h2>
      <h3>Capabilities it supports</h3><div class="tag-list">${m.capabilities.map((capability) => tag(capability, `capability:${capability}`)).join("")}</div>
      <h3>Practice stages it serves</h3><div class="tag-list">${m.servesStages.length ? m.servesStages.map((stage) => tag(stage, stageNodeId(stage))).join("") : "<span class=\"muted\">Cross-cutting authoring mode.</span>"}</div>`;
  }
  if (node.type === "capability") {
    return `<p class="eyebrow">SRS capability</p><h2>${escapeHtml(node.title)}</h2><p>This is a stable capability branch, used by release boundaries, application modes, and execution work.</p><h3>Direct relationships</h3>${relatedTags(node.id, 1)}`;
  }
  if (node.type === "reality") {
    const check = node.check;
    return `<p class="eyebrow">Current-reality evidence</p><h2>${escapeHtml(check.title)}</h2><p class="state-chip ${escapeHtml(check.state)}">${escapeHtml(realityState(check.state))}</p>
      <h3>What exists</h3><p>${escapeHtml(check.exists)}</p>
      <h3>What prevents boundary completion</h3><p>${escapeHtml(check.missing)}</p>
      <h3>Evidence</h3>${evidenceList(check.evidence)}
      <h3>Assessment</h3><p>Assessed ${escapeHtml(check.assessedAt)} · review by ${escapeHtml(check.reviewBy)}${evidenceReview(check) === "current" ? "" : ` · <strong>review ${escapeHtml(evidenceReview(check))}</strong>`}</p>
      <h3>Boundary</h3>${index.targets(check.id, "com.semanticops.strategy/assesses").map((boundaryId) => tag(nodeFor(`release:${boundaryId}`)?.title || boundaryId, `release:${boundaryId}`)).join("")}
      ${index.targets(check.id, "evidences").length ? `<h3>Practice stages</h3><div class="tag-list">${index.targets(check.id, "evidences").map((stageId) => tag(stageId, stageNodeId(stageId))).join("")}</div>` : ""}`;
  }
  if (node.type === "contract") {
    const contract = node.contract;
    const assessment = (index.assessmentsByContract.get(contract.id) || [])[0];
    const requiredBy = contractRequirements(index, contract.id);
    return `<p class="eyebrow">${escapeHtml(contract.kind === "normative-subject" ? "Normative SRS subject" : "Strategy contract")}</p><h2>${escapeHtml(contract.name)}</h2><p>${escapeHtml(contract.promise)}</p>
      <h3>Required by</h3><div class="tag-list">${requiredBy.map((item) => tag(item.id, item.kind === "boundary" ? `release:${item.id}` : stageNodeId(item.id))).join("") || "<span class=\"muted\">Future capability.</span>"}</div>
      ${assessment ? `<h3>Readiness</h3><p>Specification: ${escapeHtml(assessment.specification)} · implementation: ${escapeHtml(assessment.implementation)} · conformance: ${escapeHtml(assessment.conformance)}</p><h3>Open conditions</h3>${list(assessment.openConditions)}<p>${reviewLabel(assessment)}</p>` : ""}
      <h3>Sources</h3>${sourceTags(contract.sources)}<h3>Not included</h3>${list(contract.notIncluded)}`;
  }
  return `<p class="eyebrow">Related work</p><h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(node.ref)}</p><p><a href="${node.url}" target="_blank" rel="noreferrer">Open on GitHub ↗</a></p><h3>Direct relationships</h3>${relatedTags(node.id, 1)}`;
}

function relatedTags(id, depth) {
  const { direct, secondary } = relatedNodes(graph, id, depth + 1);
  const ids = [...direct, ...secondary];
  return ids.length ? `<div class="tag-list">${ids.map((related) => tag(nodeFor(related).title, related)).join("")}</div>` : "<p class=\"muted\">No mapped relationships.</p>";
}

function card(node, summary, extra = "", footer = "") {
  const parts = node.id.split(":");
  const key = node.type === "release" ? parts[1] : node.type === "stage" ? parts.at(-1) : node.type === "contract" ? node.contract.id : node.type === "work" ? node.ref : node.type === "reality" ? node.check.state : node.type;
  const releaseTrack = node.type === "release" ? node.boundary.track.toLowerCase() : "";
  return `<button type="button" class="road-card ${node.type} ${releaseTrack} ${extra}" data-node-id="${escapeHtml(node.id)}" aria-pressed="false">
    <span class="card-id">${escapeHtml(key)}</span><span class="card-title">${escapeHtml(node.title.replace(/^.[0-9]+ — /, ""))}</span><span class="card-summary">${escapeHtml(summary || "")}</span>${footer}
  </button>`;
}

function graphShell(content, edges, className) {
  return `<div class="graph-shell ${className}" data-graph-shell><svg class="graph-edges" aria-hidden="true"></svg><div class="graph-content">${content}</div></div>`;
}

function boundariesView() {
  const tracks = roadmap.tracks.map((track) => {
    const cards = roadmap.boundaries.filter((boundary) => boundary.track === track.id).map((boundary) => {
      const node = nodeFor(`release:${boundary.id}`);
      const alignedPractice = alignedPracticeMeter(boundary.id);
      return card(node, boundary.promise, "", `<span class="card-reality">${realityMeter(boundary.id)}${alignedPractice ? `<span class="card-document-practice">${alignedPractice}</span>` : ""}</span>`);
    }).join("");
    return `<section class="track ${track.id === "F" ? "sovereignty" : "practice"}"><h2 class="track-title"><span>${escapeHtml(track.name)}</span>${escapeHtml(track.purpose)}</h2><div class="track-row">${cards}</div></section>`;
  }).join("");
  const edges = graph.edges.filter((edge) => edge.kind === "requires" && edge.from.startsWith("release:") && edge.to.startsWith("release:"));
  return { note: "Each card is a release promise. Select one to see its hard edge: what it requires, what it stabilizes, and what it explicitly excludes.", canvas: graphShell(tracks, edges, "boundary-graph"), edges };
}

function pipelineView() {
  const cards = roadmap.capabilityPipelines.map((pipeline) => {
    const slotsByRank = new Map();
    const stageCards = pipelineLayout(pipeline, index).map(({ stage, rank }) => {
      const node = nodeFor(`stage:${pipeline.id}:${stage.id}`);
      const slot = (slotsByRank.get(rank) || 0) + 1;
      slotsByRank.set(rank, slot);
      return `<div style="grid-column: ${rank + 1}; grid-row: ${slot};">${card(node, stage.promise)}</div>`;
    }).join("");
    const columns = Math.max(...pipelineLayout(pipeline, index).map((item) => item.rank)) + 1;
    return `<section class="pipeline-section"><h2>${escapeHtml(pipeline.name)}</h2><p>${escapeHtml(pipeline.purpose)}</p><div class="pipeline-grid" style="grid-template-columns: repeat(${columns}, minmax(150px, 1fr));">${stageCards}</div></section>`;
  }).join("");
  const edges = graph.edges.filter((edge) => edge.kind === "requires" && edge.from.startsWith("stage:") && edge.to.startsWith("stage:"));
  return { note: "These paths show the next capability a group can adopt. Select a stage to see what it adds, the evidence behind it, and what remains deliberately outside its scope.", canvas: graphShell(`<div class="pipeline-set">${cards}</div>`, edges, "pipeline-graph"), edges };
}

function architectureView() {
  const statuses = new Map(roadmap.capabilityArchitecture.stability.map((item) => [item.id, item]));
  const renderNode = ({ node, children }, depth = 0) => {
    const status = statuses.get(node.stability);
    const assessment = (index.assessmentsByContract.get(node.id) || [])[0];
    const requirements = contractRequirements(index, node.id);
    const links = [
      ...node.capabilities.map((item) => tag(item, `capability:${item}`)),
      ...requirements.map((item) => tag(item.id, item.kind === "boundary" ? `release:${item.id}` : stageNodeId(item.id)))
    ].join("");
    return `<details class="architecture-node depth-${depth}" ${depth === 0 ? "open" : ""}>
      <summary><span class="architecture-name">${escapeHtml(node.name)}</span><span class="architecture-status ${escapeHtml(node.stability)}">${escapeHtml(status.label)}</span></summary>
      <div class="architecture-body"><p>${escapeHtml(node.promise)}</p>
        <div class="architecture-meta"><div><h3>Enables</h3><div class="tag-list">${links || "<span class=\"muted\">Future capability.</span>"}</div></div><div><h3>Not included</h3>${list(node.notIncluded)}</div></div>
        ${assessment ? `<h3>Readiness</h3><p class="contract-readiness">specification: ${escapeHtml(assessment.specification)} · implementation: ${escapeHtml(assessment.implementation)} · conformance: ${escapeHtml(assessment.conformance)}</p><p>${reviewLabel(assessment)}</p>` : ""}
        <h3>Specification sources</h3>${sourceTags(node.sources)}
        ${children.length ? `<div class="architecture-children">${children.map((child) => renderNode(child, depth + 1)).join("")}</div>` : ""}
      </div>
    </details>`;
  };
  const legend = roadmap.capabilityArchitecture.stability.map((item) => `<span class="architecture-status ${escapeHtml(item.id)}" title="${escapeHtml(item.meaning)}">${escapeHtml(item.label)}</span>`).join("");
  return { note: "This tree names the SRS contracts behind the release boundaries. Stability describes how soon a contract must be settled—not whether the related application surface is complete.", canvas: `<section class="architecture-intro"><p>${escapeHtml(roadmap.capabilityArchitecture.purpose)}</p><div class="architecture-legend">${legend}</div></section><div class="architecture-tree">${capabilityArchitecture(index).map((item) => renderNode(item)).join("")}</div>`, edges: [], fullWidth: true };
}

function relationshipsView() {
  const groups = nodeGroups(graph, focusId());
  const labels = { release: "Release boundaries", stage: "Practice stages", contract: "SRS contracts", capability: "SRS capabilities", mode: "SRS-web modes", reality: "Current evidence", assessment: "Contract assessments", work: "Related work" };
  const body = Object.entries(groups).map(([type, items]) => {
    if (!items.length) return "";
    return `<section class="relationship-group"><h2>${labels[type]}</h2><div class="relationship-row">${items.map(({ node }) => card(node, node.type === "release" ? node.boundary.promise : node.type === "stage" ? node.stage.promise : node.title)).join("")}</div></section>`;
  }).join("");
  return { note: "Select any mapped element. Direct relationships stay prominent; second-hop context remains visible, and unrelated elements recede.", canvas: `<div class="relationship-groups">${body}</div>`, edges: [] };
}

function realityView() {
  const body = roadmap.boundaries.map((boundary) => {
    const release = nodeFor(`release:${boundary.id}`);
    const checks = realityChecks(boundary.id);
    return `<section class="reality-boundary"><header><p class="eyebrow">${escapeHtml(boundary.track === "F" ? "Sovereignty" : "Decision practice")}</p><h2>${escapeHtml(release.title)}</h2><p>${realityMeter(boundary.id)}</p></header><div class="reality-check-grid">${checks.map((check) => {
      const node = nodeFor(`reality:${check.id}`);
      return card(node, check.exists, `state-${check.state}`, reviewLabel(check));
    }).join("")}</div></section>`;
  }).join("");
  return { note: `Evidence snapshot as of ${roadmap.reality.asOf}. Each card assesses one part of a boundary; it is not an issue-completion percentage.`, canvas: `<div class="reality-intro"><p>${escapeHtml(roadmap.reality.method)}</p></div><div class="reality-boundaries">${body}</div>`, edges: [] };
}

function viewModel() {
  if (state.view === "architecture") return architectureView();
  if (state.view === "pipeline") return pipelineView();
  if (state.view === "relationships") return relationshipsView();
  if (state.view === "reality") return realityView();
  return boundariesView();
}

function updateHash() {
  const params = new URLSearchParams({ view: state.view, focus: state.pinned || "" });
  history.replaceState(null, "", `#${params.toString()}`);
}

function applyFocus() {
  const current = focusId();
  const { direct, secondary } = relatedNodes(graph, current);
  document.querySelectorAll("[data-node-id]").forEach((element) => {
    const id = element.dataset.nodeId;
    element.classList.toggle("is-focus", id === current);
    element.classList.toggle("is-direct", direct.has(id));
    element.classList.toggle("is-secondary", secondary.has(id));
    element.classList.toggle("is-dim", current && id !== current && !direct.has(id) && !secondary.has(id));
    element.setAttribute("aria-pressed", String(id === state.pinned));
  });
  const detailPanel = document.querySelector("[data-detail]");
  if (detailPanel) detailPanel.innerHTML = detail(nodeFor(current));
  document.querySelectorAll(".graph-edges path").forEach((path) => {
    const edge = graph.edges.find((item) => item.id === path.dataset.edgeId);
    path.classList.toggle("is-related", edge && (edge.from === current || edge.to === current));
  });
}

function wireEdges(shell, edges) {
  const svg = shell.querySelector(".graph-edges");
  if (!svg || !edges.length) return;
  const draw = () => {
    const shellBox = shell.getBoundingClientRect();
    const cards = new Map([...shell.querySelectorAll("[data-node-id]")].map((element) => [element.dataset.nodeId, element]));
    svg.setAttribute("width", String(shell.scrollWidth));
    svg.setAttribute("height", String(shell.scrollHeight));
    svg.setAttribute("viewBox", `0 0 ${shell.scrollWidth} ${shell.scrollHeight}`);
    svg.innerHTML = `<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#928b80" /></marker></defs>`;
    for (const edge of edges) {
      const from = cards.get(edge.from)?.getBoundingClientRect();
      const to = cards.get(edge.to)?.getBoundingClientRect();
      if (!from || !to) continue;
      const x1 = from.left - shellBox.left + from.width / 2;
      const y1 = from.top - shellBox.top + from.height / 2;
      const x2 = to.left - shellBox.left + to.width / 2;
      const y2 = to.top - shellBox.top + to.height / 2;
      const bend = Math.max(34, Math.abs(x2 - x1) * 0.34);
      svg.insertAdjacentHTML("beforeend", `<path data-edge-id="${escapeHtml(edge.id)}" marker-end="url(#arrow)" d="M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}" />`);
    }
    applyFocus();
  };
  requestAnimationFrame(draw);
  graphObserver = new ResizeObserver(draw);
  graphObserver.observe(shell);
}

function pin(id) {
  state.pinned = id;
  state.preview = null;
  if (state.view === "architecture") state.view = "relationships";
  updateHash();
  if (state.view === "relationships") render(); else applyFocus();
}

function wireInteractions(edges) {
  const shell = document.querySelector("[data-graph-shell]");
  if (shell) wireEdges(shell, edges);
}

function installInteractionHandlers() {
  const card = (target) => target.closest?.("[data-node-id]");
  app.addEventListener("click", (event) => {
    const tab = event.target.closest?.("[data-view]");
    if (tab) { state.view = tab.dataset.view; state.preview = null; updateHash(); render(); return; }
    const focus = event.target.closest?.("[data-focus-node]");
    if (focus) { pin(focus.dataset.focusNode); return; }
    const element = card(event.target);
    if (element) pin(element.dataset.nodeId);
  });
  app.addEventListener("pointerover", (event) => { const element = card(event.target); if (element && !element.contains(event.relatedTarget)) { state.preview = element.dataset.nodeId; applyFocus(); } });
  app.addEventListener("pointerout", (event) => { const element = card(event.target); if (element && !element.contains(event.relatedTarget)) { state.preview = null; applyFocus(); } });
  app.addEventListener("focusin", (event) => { const element = card(event.target); if (element) { state.preview = element.dataset.nodeId; applyFocus(); } });
  app.addEventListener("focusout", (event) => { if (card(event.target)) { state.preview = null; applyFocus(); } });
  app.addEventListener("keydown", (event) => { if (event.key === "Escape" && card(event.target)) { state.preview = null; applyFocus(); event.target.blur(); } });
}

function render() {
  graphObserver?.disconnect();
  const model = viewModel();
  app.innerHTML = `<header><p class="eyebrow">SRS documentation · strategic map</p><h1>${escapeHtml(roadmap.title)}</h1><p class="lede">${escapeHtml(roadmap.purpose)}</p></header>
    <nav class="tabs" aria-label="Roadmap visualizer views">
      ${[["boundaries", "Release boundaries"], ["architecture", "SRS capability architecture"], ["reality", "Current evidence"], ["pipeline", "Capability paths"], ["relationships", "Relationship explorer"]].map(([id, label]) => `<button type="button" class="tab" data-view="${id}" aria-selected="${state.view === id}">${label}</button>`).join("")}
    </nav>
    <p class="view-note">${escapeHtml(model.note)}</p>
    <section class="view-layout${model.fullWidth ? " full-width" : ""}"><div class="canvas">${model.canvas}</div>${model.fullWidth ? "" : "<aside class=\"detail\" data-detail></aside>"}</section>`;
  wireInteractions(model.edges);
  applyFocus();
}

function parseHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (["boundaries", "architecture", "reality", "pipeline", "relationships"].includes(params.get("view"))) state.view = params.get("view");
  if (params.get("focus")) state.pinned = params.get("focus");
}

async function start() {
  try {
    const response = await fetch("./roadmap.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    roadmap = await response.json();
    if (!roadmap.boundaries || !roadmap.capabilityPipelines || !roadmap.applicationStrategy?.modes) throw new Error("roadmap.json is missing visualizer sections");
    index = buildRoadmapIndex(roadmap);
    graph = buildRoadmapGraph(roadmap, index);
    parseHash();
    if (state.pinned && !graph.nodes.has(state.pinned)) state.pinned = null;
    render();
  } catch (error) {
    app.innerHTML = `<section class="error"><h1>Roadmap data could not load</h1><p>The visualizer expected <code>./roadmap.json</code> beside this page, but received: ${escapeHtml(error.message)}</p><p>Run a local HTTP server from the repository root, for example <code>python3 -m http.server 8000 -d docs</code>, then open <code>http://localhost:8000/strategy/</code>.</p></section>`;
  }
}

installInteractionHandlers();
window.addEventListener("hashchange", () => { parseHash(); render(); });
start();
