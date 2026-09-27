#!/usr/bin/env node
/**
 * tests/idempotency/run.mjs — regression guard for srs#801's non-idempotency defect.
 *
 * `injectKeyInvariants` and `injectExtensionIndex` (scripts/lib/invariant-region.mjs,
 * scripts/lib/extension-index-region.mjs) each splice generated content into an already-rendered
 * markdown file. The pre-fix `injectKeyInvariants` appended unconditionally with no removal path;
 * a second call over its own output (which is exactly what happens if `publish-spec.mjs`'s
 * `renderDocumentViews()` step is ever skipped, or the functions are invoked directly outside the
 * full pipeline) duplicated the section instead of replacing it — proven by the committed
 * `docs/spec/srs-spec.md` on branch `docs/801-x1-reference-material`, which carried two copies of
 * "## Key Invariants (generated index)" before this fix. `injectExtensionIndex` had the same defect
 * class: its anchor text is never consumed, so a second call inserts a second table after it.
 *
 * This is a Node-only unit check over the pure functions (fast, no CLI, no repo state) rather than
 * a full two-run `publish-spec.mjs` diff — that end-to-end proof is documented in the PR body, but
 * is too slow to run on every `validate-all.mjs` invocation. This check is the thing that fails
 * fast and locally if the region-boundary logic regresses.
 *
 *   node tests/idempotency/run.mjs
 */
import { injectKeyInvariants } from "../../scripts/lib/invariant-region.mjs";
import { injectExtensionIndex } from "../../scripts/lib/extension-index-region.mjs";

let fail = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    fail++;
  }
}

// --- injectKeyInvariants ---------------------------------------------------------------------
{
  const base = "# Doc\n\nSome content.\n";
  const injected = "*Generated index.*\n\n#### Group\n\n- **1.** An invariant.\n";

  const once = injectKeyInvariants(base, injected);
  const twice = injectKeyInvariants(once, injected);

  check("injectKeyInvariants: single call succeeds", once !== null);
  check("injectKeyInvariants: repeat call is idempotent (byte-identical)", once === twice);
  check(
    "injectKeyInvariants: repeat call does not duplicate the heading",
    (twice.match(/## Key Invariants \(generated index\)/g) ?? []).length === 1
  );
  // Re-running with DIFFERENT generated content (the normal case — invariant records changed
  // between renders) must replace, not accumulate.
  const changedInjected = "*Generated index.*\n\n#### Different Group\n\n- **2.** A different invariant.\n";
  const replaced = injectKeyInvariants(once, changedInjected);
  check(
    "injectKeyInvariants: re-injection with changed content replaces the old body",
    replaced.includes("Different Group") && !replaced.includes("- **1.** An invariant.")
  );
}

// --- injectExtensionIndex ---------------------------------------------------------------------
{
  const base =
    "# Doc\n\nExtensions are optional, independently adoptable capability modules. " +
    "Each declares its identifier, dependencies, and the types it defines.\n\nMore text after.\n";
  const injected = "| Extension | Identifier | Depends on |\n|---|---|---|\n| Foo | `ext:foo` | — |\n";

  const once = injectExtensionIndex(base, injected);
  const twice = injectExtensionIndex(once, injected);

  check("injectExtensionIndex: single call succeeds", once !== null);
  check("injectExtensionIndex: repeat call is idempotent (byte-identical)", once === twice);
  check(
    "injectExtensionIndex: repeat call does not duplicate the table",
    (twice.match(/\| Extension \| Identifier \| Depends on \|/g) ?? []).length === 1
  );
  const changedInjected = "| Extension | Identifier | Depends on |\n|---|---|---|\n| Bar | `ext:bar` | — |\n";
  const replaced = injectExtensionIndex(once, changedInjected);
  check(
    "injectExtensionIndex: re-injection with changed content replaces the old body",
    replaced.includes("ext:bar") && !replaced.includes("ext:foo")
  );
  check(
    "injectExtensionIndex: anchor text still present exactly once after re-injection",
    (replaced.match(/Extensions are optional, independently adoptable capability modules\./g) ?? []).length === 1
  );
}

if (fail > 0) {
  console.error(`\n${fail} idempotency check(s) failed.`);
  process.exit(1);
}
console.log("\nAll idempotency checks passed.");
