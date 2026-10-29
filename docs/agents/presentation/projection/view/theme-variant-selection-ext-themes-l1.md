# Theme Variant Selection (ext:themes-l1)

> When ext:themes-l1 is declared and a variant name is supplied at render invocation:

Specification: SRS 2.0-draft, data model revision 11. Part of the [SRS specification index](/llms.txt). Up: [View](/agents/presentation/projection/view.md).

When `ext:themes-l1` is declared and a variant name is supplied at render invocation:

1. Find `ThemeVariant` in `themeVariants` matching the requested name (case-sensitive).
2. If found: resolve its `ThemeReference` and apply Rule [T-2] (targets check). If format matches, use that Theme. If format does not match, render **without a theme** — do NOT fall back to `themeRef`.
3. If not found: fall back to `themeRef` (applying Rule [T-2]). If absent or format-incompatible, render without a theme.
4. If no variant name is supplied: use `themeRef` (applying Rule [T-2]).
