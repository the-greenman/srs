#!/usr/bin/env node
/**
 * tests/hosting-parity/run.mjs: scripts/check-hosting-parity.mjs passes on identical hosts and
 * fails, naming the URL, on each kind of drift it exists to catch. Offline: two local HTTP
 * servers stand in for the incumbent (A) and the candidate (B) host.
 *
 *   node tests/hosting-parity/run.mjs
 */
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "../../scripts/check-hosting-parity.mjs");
const root = await mkdtemp(join(tmpdir(), "hosting-parity-"));
await mkdir(join(root, "schema"), { recursive: true });
await mkdir(join(root, "strategy"));
for (const [f, body] of [["index.html", "home"], ["strategy/index.html", "map"], ["schema/x.json", "{}"], ["CNAME", "ignored"], [".assetsignore", "/CNAME\n"]]) {
  await writeFile(join(root, f), body);
}

// A host answers each URL from `pages`; `tweak(path, reply)` lets one case drift.
const host = (tweak = (_p, r) => r) => {
  const pages = { "/": "home", "/index.html": "home", "/strategy/": "map", "/strategy/index.html": "map", "/schema/x.json": "{}" };
  const server = createServer((req, res) => {
    const base = { status: 404, type: "text/html", body: "404", cors: "*" };
    const hit = pages[req.url];
    if (hit !== undefined) Object.assign(base, { status: 200, body: hit, type: req.url.endsWith(".json") ? "application/json; charset=utf-8" : "text/html; charset=utf-8" });
    if (req.url === "/strategy") Object.assign(base, { status: 301, body: "", headers: { location: "/strategy/" } });
    const r = tweak(req.url, base);
    res.writeHead(r.status, { "content-type": r.type, ...(r.cors && { "access-control-allow-origin": r.cors }), ...r.headers });
    res.end(r.body);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ server, url: `http://127.0.0.1:${server.address().port}` })));
};

const run = (a, b) => new Promise((ok) =>
  execFile("node", [SCRIPT, b, "--a", a, "--root", root], (err, stdout, stderr) => ok({ code: err ? err.code : 0, out: stdout + stderr })));

let failures = 0;
const A = await host();
for (const [label, tweak, exit, contains] of [
  ["identical hosts pass (CNAME is ignored by .assetsignore)", undefined, 0, "OK: no mismatches"],
  ["a changed body fails", (p, r) => (p === "/schema/x.json" ? { ...r, body: '{"a":1}' } : r), 1, "/schema/x.json"],
  ["a missing CORS header fails", (p, r) => (p === "/" ? { ...r, cors: "" } : r), 1, "access-control-allow-origin"],
  ["a wrong content type fails", (p, r) => (p === "/schema/x.json" ? { ...r, type: "application/json" } : r), 1, "content-type"],
  ["a missing directory index fails", (p, r) => (p === "/strategy/" ? { ...r, status: 404 } : r), 1, "/strategy/"],
  ["a missing /dir redirect fails", (p, r) => (p === "/strategy" ? { ...r, status: 404, headers: {} } : r), 1, "/strategy"],
  ["a 200 for a missing path fails", (p, r) => (r.status === 404 ? { ...r, status: 200 } : r), 1, "__parity-no-such-path__"],
]) {
  const B = await host(tweak);
  const { code, out } = await run(A.url, B.url);
  const ok = code === exit && out.includes(contains);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `\n  exit ${code}, expected ${exit}; wanted ${JSON.stringify(contains)} in:\n${out}`}`);
  B.server.close();
}
A.server.close();
await rm(root, { recursive: true });
console.log(failures ? `\n${failures} case(s) failed` : "\nall hosting-parity cases passed");
process.exit(failures ? 1 : 0);
