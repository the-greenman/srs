---
description: Create, review, and track an RFC for the SRS specification. Runs the full RFC lifecycle autonomously.
argument-hint: <topic description, or issue #N to continue an existing RFC>
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, TodoWrite, WebFetch
---

# /rfc — RFC lifecycle pipeline

You are running the full RFC pipeline for:

> $ARGUMENTS

This command runs **fully autonomously** — do not pause for approval between stages unless a stage explicitly calls for user input. Use TodoWrite to track stages and work through them in order.

All work happens in `srs/`. Run `git` from this directory (`/home/greenman/dev/semanticops/srs/`), never from the `semanticops/` parent (it is not a git repo). The GitHub remote is `the-greenman/srs`.

---

## Stage 0 — Preflight

1. Confirm a commit-signing method is available (commits will fail otherwise). The required check depends on the environment:
   ```bash
   if ssh-add -l 2>/dev/null | grep -q "SHA256:vHuO6si5w3RLL4IJZofWbyvEi42WA2fYX7bM"; then
     echo "OK: local SSH signing key loaded in agent"
   elif [ ! -f "$HOME/.ssh/id_ed25519_git_signing.pub" ]; then
     echo "OK: cloud/remote environment — platform provides its own commit signing, ssh-agent not used"
   else
     echo "SIGNING KEY NOT LOADED — local key file present but not in agent"
   fi
   ```
   - **Local** (the signing key file exists under `~/.ssh`): the key must be loaded in the ssh-agent. If you see `SIGNING KEY NOT LOADED`, **stop** and tell the user — do not bypass signing.
   - **Cloud / remote agent** (no local signing key file, e.g. a scheduled CCR run): the ssh-agent is not used — the platform signs commits with its own method. Proceed; do not stop on the ssh-agent check.

   In both environments use plain `git commit` — never `--no-gpg-sign`.
2. Confirm `gh auth status` succeeds. If not, stop.

## Stage 1 — Determine mode

- If `$ARGUMENTS` references an existing GitHub issue (`#N` or a URL), fetch it with `gh issue view N --repo the-greenman/srs` and use it as the brief. Skip to **Stage 3** if the issue already has an RFC number in its title.
- Otherwise proceed to Stage 2 to draft and file a new RFC.

## Stage 2 — Draft RFC and file GitHub issue

### 2a — Assign RFC number

The `rfcs/` directory is the authoritative numbering registry. Find the highest assigned number from two sources and take the max:

```bash
# 1. Highest number in rfcs/ markdown files
ls rfcs/rfc-*.md 2>/dev/null | grep -oP 'rfc-\K\d+' | sort -n | tail -1

# 2. Highest rfc-number field value in the SRS package records (catches fast-track RFCs
#    that went straight to Stage 6 without a markdown draft)
grep -r '"5a000001-0000-4000-a000-000000000001"' srs/package/records/ -A1 \
  | grep '"value"' | grep -oP '"value": "\K\d+' | sort -n | tail -1
```

Next number = max(result1, result2) + 1. Pad to three digits (e.g. `011`).

**Important:** always create `rfcs/rfc-NNN-<slug>.md` (at minimum a stub) before the PR merges. This file is what future numbering checks read. Even for fast-track RFCs that skip Stages 2–4, the file must exist by Stage 6.

### 2b — Write the RFC draft

Create `srs/rfcs/rfc-NNN-<slug>.md` following this structure **exactly** (do not omit any section, even if the answer is "None"):

```markdown
# RFC-NNN: <Title>

**Status**: Draft (Revision 1)
**Affects**: <comma-separated list of spec entities, extensions, or schemas affected>
**Author**: <from $ARGUMENTS or "design dialogue draft">
**Date**: <today's date, YYYY-MM-DD>

---

## Revision history

| Rev | Date | Summary |
|---|---|---|
| 1 | <today> | Initial draft |

---

## Abstract

<2–4 sentence summary of what this RFC proposes and why it matters.>

---

## Motivation

### Problem 1 — <problem name>

<Problem statement. What breaks, what is underspecified, what is inconsistent, and why it matters.>

### Problem 2 — <if applicable>

---

## Proposed Changes

### Change A — <short label>

<Precise description of the change: new fields, new invariants, modified shapes. Use tables for shape changes. Be specific enough that an implementer can build from this without ambiguity.>

### Change B — <if applicable>

---

## Conformance Rules

> **[R1]** <Rule statement.>
>
> **[R2]** <Rule statement.>

List every normative rule introduced by this RFC. Use MUST/MUST NOT/SHOULD/SHALL consistently.

---

## Schema changes

List every file in `srs/docs/schema/2.0/` that must be added or modified:

| Schema file | Change |
|---|---|
| `field.json` | add `vocabularyRef` property |
| ...  | ... |

If no schema files change, write: **None.**

Schema changes must be synced to:
- `srs-rust/crates/srs-schema/schemas/2.0/` (via `scripts/check-schema-sync.sh`)
- `srs-vscode/schemas/2.0/` (manual copy)

---

## Rationale

<Why these specific changes over alternatives. Tradeoffs made explicit.>

---

## Alternatives Considered

### Alt A — <alternative>

<What it would look like and why it was not chosen.>

---

## Open Questions

1. <Open question, if any. Mark settled questions as resolved in revision history.>

If none remain: **None.**
```

