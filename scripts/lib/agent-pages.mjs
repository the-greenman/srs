/**
 * agent-pages.mjs — the specification as pages an agent with only a fetch tool can read (srs#983).
 *
 * Fetch tools stop at about 100–120k characters, and docs/spec/srs-spec.md is one ~465 KB file. This
 * module splits that rendered, normative file at its headings into docs/agents/<path>.md pages, each
 * under PAGE_LIMIT characters, and writes docs/llms.txt as their index. It splits the committed render
 * rather than rendering the composition per container, so a page can never say something the spec
 * does not: `srs render composition --container` renders every section of the composition against the
 * one container, and a second, page-shaped composition would be a second copy of the spec's
 * typeFilter and dispatch to keep in step.
 *
 * A heading becomes one page holding its whole subtree when that fits; otherwise the page holds the
 * heading's own text and links to one page per child heading, recursively. A leaf too large to fit is
 * not split further: check-agent-readability reports it.
 *
 * Pure: input is the spec text and the manifest's version facts, output is a Map of docs-relative
 * path to content, so check-agent-readability can regenerate and compare without touching disk.
 */
export const PAGE_LIMIT = 30000;
// Room left for the header each page carries (title, description, links up and down).
const HEADER_ALLOWANCE = 4000;

// The SemanticOps sites' shared Get running block (srs-context decision d871837a, semanticops.com#44):
// every site's llms.txt opens with it, byte for byte. Change the standard first, then this copy.
const GET_RUNNING = [
  "## Get running",
  "",
  "- Install the srs engine: `curl -fsSL https://engine.semanticops.com/install.sh | sh`",
  "- [First five minutes](https://engine.semanticops.com/start.md): CLI, MCP server, output contract",
  "- [SemanticOps sites](https://semanticops.com/llms.txt): every site and what it is for",
];

