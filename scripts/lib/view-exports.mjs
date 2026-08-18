// The five document-view exports rendered by publish-spec.mjs and re-checked by
// check-release-drift.mjs. Declared once — both scripts previously carried their own copy, which is
// exactly the drift-prone duplication srs#396 warns against for the injection algorithm itself.
import { join } from "path";

export function viewExports(specRoot) {
  return [
    { id: "3a000001-0000-4000-a000-000000000001", output: join(specRoot, "srs-spec.md"), requiresKeyInvariants: true },
    { id: "3a000003-0000-4000-a000-000000000003", output: join(specRoot, "srs-rationale.md") },
    { id: "3a000004-0000-4000-a000-000000000004", output: join(specRoot, "srs-unified.md"), requiresKeyInvariants: true },
    { id: "7a000001-0000-4000-a000-000000000001", output: join(specRoot, "rfcs", "rfc-catalog.md") },
    { id: "7a000002-0000-4000-a000-000000000002", output: join(specRoot, "rfcs", "rfc-decision-log.md") },
  ];
}