**Critical property of a good RFC draft:**
- Every proposed change must be precise enough to implement without ambiguity.
- Every conformance rule must be verifiable — a reader must be able to test compliance.
- The Schema changes section must be complete — omitting a file here causes implementation drift.
- The RFC must NOT include implementation details for `srs-rust` or `srs-vscode` — those follow once the RFC is accepted.

### 2c — Spec integrity check (internal)

Before filing, self-review the draft for these invariants:

1. **Does not break the fundamental purpose of SRS** — SRS is a semantic document store. Any change must preserve: stable UUIDs as primary keys, field/type/record three-tier model, first-class relations between instances, repository-as-directory layout. A change that would require existing well-formed records to become invalid is a breaking change and must be flagged in the draft.
2. **Schema changes are complete** — every entity mentioned in Proposed Changes that has a file in `srs/docs/schema/2.0/` must appear in the Schema changes table.
3. **Conformance rules are normative** — rules use MUST/MUST NOT/SHOULD, not "should probably" or "ideally".
4. **No circular dependencies** — if this RFC builds on another RFC, that RFC must be listed in Affects and its status noted (Accepted / in-progress).

### 2d — File the GitHub issue

```bash
gh issue create \
  --repo the-greenman/srs \
  --title "RFC-NNN: <Title>" \
  --label "rfc" \
  --body-file srs/rfcs/rfc-NNN-<slug>.md
```

Capture the issue number. Add a note at the top of the RFC file (before the title) referencing the issue:

```markdown
> **GitHub issue**: [the-greenman/srs#<N>](https://github.com/the-greenman/srs/issues/<N>)
```

**Important:** at this stage the RFC file lives in the working tree but is **not committed**. RFC files are only committed to a branch when work is started (Stage 5). The GitHub issue is the living record until then.

---

## Stage 3 — Agent review

Spawn the following agents **in parallel** (one Agent call, multiple invokes). All are read-only. Each returns numbered findings with severity (`blocking` / `should-fix` / `nit`).

### Spec Integrity Reviewer

Brief:
> Read `srs/rfcs/rfc-NNN-<slug>.md`. Your job is to verify this RFC does not break the fundamental purpose of SRS as a semantic document store. Check:
>
> 1. **Foundation invariants** — stable UUIDs as primary identity; Field/Type/Record three-tier model preserved; Relations remain first-class typed edges between instances; repository-as-directory layout intact.
> 2. **Breaking changes** — would existing well-formed records become invalid? If so, is a migration path specified?
> 3. **Schema completeness** — does the "Schema changes" section account for every entity shape mentioned in Proposed Changes? Cross-reference `srs/docs/schema/2.0/` file list.
> 4. **Conformance rule quality** — are all rules normative (MUST/MUST NOT/SHOULD)? Are any rules untestable?
> 5. **Internal consistency** — do any two sections contradict each other?
>
> For each finding: severity, the specific section/rule/field at issue, and a concrete suggested fix.

### RFC Completeness Reviewer

Brief:
> Read `srs/rfcs/rfc-NNN-<slug>.md`. Your job is to verify the RFC is complete and actionable as a standalone specification document. Check:
>
> 1. **Implementability** — could an engineer implement this without reading another document? Flag every place where the change is underspecified.
> 2. **Open questions** — are open questions actually open, or have they been resolved in the text but not closed?
> 3. **Rationale completeness** — is every significant design choice explained? Are obvious alternatives addressed?
> 4. **Cross-RFC compatibility** — does this RFC build on or conflict with any prior RFC (001–006)?  Reference `srs/rfcs/` to check.
> 5. **Section structure** — are any required sections (Abstract, Motivation, Proposed Changes, Conformance Rules, Schema changes, Rationale, Alternatives Considered, Open Questions) missing or empty?
>
> For each finding: severity, the specific section, and a concrete suggested fix.

