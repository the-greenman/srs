#!/usr/bin/env node
// Fetch the pinned `srs` CLI and print the SRS_CLI_PATH line to use.
//
//   export $(node scripts/fetch-pinned-srs.mjs)
//   node scripts/publish-spec.mjs
//
// The release tag is read from SRS_RUST_CLI_TAG in
// `.github/workflows/release-drift.yml` — the single place it is declared — so
// this helper cannot drift from the gate it exists to satisfy. The constraint
// is an EQUALITY: `docs/spec/**` is rendered by that build and no other, so
// "install the latest release" is wrong, not merely imprecise (issue #337).
//
// Usage:
//   node scripts/fetch-pinned-srs.mjs [--dir <path>] [--asset <name>] [--force]
//
// stdout carries only `SRS_CLI_PATH=<path>` so it can be consumed directly.
// Everything else goes to stderr.

import { chmod, mkdir, rm, stat } from "fs/promises";
import { spawn } from "child_process";
import { join, resolve } from "path";
import { readPinnedTag, sha256File } from "./lib/pinned-srs.mjs";

const REPO = "the-greenman/srs-rust";
const DEFAULT_ASSET = "srs-x86_64-unknown-linux-gnu.tar.gz";
const DEFAULT_DIR = "/tmp/srs-cli";

function parseArgs(argv) {
  const options = { dir: DEFAULT_DIR, asset: DEFAULT_ASSET, force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dir" || arg === "--asset") {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a value`);
      options[arg.slice(2)] = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

function run(cmd, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    // stdout is reserved for the SRS_CLI_PATH line, so a child's stdout is
    // redirected to stderr rather than inherited.
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "inherit"] });
    child.stdout.pipe(process.stderr);
    child.on("error", (error) => rejectPromise(new Error(`${cmd} failed to start: ${error.message}`)));
    child.on("close", (code) =>
      code === 0 ? resolvePromise() : rejectPromise(new Error(`command failed (${code}): ${cmd} ${args.join(" ")}`)),
    );
  });
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function haveGh() {
  try {
    await run("gh", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

async function download(tag, asset, intoDir) {
  const target = join(intoDir, asset);
  await rm(target, { force: true });

  if (await haveGh()) {
    await run("gh", [
      "release",
      "download",
      tag,
      "--repo",
      REPO,
      "--pattern",
      asset,
      "--dir",
      intoDir,
      "--clobber",
    ]);
    return target;
  }

  // No `gh` — fall back to the public release URL. Proxy-restricted sessions
  // and bare containers land here.
  console.error("gh not found; downloading over https");
  await run("curl", [
    "--fail",
    "--location",
    "--silent",
    "--show-error",
    "--output",
    target,
    `https://github.com/${REPO}/releases/download/${tag}/${asset}`,
  ]);
  return target;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const tag = await readPinnedTag();

  // Scope the install by tag: re-running after the pin advances must not reuse
  // the previous build, and reusing the same build must not re-download it.
  const installDir = resolve(options.dir, tag);
  const binary = join(installDir, "srs");

  if (options.force || !(await exists(binary))) {
    console.error(`Fetching ${REPO} ${tag} (${options.asset})`);
    await mkdir(installDir, { recursive: true });
    const archive = await download(tag, options.asset, installDir);
    await run("tar", ["-xzf", archive, "-C", installDir]);
    await chmod(binary, 0o755);
  } else {
    console.error(`Reusing ${binary} (already fetched; --force to re-download)`);
  }

  console.error(`srs-rust release:  ${tag} (pinned by SRS_RUST_CLI_TAG)`);
  console.error(`srs sha256:        ${await sha256File(binary)}`);
  console.error("");
  console.error("Use it with:");
  console.error("  export $(node scripts/fetch-pinned-srs.mjs)");
  console.error("");

  console.log(`SRS_CLI_PATH=${binary}`);
}

main().catch((error) => {
  console.error(`FAILED: ${error.message}`);
  process.exit(1);
});
