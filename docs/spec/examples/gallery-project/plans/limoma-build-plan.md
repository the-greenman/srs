# LiMoMa SCDS Build Plan

**Status:** In progress  
**Goal:** Extend the gallery-project SCDS example to produce the LiMoMa foundation document — a fully formed governance repository demonstrating the full flow from raw transcript to constitutional Articles, authority Roles, Decision Log, and Exercise Book.

---

## Design decisions

**Does SCDS need a separate purpose statement type?**  
No. The founding Articles serve this role. Article A-001 ("What this is") and A-002 ("What we are here to do") are the repository's purpose statement. `container.rootInstanceIds` points to them. `manifest.aiGuidance.summary` compresses them for AI navigation.

**Are Articles AI-extracted from transcripts?**  
No. Articles are a deliberate constitutive act — written by the clerk after the founding discussion, drawing on the spirit of what was agreed. `source: "human"` throughout; no `sourceRefs` to the transcript. This contrasts with Exercises and Decisions, which are extracted from or traceable to source material.

**What's the simulation flow?**

```text
founding-meeting-transcript.txt  (source document)
        ↓
   Initial Note                  ← raw capture, derived-from transcript
        ↓
   Exercises                     ← unresolved questions, extracted; source: ai
        ↓ (converted to)
   Decisions                     ← settled commitments, extracted; source: ai/human
        ↓ (clerk writes up)
   Articles                      ← constitutional layer; source: human
   Roles                         ← authority boundaries; source: human
        ↓ (rendered as)
   Foundation Document View      ← the LiMoMa document
```

---

## Build sequence

| Step | Status | Description |
|---|---|---|
| 0 | ✅ done | Plan document created (this file) |
| 1 | ✅ done | Profile: Add Article + Role fields to Section 5 |
| 2 | ✅ done | Profile: Add Founding Document Protocol (Section 8.6) |
| 3 | ✅ done | Package: Add field files, Article type, Role type, domain schemas |
| 4 | ✅ done | Create 6 Article records in `records/articles/` |
| 5 | ✅ done | Create 3 Role records in `records/roles/` |
| 6 | ✅ done | Create 3 missing Decision records |
| 7 | ✅ done | Add Foundation Document View to package |
| 8 | ✅ done | Update manifest, container, relations |
| V | ✅ done | Validate: 20 instances, 20 unique members, 10 relations — all checks passed |

---

## New records

### Articles (all source: human, no sourceRefs)

| ID | File | Article |
|---|---|---|
| 5e5e6620-37eb-507b-aa44-eadd823e7338 | records/articles/article-what-this-is.json | A-001 What this is |
| 96f9fe31-288c-5e88-a052-cc7531fca467 | records/articles/article-purpose.json | A-002 What we are here to do |
| 3010705b-266d-5ace-891f-0f4dc685afc6 | records/articles/article-members.json | A-003 Who we are |
| 093e9b67-ff1f-5530-bd24-ffb35d55f931 | records/articles/article-decisions.json | A-004 How we make decisions |
| 7ac20908-fe9b-501b-b151-21b70f06c585 | records/articles/article-care-of-building.json | A-005 Care of the building |
| 0f81d4a3-afe0-50e5-9203-05290e62a5c2 | records/articles/article-on-ending.json | A-006 On ending |

### Roles (all source: human)

| ID | File | Role |
|---|---|---|
| 25cf7ece-8232-5964-9419-d5ca808829f2 | records/roles/role-building-authority.json | R-001 Sam Hayder |
| 6b4f7122-4d42-5275-ac2c-e60031aac299 | records/roles/role-curatorial-lead.json | R-002 Immo Klink |
| ac813974-3f15-5572-a336-0e8444386f3e | records/roles/role-clerk.json | R-003 Peter Brownell |

### New Decisions

| ID | File | Decision |
|---|---|---|
| eaecece4-fd2d-5e37-be46-f68ceadd0a6f | records/decisions/decision-phase-scope.json | D-002 Phase 1 scope |
| d14af813-7d17-588a-aa41-99e565e69372 | records/decisions/decision-curatorial-lead.json | D-003 Curatorial lead |
| ced6dad0-9ba7-574d-9bd6-f2af800b06c9 | records/decisions/decision-closure-obligations.json | D-007 Closure obligations |

---

## New field UUIDs

| Field | UUID |
|---|---|
| governance/article_text | 8aa3eba2-204b-5ebd-ba7a-be0f066027d6 |
| governance/article_number | 60be1468-01bc-5d12-9eea-628f02801893 |
| governance/amendment_rule | 1f01bc6b-39c8-58d7-b1a3-79142623fece |
| governance/protected_status | 0df40543-f72a-5471-a7f1-c85c1f1f93e4 |
| governance/role_holder | a6c19b95-4f8f-5b07-93f8-3426c545277e |
| governance/authority | d25da548-79d6-555b-8878-f40b685b3955 |
| governance/boundary | 3c39ee1f-6fe0-5da7-a0b6-928aa3a63211 |
| governance/source_of_authority | 9a32dc01-f348-5e05-9f54-bb6d21239f04 |

| Type | UUID |
|---|---|
| governance/article | a1142ac3-5385-5c0e-8630-1dd3432cdf7f |
| governance/role | e53dce11-6b83-5714-a8fe-f730edb500fa |
