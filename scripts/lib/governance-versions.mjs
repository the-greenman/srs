// governance-versions.mjs — single source of truth for "which published
// com.mudemocracy.governance version is CURRENT" (srs#550).
//
// build-governance-seed.mjs's --check mode and tests/governance-seed-drift/run.mjs both need this
// answer and must never compute it two different ways — a second copy is a second thing to forget
// to update on republish, which is the defect class srs#548 already produced once (a stale shipped
// seed nobody noticed until srs#163's fresh-install evidence caught it).
import { readdirSync } from "fs";
import { join } from "path";

const VERSION_DIR_RE = /^\d+\.\d+\.\d+$/;

/**
 * The highest semver-named version directory under packages/com.mudemocracy.governance — i.e. the
 * CURRENT published governance package version. Every other version directory is exempt from the
 * srs#550 seed-drift gate as published history (a historical seed is not supposed to match a fresh
 * build off today's package/ tree; it is a snapshot of what shipped at the time).
 */
export function latestGovernanceVersion(repoRoot) {
  const dir = join(repoRoot, "packages", "com.mudemocracy.governance");
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    throw new Error(`cannot list governance package versions in ${dir}: ${error.message}`);
  }
  const versions = entries.filter((e) => e.isDirectory() && VERSION_DIR_RE.test(e.name)).map((e) => e.name);
  if (versions.length === 0) {
    throw new Error(`no version directories (X.Y.Z) found under ${dir}`);
  }
  versions.sort((a, b) => {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pa[i] - pb[i];
    }
    return 0;
  });
  return versions[versions.length - 1];
}
