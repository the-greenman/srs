---
description: RETIRED. Superseded by the programme protocol — do not invoke.
---

# Retired

The epic-256 v1 coordinator protocol that lived here is **retired**. It is not the
process any longer, and following it causes real failures: cloud sessions loaded
it by name and obeyed its global-interlock rule over the live trigger prompts,
freezing the pool for three ticks against a stale label (srs#451).

**One way per goal.** The protocol has one home:

- **Process rules** — this repo's `CLAUDE.md`, "Gates and choreography".
- **The queue** — the programme queue issue, linked from `AGENTS.md`.
- **The stages** — the programme Protocol record, walked by `/programme`.

Do not restore this file's content. A stale instruction on disk is worse than
no instruction, because an agent obeys it faithfully.
