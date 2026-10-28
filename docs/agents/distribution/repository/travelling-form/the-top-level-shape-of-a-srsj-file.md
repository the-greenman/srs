# The top-level shape of a `.srsj` file

> The top-level keys of a JSON Store file:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [Travelling form](/agents/distribution/repository/travelling-form.md).

The top-level keys of a JSON Store file:

```json
{
  "srsj": "1",
  "manifest": { ... },
  "data": {
    "package/package.json": { ... },
    "package/fields/<id>.json": { ... },
    "records/<type>/<slug>.json": { ... },
    "relations/relations.json": { ... }
  }
}
```
