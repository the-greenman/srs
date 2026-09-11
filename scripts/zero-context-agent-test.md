# Zero-context-agent acceptance test

Executes RFC-042 Change H (`rfcs/rfc-042-concept-tree-spine.md`) — the acceptance test the
AI-native-repositories note (`09b57270`) demands and srs#580's Wave 4 names: *"an agent knowing
nothing about SRS works out the concepts, state and safe next actions from the repository over
MCP."* The MCP surface this test depends on (`tree`, `agent-index`, container descent hook)
shipped in srs-rust#949. This protocol only exercises it; it builds no new server capability.

This is a repeatable protocol, not a vibe check: anyone re-running it against the same repository
state gets the same setup, the same single prompt, and a rubric that scores from transcript
evidence rather than impression.

## 1. Setup

- **No repository files mounted.** The session must have no working-directory access to `srs/`,
  no `CLAUDE.md`, `AGENTS.md` or `srs-usage.md` loaded, and no prior conversation about SRS or this
  repository. It starts knowing nothing beyond how to use an MCP server.
- **Model: Haiku** (the smallest generally-available Claude model at run time — this keeps the test
  honest about what the MCP surface conveys on its own, rather than what a stronger model can infer
  or guess around a thin surface).
- **The only tool available is the `srs-spec` MCP server**, mounted over `srs/srs` (this
  repository's own spec content) exactly as this workspace mounts it — `srs mcp serve --repo
  srs/srs`, stdio. Nothing else is attached: no filesystem tools, no shell, no other MCP server.

  Minimal client config (per `srs-usage.md` §5i):

  ```json
  {
    "mcpServers": {
      "srs-spec": {
        "command": "srs",
        "args": ["mcp", "serve", "--repo", "<absolute-path-to-srs/srs>"]
      }
    }
  }
  ```

  Use the **pinned** `srs` build (`node scripts/fetch-pinned-srs.mjs`, per this repo's `CLAUDE.md`
  "Rendered Outputs" section) so a re-run's server behavior matches this run's, not whatever build
  happens to be on `PATH`.

- **Exactly one prompt, verbatim, no follow-ups:**

  > You have an MCP server exposing one repository. Using only its resources and tools, report:
  > what the repository is, its top-level structure, the concepts it defines and their prerequisite
  > order, the lifecycle state of the RFC records, and three safe next actions with the tool calls
  > you would use.

  Send it once. Do not clarify, hint, or nudge if the agent stalls or misreads the task — a prompt
  that needs a follow-up to work has failed the test as written.

## 2. Rubric

Five items, each pass/fail, each decided by a transcript quote or tool-call log line — not by
overall impression. Derived from RFC-042 [R1]-[R13] and RFC-013 navigation.

1. **Names the Parts in order.** The transcript names the repository's Parts (root concepts / the
   root container's non-identity members) in the order `srs://<repoId>/navigation` returns them —
   not a reordering, not a subset it invented.

2. **Walks at least two Parts via `/tree`.** It calls `srs://<repoId>/tree` or
   `srs://<repoId>/tree/{instanceId}` for at least two distinct Part roots and reports the
   concept → leaf structure it actually got back (node types, depth) — not a paraphrase of prose it
   never read.

3. **States prerequisites and a forward-reference-free path.** It identifies at least one
   `depends-on` edge read from a concept record's relations (not inferred from prose) and states a
   reading path that never puts a dependent concept before its prerequisite — matching RFC-042
   [R5]/[R8]'s no-forward-reference rule.

4. **Reads lifecycle state from records, not prose.** For the RFC records, it reports
   `lifecycleState` values it read via `find` or a record resource (e.g. accepted/draft/deprecated),
   not a state it inferred from the rendered spec text or guessed.

5. **Proposes actions with correct preconditions.** Each of its three "safe next actions" names a
   real tool and, where a write is proposed, states the precondition tool it would call first —
   `record_allowed_transitions` before any `record_transition`, `type_schema` before any
   `record_create`.

**Pass = 5/5, AND no hallucinated identifier.** Every `instanceId` / `typeId` / relation the
transcript cites must resolve via the MCP server when checked afterward (`find`, `type_schema`, or
the `/record/{id}` resource). One unresolvable id anywhere in the transcript fails the run
regardless of the 5-item score.

## 3. Scoring procedure

1. Go through the saved transcript once per rubric item; mark pass/fail with the evidence line
   (a transcript quote or a tool-call/result pair) that decided it.
2. Separately, grep every id the transcript cites (`instanceId`, `typeId`, relation endpoints)
   against the live repository — a script, or manual `find` / `type_schema` calls — and mark the
   hallucination check pass/fail.
3. Total: five item verdicts plus one hallucination verdict. A FAIL on any item is not a defect in
   this protocol — it is exactly the finding this test exists to produce. Do not re-run to chase a
   pass; record the result as-is.

## 4. Recording a run

- Save the full transcript (the prompt, every tool call and its result, the final report) as a
  repository record — a typed `finding`-shaped record where the repository the transcript is filed
  against has one (check `srs type list` first), otherwise a Tier-0 `note`. Use `record_create` /
  `note_create` via the CLI or MCP — never a hand-written JSON file; that mimics the record without
  being one.
- Record the five item verdicts, the hallucination verdict, and the run's model/date alongside it.
- A FAIL scorecard is a complete, acceptable outcome. It is data about the MCP surface's current
  expressiveness, not a failed test run.

## Appendix: running this from a shell, when no client can be configured with only one MCP server

A local Claude Code CLI (or any MCP client you can hand a bespoke config to) can follow Setup
directly. Where only a shell is available and no client's tool surface can be trimmed to literally
nothing but the MCP server, the `claude` CLI itself can approximate it as a subprocess — this is
how the first run of this protocol (srs#711) was executed:

```bash
cat > mcp-config.json <<'JSON'
{ "mcpServers": { "srs-spec": { "command": "<pinned srs binary>",
  "args": ["mcp", "serve", "--repo", "<path-to-srs/srs>"] } } }
JSON

claude -p "<the verbatim prompt above>" \
  --model claude-haiku-4-5-20251001 \
  --output-format stream-json --verbose \
  --permission-mode dontAsk --permission-prompts none \
  --setting-sources "" \
  --mcp-config mcp-config.json --strict-mcp-config \
  --allowedTools "ListMcpResourcesTool ReadMcpResourceTool ReadMcpResourceDirTool ToolSearch mcp__srs-spec__find mcp__srs-spec__type_schema mcp__srs-spec__repo_validate mcp__srs-spec__record_allowed_transitions" \
  --disallowedTools "Read Write WebFetch WebSearch Skill mcp__srs-spec__record_create mcp__srs-spec__record_update mcp__srs-spec__relation_create mcp__srs-spec__note_create mcp__srs-spec__record_transition mcp__srs-spec__record_successor mcp__srs-spec__note_graduate mcp__srs-spec__container_member_add mcp__srs-spec__container_member_remove mcp__srs-spec__protocol_run_abandon mcp__srs-spec__protocol_run_advance mcp__srs-spec__protocol_run_complete mcp__srs-spec__protocol_run_create mcp__srs-spec__protocol_run_get mcp__srs-spec__protocol_run_list" \
  > transcript.jsonl
```

Run this from an empty working directory (no `CLAUDE.md` in it or any parent) rather than `--bare`
— `--bare` requires `ANTHROPIC_API_KEY`/`apiKeyHelper` auth, which a proxy-authenticated cloud
worker does not have.

**Two gotchas this surfaced:**

- `--tools ""` (disable all built-in tools) also removes the harness's own deferred resource-reader
  tools (`ListMcpResourcesTool`, `ReadMcpResourceTool`) and `ToolSearch` needed to load them — it is
  not a clean way to restrict the session to "MCP tools only". Use `--allowedTools`/
  `--disallowedTools` by name instead, as above, and keep `ToolSearch` allowed.
- MCP resources are not automatically callable the moment a server is mounted: the agent must first
  `ToolSearch` for `ReadMcpResourceTool`/`ListMcpResourcesTool` (they arrive as deferred tools), then
  call `ListMcpResourcesTool` to discover the real `srs://<repositoryId>/...` URIs — guessing a
  URI (e.g. `srs://default/agent-index`) fails. Both cost transcript turns; a rubric run's turn
  count is not directly comparable across clients that expose resources differently.
- This is not a literal zero-other-tools client — `Read`/`Write` and the harness's task/skill
  tools are present but denied by permission, not physically absent. Note this as a caveat on any
  run executed this way rather than reporting it as a clean Setup-section isolation.
