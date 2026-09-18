# Extension discovery authoring guide

An extension discovery entry should describe the extension's identity and
leave the rendered example or table as the user-facing material. Keep
headings, navigation, and explanatory prose in the guide; place the actual
extension declarations in the example block that the parser consumes.

This separation lets the discovery document grow without baking the guide's
seven section headings into generated extension data. When adding an entry,
run the repository's documentation checks and verify both the rendered guide
and the generated extension output.
