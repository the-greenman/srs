# at most one attachment_policy record per repository

> At most one attachment_policy record of the com.semanticops.base/repo_settings type MAY exist per repository.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: I-111

At most one `attachment_policy` record of the `com.semanticops.base/repo_settings` type MAY exist per repository. A conformant implementation encountering two or more MUST surface a diagnostic and treat the policy as absent (applying the no-policy defaults: all MIME types accepted, no size limits enforced, no size-or-MIME-type-policy diagnostics emitted).