### Post findings

Post all findings as comments on the GitHub issue (one comment per reviewer, clearly attributed):
```bash
gh issue comment <N> --repo the-greenman/srs --body "<Spec Integrity Reviewer findings>"
gh issue comment <N> --repo the-greenman/srs --body "<RFC Completeness Reviewer findings>"
```

---

## Stage 4 — Respond and revise

1. Work through every `blocking` and `should-fix` finding:
   - Update the RFC file in `srs/rfcs/rfc-NNN-<slug>.md`.
   - Increment the revision number in the Status line and add a row to the Revision history table.
2. For findings you decline, post an issue comment explaining why.
3. Re-sync the RFC to the issue body:
   ```bash
   gh issue edit <N> --repo the-greenman/srs --body-file srs/rfcs/rfc-NNN-<slug>.md
   ```
4. **Loop:** if the last review produced any `blocking` finding, re-run both reviewers on the updated RFC. Repeat until a pass yields zero blocking findings.

**Design decision pause:** if any finding or revision exposes a decision with long-term consequences for the SRS data model (e.g. a new canonical field name, a new extension dependency, a change to UUID semantics), present it clearly to the user with trade-offs and **wait for their input** before continuing.

---

## Stage 5 — Start work: branch and commit the RFC file

This stage runs only when the RFC is **accepted** (status set to Accepted in the issue) and implementation is ready to begin.

### 5a — Create feature branch

```bash
cd srs
git worktree add ../.worktrees/rfc-NNN-<slug> -b rfc/NNN-<slug>
```

### 5b — Commit the RFC file

The RFC file has been living in the working tree since Stage 2. Now commit it:
```bash
cd ../.worktrees/rfc-NNN-<slug>
git add rfcs/rfc-NNN-<slug>.md
git commit -m "feat: add RFC-NNN <title> (#<issue-N>)"
```

Use plain `git commit` — never `--no-gpg-sign`.

### 5c — Update schema files (if schema changes are required)

Edit the canonical schema in **this repo only**. For every file listed in the RFC's Schema changes table:

1. Edit `srs/docs/schema/2.0/<file>.json` on the RFC branch. This is the single source of truth.
2. Commit it on the RFC branch with a message referencing the RFC issue number.

**Do not edit `srs-rust` or `srs-vscode` schema mirrors in this session, and do not coordinate sibling branches.** In a cloud session those repos are not checked out. When this PR merges, `srs` `release.yml` publishes `schemas-2.0.tar.gz`; each mirror repo refreshes itself from that artifact via its own `sync-schemas-from-spec.sh` / CI, and the release-drift CI enforces consistency. Optionally file a best-effort mirror-sync tracking issue in `the-greenman/srs-rust` and `the-greenman/srs-vscode` linking this RFC — do not reach into their trees.

### 5d — Update the RFC status

In `srs/rfcs/rfc-NNN-<slug>.md`, update the Status line:
```
**Status**: In Progress (Revision N)
```
Add a row to the Revision history: `N | <date> | Implementation started; RFC file committed to branch rfc/NNN-<slug>`.

Commit the status update and push:
```bash
git add rfcs/rfc-NNN-<slug>.md
git commit -m "docs: RFC-NNN status → In Progress (#<issue-N>)"
git push -u origin rfc/NNN-<slug>
```

### 5e — Open a PR for the RFC branch

