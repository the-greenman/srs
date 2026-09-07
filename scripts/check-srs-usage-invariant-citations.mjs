#!/usr/bin/env node
/**
 * check-srs-usage-invariant-citations.mjs — every `I-<n>` invariant citation in `srs-usage.md`
 * resolves to a real, live `com.semanticops.spec/invariant` record (#490 meaning-placement sweep).
 *
 * The defect this closes: `srs-usage.md` is 1,800+ lines of agent-normative prose that cites specific
 * invariant numbers ("I-78", "I-63", "I-132", ...) as authority for the rules it states, and until now
 * nothing checked that those numbers still exist. An invariant can be renumbered or retired (srs#410
 * makes renumbering-on-relocation the ratification act itself) without srs-usage.md's citation of the
 * old number ever going red — the guide would keep citing a number that no longer means anything, and
 * an agent following it would chase a dead reference with no signal that it was already stale.
 *
 * `docs/charter/decision-compass.md` already has exactly this shape of guard for `rfc-decision-<id>`
 * citations (check-decision-compass-drift.mjs, srs#461) — its FORWARD half is the model: every
 * citation in the body must resolve to a record that exists. This check is that same FORWARD rule
 * applied to srs-usage.md's `I-<n>` citations against the invariant corpus, reusing the corpus's own
 * canonical number-loading and normalization (scripts/lib/invariant-numbers.mjs) rather than
 * re-deriving it — the same module check-rfc-integration.mjs's manifest-token check now uses.
 *
 * srs-usage.md has no roster block and is not required to cite every live invariant, so only the
 * FORWARD direction applies here; there is no BACKWARD half to check.
 *
 *   node scripts/check-srs-usage-invariant-citations.mjs [root]   # root defaults to the repo root
 */
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadInvariantNumbers } from "./lib/invariant-numbers.mjs";

// `fileURLToPath`, not `new URL(..).pathname` — the percent-encoding trap the sibling guards
// document against; getting it wrong breaks every run under a checkout path containing a space.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const USAGE_PATH = `${ROOT}/srs-usage.md`;
const REPO_ROOT = `${ROOT}/srs`;

// Citation shape observed in srs-usage.md: "I-78", "I-63", "I-132". Word-boundary-bound so this
// does not also match unrelated hyphenated tokens like "R13" or "N+28".
const CITATION_RE = /\bI-(\d+)\b/g;

async function main() {
  console.log("srs-usage.md invariant citations (#490)");

  let text;
  try {
    text = await readFile(USAGE_PATH, "utf8");
  } catch {
    console.log(`\n✗ ${USAGE_PATH} does not exist.`);
    process.exit(1);
  }

  const liveNumbers = await loadInvariantNumbers(REPO_ROOT);
  if (liveNumbers.size === 0) {
    console.log(`\n✗ No invariant numbers loaded from ${REPO_ROOT} — the walk found nothing, which`);
    console.log(`  means the root is wrong, not that the corpus is empty.`);
    process.exit(1);
  }

  const citations = [...new Set([...text.matchAll(CITATION_RE)].map((m) => m[1]))];
  console.log(`  Citations found: ${citations.length}`);
  console.log(`  Live invariant numbers: ${liveNumbers.size}`);

  const dangling = citations.filter((n) => !liveNumbers.has(String(parseInt(n, 10))));

  if (dangling.length > 0) {
    console.log("");
    for (const n of dangling) {
      console.log(
        `  ✗ srs-usage.md cites I-${n}, but no live com.semanticops.spec/invariant record carries ` +
          `invariant_number ${n}. Fix the citation to the invariant's current number, or remove it if ` +
          `the invariant was retired.`,
      );
    }
    console.log(`\n✗ ${dangling.length} dangling invariant citation(s) found in srs-usage.md.`);
    process.exit(1);
  }

  console.log(`\n✓ Every I-<n> citation in srs-usage.md resolves to a live invariant record.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
