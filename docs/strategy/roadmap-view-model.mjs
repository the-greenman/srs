const OWNER = "the-greenman";

export function issueUrl(ref, owner = OWNER) {
  const match = /^([^#\s]+)#(\d+)$/.exec(ref || "");
  if (!match) return null;
  return `https://github.com/${owner}/${match[1]}/issues/${match[2]}`;
}

function addNode(nodes, node) {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function addEdge(edges, from, to, kind) {
  edges.push({ id: `${kind}:${from}->${to}`, from, to, kind });
}

export function buildRoadmapGraph(data) {
  const nodes = new Map();
  const edges = [];
  const workTitles = new Map((data.epics || []).map((epic) => [epic.ref, epic.name]));
  const workNode = (ref) => {
    const id = `work:${ref}`;
    addNode(nodes, { id, type: "work", ref, title: workTitles.get(ref) || ref, url: issueUrl(ref) });
    return id;
  };

  for (const capability of data.capabilities || []) addNode(nodes, { id: `capability:${capability}`, type: "capability", title: capability });

  for (const boundary of data.boundaries || []) {
    const id = `release:${boundary.id}`;
    addNode(nodes, { id, type: "release", title: `${boundary.id} — ${boundary.name}`, boundary });
    for (const required of boundary.requires || []) addEdge(edges, `release:${required}`, id, "requires");
    for (const capability of boundary.includedCapabilities || []) addEdge(edges, id, `capability:${capability}`, "includes");
    for (const task of boundary.tasks || []) addEdge(edges, id, workNode(task.ref), task.role);
  }

  for (const pipeline of data.capabilityPipelines || []) {
    for (const stage of pipeline.stages || []) {
      const id = `stage:${pipeline.id}:${stage.id}`;
      addNode(nodes, { id, type: "stage", title: `${stage.id} — ${stage.name}`, stage, pipeline });
      for (const required of stage.requires || []) addEdge(edges, `stage:${pipeline.id}:${required}`, id, "requires");
      for (const boundaryId of stage.releaseAlignment || []) addEdge(edges, id, `release:${boundaryId}`, "aligns");
      for (const ref of stage.executionAnchors || []) addEdge(edges, id, workNode(ref), "anchor");
    }
  }

  for (const mode of data.applicationStrategy?.modes || []) {
    const id = `mode:${mode.id}`;
    addNode(nodes, { id, type: "mode", title: mode.name, mode });
    for (const capability of mode.capabilities || []) addEdge(edges, id, `capability:${capability}`, "supports");
    for (const stageId of mode.servesStages || []) addEdge(edges, id, `stage:governance-practice:${stageId}`, "serves");
  }

  for (const epic of data.epics || []) {
    const id = workNode(epic.ref);
    for (const capability of epic.capabilities || []) addEdge(edges, id, `capability:${capability}`, "owns");
  }

  const adjacency = new Map([...nodes.keys()].map((id) => [id, new Set()]));
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, new Set());
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, new Set());
    adjacency.get(edge.from).add(edge.to);
    adjacency.get(edge.to).add(edge.from);
  }
  return { nodes, edges, adjacency };
}

export function relatedNodes(graph, focusId, maxDepth = 2) {
  const direct = new Set();
  const secondary = new Set();
  if (!graph.nodes.has(focusId)) return { direct, secondary };
  const visited = new Set([focusId]);
  let frontier = new Set([focusId]);
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next = new Set();
    for (const id of frontier) for (const adjacent of graph.adjacency.get(id) || []) {
      if (!visited.has(adjacent)) next.add(adjacent);
    }
    for (const id of next) (depth === 1 ? direct : secondary).add(id);
    for (const id of next) visited.add(id);
    frontier = next;
  }
  return { direct, secondary };
}

export function prerequisites(graph, nodeId) {
  const result = new Set();
  const visit = (id) => {
    for (const edge of graph.edges) if (edge.to === id && edge.kind === "requires" && !result.has(edge.from)) {
      result.add(edge.from);
      visit(edge.from);
    }
  };
  visit(nodeId);
  return [...result];
}

export function nodeGroups(graph, focusId) {
  const { direct, secondary } = relatedNodes(graph, focusId);
  const grouped = { release: [], stage: [], capability: [], mode: [], work: [] };
  for (const node of graph.nodes.values()) {
    if (node.type === "work" && node.id !== focusId && !direct.has(node.id) && !secondary.has(node.id)) continue;
    grouped[node.type]?.push({ node, relation: node.id === focusId ? "focus" : direct.has(node.id) ? "direct" : secondary.has(node.id) ? "secondary" : "other" });
  }
  for (const group of Object.values(grouped)) group.sort((left, right) => left.node.title.localeCompare(right.node.title));
  return grouped;
}
