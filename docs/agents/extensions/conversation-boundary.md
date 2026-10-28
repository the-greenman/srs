# Conversation boundary

> The permanent architectural line between raw multimodal source material (speech, threads, annotations) and the negotiated semantic state SRS captures.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Extensions](/agents/extensions.md).

The permanent architectural line between raw multimodal source material (speech, threads, annotations) and the negotiated semantic state SRS captures. The two layers reference each other in both directions but never merge: material on the conversation side is addressable evidence, and it does not become an instance automatically. A transcript chunk cited as evidence for a field value is not a Note unless someone deliberately models it as one.

**Notes**: This is not itself an extension — it is the boundary that `ext:addressability` and `ext:protocol` are built to cross. It is documented in this Part, alongside the extensions that depend on it, instead of in Foundations. The conversation layer is optional infrastructure: a repository declaring only the core plus the file-based repository format needs none of it, and source documents stored under `source-documents/` are sufficient evidence storage on their own.
