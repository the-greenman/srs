#!/usr/bin/env python3
"""
P5 Migration: Create individual invariant records from embedded prose.
Creates srs/records/invariants/invariant-NNN.json for each of the 62 invariants.
"""

import json, os, re

RECORDS_ROOT = os.path.join(os.path.dirname(__file__), '..', 'records')
SUBSECTIONS_DIR = os.path.join(RECORDS_ROOT, 'subsections')
INVARIANTS_DIR = os.path.join(RECORDS_ROOT, 'invariants')
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), '..', 'manifest.json')

CONTENT_FIELD = '1a000002-0000-4000-a000-000000000002'
TITLE_FIELD = '1a000001-0000-4000-a000-000000000001'

# New invariant type
INVARIANT_TYPE_ID = '2a000006-0000-4000-a000-000000000006'

# Field IDs
F_INV_NUMBER   = '1a000020-0000-4000-a000-000000000020'
F_TITLE        = '1a000001-0000-4000-a000-000000000001'
F_NORM_STMT    = '1a000003-0000-4000-a000-000000000003'
F_APPLIES_TO   = '1a000021-0000-4000-a000-000000000021'

# Source document ID (SRS spec source)
SRS_SOURCE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'


def section_to_applies_to(section_title):
    """Map section heading to applies-to label."""
    mapping = {
        'Field semantics': 'core — Field',
        'Field semantics — content format': 'core — Field.contentFormat',
        'Lifecycle (ext:lifecycle)': 'ext:lifecycle',
        'Distribution': 'core — Package',
        'Cross-field validation (ext:cross-field-validation)': 'ext:cross-field-validation',
        'Views (ext:views-l1)': 'ext:views-l1',
        'Distribution — Views (ext:views-l1)': 'ext:views-l1 — Distribution',
        'Relations': 'core — Relation',
        'Notes and Typed Records': 'core — Note/TypedRecord',
        'Containers': 'core — Container',
        'Repeatability (ext:repeatable-fields)': 'ext:repeatable-fields',
        'Field groups (ext:field-groups)': 'ext:field-groups',
        'Records': 'core — Record',
        'Protocol (ext:protocol)': 'ext:protocol',
        'Views L2 (ext:views-l2)': 'ext:views-l2',
        'Addressability (ext:addressability)': 'ext:addressability',
        'Distribution — Views L2 (ext:views-l2)': 'ext:views-l2 — Distribution',
        'Distribution — Schema (ext:schema)': 'ext:schema — Distribution',
        'Distribution — Protocol (ext:protocol)': 'ext:protocol — Distribution',
        'Type inheritance (ext:type-inheritance)': 'ext:type-inheritance',
        'Views L2 navigation (ext:views-l2)': 'ext:views-l2 — Navigation',
        'Repository (ext:repository)': 'ext:repository',
        'Federation (ext:federation)': 'ext:federation',
        'Extension Interactions': 'core — Extension interactions',
    }
    return mapping.get(section_title, section_title)


def derive_title(text):
    """Derive a short title from invariant prose."""
    # Strip backtick contents for reading but keep the first identifier
    # Take up to the first period + space or comma in main clause
    clean = text.replace('\n', ' ').strip()
    # Get first sentence
    first_period = re.search(r'(?<=[a-z\]`)])\.\s', clean)
    if first_period:
        sentence = clean[:first_period.start() + 1]
    else:
        sentence = clean

    # Strip markdown backticks from title for readability
    sentence = sentence.replace('`', '')
    # Remove leading "A " / "An " / "The "
    sentence = re.sub(r'^(A|An|The)\s+', '', sentence)
    # Trim to 70 chars at word boundary
    if len(sentence) > 70:
        truncated = sentence[:70]
        last_space = truncated.rfind(' ')
        if last_space > 40:
            sentence = truncated[:last_space] + '…'
        else:
            sentence = truncated + '…'
    return sentence


def make_uuid(n):
    """Generate a sequential UUID for invariant record n (1-based)."""
    return f'e1{n:06d}-0000-4000-a000-{n:012d}'


# --- Parse invariants from 08-* subsections ---

inv_block = re.compile(r'\*\*(\d+)\.\*\*\s+(.*?)(?=\n\n\*\*\d+\.\*\*|\Z)', re.DOTALL)

all_invariants = []
for f in sorted(os.listdir(SUBSECTIONS_DIR)):
    if not f.startswith('08-'):
        continue
    path = os.path.join(SUBSECTIONS_DIR, f)
    r = json.load(open(path))
    tv = next((x for x in r['fieldValues'] if x['fieldId'] == TITLE_FIELD), None)
    cv = next((x for x in r['fieldValues'] if x['fieldId'] == CONTENT_FIELD), None)
    if not cv or not cv['value']:
        continue
    section_title = tv['value'] if tv else f
    for m in inv_block.finditer(cv['value']):
        num = int(m.group(1))
        text = m.group(2).strip()
        all_invariants.append((num, section_title, text))

all_invariants.sort(key=lambda x: x[0])
print(f'Found {len(all_invariants)} invariants')

# --- Create invariants directory and records ---

os.makedirs(INVARIANTS_DIR, exist_ok=True)

created_paths = []
for num, section_title, text in all_invariants:
    uuid = make_uuid(num)
    title = derive_title(text)
    applies_to = section_to_applies_to(section_title)
    filename = f'invariant-{num:03d}.json'
    path = os.path.join(INVARIANTS_DIR, filename)

    record = {
        "$schema": "https://srs.semanticops.com/schema/2.0/record.json",
        "instanceId": uuid,
        "typeId": INVARIANT_TYPE_ID,
        "typeVersion": 1,
        "typeNamespace": "com.semanticops.spec",
        "typeName": "invariant",
        "fieldValues": [
            {"fieldId": F_INV_NUMBER, "value": num},
            {"fieldId": F_TITLE, "value": title},
            {"fieldId": F_NORM_STMT, "value": text},
            {"fieldId": F_APPLIES_TO, "value": applies_to}
        ],
        "sourceRefs": [
            {
                "sourceType": "repository-document",
                "sourceId": SRS_SOURCE_ID,
                "relationType": "evidence",
                "note": f"Invariant {num} from srs-spec.md section 08"
            }
        ],
        "createdAt": "2026-05-27T00:00:00Z"
    }

    with open(path, 'w') as fp:
        json.dump(record, fp, indent=2)
        fp.write('\n')

    created_paths.append(f'invariants/{filename}')
    print(f'  Created {filename}: {title[:60]}')

# --- Update manifest.json ---

manifest = json.load(open(MANIFEST_PATH))

# Insert invariant paths before type-definitions entries
# Find the position of first type-definitions entry
index = manifest['instanceIndex']
first_typedef_pos = next(
    (i for i, p in enumerate(index) if p.startswith('type-definitions/')),
    len(index)
)

# Remove any existing invariant entries (idempotent)
index = [p for p in index if not p.startswith('invariants/')]

# Insert new invariant entries
for i, p in enumerate(created_paths):
    index.insert(first_typedef_pos + i, p)

manifest['instanceIndex'] = index

with open(MANIFEST_PATH, 'w') as fp:
    json.dump(manifest, fp, indent=2)
    fp.write('\n')

print(f'\nUpdated manifest.json: added {len(created_paths)} invariant entries')
print('Done.')
