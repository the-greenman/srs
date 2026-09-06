#!/usr/bin/env node
/**
 * check-spec-language.mjs — the spec-prose register gate (srs#569).
 *
 * The rules are NOT in this file. `scripts/spec-language-registry.json` (srs#568) is the one home
 * of the banned-register list, the prose-field set, the numeric limits and the rule inventory;
 * `docs/style/spec-language-guide.md` is the same content in human-readable form. This script is a
 * runner over that registry and nothing more: adding a pattern is a registry edit, never a script
 * edit. Modeled on scripts/check-rfc-integration.mjs — collect failures, print each with the
 * substitution to apply, exit 1 on any.
 *
 *   node scripts/check-spec-language.mjs [root]        # root defaults to the repo root
 *   node scripts/check-spec-language.mjs --seed        # rewrite the allowlist from today's corpus
 *
 * SCOPE: only the registry rules marked `enforcement: "code"` are implemented here —
 * word-budget, em-dash-cap, keyword-register, heading-restatement, bold-lead-in-uniformity — plus
 * every entry in `patterns`. The seven `enforcement: "review"` rules (rationale-in-constraint,
 * term-defined-once, list-over-prose, uniform-section-length, rule-of-three, must-inflation,
 * example-over-explanation) are a deliberate boundary: each needs a judgement a regex cannot make,
 * and approximating one in code would produce violations an author cannot act on. They stay
 * unimplemented until they are made mechanical, not until a heuristic is close enough.
 *
 * ---------------------------------------------------------------------------------------------
 * RULING 1 — `title` is OUT OF SCOPE, and stays out.
 *
 * 26 em-dashes sit in `title` fields (verified on master). None of them is a violation here, and
 * none is allowlisted, for two independent reasons:
 *
 *   (a) The registry's `proseFields` list — content, normative_statement, rationale, summary,
 *       intro, outro, notes, description — does not name `title`. The registry is the rule; this
 *       script does not get to widen it. A title is a label, not prose.
 *   (b) The em-dash rule is stated per PARAGRAPH ("at most one em-dash per paragraph"). A title has
 *       no paragraphs, so the cap has no denominator there. Applying a per-paragraph cap to a
 *       one-line label would be inventing a rule, not enforcing one, and it would ban the ordinary
 *       "Containers — membership and identity" title form the corpus uses deliberately.
 *
 * The banned-register `patterns` are likewise not applied to `title`, for reason (a): the registry
 * scopes patterns to prose fields. If a future ruling wants titles governed, the fix is a `title`
 * entry (or a separate `labelFields` axis) in the registry — not a special case in this script.
 *
 * ---------------------------------------------------------------------------------------------
 * RULING 2 — the allowlist seeds PER VIOLATION SITE, never per file, and never per field.
 *
 * 727 em-dashes live in `content`. Seeding one entry per file that contains an em-dash would
 * produce a several-hundred-entry allowlist that grandfathers whole fields, and would then hide
 * every genuine future regression inside them — the exact failure the owner flagged on #569.
 *
 * The rule is "at most one em-dash per paragraph", so the unit of judgement is the paragraph:
 *
 *   - A field with twelve well-spaced em-dashes, one per paragraph, is COMPLIANT. It is never
 *     reported and never enters the allowlist. Only a paragraph carrying two or more is a site.
 *   - Each site is keyed by `<relpath>#<field>#<ruleId>#<siteKey>`, where `siteKey` is an 8-hex
 *     digest of the offending paragraph's normalized text. Field-level rules (word-budget,
 *     heading-restatement, bold-lead-in-uniformity) have no siteKey — the field is the site.
 *   - Because the key carries the paragraph's own digest, fixing a grandfathered paragraph retires
 *     its entry, and adding a second em-dash to a different paragraph is a NEW violation that no
 *     existing entry covers. That is what makes the allowlist a migration ledger rather than a
 *     blanket.
 *
 * Consequence: em-dash-cap seeds far smaller than a per-file seed would, and every entry names a
 * paragraph a human can open and fix.
 *
 * Allowlist entries that no longer match anything are reported as stale (with a nudge to re-seed)
 * but do not fail the run: a paragraph reworded in passing should not turn the build red.
 * `--seed` rewrites the file, dropping the stale entries — that is the shrink.
 * ---------------------------------------------------------------------------------------------
 */
