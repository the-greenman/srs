# Hosting srs.semanticops.com

This is an operator note. It is excluded from the Worker's assets (`docs/.assetsignore`) and describes how the site is served, how to move it from GitHub Pages to a Cloudflare Worker, and how to move back.

## How it is served

Every file under `docs/` is published at the same path under `https://srs.semanticops.com/`. The JSON Schemas at `/schema/2.0/<name>.json` are `$id` and `$schema` identifiers used across many repositories, so no URL, body, `Content-Type` or CORS header may change.

- **Today:** GitHub Pages, from `docs/` on `master` (`CNAME`, `docs/CNAME`, `docs/.nojekyll`).
- **Target:** Cloudflare Workers static assets. `wrangler.jsonc` at the repo root declares an assets-only Worker named `srs-semanticops-com` that serves `./docs`. `docs/_headers` restores the headers Pages sends. `docs/.assetsignore` keeps Pages-only files and this note out of the assets; dot-directories such as `spec/examples/gallery-project-v2/.srs/` are served, as on Pages.

`wrangler.jsonc` is host-binding config, the same class as `CNAME`. It carries no spec content.

## Staging check

1. Owner: `npx wrangler@4.147.0 deploy` from the repo root. With no route and `workers_dev: true` this publishes only to `https://srs-semanticops-com.<account>.workers.dev`.
2. `node scripts/check-hosting-parity.mjs https://srs-semanticops-com.<account>.workers.dev`

The script walks every file under `docs/` and compares status, `Content-Type`, `Access-Control-Allow-Origin` and the SHA-256 of the body between Pages and the staging Worker. It exits non-zero on any mismatch. Differences that are intended are listed by the script and are not failures.

## Cutover

1. One PR: set `workers_dev` to `false` and add `"routes": [{ "pattern": "srs.semanticops.com/*", "zone_name": "semanticops.com" }]` to `wrangler.jsonc`. The existing proxied DNS record for `srs.semanticops.com` stays as it is; the route takes the traffic ahead of the Pages origin.
2. Owner: deploy. Spot-check `https://srs.semanticops.com/schema/2.0/record.json` (same body, `application/json; charset=utf-8`, `Access-Control-Allow-Origin: *`).
3. Soak. Keep GitHub Pages enabled during the soak; it is the rollback target.
4. Retire Pages: disable Pages for the repository, delete `CNAME` and `docs/CNAME`, delete `docs/.nojekyll`, and drop their lines from `docs/.assetsignore`.

## Rollback

Delete the route (remove the `routes` entry and deploy, or delete the route in the Cloudflare dashboard). Traffic falls back to the proxied DNS record, which still points at GitHub Pages. This works only while Pages is enabled, so do not do step 4 until the soak is over.
