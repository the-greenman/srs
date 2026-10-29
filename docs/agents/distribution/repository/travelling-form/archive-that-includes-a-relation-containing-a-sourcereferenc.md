# archive that includes a Relation containing a SourceReference with…

> An archive that includes a Relation containing a SourceReference with sourceType: "repository-document" must include that document's sidecar and content file, just as if the reference appeared within…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Number**: 51

An archive that includes a `Relation` containing a `SourceReference` with `sourceType: "repository-document"` must include that document's sidecar and content file, just as if the reference appeared within an instance. A conforming archiver must scan Relations for `repository-document` references and collect the corresponding source material. An archive missing such material is malformed.
