# Conversation Layer

> This is the Conversation boundary concept's own line seen from the integration side: how the conversation layer, protocol layer, SRS layer and presentation layer connect via SourceReference and Atten…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

> **Standalone repository note**: An implementation declaring only `SRS 2.0 Core + ext:repository` does not require a TSS, ext:protocol, ext:addressability, AttentionState, or any live store for raw multimodal material; source documents stored in `source-documents/` are sufficient evidence storage for standalone use. This note describes the full-stack integration model, and implementers building file-based or offline repositories may skip it entirely.

This is the Conversation boundary concept's own line seen from the integration side: how the conversation layer, protocol layer, SRS layer and presentation layer connect via `SourceReference` and `AttentionState`.

```
Conversation layer  →  raw multimodal source material (speech, threads, annotations)
                        elements tagged with Address at production time
Protocol layer      →  sequences turns between parties; advances AttentionState
SRS layer          →  captures negotiated semantic state; Records carry SourceReferences
Presentation layer  →  renders SRS state via Views
```

Three conversation types are in scope:

| Type | Structure | Anchoring |
|---|---|---|
| Meeting transcript | Linear, time-ordered chunks | Tagged with AttentionState at production time |
| Threaded conversation | Tree of replies | Thread root anchored to a document element Address |
| Web UI annotations | Attached to content | Anchored to a Field or Record Address |

Transcript chunks referenced in `SourceReference` are source material — addressable evidence, not Notes or Records, per Conversation boundary's rule.
