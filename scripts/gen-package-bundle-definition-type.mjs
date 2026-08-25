#!/usr/bin/env node
/**
 * gen-package-bundle-definition-type.mjs — rfc-decision-c8704763 item 4 (definitionType enum
 * derived from the package-manifest's ten definition kinds; finding A6, travel mandate 8948e43f).
 *
 * `docs/schema/2.0/package-bundle.json`'s `$defs.Reference.definitionType` enum used to be nine
 * hand-listed values, independently authored from `package-manifest.json`'s ten definition-kind
 * properties — the exact "two lists, one diverges" shape finding A6 named. This script makes the
 * bundle's enum GENERATED from the one source of truth: `check-schema-kind-correspondence.mjs`'s
 * `definitionKinds()` (#311), which already derives the kind list from package-manifest.json's
 * declared properties. The enum value for each kind is its schema's basename (already the correct
 * singular-kebab form: field.json -> "field", document-view.json -> "document-view", ...), so there
 * is no separate naming table to keep in sync either.
 *
 *   node scripts/gen-package-bundle-definition-type.mjs           # write docs/schema/2.0/package-bundle.json
 *   node scripts/gen-package-bundle-definition-type.mjs --check   # fail if committed output drifts
 */
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { definitionKinds } from "./check-schema-kind-correspondence.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const BUNDLE_SCHEMA = join(ROOT, "docs/schema/2.0/package-bundle.json");
const CHECK = process.argv.includes("--check");

async function main() {
  const { composed, kinds, unclassified } = await definitionKinds(ROOT);
  if (composed.length > 0 || unclassified.length > 0) {
    console.error("✗ package-manifest.json's definition kinds are not cleanly derivable — run");
    console.error("  check-schema-kind-correspondence.mjs first and fix what it reports.");
    process.exit(1);
  }

  const expectedEnum = kinds
    .map(({ schemaFile }) => schemaFile.replace(/\.json$/, ""))
    .sort();

  const raw = await readFile(BUNDLE_SCHEMA, "utf8");
  const doc = JSON.parse(raw);
  const target = doc.$defs?.Reference?.properties?.definitionType;
  if (!target) {
    console.error("✗ package-bundle.json's $defs.Reference.properties.definitionType is missing.");
    process.exit(1);
  }

  const currentEnum = [...(target.enum ?? [])].sort();
  const drift = JSON.stringify(currentEnum) !== JSON.stringify(expectedEnum);

  if (CHECK) {
    if (drift) {
      console.error("✗ package-bundle.json's definitionType enum has drifted from the derivation.");
      console.error(`  committed: ${JSON.stringify(currentEnum)}`);
      console.error(`  derived:   ${JSON.stringify(expectedEnum)}`);
      process.exit(1);
    }
    console.log(`✓ package-bundle.json's definitionType enum matches the derivation (${expectedEnum.length} kinds).`);
    return;
  }

  target.enum = expectedEnum;
  await writeFile(BUNDLE_SCHEMA, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`✓ wrote definitionType enum (${expectedEnum.length} kinds): ${expectedEnum.join(", ")}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
