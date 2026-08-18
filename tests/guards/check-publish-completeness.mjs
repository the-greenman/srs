// srs#396 — negative test for scripts/lib/publish-completeness.mjs.
//
// Guards-house-style (tests/guards/run.mjs): drive the real check against a sabotaged fixture,
// assert it fails naming the offender, then assert the same check passes once the sabotage is
// undone. Folded into check-release-drift.mjs's own run (rather than the CLI-independent
// tests/guards/run.mjs suite validate-all.mjs runs standalone) because the guard needs a fresh
// pinned-CLI render, which check-release-drift.mjs has already produced by the time this runs —
// reusing it costs nothing extra.
//
// The sabotage reproduces srs#396 exactly: delete the "### Extension Interactions" section (the
// content the old `next '---'` scan discarded) from an otherwise-real committed export, on disk in
// a temp copy — the real committed file is never touched.
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { checkPublishCompleteness } from "../../scripts/lib/publish-completeness.mjs";

export async function testPublishCompletenessGuard(entries, rawContentsById, exemptCounts) {
  const targets = entries.filter((e) => e.requiresKeyInvariants);
  if (targets.length === 0) throw new Error("no requiresKeyInvariants entry available to sabotage");

  const tempDir = await mkdtemp(join(tmpdir(), "srs-completeness-guard-test-"));
  try {
    // Every requiresKeyInvariants export, not just the first — each is a distinct rendered
    // document and a guard regression could be specific to one of them.
    for (const target of targets) {
      const real = await readFile(target.output, "utf8");
      const sabotaged = real.replace(/\n### Extension Interactions\n[\s\S]*?\n(?=### Conformance)/, "\n");
      if (sabotaged === real) {
        throw new Error(
          `sabotage fixture made no change to ${target.output} — "### Extension Interactions" or ` +
            `"### Conformance" may have moved; update the fixture pattern`
        );
      }

      const sabotagedPath = join(tempDir, `sabotaged-${targets.indexOf(target)}.md`);
      await writeFile(sabotagedPath, sabotaged, "utf8");

      let rejected = false;
      let message = "";
      try {
        await checkPublishCompleteness([{ ...target, output: sabotagedPath }], rawContentsById, exemptCounts);
      } catch (error) {
        rejected = true;
        message = error.message;
      }
      if (!rejected) {
        throw new Error(`checkPublishCompleteness did not reject the sabotaged ${target.output} (missing Extension Interactions)`);
      }
      if (!message.includes("Extension Interactions")) {
        throw new Error(`checkPublishCompleteness rejected the sabotage but did not name the missing heading: ${message}`);
      }
      console.log(`  ✓ rejects ${target.output} missing a renderer-emitted section (sabotage)`);
    }

    // Same entries/raw content, real (unsabotaged) committed files: must pass.
    await checkPublishCompleteness(targets, rawContentsById, exemptCounts);
    console.log("  ✓ accepts the real, unmodified committed exports");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
