#!/usr/bin/env node
/**
 * render-extension-index.mjs — the generated extension index (RFC-042 Revision 4 [R18]), companion
 * to render-invariants.mjs. Reads the `extension` records directly (RFC-038, tree-authoritative;
 * never shells out to the CLI) and renders a single markdown table enumerating every `live`
 * extension and what it depends on. `table-27b56c53` (a hand-authored duplicate of this same
 * enumeration) retired in the same change this script landed in — Change E's precedent for the
 * invariant appendix, applied a second time.
 *
 * A `dormant` extension is not required, so it does not appear here — the reader who wants it reads
 * the extension's own record (`extension_status: dormant`, `content` states its removal).
 */
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const EXTENSION_TYPE = "com.semanticops.spec/extension";

/**
 * The same two full-specification renders `REQUIRES_KEY_INVARIANTS_VIEW_IDS` (render-invariants.mjs)
 * names — both carry the "Extensions" overview concept this index anchors on; other compositions
 * (e.g. the glossary) do not, and would have no anchor to splice against.
 */
export const REQUIRES_EXTENSION_INDEX_VIEW_IDS = new Set([
  "3a000001-0000-4000-a000-000000000001", // srs-spec-document-view (docs/spec/srs-spec.md)
  "3a000004-0000-4000-a000-000000000004", // srs-unified-document-view (docs/spec/srs-unified.md)
]);

async function walkJson(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkJson(p)));
    else if (e.name.endsWith(".json")) out.push(JSON.parse(await readFile(p, "utf8")));
  }
  return out;
}

export async function renderExtensionIndex(repoPath) {
  const records = await walkJson(join(repoPath, "records"));
  const relations = await walkJson(join(repoPath, "relations"));

  const extensions = records.filter(
    (r) => r.typeNamespace && r.typeName && `${r.typeNamespace}/${r.typeName}` === EXTENSION_TYPE,
  );

  const extensionIdById = new Map(extensions.map((r) => [r.instanceId, r.fieldValues?.extension_id]));
  const dependsOn = new Map(); // extension instanceId -> [extension_id...] it depends on
  for (const r of relations) {
    if (r.relationType !== "depends-on") continue;
    if (!extensionIdById.has(r.sourceInstanceId)) continue;
    const targetExtId = extensionIdById.get(r.targetInstanceId);
    if (!targetExtId) continue; // target is a concept, not an extension — not this table's concern
    dependsOn.set(r.sourceInstanceId, [...(dependsOn.get(r.sourceInstanceId) ?? []), targetExtId]);
  }

  const live = extensions
    .filter((r) => r.fieldValues?.extension_status === "live")
    .map((r) => ({
      extensionId: r.fieldValues.extension_id,
      title: r.fieldValues.title,
      dependsOn: (dependsOn.get(r.instanceId) ?? []).sort(),
    }))
    .sort((a, b) => a.extensionId.localeCompare(b.extensionId));

  const lines = [
    "| Extension | Identifier | Depends on |",
    "|---|---|---|",
    ...live.map((e) => `| ${e.title} | \`${e.extensionId}\` | ${e.dependsOn.length ? e.dependsOn.map((d) => `\`${d}\``).join(", ") : "—"} |`),
  ];

  return lines.join("\n");
}