```bash
gh pr create \
  --repo the-greenman/srs \
  --base main \
  --title "RFC-NNN: <Title>" \
  --body "$(cat <<'EOF'
Adds RFC-NNN and associated schema changes.

Closes #<issue-N>

## Schema changes
<bullet list from the RFC's Schema changes table, or "None">

## Review checklist
- [ ] Spec integrity review passed (zero blocking findings)
- [ ] RFC Completeness review passed (zero blocking findings)
- [ ] Schema sync check passes (scripts/check-schema-sync.sh exits 0)
- [ ] All conformance rules are normative

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Stage 6 — Merge into spec: author records and re-render

This stage runs **after the RFC branch PR is merged to main** (or as part of the same branch if the spec records can be written before the PR is opened — they may be committed on the same RFC branch).

The goal: the RFC's proposed changes must be reflected as SRS records in `srs/srs/`, not just as a Markdown file in `rfcs/`. The spec is the records; the RFC file is a design document. Both must exist after acceptance.

### 6a — Understand the existing spec structure

Before writing any records, run the discovery ladder:

```bash
srs repo validate --repo srs/srs --pretty        # confirm 0 errors before touching anything
srs type list --repo srs/srs --pretty             # see all available types
srs record list --repo srs/srs --type com.semanticops.spec/section --pretty
srs relation list --repo srs/srs --pretty         # ordering relations
```

Read `srs/srs-usage.md` for the authoritative agentic write workflow before creating any records.

### 6b — Author spec records

For each substantive change the RFC introduces, create the corresponding spec record. Common patterns:

**New entity (Field, Type, extension, invariant):**
```bash
# Find the correct section to place the record under
srs record list --repo srs/srs --type com.semanticops.spec/section --pretty

# Create the record — pipe JSON matching the type's field schema
echo '{"typeId": "<type-uuid>", "typeVersion": 1, "fieldValues": {"title": "...", "body": "..."}}' \
  | srs record create --repo srs/srs

# Assert ordering: place it after its predecessor section/subsection
srs relation create --repo srs/srs --type precedes \
  --from <predecessor-instanceId> --to <new-instanceId>