function parseHeadings(text) {
  const lines = text.split("\n");
  const root = { level: 0, title: "", lines: [], children: [] };
  const stack = [root];
  let fenced = false;
  for (const line of lines) {
    if (line.startsWith("```")) fenced = !fenced;
    const m = !fenced && line.match(/^(#{1,6}) (.+)$/);
    if (m) {
      const node = { level: m[1].length, title: m[2].trim(), lines: [], children: [] };
      while (stack.at(-1).level >= node.level) stack.pop();
      stack.at(-1).children.push(node);
      stack.push(node);
    } else {
      stack.at(-1).lines.push(line);
    }
  }
  return root;
}

// The subtree as markdown, headings shifted so the node's own heading is `#`.
function subtreeText(node, shift = node.level - 1) {
  const own = [`${"#".repeat(node.level - shift)} ${node.title}`, ...node.lines];
  return [own.join("\n"), ...node.children.map((c) => subtreeText(c, shift))].join("\n");
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60).replace(/-$/, "") || "section";
}

function describe(node) {
  let fenced = false;
  // An extension registry entry is all bold labels; its `Adds` line says what it is.
  const adds = node.lines.find((l) => l.startsWith("**Adds**: "));
  for (const line of adds ? [adds.slice(10)] : node.lines) {
    if (line.startsWith("```")) fenced = !fenced;
    const t = line.trim();
    if (fenced || !t || /^[|>`-]|^\*\*[^*]+\*\*(:|$)/.test(t)) continue;
    const plain = t.replace(/`([^`]*)`/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1");
    const sentence = plain.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? plain;
    return sentence.length > 200 ? `${sentence.slice(0, 199)}…` : sentence;
  }
  return `${node.label ?? node.title}: a section of the specification.`;
}

// Sibling headings that repeat (the Discovery concept and the ext:discovery registry entry) get
// the extension id the entry declares, so the index tells them apart; otherwise a number.
function label(node, siblings) {
  if (siblings.filter((s) => s.title === node.title).length < 2) return node.title;
  const extensionId = node.lines.join("\n").match(/^\*\*Extension ID\*\*: (\S+)/m)?.[1];
  return extensionId ? `${node.title} (${extensionId})` : node.title;
}

/** @returns {Map<string, string>} docs-relative path → content, including `llms.txt`. */
export function buildAgentPages(specText, { srsVersion, dataModelRevision }) {
  const doc = parseHeadings(specText.replace(/\r\n/g, "\n"));
  const top = doc.children.length === 1 ? doc.children[0] : doc;
  // Text before the first Part would land on no page.
  if ([...doc.lines, ...(top === doc ? [] : top.lines)].some((l) => l.trim())) {
    throw new Error("agent-pages: srs-spec.md has text before its first Part heading, which no page would carry");
  }
  const version = `SRS ${srsVersion}, data model revision ${dataModelRevision}`;
  const parts = top.children;
  const pages = []; // { node, path, parent, depth }

  function plan(node, dir, parent, depth) {
    const taken = new Set();
    for (const child of node.children) {
      child.label = label(child, node.children);
      let slug = slugify(child.label);
      for (let n = 2; taken.has(slug); n++) slug = `${slugify(child.label)}-${n}`;
      taken.add(slug);
      const page = { node: child, path: `${dir}/${slug}.md`, parent, depth, split: false, children: [] };
      pages.push(page);
      parent?.children.push(page);
      if (subtreeText(child).length + HEADER_ALLOWANCE >= PAGE_LIMIT && child.children.length) {
        page.split = true;
        plan(child, `${dir}/${slug}`, page, depth + 1);
      }
    }
  }
  plan(top, "agents", null, 0);

  const link = (p) => `[${p.node.label}](/${p.path})`;
  const reading = pages.find((p) => p.depth === 0);
  const files = new Map();
  for (const page of pages) {
    const { node } = page;
    const body = page.split
      ? [`# ${node.title}`, ...node.lines].join("\n").trimEnd()
      : subtreeText(node).trimEnd();
    const nav = [`Specification: ${version}. Part of the [SRS specification index](/llms.txt).`];
    if (page.parent) nav.push(`Up: ${link(page.parent)}.`);
    if (page.depth === 0) {
      const i = parts.indexOf(node);
      const before = [reading, i > 1 ? pages.find((p) => p.node === parts[i - 1]) : null].filter((p) => p && p.node !== node);
      if (before.length) nav.push(`Read first: ${before.map(link).join(", ")}.`);
    }
    const lines = [`> ${describe(node)}`, "", nav.join(" ")];
    if (page.split) {
      lines.push("", "Pages under this one:", "", ...page.children.map((c) => `- ${link(c)}: ${describe(c.node)}`));
    }
    const [heading, ...rest] = body.split("\n");
    files.set(page.path, [heading, "", ...lines, ...rest].join("\n") + "\n");
  }

  const entry = (p) => `${"  ".repeat(p.depth)}- ${link(p)}: ${describe(p.node)}`;
  files.set(
    "llms.txt",
    [
      "# SRS specification",
      "",
      `> The normative specification of SRS (Semantic Record System), ${version}, one page per concept, each under ${PAGE_LIMIT.toLocaleString("en")} characters. Generated from the records of the specification repository; the records, not these pages, are authoritative.`,
      "",
      ...GET_RUNNING,
      "",
      "## Start here",
      "",
      `- ${link(reading)}: notation, RFC 2119 keywords and the reading order of the nine Parts.`,
      "- [Glossary](/spec/srs-glossary.md): one definition per SRS term.",
      "- [JSON Schemas](/schema/2.0/README.md): the production contract for SRS 2.0 data, one schema per entity.",
      "",
      "## Pages",
      "",
      ...pages.map(entry),
      "",
      "## Other forms",
      "",
      "- [Rationale](/spec/srs-rationale.md): why the specification is as it is; design notes only.",
      "- [Specification, one file](/spec/srs-spec.md): every page above in one large file, more than one fetch.",
      "- [Unified](/spec/srs-unified.md): specification and rationale together, one large file.",
      "- [Repository archive](/srs-spec.srs): the full specification repository as records; needs an SRS client.",
      "- Implementations: the reference engine at https://engine.semanticops.com",
      "",
      "<!-- generated from docs/spec/srs-spec.md by scripts/lib/agent-pages.mjs; do not edit -->",
      "",
    ].join("\n"),
  );
  return files;
}
