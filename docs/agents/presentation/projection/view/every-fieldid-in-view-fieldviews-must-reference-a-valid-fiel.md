# Every fieldId in View.fieldViews[] must reference a valid Field.id

> Every fieldId in View.fieldViews[] must reference a valid Field.id in the effective package set.

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

**Number**: 12

Every `fieldId` in `View.fieldViews[]` must reference a valid `Field.id` in the effective package set. View compatibility is field-centric (based on required field presence), not Type-bound.
