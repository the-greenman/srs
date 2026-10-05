#!/usr/bin/env node
/**
 * check-hosting-parity.mjs: does a candidate host serve docs/ exactly as the current one does?
 *
 * srs.semanticops.com is moving from GitHub Pages to a Cloudflare Worker serving docs/
 * (docs/HOSTING.md). Every https://srs.semanticops.com/schema/2.0/<name>.json is a $id/$schema
 * identifier used across many files, so each URL must keep its status, Content-Type, CORS header
 * and body bytes. This walks every file under docs/ and fetches it from both hosts.
 *
 *   node scripts/check-hosting-parity.mjs <B> [--a <A>] [--root <dir>]
 *
 *   B        base URL of the candidate host, e.g. https://srs-semanticops-com.<account>.workers.dev
 *   --a A    base URL of the incumbent (default https://srs.semanticops.com)
 *   --root   directory that defines the URL set (default: docs/ in this repo)
 *
 * Checked per URL: status, content-type, access-control-allow-origin and the sha256 of the body; for a
 * redirect (not followed) only its status and Location path. Also checked: every index.html as a
 * /-terminated URL, its /dir to /dir/ redirect, and one path that does not exist. Files listed in
 * <root>/.assetsignore (plus _headers and .assetsignore) are not served by the Worker and are skipped.
 * Every other header (server, via, cache-control, etag, date, x-*) is deliberately not compared.
 *
 * Differences that are intended are in KNOWN below. They are printed, never failures, and match
 * only the exact values listed, so any further drift still fails.
 *
 * Exit 0: no mismatches. Exit 1: at least one. Exit 2: bad usage or a host that cannot be reached.
 */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COMPARED = ["content-type", "access-control-allow-origin"];
const MISSING = "/__parity-no-such-path__";
const REDIRECTS = new Set([301, 302, 307, 308]);

// [applies to, field, A value, B value, why]
const KNOWN = [
  [(t) => t.file?.endsWith(".srsj"), "content-type", "application/octet-stream", "application/json", "Pages has no .srsj type; the file is JSON"],
  [(t) => t.file?.endsWith(".zip"), "content-type", "application/x-zip-compressed", "application/zip", "Workers uses the registered zip type"],
  [(t) => t.redirect, "status", "301", "307", "Workers redirects /dir to /dir/ with 307, Pages with 301"],
  [(t) => !t.file || t.file.endsWith(".html"), "content-type", "text/html; charset=utf-8", "text/html", "every HTML page declares <meta charset=\"utf-8\">"],
];

function usage(msg) {
  console.error(`${msg}\nusage: node scripts/check-hosting-parity.mjs <B> [--a <A>] [--root <dir>]`);
  process.exit(2);
}

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i < 0 ? dflt : args.splice(i, 2)[1] ?? usage(`${name} needs a value`);
};
const A = opt("--a", "https://srs.semanticops.com").replace(/\/+$/, "");
const ROOT = resolve(opt("--root", join(dirname(fileURLToPath(import.meta.url)), "..", "docs")));
const B = args.shift()?.replace(/\/+$/, "") ?? usage("missing <B>");
if (args.length) usage(`unexpected argument: ${args[0]}`);

async function* walk(dir, rel = "") {
  for (const e of await readdir(join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) yield* walk(dir, r);
    else if (e.isFile()) yield r;
  }
}

// ponytail: literal paths only (what docs/.assetsignore uses), no glob support; add if it grows globs.
async function ignored() {
  const lines = (await readFile(join(ROOT, ".assetsignore"), "utf8").catch(() => "")).split("\n");
  const set = lines.map((l) => l.trim().replace(/^\//, "")).filter((l) => l && !l.startsWith("#"));
  return (rel) => ["_headers", "_redirects", ".assetsignore", ...set].some((p) => rel === p || rel.startsWith(`${p}/`));
}

async function targets() {
  const skip = await ignored();
  const out = [{ path: MISSING, missing: true }];
  for await (const rel of walk(ROOT)) {
    if (skip(rel)) continue;
    const path = encodeURI(`/${rel}`);
    out.push({ path, file: rel });
    if (rel === "index.html" || rel.endsWith("/index.html")) {
      const dir = path.slice(0, -"index.html".length);
      out.push({ path: dir, file: null });
      if (dir !== "/") out.push({ path: dir.slice(0, -1), redirect: true });
    }
  }
  return out;
}

async function get(base, path) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(30000) });
      const body = Buffer.from(await res.arrayBuffer());
      const loc = res.headers.get("location");
      return {
        status: String(res.status),
        "content-type": res.headers.get("content-type") ?? "",
        "access-control-allow-origin": res.headers.get("access-control-allow-origin") ?? "",
        location: loc ? new URL(loc, base + path).pathname : "",
        sha256: createHash("sha256").update(body).digest("hex").slice(0, 16),
      };
    } catch (err) {
      if (attempt) { console.error(`cannot reach ${base}${path}: ${err.message}`); process.exit(2); }
    }
  }
}

function compare(t, a, b) {
  // html_handling auto-trailing-slash redirects an explicit /x.html or /dir/index.html to its clean
  // URL; that clean URL is a target of its own, so this is covered, not lost.
  if (t.file?.endsWith(".html") && a.status === "200" && b.status === "307" && b.location === t.path.replace(/(index)?\.html$/, "")) {
    return { known: [[t.path, "status", "200", "307", "explicit .html redirects to the clean URL"]], bad: [] };
  }
  const known = [], bad = [];
  // A redirect's own body and content-type are boilerplate that differs by host, so only its target counts.
  const fields = REDIRECTS.has(+a.status) ? ["status", "location"] : ["status", ...COMPARED, "sha256"];
  for (const field of fields) {
    if (a[field] === b[field]) continue;
    const k = KNOWN.find(([when, f, av, bv]) => when(t) && f === field && av === a[field] && bv === b[field]);
    (k ? known : bad).push([t.path, field, a[field], b[field], k?.[4]]);
  }
  return { known, bad };
}

const list = await targets();
const results = [];
for (let i = 0; i < list.length; i += 8) {
  results.push(...(await Promise.all(list.slice(i, i + 8).map(async (t) => compare(t, await get(A, t.path), await get(B, t.path))))));
}
const known = results.flatMap((r) => r.known);
const bad = results.flatMap((r) => r.bad);

const table = (rows) => {
  const w = [0, 1, 2, 3].map((c) => Math.max(...rows.map((r) => String(r[c]).length)));
  for (const r of rows) console.log("  " + r.slice(0, 4).map((v, c) => String(v).padEnd(w[c])).join("  ") + (r[4] ? `  (${r[4]})` : ""));
};
console.log(`A ${A}\nB ${B}\n${list.length} URLs from ${ROOT}`);
if (known.length) { console.log(`\nknown differences (${known.length}), not failures:`); table([["path", "field", "A", "B"], ...known]); }
if (bad.length) { console.log(`\nMISMATCHES (${bad.length}):`); table([["path", "field", "A", "B"], ...bad]); }
console.log(bad.length ? `\nFAIL: ${bad.length} mismatch(es)` : "\nOK: no mismatches");
process.exit(bad.length ? 1 : 0);
