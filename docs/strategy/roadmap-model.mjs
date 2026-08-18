// Shared, browser-safe roadmap semantics. roadmap.json is an ergonomic
// projection of a future SRS graph; renderers consume this normalized index.

export const TASK_ROLES = new Set(["gate", "evidence", "supporting", "later"]);
export const REALITY_STATES = new Set(["proven", "partial", "planned", "prototype"]);
export const EVIDENCE_TYPES = new Set(["repo-path", "issue", "command", "url", "srs-record"]);
export const ARCHITECTURE_STABILITY = new Set(["lock-before-f1", "settle-before-f2", "settle-before-f3", "extension", "deferred"]);
export const LINK_TYPES = new Set(["contains", "depends-on", "com.semanticops.strategy/requires-contract", "com.semanticops.strategy/assesses", "com.semanticops.strategy/aligns-with", "evidences"]);
export const SPECIFICATION_MATURITY = new Set(["exploratory", "draft", "provisional", "stable"]);
export const IMPLEMENTATION_MATURITY = new Set(["not-implemented", "partial", "reference-implemented"]);
export const CONFORMANCE_MATURITY = new Set(["unproven", "fixture-proven", "walkthrough-proven"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function issueRef(ref) { const match = /^([^#\s]+)#(\d+)$/.exec(ref || ""); if (!match) throw new Error(`invalid issue reference: ${ref}`); return { ref, repo: match[1], number: Number(match[2]) }; }
export function issueUrl(ref, owner = "the-greenman") { try { const { repo, number } = issueRef(ref); return `https://github.com/${owner}/${repo}/issues/${number}`; } catch { return null; } }

function required(errors, scope, object, fields, optionalArrays = []) { for (const field of fields) { const value = object?.[field]; if (value == null || value === "" || (Array.isArray(value) && !value.length && !optionalArrays.includes(field))) errors.push(`${scope}: missing ${field}`); } }
function validateDag(errors, label, values, children) { const visiting = new Set(), visited = new Set(); const visit = (value) => { if (visiting.has(value)) { errors.push(`${label} cycle at ${value}`); return; } if (visited.has(value)) return; visiting.add(value); for (const child of children(value)) visit(child); visiting.delete(value); visited.add(value); }; for (const value of values) visit(value); }

function entityMaps(data, errors) {
  const entitiesById = new Map(), entityKinds = new Map();
  const add = (entity, kind, scope) => { if (!entity.id || entitiesById.has(entity.id)) { errors.push(`duplicate strategic entity id: ${entity.id || "(blank)"}`); return; } if (!UUID.test(entity.instanceId || "")) errors.push(`${scope}: invalid or missing instanceId`); entitiesById.set(entity.id, entity); entityKinds.set(entity.id, kind); };
  for (const boundary of data.boundaries || []) add(boundary, "boundary", boundary.id || "boundary");
  for (const pipeline of data.capabilityPipelines || []) for (const stage of pipeline.stages || []) add(stage, "stage", stage.id || "stage");
  for (const contract of data.standardContracts || []) add(contract, "contract", contract.id || "contract");
  for (const assessment of data.assessments || []) add(assessment, "assessment", assessment.id || "assessment");
  return { entitiesById, entityKinds };
}

function linksFor(data, errors, entitiesById, entityKinds) {
  const links = data.links || [], byFrom = new Map(), byTo = new Map(), linkIds = new Set();
  for (const link of links) {
    required(errors, "link", link, ["type", "from", "to"]);
    if (!LINK_TYPES.has(link.type)) errors.push(`link ${link.from || "?"}->${link.to || "?"}: invalid type ${link.type}`);
    const linkId = `${link.type}:${link.from}:${link.to}`;
    if (linkIds.has(linkId)) errors.push(`duplicate link ${linkId}`); linkIds.add(linkId);
    if (!entitiesById.has(link.from)) errors.push(`link: unknown source ${link.from}`);
    if (!entitiesById.has(link.to)) errors.push(`link: unknown target ${link.to}`);
    if (!byFrom.has(link.from)) byFrom.set(link.from, []); if (!byTo.has(link.to)) byTo.set(link.to, []);
    byFrom.get(link.from).push(link); byTo.get(link.to).push(link);
    const from = entityKinds.get(link.from), to = entityKinds.get(link.to);
    const valid = { "contains": from === "contract" && to === "contract", "depends-on": from === to && ["boundary", "stage", "contract"].includes(from), "com.semanticops.strategy/requires-contract": ["boundary", "stage"].includes(from) && to === "contract", "com.semanticops.strategy/assesses": from === "assessment" && ["boundary", "contract"].includes(to), "com.semanticops.strategy/aligns-with": from === "stage" && to === "boundary", "evidences": from === "assessment" && to === "stage" }[link.type];
    if (valid === false) errors.push(`link ${link.from}->${link.to}: ${link.type} has incompatible endpoints`);
  }
  return { links, byFrom, byTo };
}

export function validateRoadmap(data) {
  const errors = [], warnings = [], capabilities = new Set(data.capabilities || []), tracks = new Set((data.tracks || []).map((track) => track.id));
  if (!data.version) errors.push("missing version"); if (!data.bootstrapStatus) errors.push("missing bootstrapStatus");
  required(errors, "applicationStrategy", data.applicationStrategy, ["name", "role", "architecture", "boundaries", "modes", "predecessor"]);
  if (data.mission?.status !== "ratified") errors.push("mission must be ratified"); required(errors, "mission", data.mission, ["purpose", "muDemocracy", "srs", "humanAiConstitution", "roadmapTests"]); if (!tracks.size) errors.push("missing tracks");
  const { entitiesById, entityKinds } = entityMaps(data, errors), indexedLinks = linksFor(data, errors, entitiesById, entityKinds), targets = (id, type) => (indexedLinks.byFrom.get(id) || []).filter((link) => link.type === type).map((link) => link.to);
  for (const boundary of data.boundaries || []) {
    required(errors, boundary.id || "boundary", boundary, ["track", "name", "actor", "promise", "durableArtifact", "entryCriteria", "includedCapabilities", "exclusions", "walkthrough", "compatibilityPromise", "stableAfter", "tasks"]);
    if (!tracks.has(boundary.track)) errors.push(`${boundary.id}: unknown track ${boundary.track}`); for (const capability of boundary.includedCapabilities || []) if (!capabilities.has(capability)) errors.push(`${boundary.id}: unknown capability ${capability}`);
    const taskRefs = new Set(); for (const task of boundary.tasks || []) { try { issueRef(task.ref); } catch (error) { errors.push(`${boundary.id}: ${error.message}`); } if (!TASK_ROLES.has(task.role)) errors.push(`${boundary.id}: invalid task role ${task.role}`); if (taskRefs.has(task.ref)) errors.push(`${boundary.id}: duplicate task ${task.ref}`); taskRefs.add(task.ref); }
    if (!(boundary.tasks || []).some((task) => task.role === "gate")) errors.push(`${boundary.id}: no gate task`); for (const gap of boundary.gaps || []) required(errors, `${boundary.id}: gap`, gap, ["title", "owner", "trigger"]);
  }
  validateDag(errors, "boundary dependency", (data.boundaries || []).map((item) => item.id), (id) => targets(id, "depends-on"));
  const allStages = new Map();
  for (const pipeline of data.capabilityPipelines || []) {
    required(errors, pipeline.id || "pipeline", pipeline, ["instanceId", "name", "purpose", "stages"]);
    for (const stage of pipeline.stages || []) { if (allStages.has(stage.id)) errors.push(`duplicate capability stage id: ${stage.id || "(blank)"}`); allStages.set(stage.id, { stage, pipeline }); required(errors, `${pipeline.id}/${stage.id}`, stage, ["id", "instanceId", "name", "groupNeed", "promise", "semanticAdds", "blueprintAdds", "doesNotIntroduce", "executionAnchors", "activationTrigger"], ["executionAnchors"]); if ((stage.executionAnchors || []).length > 3) errors.push(`${pipeline.id}/${stage.id}: more than three execution anchors`); for (const ref of stage.executionAnchors || []) try { issueRef(ref); } catch (error) { errors.push(`${pipeline.id}/${stage.id}: ${error.message}`); } for (const research of stage.research || []) required(errors, `${pipeline.id}/${stage.id}: research`, research, ["source", "takeaway"]); }
    validateDag(errors, `${pipeline.id}: capability dependency`, pipeline.stages.map((stage) => stage.id), (id) => targets(id, "depends-on"));
  }
  for (const mode of data.applicationStrategy?.modes || []) { required(errors, `applicationStrategy/${mode.id}`, mode, ["name"]); for (const capability of mode.capabilities || []) if (!capabilities.has(capability)) errors.push(`applicationStrategy/${mode.id}: unknown capability ${capability}`); for (const stageId of mode.servesStages || []) if (!allStages.has(stageId)) errors.push(`applicationStrategy/${mode.id}: serves unknown stage ${stageId}`); }
  required(errors, "reality", data.reality, ["asOf", "method", "states"]); for (const state of data.reality?.states || []) if (!REALITY_STATES.has(state.id) || !state.label) errors.push(`reality: invalid state definition ${state.id || "(blank)"}`);
  const assessmentIds = new Set(), checksPerBoundary = new Map((data.boundaries || []).map((item) => [item.id, 0]));
  for (const assessment of data.assessments || []) {
    if (!assessment.id || assessmentIds.has(assessment.id)) errors.push(`assessment: duplicate id ${assessment.id || "(blank)"}`); assessmentIds.add(assessment.id);
    if (assessment.kind === "boundary-assessment") { required(errors, `assessment/${assessment.id}`, assessment, ["title", "state", "exists", "missing", "evidence", "assessedAt", "reviewBy"]); if (!REALITY_STATES.has(assessment.state)) errors.push(`assessment/${assessment.id}: invalid state ${assessment.state}`); const subjects = targets(assessment.id, "com.semanticops.strategy/assesses"); if (subjects.length !== 1 || entityKinds.get(subjects[0]) !== "boundary") errors.push(`assessment/${assessment.id}: must assess exactly one boundary`); else checksPerBoundary.set(subjects[0], checksPerBoundary.get(subjects[0]) + 1); }
    else if (assessment.kind === "contract-assessment") { required(errors, `assessment/${assessment.id}`, assessment, ["title", "specification", "implementation", "conformance", "openConditions", "evidence", "assessedAt", "reviewBy"]); if (!SPECIFICATION_MATURITY.has(assessment.specification)) errors.push(`assessment/${assessment.id}: invalid specification maturity ${assessment.specification}`); if (!IMPLEMENTATION_MATURITY.has(assessment.implementation)) errors.push(`assessment/${assessment.id}: invalid implementation maturity ${assessment.implementation}`); if (!CONFORMANCE_MATURITY.has(assessment.conformance)) errors.push(`assessment/${assessment.id}: invalid conformance maturity ${assessment.conformance}`); if (targets(assessment.id, "com.semanticops.strategy/assesses").length !== 1) errors.push(`assessment/${assessment.id}: must assess exactly one contract`); }
    else errors.push(`assessment/${assessment.id}: invalid kind ${assessment.kind}`);
    for (const evidence of assessment.evidence || []) { required(errors, `assessment/${assessment.id}: evidence`, evidence, ["type", "ref"]); if (!EVIDENCE_TYPES.has(evidence.type)) errors.push(`assessment/${assessment.id}: invalid evidence type ${evidence.type}`); if (evidence.type === "issue") try { issueRef(evidence.ref); } catch (error) { errors.push(`assessment/${assessment.id}: ${error.message}`); } }
    if (assessment.assessedAt > assessment.reviewBy) errors.push(`assessment/${assessment.id}: reviewBy precedes assessedAt`);
  }
  for (const [id, count] of checksPerBoundary) if (!count) errors.push(`reality: no boundary assessment for ${id}`);
  const architecture = data.capabilityArchitecture; required(errors, "capabilityArchitecture", architecture, ["purpose", "stability"]); const statuses = new Set((architecture?.stability || []).map((item) => item.id)); for (const item of architecture?.stability || []) if (!ARCHITECTURE_STABILITY.has(item.id)) errors.push(`capabilityArchitecture: invalid stability ${item.id}`);
  for (const contract of data.standardContracts || []) { required(errors, `contract/${contract.id}`, contract, ["id", "instanceId", "kind", "name", "stability", "promise", "capabilities", "sources", "notIncluded"]); if (!statuses.has(contract.stability)) errors.push(`contract/${contract.id}: unknown stability ${contract.stability}`); if (!["strategy-contract", "normative-subject"].includes(contract.kind)) errors.push(`contract/${contract.id}: invalid kind ${contract.kind}`); for (const capability of contract.capabilities || []) if (!capabilities.has(capability)) errors.push(`contract/${contract.id}: unknown capability ${capability}`); for (const source of contract.sources || []) { required(errors, `contract/${contract.id}: source`, source, ["type", "ref"]); if (!EVIDENCE_TYPES.has(source.type)) errors.push(`contract/${contract.id}: invalid source type ${source.type}`); } if (contract.kind === "normative-subject") { if ("content" in contract || "normativeContent" in contract) errors.push(`contract/${contract.id}: normative subject must reference, not duplicate, normative content`); required(errors, `contract/${contract.id}: normativeSubject`, contract.normativeSubject, ["type", "instanceId", "path"]); if (contract.normativeSubject?.type !== "srs-record" || contract.normativeSubject?.instanceId !== contract.instanceId) errors.push(`contract/${contract.id}: normative subject must reuse contract instanceId`); } }
  validateDag(errors, "contract decomposition", (data.standardContracts || []).map((item) => item.id), (id) => targets(id, "contains")); validateDag(errors, "contract dependency", (data.standardContracts || []).map((item) => item.id), (id) => targets(id, "depends-on"));
  const known = new Set(data.knownEpicRefs || []), mapped = new Set(); for (const epic of data.epics || []) { try { issueRef(epic.ref); } catch (error) { errors.push(`epic: ${error.message}`); continue; } if (mapped.has(epic.ref)) errors.push(`duplicate epic: ${epic.ref}`); mapped.add(epic.ref); if (!known.has(epic.ref)) warnings.push(`mapped epic absent from knownEpicRefs: ${epic.ref}`); } for (const ref of known) if (!mapped.has(ref)) errors.push(`unmapped epic: ${ref}`);
  return { errors, warnings };
}

function addNode(nodes, node) { if (!nodes.has(node.id)) nodes.set(node.id, node); }
function addEdge(edges, from, to, kind) { edges.push({ id: `${kind}:${from}->${to}`, from, to, kind }); }

export function buildRoadmapIndex(data) {
  const errors = [], { entitiesById, entityKinds } = entityMaps(data, errors), { links, byFrom, byTo } = linksFor(data, errors, entitiesById, entityKinds), targets = (id, type) => (byFrom.get(id) || []).filter((link) => link.type === type).map((link) => link.to), sources = (id, type) => (byTo.get(id) || []).filter((link) => link.type === type).map((link) => link.from);
  const boundariesById = new Map((data.boundaries || []).map((value) => [value.id, value])), pipelinesById = new Map((data.capabilityPipelines || []).map((value) => [value.id, value])), stagesById = new Map(), stageNodeIds = new Map(), modesByStage = new Map(), checksByBoundary = new Map(), checksByStage = new Map(), assessmentsByContract = new Map();
  for (const boundary of data.boundaries || []) checksByBoundary.set(boundary.id, []);
  for (const pipeline of data.capabilityPipelines || []) for (const stage of pipeline.stages || []) { stagesById.set(stage.id, { stage, pipeline }); stageNodeIds.set(stage.id, `stage:${pipeline.id}:${stage.id}`); checksByStage.set(stage.id, []); }
  for (const assessment of data.assessments || []) { const subject = targets(assessment.id, "com.semanticops.strategy/assesses")[0]; if (assessment.kind === "boundary-assessment") checksByBoundary.get(subject)?.push(assessment); if (assessment.kind === "contract-assessment") { if (!assessmentsByContract.has(subject)) assessmentsByContract.set(subject, []); assessmentsByContract.get(subject).push(assessment); } for (const stageId of targets(assessment.id, "evidences")) checksByStage.get(stageId)?.push(assessment); }
  for (const mode of data.applicationStrategy?.modes || []) for (const stageId of mode.servesStages || []) { if (!modesByStage.has(stageId)) modesByStage.set(stageId, []); modesByStage.get(stageId).push(mode); }
  const contractsById = new Map((data.standardContracts || []).map((value) => [value.id, value])), contractChildrenById = new Map([[null, []], ...[...contractsById.keys()].map((id) => [id, []])]);
  for (const contract of contractsById.values()) { const parents = sources(contract.id, "contains"); if (parents.length) for (const parent of parents) contractChildrenById.get(parent)?.push(contract); else contractChildrenById.get(null).push(contract); }
  return { data, errors, links, linksFrom: byFrom, linksTo: byTo, entitiesById, entityKinds, boundariesById, pipelinesById, stagesById, stageNodeIds, checksByBoundary, checksByStage, assessmentsByContract, modesByStage, contractsById, contractChildrenById, statesById: new Map((data.reality?.states || []).map((value) => [value.id, value])), targets, sources, taskRefs: new Set((data.boundaries || []).flatMap((boundary) => boundary.tasks.map((task) => task.ref))) };
}

export function capabilityArchitecture(index) { const visit = (node) => ({ node, children: (index.contractChildrenById.get(node.id) || []).map(visit) }); return (index.contractChildrenById.get(null) || []).map(visit); }
export function contractRequirements(index, contractId) { return index.sources(contractId, "com.semanticops.strategy/requires-contract").map((id) => ({ id, kind: index.entityKinds.get(id), entity: index.entitiesById.get(id) })); }
function deterministicUuid(seed) { let a = 2166136261, b = 2166136261; for (const char of seed) { a = Math.imul(a ^ char.charCodeAt(0), 16777619); b = Math.imul(b ^ (char.charCodeAt(0) + 97), 16777619); } const hex = [a >>> 0, b >>> 0, (a ^ b) >>> 0, (a + b) >>> 0].map((value) => value.toString(16).padStart(8, "0")).join(""); return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`; }
export function materializeSrsProjection(index) {
  const typeFor = { boundary: "com.semanticops.strategy/release-boundary", stage: "com.semanticops.strategy/capability-stage", contract: "com.semanticops.strategy/strategy-contract", assessment: "com.semanticops.strategy/assessment" };
  const records = [...index.entitiesById.entries()].map(([key, entity]) => ({ instanceId: entity.instanceId, type: typeFor[index.entityKinds.get(key)], fieldValues: { strategy_key: key, title: entity.name || entity.title, ...entity } }));
  const relations = index.links.map((link) => ({ relationId: deterministicUuid(`${link.type}:${link.from}:${link.to}`), relationType: link.type, sourceInstanceId: index.entitiesById.get(link.from).instanceId, targetInstanceId: index.entitiesById.get(link.to).instanceId }));
  return { records, relations };
}
export function rehydrateSrsProjection(materialized) { const keysByInstanceId = new Map(materialized.records.map((record) => [record.instanceId, record.fieldValues.strategy_key])); return { entityKeys: materialized.records.map((record) => record.fieldValues.strategy_key).sort(), links: materialized.relations.map((relation) => ({ type: relation.relationType, from: keysByInstanceId.get(relation.sourceInstanceId), to: keysByInstanceId.get(relation.targetInstanceId) })).sort((a, b) => `${a.type}:${a.from}:${a.to}`.localeCompare(`${b.type}:${b.from}:${b.to}`)) }; }

export function buildRoadmapGraph(data, index = buildRoadmapIndex(data)) {
  const nodes = new Map(), edges = [], workTitles = new Map((data.epics || []).map((epic) => [epic.ref, epic.name])), workNode = (ref) => { const id = `work:${ref}`; addNode(nodes, { id, type: "work", ref, title: workTitles.get(ref) || ref, url: issueUrl(ref) }); return id; }, nodeId = (key) => { const kind = index.entityKinds.get(key); if (kind === "boundary") return `release:${key}`; if (kind === "stage") return index.stageNodeIds.get(key); if (kind === "contract") return `contract:${key}`; if (kind === "assessment") return index.entitiesById.get(key)?.kind === "boundary-assessment" ? `reality:${key}` : `assessment:${key}`; return null; };
  for (const capability of data.capabilities || []) addNode(nodes, { id: `capability:${capability}`, type: "capability", title: capability });
  for (const boundary of data.boundaries || []) { const id = nodeId(boundary.id); addNode(nodes, { id, type: "release", title: `${boundary.id} — ${boundary.name}`, boundary }); for (const capability of boundary.includedCapabilities || []) addEdge(edges, id, `capability:${capability}`, "includes"); for (const task of boundary.tasks || []) addEdge(edges, id, workNode(task.ref), task.role); }
  for (const pipeline of data.capabilityPipelines || []) for (const stage of pipeline.stages || []) { const id = nodeId(stage.id); addNode(nodes, { id, type: "stage", title: `${stage.id} — ${stage.name}`, stage, pipeline }); for (const ref of stage.executionAnchors || []) addEdge(edges, id, workNode(ref), "anchor"); }
  for (const contract of data.standardContracts || []) addNode(nodes, { id: nodeId(contract.id), type: "contract", title: contract.name, contract });
  for (const assessment of data.assessments || []) addNode(nodes, { id: nodeId(assessment.id), type: assessment.kind === "boundary-assessment" ? "reality" : "assessment", title: assessment.title, assessment, check: assessment });
  for (const mode of data.applicationStrategy?.modes || []) { const id = `mode:${mode.id}`; addNode(nodes, { id, type: "mode", title: mode.name, mode }); for (const capability of mode.capabilities || []) addEdge(edges, id, `capability:${capability}`, "supports"); for (const stageId of mode.servesStages || []) addEdge(edges, id, nodeId(stageId), "serves"); }
  for (const epic of data.epics || []) { const id = workNode(epic.ref); for (const capability of epic.capabilities || []) addEdge(edges, id, `capability:${capability}`, "owns"); }
  for (const link of index.links) { const from = nodeId(link.from), to = nodeId(link.to); if (!from || !to) continue; if (link.type === "depends-on") addEdge(edges, to, from, "requires"); else addEdge(edges, from, to, link.type === "com.semanticops.strategy/aligns-with" ? "aligns" : link.type); }
  const adjacency = new Map([...nodes.keys()].map((id) => [id, new Set()])); for (const edge of edges) { if (!adjacency.has(edge.from)) adjacency.set(edge.from, new Set()); if (!adjacency.has(edge.to)) adjacency.set(edge.to, new Set()); adjacency.get(edge.from).add(edge.to); adjacency.get(edge.to).add(edge.from); }
  return { nodes, edges, adjacency };
}

export function relatedNodes(graph, focusId, maxDepth = 2) { const direct = new Set(), secondary = new Set(); if (!graph.nodes.has(focusId)) return { direct, secondary }; const visited = new Set([focusId]); let frontier = new Set([focusId]); for (let depth = 1; depth <= maxDepth; depth += 1) { const next = new Set(); for (const id of frontier) for (const adjacent of graph.adjacency.get(id) || []) if (!visited.has(adjacent)) next.add(adjacent); for (const id of next) (depth === 1 ? direct : secondary).add(id); for (const id of next) visited.add(id); frontier = next; } return { direct, secondary }; }
export function prerequisites(graph, nodeId) { const result = new Set(); const visit = (id) => { for (const edge of graph.edges) if (edge.to === id && edge.kind === "requires" && !result.has(edge.from)) { result.add(edge.from); visit(edge.from); } }; visit(nodeId); return [...result]; }
export function nodeGroups(graph, focusId) { const { direct, secondary } = relatedNodes(graph, focusId); const grouped = { release: [], stage: [], contract: [], capability: [], mode: [], reality: [], assessment: [], work: [] }; for (const node of graph.nodes.values()) { if (["work", "reality", "assessment"].includes(node.type) && node.id !== focusId && !direct.has(node.id) && !secondary.has(node.id)) continue; grouped[node.type]?.push({ node, relation: node.id === focusId ? "focus" : direct.has(node.id) ? "direct" : secondary.has(node.id) ? "secondary" : "other" }); } for (const group of Object.values(grouped)) group.sort((a, b) => a.node.title.localeCompare(b.node.title)); return grouped; }
export function pipelineLayout(pipeline, index) { const stages = pipeline.stages || [], byId = new Map(stages.map((stage) => [stage.id, stage])), ranks = new Map(), requirements = (id) => index ? index.targets(id, "depends-on") : byId.get(id)?.requires || []; const rank = (id) => { if (ranks.has(id)) return ranks.get(id); const value = Math.max(0, ...requirements(id).filter((ref) => byId.has(ref)).map((ref) => rank(ref) + 1)); ranks.set(id, value); return value; }; for (const stage of stages) rank(stage.id); return stages.map((stage, order) => ({ stage, rank: ranks.get(stage.id), order })).sort((a, b) => a.rank - b.rank || a.order - b.order); }
export function evidenceReview(check, today = new Date().toISOString().slice(0, 10)) { return check.reviewBy < today ? "overdue" : check.reviewBy === today ? "due" : "current"; }
