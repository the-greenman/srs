# conforming importer must use repositoryId as the key to determine…

> A conforming importer must use repositoryId as the key to determine whether an incoming repository already exists locally.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Repository](/agents/distribution/repository.md).

**Number**: 53

A conforming importer must use `repositoryId` as the key to determine whether an incoming repository already exists locally. An importer that unconditionally creates a new local repository for every archive it receives, without consulting `repositoryId`, is not conformant.
