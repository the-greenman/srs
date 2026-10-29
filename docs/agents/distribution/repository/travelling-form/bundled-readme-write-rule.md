# Bundled readme write rule

> An implementation that writes a carried readme out, to a file system or as a .srs archive, MUST NOT write any file it generates on its own account (a marker placeholder, a scaffold) at the readme's p…

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

An implementation that writes a carried readme out, to a file system or as a `.srs` archive, MUST NOT write any file it generates on its own account (a marker placeholder, a scaffold) at the readme's `path`. On a file system it MUST write the readme after every other carried file of the same operation, creating missing parent directories, and MUST NOT write it over any existing file or directory, nor through a symbolic link at any component of `path`, unless the user explicitly instructs it to replace that file (and never through a symbolic link). When a component of the path is a symbolic link, or, absent such an instruction, an entry exists at the target path and is not a regular file whose bytes equal the UTF-8 encoding of `content`, or the readme cannot be written there for any other reason, it MUST leave what is there unmodified, MUST report a warning with code `readme-write-conflict` naming the path, and MUST complete the rest of the operation. (RFC-045 [R6])
