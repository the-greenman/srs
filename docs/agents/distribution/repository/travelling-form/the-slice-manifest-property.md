# The `slice` manifest property

> The property ext:slices adds to RepositoryManifest:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

The property `ext:slices` adds to `RepositoryManifest`:

```json
"slice": {
  "origin": { "repositoryId": "<source-uuid>" },
  "spec": { "type": "container", "id": "<containerId-uuid>" },
  "exportedAt": "<ISO-8601>",
  "externalRelationRefs": [
    {
      "relationId": "<uuid>",
      "sourceInstanceId": "<uuid>",
      "targetInstanceId": "<uuid>",
      "relationType": "depends-on"
    }
  ]
}
```
