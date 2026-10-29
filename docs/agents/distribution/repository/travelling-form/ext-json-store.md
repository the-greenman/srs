# ext:json-store

> Defines the SRS JSON Store format (.srsj): a single-file, self-contained serialization of a complete SRS repository.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

**Required for**: any implementation that stores an SRS repository as a single portable JSON file.

**Depends on**: `ext:repository`

Defines the **SRS JSON Store format** (`.srsj`): a single-file, self-contained serialization of a complete SRS repository. The JSON Store is an alternative to the filesystem layout defined by `ext:repository`. Both formats carry identical semantic content; an implementation must be able to convert between them losslessly.
