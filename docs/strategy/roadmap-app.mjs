import { buildRoadmapGraph, issueUrl, nodeGroups, prerequisites, relatedNodes } from "./roadmap-view-model.mjs";

const app = document.querySelector("#roadmap-app");
let roadmap;
let graph;
const state = { view: "boundaries", pinned: null, preview: null };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character]);
}

function list(items) {
  return items?.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p class=\"muted\">None.</p>";
}

function nodeFor(id) { return graph.nodes.get(id); }
function focusId() { return state.preview || state.pinned || defaultFocus(); }
function defaultFocus() { return state.view === "pipeline" ? "stage:governance-practice:G1" : state.view === "relationships" ? "stage:governance-practice:G3" : "release:F1"; }
function nodeIdForRef(ref) { return `work:${ref}`; }

function modeNamesForStage(stageId) {
  return roadmap.applicationStrategy.modes.filter((mode) => mode.servesStages.includes(stageId)).map((mode) => mode.name);
}

function tag(text, nodeId) {
  return nodeId && nodeFor(nodeId) ? `<button class="tag" type="button" data-focus-node="${escapeHtml(nodeId)}">${escapeHtml(text)}</button>` : `<span class="tag">${escapeHtml(text)}</span>`;
}

function workTags(refs) {
  if (!refs?.length) return "<p class=\"muted\">No current execution anchor.</p>";
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
      <h3>Gate and supporting work</h3>${workTags(b.tasks.map((task) => task.ref))}
      ${b.gaps?.length ? `<h3>Known gaps</h3>${list(b.gaps.map((gap) => `${gap.title}: ${gap.trigger}`))}` : ""}`;
  }
  if (node.type === "stage") {
    const s = node.stage;
    const cumulative = [...prerequisiteNodes, node].filter((item) => item.type === "stage");
    const available = [...new Set(cumulative.flatMap((item) => item.stage.semanticAdds))];
    return `<p class="eyebrow">Governance-practice stage</p><h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(s.promise)}</p>
      <h3>Group need</h3><p>${escapeHtml(s.groupNeed)}</p>
      <h3>Prerequisite stages</h3>${prerequisiteTags}
      <h3>New here</h3>${list(s.semanticAdds)}
      <h3>Available by this stage</h3>${list(available)}
      <h3>Blueprint additions</h3>${list(s.blueprintAdds)}
      <h3>Does not introduce</h3>${list(s.doesNotIntroduce)}
      <h3>Release alignment</h3><div class="tag-list">${(s.releaseAlignment.length ? s.releaseAlignment : ["future"]).map((release) => release === "future" ? tag(release) : tag(release, `release:${release}`)).join("")}</div>
      <h3>Application modes</h3><div class="tag-list">${modeNamesForStage(s.id).map((name) => { const mode = roadmap.applicationStrategy.modes.find((item) => item.name === name); return tag(name, `mode:${mode.id}`); }).join("") || "<span class=\"muted\">No direct mode.</span>"}</div>
      <h3>Execution anchors</h3>${workTags(s.executionAnchors)}
      <h3>Activation trigger</h3><p>${escapeHtml(s.activationTrigger)}</p>`;
  }
  if (node.type === "mode") {
    const m = node.mode;
    return `<p class="eyebrow">SRS-web mode</p><h2>${escapeHtml(m.name)}</h2>
      <h3>Capabilities it supports</h3><div class="tag-list">${m.capabilities.map((capability) => tag(capability, `capability:${capability}`)).join("")}</div>
      <h3>Practice stages it serves</h3><div class="tag-list">${m.servesStages.length ? m.servesStages.map((stage) => tag(stage, `stage:governance-practice:${stage}`)).join("") : "<span class=\"muted\">Cross-cutting authoring mode.</span>"}</div>`;
  }
  if (node.type === "capability") {
    return `<p class="eyebrow">SRS capability</p><h2>${escapeHtml(node.title)}</h2><p>This is a stable capability branch, used by release boundaries, application modes, and execution work.</p><h3>Direct relationships</h3>${relatedTags(node.id, 1)}`;
  }
  return `<p class="eyebrow">Execution anchor</p><h2>${escapeHtml(node.title)}</h2><p>${escapeHtml(node.ref)}</p><p><a href="${node.url}" target="_blank" rel="noreferrer">Open on GitHub ↗</a></p><h3>Direct relationships</h3>${relatedTags(node.id, 1)}`;
}

function relatedTags(id, depth) {
  const { direct, secondary } = relatedNodes(graph, id, depth + 1);
  const ids = [...direct, ...secondary];
  return ids.length ? `<div class="tag-list">${ids.map((related) => tag(nodeFor(related).title, related)).join("")}</div>` : "<p class=\"muted\">No mapped relationships.</p>";
}

function card(node, summary, extra = "") {
  const parts = node.id.split(":");
  const key = node.type === "release" ? parts[1] : node.type === "stage" ? parts.at(-1) : node.type === "work" ? node.ref : node.type;
  const releaseTrack = node.type === "release" ? node.boundary.track.toLowerCase() : "";
  return `<button type="button" class="road-card ${node.type} ${releaseTrack} ${extra}" data-node-id="${escapeHtml(node.id)}" aria-pressed="false">
    <span class="card-id">${escapeHtml(key)}</span><span class="card-title">${escapeHtml(node.title.replace(/^.[0-9]+ — /, ""))}</span><span class="card-summary">${escapeHtml(summary || "")}</span>
  </button>`;
}

function graphShell(content, edges, className) {
  return `<div class="graph-shell ${className}" data-graph-shell><svg class="graph-edges" aria-hidden="true"></svg><div class="graph-content">${content}</div></div>`;
}

function boundariesView() {
  const tracks = roadmap.tracks.map((track) => {
    const cards = roadmap.boundaries.filter((boundary) => boundary.track === track.id).map((boundary) => {
      const node = nodeFor(`release:${boundary.id}`);
      return card(node, boundary.promise);
    }).join("");
    return `<section class="track ${track.id === "F" ? "sovereignty" : "practice"}"><h2 class="track-title"><span>${escapeHtml(track.name)}</span>${escapeHtml(track.purpose)}</h2><div class="track-row">${cards}</div></section>`;
  }).join("");
  const edges = graph.edges.filter((edge) => edge.kind === "requires" && edge.from.startsWith("release:") && edge.to.startsWith("release:"));
  return { note: "Each card is a release promise. Select one to see its hard edge: what it requires, what it stabilizes, and what it explicitly excludes.", canvas: graphShell(tracks, edges, "boundary-graph"), edges };
}

function pipelineView() {
  const pipeline = roadmap.capabilityPipelines[0];
  const positions = { G1: "1 / 1", G2: "2 / 1", G3: "3 / 1", G4: "4 / 1", G5: "5 / 1", G6: "4 / 2", G7: "5 / 2" };
  const cards = pipeline.stages.map((stage) => {
    const node = nodeFor(`stage:${pipeline.id}:${stage.id}`);
    return `<div style="grid-column: ${positions[stage.id].split(" / ")[0]}; grid-row: ${positions[stage.id].split(" / ")[1]};">${card(node, stage.promise)}</div>`;
  }).join("");
  const edges = graph.edges.filter((edge) => edge.kind === "requires" && edge.from.startsWith("stage:") && edge.to.startsWith("stage:"));
  return { note: "This is the group adoption path, not an issue hierarchy. Selecting a stage shows what becomes possible cumulatively and what remains deliberately outside it.", canvas: graphShell(`<div class="pipeline-grid">${cards}</div>`, edges, "pipeline-graph"), edges };
}

function relationshipsView() {
  const groups = nodeGroups(graph, focusId());
  const labels = { release: "Release boundaries", stage: "Practice stages", capability: "SRS capabilities", mode: "SRS-web modes", work: "Related execution anchors" };
  const body = Object.entries(groups).map(([type, items]) => {
    if (!items.length) return "";
    return `<section class="relationship-group"><h2>${labels[type]}</h2><div class="relationship-row">${items.map(({ node }) => card(node, node.type === "release" ? node.boundary.promise : node.type === "stage" ? node.stage.promise : node.title)).join("")}</div></section>`;
  }).join("");
  return { note: "Select any mapped element. Direct relationships stay prominent; second-hop context remains visible, and unrelated elements recede.", canvas: `<div class="relationship-groups">${body}</div>`, edges: [] };
}

function viewModel() {
  if (state.view === "pipeline") return pipelineView();
  if (state.view === "relationships") return relationshipsView();
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
  document.querySelectorAll("[data-focus-node]").forEach((element) => element.addEventListener("click", () => pin(element.dataset.focusNode)));
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
  new ResizeObserver(draw).observe(shell);
}

function pin(id) {
  state.pinned = id;
  state.preview = null;
  updateHash();
  if (state.view === "relationships") render(); else applyFocus();
}

function wireInteractions(edges) {
  document.querySelectorAll("[data-node-id]").forEach((element) => {
    element.addEventListener("mouseenter", () => { state.preview = element.dataset.nodeId; applyFocus(); });
    element.addEventListener("mouseleave", () => { state.preview = null; applyFocus(); });
    element.addEventListener("focus", () => { state.preview = element.dataset.nodeId; applyFocus(); });
    element.addEventListener("blur", () => { state.preview = null; applyFocus(); });
    element.addEventListener("click", () => pin(element.dataset.nodeId));
    element.addEventListener("keydown", (event) => { if (event.key === "Escape") { state.preview = null; applyFocus(); event.currentTarget.blur(); } });
  });
  const shell = document.querySelector("[data-graph-shell]");
  if (shell) wireEdges(shell, edges);
}

function render() {
  const model = viewModel();
  app.innerHTML = `<header><p class="eyebrow">Owner strategic map · bootstrap JSON</p><h1>${escapeHtml(roadmap.title)}</h1><p class="lede">${escapeHtml(roadmap.purpose)}</p></header>
    <nav class="tabs" aria-label="Roadmap visualizer views">
      ${[["boundaries", "Release boundaries"], ["pipeline", "Capability pipeline"], ["relationships", "Relationship explorer"]].map(([id, label]) => `<button type="button" class="tab" data-view="${id}" aria-selected="${state.view === id}">${label}</button>`).join("")}
    </nav>
    <p class="view-note">${escapeHtml(model.note)}</p>
    <section class="view-layout"><div class="canvas">${model.canvas}</div><aside class="detail" data-detail></aside></section>`;
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; state.preview = null; updateHash(); render(); }));
  wireInteractions(model.edges);
  applyFocus();
}

function parseHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (["boundaries", "pipeline", "relationships"].includes(params.get("view"))) state.view = params.get("view");
  if (params.get("focus")) state.pinned = params.get("focus");
}

async function start() {
  try {
    const response = await fetch("./roadmap.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    roadmap = await response.json();
    if (!roadmap.boundaries || !roadmap.capabilityPipelines || !roadmap.applicationStrategy?.modes) throw new Error("roadmap.json is missing visualizer sections");
    graph = buildRoadmapGraph(roadmap);
    parseHash();
    if (state.pinned && !graph.nodes.has(state.pinned)) state.pinned = null;
    render();
  } catch (error) {
    app.innerHTML = `<section class="error"><h1>Roadmap data could not load</h1><p>The visualizer expected <code>./roadmap.json</code> beside this page, but received: ${escapeHtml(error.message)}</p><p>Run a local HTTP server from the repository root, for example <code>python3 -m http.server 8000 -d docs</code>, then open <code>http://localhost:8000/strategy/</code>.</p></section>`;
  }
}

window.addEventListener("hashchange", () => { parseHash(); render(); });
start();
