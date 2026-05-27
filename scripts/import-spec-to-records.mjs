import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = "/home/greenman/dev/semanticops/srs";
const specPath = path.join(repoRoot, "spec", "srs-spec.md");
const recordsRoot = path.join(repoRoot, "records");
const sectionsDir = path.join(recordsRoot, "sections");
const subsectionsDir = path.join(recordsRoot, "subsections");
const extensionsDir = path.join(recordsRoot, "extensions");
const rfcsDir = path.join(recordsRoot, "rfcs");
const typeDefinitionsDir = path.join(recordsRoot, "type-definitions");
const relationsPath = path.join(repoRoot, "relations", "relations.json");
const manifestPath = path.join(repoRoot, "manifest.json");
const createdAt = "2026-05-27T00:00:00Z";

function stableUuid(input) {
  const hex = createHash("sha1").update(input).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8).join(""),
    hex.slice(8, 12).join(""),
    hex.slice(12, 16).join(""),
    hex.slice(16, 20).join(""),
    hex.slice(20, 32).join(""),
  ].join("-");
}

function trimBlock(text) {
  return text.replace(/^\n+/, "").replace(/\n+$/, "");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[`"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadSectionRecord(filePath) {
  try {
    return await loadJson(filePath);
  } catch {
    return null;
  }
}

async function loadRecordDirectory(dirPath) {
  const files = await readdir(dirPath);
  const records = [];
  for (const file of files) {
    records.push({
      filePath: path.join(dirPath, file),
      fileName: file,
      data: await loadJson(path.join(dirPath, file)),
    });
  }
  return records;
}

function parseSectionHeading(rawTitle) {
  const match = rawTitle.match(/^(\d+)(?:\.(\d+))?\.?\s+(.*)$/);
  if (!match) {
    throw new Error(`Unrecognised section heading format: ${rawTitle}`);
  }

  const major = match[1].padStart(2, "0");
  const minor = match[2] ?? null;
  const body = match[3].trim();
  const label = minor ? `${major}.${minor}` : major;
  const title = minor ? `${label} ${body}` : `${label}. ${body}`;
  const fileLabel = minor ? `${major}-${minor}` : major;

  return { label, title, body, fileLabel };
}

function splitH4Blocks(markdown) {
  const lines = markdown.split("\n");
  const intro = [];
  const blocks = new Map();
  let currentKey = null;
  let currentLines = [];

  function flush() {
    if (!currentKey) return;
    blocks.set(currentKey, trimBlock(currentLines.join("\n")));
    currentKey = null;
    currentLines = [];
  }

  for (const line of lines) {
    const h4 = line.match(/^####\s+`?(.+?)`?\s*$/);
    if (h4) {
      flush();
      currentKey = h4[1].trim();
      currentLines.push(line);
      continue;
    }

    if (currentKey) {
      currentLines.push(line);
    } else {
      intro.push(line);
    }
  }

  flush();
  return {
    intro: trimBlock(intro.join("\n")),
    blocks,
  };
}

function parseRfcDocument(markdown) {
  const lines = markdown.split("\n");
  const titleLine = lines.find((line) => line.startsWith("# "));
  const statusLine = lines.find((line) => line.startsWith("**Status**:"));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Untitled RFC";
  let status = "draft";

  if (statusLine) {
    const rawStatus = statusLine.replace(/^\*\*Status\*\*:\s*/, "").trim().toLowerCase();
    if (rawStatus.includes("accepted")) status = "accepted";
    else if (rawStatus.includes("rejected")) status = "rejected";
    else if (rawStatus.includes("superseded")) status = "superseded";
    else if (rawStatus.includes("proposed")) status = "proposed";
    else status = "draft";
  }

  const bodyStart = titleLine ? lines.indexOf(titleLine) + 1 : 0;
  const body = trimBlock(lines.slice(bodyStart).join("\n"));

  return { title, status, body };
}

function parseSpec(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let currentSection = null;
  let currentSubsection = null;
  let sectionBuffer = [];
  let subsectionBuffer = [];
  let started = false;

  function flushSubsection() {
    if (!currentSubsection) return;
    currentSubsection.content = trimBlock(subsectionBuffer.join("\n"));
    currentSection.subsections.push(currentSubsection);
    currentSubsection = null;
    subsectionBuffer = [];
  }

  function flushSection() {
    if (!currentSection) return;
    flushSubsection();
    currentSection.content = trimBlock(sectionBuffer.join("\n"));
    sections.push(currentSection);
    currentSection = null;
    sectionBuffer = [];
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);

    if (h2) {
      started = true;
      flushSection();
      const heading = parseSectionHeading(h2[1].trim());
      currentSection = {
        label: heading.label,
        title: heading.title,
        bodyTitle: heading.body,
        fileLabel: heading.fileLabel,
        content: "",
        subsections: [],
      };
      continue;
    }

    if (!started) {
      continue;
    }

    if (h3) {
      flushSubsection();
      currentSubsection = {
        title: h3[1].trim(),
        content: "",
      };
      continue;
    }

    if (currentSubsection) {
      subsectionBuffer.push(line);
    } else if (currentSection) {
      sectionBuffer.push(line);
    }
  }

  flushSection();
  return sections;
}

function buildSectionRecord(existing, title, content, order) {
  const record = existing ?? {
    "$schema": "https://srs.semanticops.com/schema/2.0/record.json",
    id: stableUuid(`section:${title}`),
    type: "com.semanticops.srs/meta.section",
    version: 1,
    fields: {},
    meta: {},
    createdAt,
  };

  record.fields.section_title = title;
  record.fields.normative_content = content;
  record.meta = {
    ...(record.meta ?? {}),
    order,
  };
  return record;
}

function buildSubsectionRecord(sectionTitle, sectionId, subsectionTitle, content, order) {
  return {
    "$schema": "https://srs.semanticops.com/schema/2.0/record.json",
    id: stableUuid(`subsection:${order}:${subsectionTitle}`),
    type: "com.semanticops.srs/meta.subsection",
    version: 1,
    fields: {
      section_title: subsectionTitle,
      normative_content: content,
    },
    meta: {
      order,
      parentSectionId: sectionId,
      parentSectionTitle: sectionTitle,
    },
    createdAt,
  };
}

function buildExtensionDepends(value) {
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => `- ${item}`).join("\n") : "";
  }
  return value ?? "";
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const specMarkdown = await readFile(specPath, "utf8");
  const parsedSections = parseSpec(specMarkdown);
  const relations = await loadJson(relationsPath);
  const manifest = await loadJson(manifestPath);
  const extensionRecords = await loadRecordDirectory(extensionsDir);
  const rfcRecords = await loadRecordDirectory(rfcsDir);
  const typeDefinitionRecords = await loadRecordDirectory(typeDefinitionsDir);

  await mkdir(subsectionsDir, { recursive: true });

  const sectionIds = [];
  const subsectionRelations = [];
  const subsectionContentByTitle = new Map();

  for (const [index, section] of parsedSections.entries()) {
    const order = section.label;
    const sectionFilePath = path.join(sectionsDir, `${section.fileLabel}-${slugify(section.bodyTitle)}.json`);
    const existing = await loadSectionRecord(sectionFilePath);
    const sectionRecord = buildSectionRecord(existing, section.title, section.content, order);

    await writeJson(sectionFilePath, sectionRecord);
    sectionIds.push(sectionRecord.id);

    const subsectionIds = [];
    for (const [subIndex, subsection] of section.subsections.entries()) {
      const subsectionOrder = `${section.label}.${subIndex + 1}`;
      const subsectionRecord = buildSubsectionRecord(
        section.title,
        sectionRecord.id,
        subsection.title,
        subsection.content,
        subsectionOrder
      );
      const subsectionFilePath = path.join(
        subsectionsDir,
        `${subsectionOrder.replace(/\./g, "-")}-${slugify(subsection.title)}.json`
      );
      await writeJson(subsectionFilePath, subsectionRecord);
      subsectionIds.push(subsectionRecord.id);
      subsectionContentByTitle.set(subsection.title, subsection.content);
    }

    subsectionRelations.push({
      id: `rel-subsection-sequence-${section.fileLabel}`,
      type: "subsection-sequence",
      from: sectionRecord.id,
      members: subsectionIds,
      description: `Ordered list of subsection records for ${section.title}.`,
    });
  }

  relations.relations = relations.relations.filter(
    (relation) => relation.type !== "section-sequence" && relation.type !== "subsection-sequence"
  );
  relations.relations.unshift(
    {
      id: "rel-section-sequence",
      type: "section-sequence",
      description: "Ordered list of top-level spec sections for document-view rendering.",
      members: sectionIds,
    },
    ...subsectionRelations
  );

  manifest.meta = {
    ...(manifest.meta ?? {}),
    sourceOfTruth: "records",
    migrationImports: [
      {
        source: "spec/srs-spec.md",
        importedAt: new Date().toISOString(),
        note: "Imported section and subsection content into canonical repository records.",
      },
      ...((manifest.meta && manifest.meta.migrationImports) ?? []),
    ],
  };

  const extensionTitleById = new Map([
    ["ext:addressability", "ext:addressability"],
    ["ext:lifecycle", "ext:lifecycle"],
    ["ext:protocol", "ext:protocol"],
    ["ext:schema", "ext:schema"],
    ["ext:type-inheritance", "ext:type-inheritance"],
    ["ext:views-l1", "ext:views-l1"],
    ["ext:views-l2", "ext:views-l2"],
    ["ext:repeatable-fields", "ext:repeatable-fields"],
    ["ext:field-groups", "ext:field-groups"],
    ["ext:cross-field-validation", "ext:cross-field-validation"],
    ["ext:recommended-relations", "ext:recommended-relations"],
    ["ext:import-tracking", "ext:import-tracking"],
    ["ext:registry", "ext:registry"],
    ["ext:federation", "ext:federation"],
    ["ext:repository", "ext:repository"],
  ]);

  for (const record of extensionRecords) {
    const subsectionTitle = extensionTitleById.get(record.data.fields.extension_id);
    if (!subsectionTitle) continue;
    const importedContent = subsectionContentByTitle.get(subsectionTitle);
    if (!importedContent) continue;
    record.data.fields.normative_content = importedContent;
    record.data.fields.extension_depends = buildExtensionDepends(record.data.fields.extension_depends);
    await writeJson(record.filePath, record.data);
  }

  const recordTiers = splitH4Blocks(subsectionContentByTitle.get("4.4 Record tiers") ?? "");
  const typeDefinitionContent = new Map([
    ["field", subsectionContentByTitle.get("4.2 Field") ?? ""],
    ["type", subsectionContentByTitle.get("4.3 Type") ?? ""],
    [
      "record-note",
      trimBlock([recordTiers.intro, recordTiers.blocks.get("NoteSection"), recordTiers.blocks.get("Note")].filter(Boolean).join("\n\n")),
    ],
    [
      "record-typed",
      trimBlock([recordTiers.intro, recordTiers.blocks.get("TypedField"), recordTiers.blocks.get("Typed Record"), recordTiers.blocks.get("SourceReference")].filter(Boolean).join("\n\n")),
    ],
    [
      "record",
      trimBlock([recordTiers.intro, recordTiers.blocks.get("FieldValue"), recordTiers.blocks.get("Record")].filter(Boolean).join("\n\n")),
    ],
    ["relation", subsectionContentByTitle.get("4.5 Relation") ?? ""],
    ["container", subsectionContentByTitle.get("4.6 Container") ?? ""],
  ]);

  for (const record of typeDefinitionRecords) {
    const importedContent = typeDefinitionContent.get(record.fileName.replace(/\.json$/, ""));
    if (!importedContent) continue;
    record.data.fields.normative_content = importedContent;
    await writeJson(record.filePath, record.data);
  }

  const rfcImports = new Map([
    ["rfc-001-views-l2-rendering.json", path.join(repoRoot, "spec", "rfcs", "rfc-001.md")],
    ["rfc-002-themes-l1.json", path.join(repoRoot, "spec", "rfcs", "rfc-002.md")],
    ["rfc-003-distribution-and-slices.json", path.join(repoRoot, "spec", "rfcs", "rfc-003.md")],
  ]);

  for (const record of rfcRecords) {
    const sourcePath = rfcImports.get(record.fileName);
    if (!sourcePath) continue;
    const parsedRfc = parseRfcDocument(await readFile(sourcePath, "utf8"));
    record.data.fields.section_title = parsedRfc.title;
    record.data.fields.rfc_status = parsedRfc.status;
    record.data.fields.normative_content = parsedRfc.body;
    await writeJson(record.filePath, record.data);
  }

  await writeJson(relationsPath, relations);
  await writeJson(manifestPath, manifest);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
