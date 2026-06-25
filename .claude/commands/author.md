---
description: Author or update data in an SRS repository using the CLI. Enforces CLI-first rule, validates after every write, and routes gaps to the issue tracker before any manual fallback.
argument-hint: <target repo path and goal, or issue #N>
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, TodoWrite, WebFetch
---

# /author — SRS data authoring pipeline

You are authoring data in an SRS repository:

> $ARGUMENTS

Run **autonomously** — do not pause for decisions you can resolve from context. Use TodoWrite to track stages.

**Foundational rule:** the `srs` CLI is the stable machine-facing contract. Never hand-edit records, types, relations, containers, views, blueprints, or protocols unless the CLI cannot perform the operation (see Stage 4). The gap is signal — do not hide it.

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
   - **Cloud / remote agent** (no local signing key file): the ssh-agent is not used — the platform signs commits with its own method. Proceed; do not stop on the ssh-agent check.

   In both environments use plain `git commit` — never `--no-gpg-sign`.
2. Confirm `gh auth status` succeeds. If not, stop.
3. Identify the **target SRS repo** from `$ARGUMENTS` (may be a path like `docs/spec/examples/gallery-project-v2`, or derived from the issue). Confirm it is an SRS repo (`ls <path>/.srs/` must succeed and `manifest.json` must exist).

---

## Stage 1 — Issue

- If `$ARGUMENTS` references an existing GitHub issue (`#N` or URL), fetch it:
  ```bash
  gh issue view N --repo the-greenman/srs
  ```
  Use the issue body as the authoritative brief. Extract the acceptance criteria and verify commands.
- If no issue exists, create one:
  ```bash
  gh issue create --repo the-greenman/srs \
    --title "<concise title>" \
    --body "<goal, target repo, acceptance criteria>"
  ```
  Capture the issue number.

---

## Stage 2 — Discovery

Before writing anything, run the full discovery ladder on the target repo. Read `srs/srs-usage.md` section 3 if you need the reference.

```bash
srs repo validate --repo <path> --pretty        # confirm 0 errors before touching anything
srs repo map --repo <path> --pretty             # orient
srs type list --repo <path> --pretty            # all available types
srs field list --repo <path> --pretty           # available fields
srs record list --repo <path> --pretty          # existing instances
srs relation list --repo <path> --pretty        # existing relations
```

If blueprints, protocols, containers, or views may be relevant, also discover:

```bash
srs blueprint list --repo <path> --pretty
srs protocol list --repo <path> --pretty
srs container list --repo <path> --pretty
srs document-view list --repo <path> --pretty
```

Record what already exists. If the initial `repo validate` has errors, **stop and report** — fix errors before authoring new data.

---

## Stage 3 — Operation plan

Map each acceptance criterion from the issue to a concrete CLI operation. List them as a table:

| Goal | CLI command | Inputs needed | Gap? |
|---|---|---|---|
| Create `decision_log` type | `srs type create` | field IDs, type schema JSON | no |
| Create Container | `srs container create` | rootInstanceId, containerType | check |
| Create DocumentView | `srs document-view create` | rootTypeRefs, viewId | check |
| ... | ... | ... | ... |

Mark a row **Gap** if you are not certain the CLI command exists or supports the required flags. You will resolve gaps in Stage 4 before executing.

---

## Stage 4 — Gap analysis

For every **Gap** row from Stage 3:

### 4a — Verify the command exists

```bash
srs <command> --help 2>&1 | head -20
```

If the command exists and covers the need: mark the gap resolved, update the plan.

### 4b — Check open issues before filing

If the command does not exist or lacks the required capability:

```bash
gh issue list --repo the-greenman/srs --state open --search "<capability keyword>"
gh issue list --repo the-greenman/srs --state open --label "cli" --search "<command>"
```

- If an open issue already tracks it: note the issue number; do not file a duplicate. Link it in a comment on the current issue.
- If it appears in a closed issue (accepted/implemented but not yet in the binary): check the `srs` binary version and whether the feature was released. If unreleased, note this.

### 4c — File a new issue (if no existing issue covers it)

Determine severity:
- **Bug** — the CLI command should exist (the spec or RFC requires it) but does not.
- **Feature request** — a genuine new capability not yet specified.

```bash
gh issue create --repo the-greenman/srs \
  --title "<CLI: <command> — <what is missing>>" \
  --label "<bug|enhancement>,cli" \
  --body "$(cat <<'EOF'
## Gap
<what operation is needed and why>

## Context
Discovered while authoring <issue #N>. Acceptance criteria requires: <quote>.

## Expected CLI
<exact command and flags that should exist>

## Workaround
<manual JSON edit, per srs-usage.md §9, if taken>
EOF
)"
```

