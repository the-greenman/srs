#!/usr/bin/env node
// NEGATIVE TEST ONLY — proves the registry membership guard and the new
// required CI gate both bite. This file is undeclared in scripts/checks.json
// on purpose. It must never merge.
process.exit(0);
