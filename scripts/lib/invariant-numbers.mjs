// The set of live I-<n> invariant numbers, loaded once from the canonical
// `com.semanticops.spec/invariant` records under `srs/records/invariants/` (RFC-038 tree-authoritative
// walk, not a hardcoded directory assumption) and normalized to bare integer strings.
//
// This module exists because two independent consumers need the identical answer to "does I-<n>
// resolve to a real invariant?" — check-rfc-integration.mjs (srs-integration manifest tokens) and
// check-srs-usage-invariant-citations.mjs (srs-usage.md prose citations) — and the normalization rule
// (records store a mix of bare numbers and "I-79"-style strings) has one home, not two copies that can
// drift apart (found by the #490 meaning-placement sweep, the same drift class decision-modes.mjs
// already closed for the decision-mode vocabulary).
import { loadInstances } from "./rfc-038-tree.mjs";

const TYPE_NAMESPACE = "com.semanticops.spec";
const TYPE_NAME = "invariant";
const F_INV_NUMBER = "invariant_number";

/** Bare numbers (79) and prefixed strings ("I-79") both normalize to a bare integer string. */
export function normInvariantNumber(value) {
  const s = String(value).trim().replace(/^i-/i, "");
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
}

/** Every live invariant number in the repository, as a Set of normalized strings. */
export async function loadInvariantNumbers(repoRoot) {
  const instances = await loadInstances(repoRoot);
  const numbers = new Set();
  for (const { record } of instances) {
    if (record?.typeNamespace !== TYPE_NAMESPACE || record?.typeName !== TYPE_NAME) continue;
    const n = record.fieldValues?.[F_INV_NUMBER];
    if (n !== undefined && n !== null && n !== "") numbers.add(normInvariantNumber(n));
  }
  return numbers;
}