Post a comment on the current issue linking the new gap issue.

### 4d — Manual fallback (last resort)

If the operation is required to complete the current work and no CLI path exists:

1. Author the JSON directly in the repo file (minimum viable change).
2. Run `srs repo validate --repo <path> --pretty` — must be 0 errors.
3. Document the manual change in the commit message: `chore: manual <entity> edit — pending <gap-issue-url>`.
4. Do **not** build helper scripts or multi-step workarounds that become load-bearing. The manual edit is a placeholder, not a pattern.

---

## Stage 5 — Authoring loop

Work through the operation plan from Stage 3. For each operation:

### Write rule

Every write uses `srs` CLI piping JSON on stdin. Example patterns:

```bash
# Create a record (Tier 2)
echo '{
  "typeId": "<uuid>",
  "typeVersion": 1,
  "fieldValues": { "<fieldId>": "<value>" }
}' | srs record create --repo <path> --pretty

# Assert a relation
srs relation create --repo <path> \
  --type <relation-type> \
  --from <sourceInstanceId> \
  --to <targetInstanceId> \
  --pretty

# Create a container
echo '{
  "rootInstanceIds": ["<uuid>"],
  "memberInstanceIds": ["<uuid>", ...],
  "containerType": "<type-name>"
}' | srs container create --repo <path> --pretty

# Create a DocumentView with rootTypeRefs
echo '{
  "name": "<view-name>",
  "rootTypeRefs": [{ "typeId": "<uuid>", "typeVersion": 1 }],
  "template": "<template-name>"
}' | srs document-view create --repo <path> --pretty
```

Capture every `instanceId`, `containerId`, `viewId` returned — you will need them for subsequent relations and the PR description.

### Validate after each write batch

After every logical write batch (not after every single command):

```bash
srs repo validate --repo <path> --pretty
```

**Zero errors required before the next batch.** If errors appear, diagnose and fix before continuing — never accumulate errors.

If the issue specifies extra verify commands (`srs blueprint validate`, `srs protocol validate`, `srs document-view list --root-type <typeId>`), run those too.

### Render check (if applicable)

If a `DocumentView` was created or modified:

```bash
srs render document-view <viewId> --repo <path> --pretty
```

Confirm the render completes without error and the output is non-empty and coherent.

---

## Stage 6 — Reference data integrity check

When the goal is to author **reference data proving a spec design** (like RFC-009's `rootTypeRefs`):

1. Cross-check every acceptance criterion from the issue — verify each one is met.
2. Note any spec behaviour the data revealed that was ambiguous or missing. These are findings for the linked RFC or a new issue — do not silently discard them.
3. Post a summary comment on the issue listing: entities created, validation result, render result, and any spec findings.

---

## Stage 7 — Branch, commit, PR

### 7a — Determine the repo

All git operations run from the repo containing the target path. For examples in `srs/`, that is `/home/greenman/dev/semanticops/srs/`. Never `cd` to the `semanticops/` parent.

Commit signing was already confirmed in Stage 0 (local agent key or cloud platform signing). Use plain `git commit` — never `--no-gpg-sign`.

### 7b — Branch

Naming: `data/<issue-N>-<slug>` (e.g. `data/68-gallery-v2-decision-log`).

```bash
cd srs
git worktree add ../.worktrees/<issue-N>-<slug> -b data/<issue-N>-<slug>
```

### 7c — Commit

Stage only the files that changed (records, relations, package types, views, containers — no generated output unless the issue explicitly requires it):

```bash
git add <changed files>
git commit -m "data: <what was authored> (#<issue-N>)"
```

Use plain `git commit` — never `--no-gpg-sign`. If the commit includes manual JSON edits from Stage 4d, the message must say so and link the gap issue.

### 7d — PR

```bash
git push -u origin data/<issue-N>-<slug>
gh pr create \
  --repo the-greenman/srs \
  --base main \
  --title "data: <title> (#<issue-N>)" \
  --body "$(cat <<'EOF'
Closes #<issue-N>

## What was authored
<bullet: each entity created, with ID>

## Validation
`srs repo validate` — 0 errors, 0 warnings (or list advisory warnings)

## Render
`srs render document-view <viewId>` — OK / <note>

## CLI gaps found
<list gap issues filed, or "None">

## Manual edits (if any)
<list files hand-edited and linked gap issues, or "None">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Output contract

When done, report:
- Issue # and title
- Target SRS repo path
- Entities created (type, ID for each)
- Validation result (0 errors / list any)
- Render result (OK / error)
- CLI gaps found (gap issue URLs, or "None")
- Manual edits made (files + linked gap issues, or "None")
- PR URL

If you stopped early, say exactly which stage and why.