import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { createHash } from "crypto";
import { join, resolve, relative, dirname } from "path";
import { fileURLToPath } from "url";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const SEED = args.includes("--seed");
const ROOT = resolve(args.find((a) => !a.startsWith("--")) ?? join(SCRIPT_DIR, ".."));
const RECORDS_DIR = join(ROOT, "srs", "records");

// The registry is the rule set, so it is read from beside THIS script, not from the checked root —
// a fixture tree under tests/guards is checked against the real rules, which is the point of it.
const REGISTRY_PATH = join(SCRIPT_DIR, "spec-language-registry.json");
// The allowlist is per-corpus grandfathering, so it IS root-relative (the check-rfc-integration
// convention): a fixture root carries no allowlist and every violation in it is reported.
const ALLOWLIST_PATH = join(ROOT, "scripts", "spec-language-allowlist.json");

const RFC_2119 = /\b(?:MUST NOT|SHALL NOT|SHOULD NOT|MUST|SHALL|SHOULD|MAY|REQUIRED|RECOMMENDED|OPTIONAL)\b/g;

const STOPWORDS = new Set(
  "a an and are as at be by for from has have in into is it its of on or that the this to with".split(" "),
);

const loadJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const digest = (text) => createHash("sha256").update(text).digest("hex").slice(0, 8);
const clip = (text, n = 90) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n)}…` : flat;
};

/**
 * Split a prose field into paragraphs.
 *
 * Blank lines separate paragraphs, and — the part a naive `split(/\n\n/)` gets wrong — a markdown
 * list item or table row is its own paragraph. Without that, a twenty-row table with one em-dash
 * per row reads as a single paragraph with twenty em-dashes and every table in the corpus becomes
 * a violation, which would be a bug in the checker rather than a finding about the prose.
 */
function paragraphs(text) {
  const out = [];
  let current = [];
  const flush = () => {
    const joined = current.join("\n").trim();
    if (joined) out.push(joined);
    current = [];
  };
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") {
      flush();
      continue;
    }
    if (/^\s*(?:[-*+]\s|\d+\.\s|\|)/.test(line)) {
      flush();
      out.push(line.trim());
      continue;
    }
    current.push(line);
  }
  flush();
  return out;
}

const contentWords = (text) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !STOPWORDS.has(w)),
  );

const firstSentence = (text) => {
  const body = text.replace(/^\s*#{1,6}\s+.*$/gm, "").trim();
  const match = /^[\s\S]*?[.!?](?:\s|$)/.exec(body);
  return (match ? match[0] : body).trim();
};

async function walkRecords(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkRecords(abs)));
    else if (entry.name.endsWith(".json")) out.push(abs);
  }
  return out;
}

async function main() {
  const registry = await loadJson(REGISTRY_PATH);
  const proseFields = new Set(registry.proseFields);
  const normativeFields = new Set(registry.normativeSites?.fields ?? []);
  const normativeRoles = new Set(registry.normativeSites?.expositionRoles ?? []);
  const limits = registry.limits ?? {};
  const codeRules = new Set(
    (registry.rules ?? []).filter((r) => r.enforcement === "code").map((r) => r.id),
  );
  const compiled = (registry.patterns ?? []).map((p) => ({
    ...p,
    re: new RegExp(p.pattern, p.flags.includes("g") ? p.flags : `${p.flags}g`),
  }));

  let allowed = {};
  if (existsSync(ALLOWLIST_PATH)) {
    allowed = (await loadJson(ALLOWLIST_PATH)).grandfathered ?? {};
  }

  const files = (await walkRecords(RECORDS_DIR)).sort();
  const violations = []; // { key, file, field, rule, matched, substitution }
  let fieldsChecked = 0;

  const report = (file, field, rule, matched, substitution, siteKey = "") => {
    violations.push({
      key: `${file}#${field}#${rule}${siteKey ? `#${siteKey}` : ""}`,
      file,
      field,
      rule,
      matched: clip(matched),
      substitution,
    });
  };

  for (const abs of files) {
    const relPath = relative(ROOT, abs).split("\\").join("/");
    let record;
    try {
      record = await loadJson(abs);
    } catch {
      continue; // structural load failures are validate-records.mjs's job
    }
    const fv = record.fieldValues;
    if (!fv || typeof fv !== "object") continue;
    const title = typeof fv.title === "string" ? fv.title : "";
    const role = typeof fv.exposition_role === "string" ? fv.exposition_role : null;

    for (const [field, value] of Object.entries(fv)) {
      // RULING 1: `title` is not a prose field in the registry, so it is not checked here.
      if (!proseFields.has(field) || typeof value !== "string" || value.trim() === "") continue;
      fieldsChecked++;
      const isNormative = normativeFields.has(field) || (role !== null && normativeRoles.has(role));

      // --- registry `patterns` -----------------------------------------------------------------
      for (const p of compiled) {
        if (p.scope === "normative" && !isNormative) continue;
        for (const m of value.matchAll(p.re)) {
          if (!m[0].trim()) continue;
          report(relPath, field, p.id, m[0], p.substitution, digest(m[0].trim().toLowerCase()));
        }
      }

      // --- rule: word-budget -------------------------------------------------------------------
      if (codeRules.has("word-budget")) {
        const words = value.split(/\s+/).filter(Boolean).length;
        if (words > limits.contentWords) {
          report(
            relPath,
            field,
            "word-budget",
            `${words} words (limit ${limits.contentWords})`,
            "Split into child records, or move the worked example into a typed `example` record.",
          );
        }
      }

      // --- rule: em-dash-cap (RULING 2 — per paragraph, not per file) --------------------------
      if (codeRules.has("em-dash-cap")) {
        const cap = isNormative
          ? (limits.emDashesInNormativeStatement ?? 0)
          : (limits.emDashesPerParagraph ?? 1);
        for (const para of paragraphs(value)) {
          const count = (para.match(/—/g) ?? []).length;
          if (count > cap) {
            report(
              relPath,
              field,
              "em-dash-cap",
              `${count} em-dashes in one paragraph (cap ${cap}): ${para}`,
              isNormative
                ? "A normative statement carries no em-dash. Recast as a plain clause, or split the sentence."
                : "Keep one em-dash in this paragraph and recast the rest as commas, colons, or separate sentences.",
              digest(para),
            );
          }
        }
      }

      // --- rule: keyword-register --------------------------------------------------------------
      // #559 (exposition_role) has not landed, so `normative_statement` is the only normative
      // signal today — exactly what the registry's normativeSites comment says to expect.
      //
      // #626: keyed by paragraph text + keyword + ordinal WITHIN THE PARAGRAPH, never by the
      // match's character offset into the whole field. A field-relative offset shifts for every
      // keyword site whenever earlier prose in the same field is edited, so a one-word fix
      // anywhere upstream re-fired every later, untouched allowlist entry (srs#626). Keying
      // relative to the paragraph — the same unit em-dash-cap already uses — means only edits to
      // that paragraph itself change its sites, matching RULING 2's intent.
      if (codeRules.has("keyword-register") && !isNormative) {
        for (const para of paragraphs(value)) {
          const matches = [...para.matchAll(RFC_2119)];
          matches.forEach((m, ordinal) => {
            report(
              relPath,
              field,
              "keyword-register",
              m[0],
              "RFC 2119 keywords belong in a normative_statement field. Describe the behaviour here, or move the requirement.",
              digest(`${para}:${m[0]}:${ordinal}`),
            );
          });
        }
      }

      // --- rule: heading-restatement -----------------------------------------------------------
      if (codeRules.has("heading-restatement") && title) {
        const titleWords = contentWords(title);
        const openingWords = contentWords(firstSentence(value));
        if (titleWords.size >= 2 && [...titleWords].every((w) => openingWords.has(w))) {
          report(
            relPath,
            field,
            "heading-restatement",
            firstSentence(value),
            `The opening sentence restates the title ("${title}"). Delete it and open with the first fact.`,
          );
        }
      }

      // --- rule: bold-lead-in-uniformity -------------------------------------------------------
      if (codeRules.has("bold-lead-in-uniformity")) {
        const bullets = value.split(/\r?\n/).filter((l) => /^\s*[-*]\s+\S/.test(l));
        const bold = bullets.filter((l) => /^\s*[-*]\s+\*\*[^*]+\*\*\s*:/.test(l));
        if (bullets.length >= 3 && bold.length === bullets.length) {
          report(
            relPath,
            field,
            "bold-lead-in-uniformity",
            `all ${bullets.length} bullets open with a bold lead-in and a colon`,
            "Not every bullet needs a bold lead-in. Write the ones that are plain sentences as plain sentences.",
          );
        }
      }
    }
  }

  // Fail-open guard (the house pattern): a walk that read nothing is not a corpus that is clean.
  if (files.length === 0 || fieldsChecked === 0) {
    console.log(
      `\n✗ No prose fields found under ${RECORDS_DIR} — refusing to report success. ` +
        `(${files.length} record file(s) walked, ${fieldsChecked} prose field(s) read.)`,
    );
    process.exit(1);
    return;
  }

  if (SEED) {
    const grandfathered = {};
    for (const v of violations.sort((a, b) => a.key.localeCompare(b.key))) {
      grandfathered[v.key] = { issue: "the-greenman/srs#563", rule: v.rule, matched: v.matched };
    }
    await mkdir(dirname(ALLOWLIST_PATH), { recursive: true });
    await writeFile(
      ALLOWLIST_PATH,
      `${JSON.stringify(
        {
          $comment:
            "Grandfathered spec-language violations (srs#569), seeded from the corpus as it stood " +
            "when scripts/check-spec-language.mjs landed. Each key is `<record path>#<field>#<rule " +
            "id>[#<site digest>]` — a SITE, not a file: for em-dash-cap the digest identifies one " +
            "offending paragraph, so a compliant paragraph in the same field is not covered and a " +
            "new violation elsewhere in it is still caught. Every entry cites the issue that " +
            "retires it. Shrinking this file IS the migration (#563 empties it for Parts I-IV); " +
            "nothing may be added here without an issue reference. Re-seed with " +
            "`node scripts/check-spec-language.mjs --seed` after a batch of fixes.",
          version: 1,
          grandfathered,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Seeded ${Object.keys(grandfathered).length} allowlist entries to ${ALLOWLIST_PATH}`);
    const byRule = {};
    for (const v of violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
    for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(4)}  ${rule}`);
    }
    return;
  }

  const live = violations.filter((v) => !(v.key in allowed));
  const seen = new Set(violations.map((v) => v.key));
  const stale = Object.keys(allowed).filter((k) => !seen.has(k));

  if (live.length > 0) {
    console.log("Checking spec language... FAILED");
    for (const v of live) {
      console.log(`  ✗ ${v.file} · ${v.field} · ${v.rule}`);
      console.log(`      found: ${v.matched}`);
      console.log(`      fix:   ${v.substitution}`);
    }
    console.log(
      `\nFAILED: ${live.length} spec-language violation(s) across ${fieldsChecked} prose field(s). ` +
        `Rules live in scripts/spec-language-registry.json; docs/style/spec-language-guide.md ` +
        `explains them. A site that is genuinely grandfathered goes in ` +
        `scripts/spec-language-allowlist.json with an issue reference — never without one.`,
    );
    process.exit(1);
    return;
  }

  const staleNote = stale.length > 0 ? `; ${stale.length} stale allowlist entr(y|ies) — re-seed to shrink` : "";
  console.log(
    `Checking spec language... OK (${fieldsChecked} prose fields in ${files.length} records; ` +
      `${Object.keys(allowed).length} grandfathered site(s)${staleNote})`,
  );
}

main().catch((error) => {
  console.log(`\nFAILED: ${error.message}`);
  process.exit(1);
});