```

**New invariant:**
- Type: `com.semanticops.spec/invariant`
- Place inside the relevant section via a `contains` relation

**New extension entry:**
- Type: `com.semanticops.spec/extension`

Use only the types that already exist in the spec repo (`srs type list`). Do not invent new types — if a new spec meta-type is needed, that is itself an RFC-level decision.

After each record creation:
```bash
srs repo validate --repo srs/srs --pretty
# Must be 0 errors before continuing
```

### 6c — Update the RFC file status

In `srs/rfcs/rfc-NNN-<slug>.md`, update:
```
**Status**: Accepted (Revision N)
```
Add a revision history row: `N | <date> | Accepted; spec records authored in srs/srs`.

### 6d — Publish (validate + render)

Run the publish pipeline from the `srs/` repo root:

```bash
node scripts/publish-spec.mjs
```

The parts that matter for this single-repo session:
1. Runs `validate-all.mjs` — all validations must pass (this now includes `check-rfc-integration.mjs`, the RFC → canonical-spec drift gate, and `validate-rfc-process.mjs`)
2. Runs `srs repo validate` — 0 errors required
3. Renders all document views to `docs/spec/` (incl. `docs/spec/rfcs/rfc-catalog.md`) via `srs render document-view`
4. Runs `check-release-drift.mjs` — must report **OK** for the `srs` artifacts

The RFC integration gate (`scripts/check-rfc-integration.mjs`, issue #204) will **fail** here if this RFC is `accepted`/`implemented` but its record declares no resolving integration manifest (see 6f), or if the `.md` `**Status**:` line disagrees with the record `rfc-status`. Fix the record — do not weaken the gate.

**Sibling schema mirrors are not this session's responsibility.** In a cloud session `../srs-rust` and `../srs-vscode` are not checked out, so any mirror-sync step in `publish-spec.mjs` must be a no-op when the siblings are absent — do not treat a skipped sibling sync as a failure. The mirrors refresh from the `srs` release artifact through their own pipelines after this PR merges (see Stage 5c). If `publish-spec.mjs` hard-fails because a sibling is missing, that is a script bug — file a follow-up issue and continue with the `srs`-local validate + render; do not check out siblings to satisfy it.

If a `srs`-local step (validate / render / release-drift) fails, fix the issue before committing.

### 6e — Commit

Stage the records, updated RFC file, and the publish output together:
```bash
git add srs/records/ srs/relations/ rfcs/rfc-NNN-<slug>.md docs/spec/
git commit -m "feat: RFC-NNN — author spec records and re-render (#<issue-N>)"
```

Records, rendered spec, and schema sync are all committed together. Never commit records without also committing the re-rendered `docs/spec/` output.

### 6f — Declare the integration manifest (required on acceptance)

**Canonical model (issue #204):** the `rfcs/rfc-NNN-*.md` file is the RFC **proposal and design history**; the canonical spec is `srs/srs` records + `docs/schema/2.0` schemas. The RFC **record** is a lightweight **stub** — metadata + `proposal-artifact-path` pointing back at the `.md` + an integration manifest. It must never embed the full RFC body.

When an RFC reaches `accepted`/`implemented`, declare **what it folded into the canonical spec** as a machine-checkable manifest block appended to the record's `affected-components` field (fieldId `5a000009`), inside an HTML comment so it stays invisible in the rendered catalog:

```
<!-- srs-integration:v1
ext:changelog
schema:changelog.json
type:com.semanticops.spec/changelog-entry
I-90
-->
```

Token grammar (one per line): `I-<n>` (invariant record), `ext:<name>` (extension record), `schema:<file>.json` (file in `docs/schema/2.0/`), `type:<ns>/<name>` (type-definition record or installed package Type), `section:<slug>` / `subsection:<slug>` (by title slug). Use the special token `tooling-only` when the RFC changes only tooling / rendering / CLI / a downstream package and folds **no** record or schema artifact into the canonical spec. Every declared token MUST resolve; the manifest need not be exhaustive (declaring what is folded is your responsibility — the gate is a floor, not a completeness proof).

If a genuinely-accepted RFC cannot be fully folded now, grandfather it in `rfcs/integration-allowlist.json` with a follow-up issue (this skips only the completeness check; status/consistency checks stay live) — do not leave the gate red.

---

## Stage 7 — Documentation pass

The records and rendered spec are now correct, but the prose docs that *describe* the model around it drift quietly. This stage runs after Stage 6 and reconciles the human-facing documentation with what this RFC changed. Run it on the same branch so doc updates land in the RFC PR.

1. **Determine what surface this RFC changed.** Ask: did it add or change —
   - a Field, Type, Relation type, or extension in the data model,
   - an entity schema in `srs/docs/schema/2.0/`,
   - a CLI contract the spec defines,
   - a canonical relation vocabulary, namespace convention, or invariant?

   If the RFC was rejected or made no model-level change, state that in one sentence and skip to the output contract — but say so explicitly.

2. **Update each affected doc.** Map change → doc:
   | Changed surface | Doc(s) to update |
   |---|---|
   | New/changed extension | the **Extensions model** table in `semanticops/CLAUDE.md` |
   | New/changed Field, Type, Record, or Relation semantics | the **How SRS works** / data-model sections of `semanticops/CLAUDE.md` |
   | New/changed entity schema | `semanticops/CLAUDE.md` schema notes; confirm the sync targets named in the RFC's Schema changes section are updated (`srs-rust`, `srs-vscode`) |
   | New CLI contract or agentic workflow rule | `srs/srs-usage.md` (authoritative agent rules + CLI reference) |
   | New namespace or authoring convention | `srs/CLAUDE.md` |
   | Repo-level concept worth a reader's first look | `srs/README.md` (and the top-level project README if one exists) |

   The schema files in `srs-rust/` and `srs-vscode/` are coordinated through their own branches (as in Stage 5c). The prose docs in `srs/` (`srs-usage.md`, `CLAUDE.md`, `README.md`) are committed on this RFC branch. **`semanticops/CLAUDE.md` lives in the non-git parent directory** — edit it in place if it is stale, but it cannot be committed; mention in the output contract that it was touched.

3. **Hunt for stale references.** Grep the docs for anything this RFC made wrong — renamed entities, removed fields, changed relation type names, old extension keys:
   ```bash
   rg -n "<old-name-or-key>" --glob '*.md' .
   ```
   Fix every stale hit, not just the ones in the table.

4. **Verify doc commands still run.** Any `srs ...` command block you touched in a doc must actually execute against `srs/srs` without error.

5. Commit the doc updates on the RFC branch (only the files you actually changed; `semanticops/CLAUDE.md` is excluded — it is not version-controlled):
   ```bash
   git add srs-usage.md CLAUDE.md README.md
   git commit -m "docs: reconcile docs with RFC-NNN (#<issue-N>)"
   ```
   These land in the RFC PR's diff.

---

## Output contract

When done, report:
- RFC number and title
- GitHub issue URL
- Current RFC status (Draft / In Progress / Accepted)
- PR URL (if Stage 5 was reached)
- Number of review rounds
- Schema files changed (if any)
- Spec records created (instanceIds, if Stage 6 was reached)
- Docs reconciled in Stage 7 (list files, including any edit to the non-committable `semanticops/CLAUDE.md`; or "none — no model-level change")
- Any open questions remaining in the RFC

If you stopped early, say exactly which stage and why.
