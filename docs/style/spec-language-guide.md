# Spec language guide

How to write prose for the SRS specification. It binds anyone authoring a record in
`srs/records/**`, and most of all it binds agents, because the Parts I–IV rewrite in srs#563 hands
that authoring to them.

**This guide is preventive.** A trope scan across all 54,868 words of record content found almost
nothing. No "leverage", no "it is important to note", no "seamless"; two hedges and one "this
ensures" in the whole corpus. The prose today is human and disciplined. Machine register
enters a document at exactly the moment authoring is delegated, and the rules below exist to hold
the line through that moment. Nothing here is a complaint about what is already written.

`scripts/spec-language-registry.json` holds the same rules as data. srs#569 builds
`check-spec-language.mjs` over that file, with an allowlist for grandfathered sites. The registry is
the machine form; this page is the reason.

## Register

RFC 2119 keywords carry conformance force. They appear only in a genuinely normative statement: a
`normative_statement` field, or, once srs#559 lands the authoring package, an element whose
`exposition_role` is `constraint`. Explanatory prose describes; it does not oblige.

A constraint states the rule and stops. Its reason belongs in a `design-note` record, linked by
`explains`. Reasons inside constraints are how a two-line rule becomes a twelve-line paragraph that
a reader has to parse before finding what is actually required.

The corpus carries 318 MUST, 75 MUST NOT, 11 SHOULD and 16 MAY. That is 92% mandatory, and it is
worth a deliberate pass, because MUST inflation makes real requirements indistinguishable from
descriptions of behaviour. A MUST marks something an implementation can fail. Everything else is
written as what it is.

## Voice

Present tense, active voice, no narrator.

Name the actor. The validator, the loader, the renderer, the CLI, an implementation. "The validator
rejects a record whose `typeId` does not resolve" beats "records with unresolvable type references
will be rejected", which hides both who acts and when.

No "we", no "our", no "let us". No future tense: a specification describes a system that exists in
the present, and "will" smuggles in an implementation timeline. No second person in normative text.

## Terms

A term is defined once, as a `concept` record (srs#561), and used with that meaning everywhere
after. It is never redefined in prose, never glossed a second time in a later section, and never
given a casual synonym. Where a reader needs the definition again, link the record.

## Budget

A prose field carries at most **400 words**. Above that, split it into child records, or move the
worked example into a typed `example` record.

The ceiling is not a style preference. The largest single blob in the corpus runs 28,872 characters,
roughly 4,500 words, in one field. A field that size is unreviewable, undiffable, and impossible to
address by reference, which defeats the point of a record model.

The `example` type is defined and has zero records against it, while 101 fenced code blocks sit
buried inside `content` strings. Where a worked example settles a question, write the example
instead of the paragraph.

## Em-dash

At most one em-dash per paragraph, and none inside a normative statement.

This is a cap, not a ban. The corpus carries 459 and they are house voice. What reads as generated
is the machine-gun rhythm of three or four in a paragraph, so the cap removes that without losing
the device.

## Banned register, with substitutions

Bare bans get evaded. Substitutions get followed. Each row names what to write instead.

| Instead of | Write |
|---|---|
| It is important to note that X | X |
| It is worth noting that X | X, or delete it |
| Note that X, Please note X | X |
| leverage, utilise, harness | use |
| facilitate, enable | Name the actual mechanism |
| streamline | Name what got shorter |
| robust, powerful, seamless, comprehensive, elegant, flexible, intuitive | Delete. A specification does not praise its subject |
| simply, just, easily, merely | Delete. If the step were easy the sentence would be unnecessary |
| In essence, At its core, Fundamentally, Essentially, Ultimately | Delete. Say the thing itself |
| Moreover, Furthermore, Additionally | Start the sentence |
| This ensures that Y, This means that Y | State Y as its own requirement |
| aims to, seeks to, is designed to, is intended to | State what it does |
| not only X but also Y | X and Y |
| typically, generally, usually (in normative text) | State the rule, or state the exception |
| arguably, somewhat, fairly, relatively | Delete, or give the measured value |
| very, highly, significantly, crucial, vital | Delete, or give the number |
| will reject | rejects |
| we, our, let us | Name the actor |
| you can, your (in normative text) | Name the actor |
| the system, the framework, the platform | Name the actor |
| Think of it like…, In other words | Move it to a `design-note` record |
| In conclusion, In summary, Overall | Delete the sentence |
| As mentioned above, As discussed earlier | Link the record |
| in order to | to |
| the fact that | Rewrite without it |
| has the ability to, is able to | can |
| prior to / subsequent to | before / after |
| in the event that | if |
| with respect to, in terms of, when it comes to | for, about, or rewrite around the noun |
| myriad, a plethora of, a wide range of | Give the count, or the list |
| delve into, dive deeper, unpack this | Delete. The next sentence is the explanation |
| In today's landscape, a testament to, plays a key role | Delete. A specification has no audience to persuade |
| MUST always, SHOULD ideally | The keyword carries the force; drop the adverb |

## Structural tells

These carry no banned word and are banned equally. They are the shape of generated prose, not its
vocabulary.

- **Restating the heading as the first sentence.** The reader has read the heading.
- **A closing paragraph that summarises the section.** A section that needs a summary is too long;
  split it.
- **Every section the same length.** Subjects vary in size, so sections do too. Uniformity means
  something was padded or something was truncated.
- **A bulleted list where two sentences of prose are correct.** Bullets are for genuinely parallel
  items, not for making three points look like a structure.
- **A bold lead-in and a colon on every bullet.** Occasionally right, uniformly wrong.
- **Rule-of-three padding.** A list is as long as the subject requires. A third item added for
  cadence is filler with formatting.

## Why these rules

Short specifications are not short because they say less. They are short because they say each thing
once, in one place, and demonstrate the rest.

Measured word counts, whole document:

| Specification | Words |
|---|---:|
| RFC 2119 | 640 |
| Semantic Versioning 2.0.0 | 2,583 |
| RFC 8259 (JSON) | 3,998 |
| CommonMark | 25,562 (18,152 prose + 7,410 in 655 worked examples) |
| **SRS 2.0-draft** | **44,519 total, 35,302 prose** |
| Go language spec | ~39,856 |
| RFC 9110 (HTTP semantics) | 68,887 |

Every count on this page was measured against the srs#580 programme baseline (master `64853b6`).
The corpus moves, so re-measure before citing a figure as current; srs#569 counts the live corpus on
every run.

SRS prose is nearly double CommonMark's for a far smaller subject, and around 90% of the Go language
specification, which covers goroutines, interfaces, generics and a memory model. CommonMark spends
28% of its bulk on 655 worked examples that double as its conformance suite. SRS has zero.

The techniques these documents share, and where they come from:

1. **Normative and informative are labelled.** [W3C QA Framework Specification
   Guidelines](https://www.w3.org/TR/qaframe-spec/), Good Practice 2. A reader can tell at a glance which
   sentences bind an implementation. `exposition_role` in srs#559 is this
   distinction made structural.
2. **Every feature gets a test assertion**, and inability to write one means the specification is
   wrong. W3C QA Framework, Good Practice 12. This is what an invariant is, per srs#564.
3. **Terms are defined once and collected in a glossary.** W3C QA Framework, Requirement 5 and Good
   Practice 9. The `concept` records in srs#561.
4. **Reserved keywords appear only in normative statements.**
   [RFC 7322](https://www.rfc-editor.org/rfc/rfc7322.html), the RFC Editor's style manual.
5. **Optional features are constrained or removed.** W3C QA Framework, Good Practices 15 and 17.
   Every option is a fork in the conformance surface.
6. **One normative statement per numbered clause**, as Semantic Versioning does throughout. A clause
   a reader can cite by number is a clause an implementer can test.
7. **Two registers kept apart**: a guide-level explanation and a reference-level definition, as the
   Rust RFC template separates them, and as Go fixes the order of grammar, gloss and example.
8. **Non-goals stated explicitly.** SRS already does this well in *What this specification does not
   define*.
9. **A predictable slot structure per element kind**, so a reader who knows what they want can skip
   to it.

## What a checker catches, and what a reviewer catches

Every rule above is one or the other. None sits in an undefined middle.

| Rule | Enforced by |
|---|---|
| Banned phrases and their substitutions | srs#569, regex over the registry's `patterns` |
| 400-word field budget | srs#569, counted |
| Em-dash cap per paragraph, zero in normative statements | srs#569, counted |
| RFC 2119 keywords outside normative sites | srs#569, once srs#559 lands `exposition_role` |
| Narrator and future tense in normative text | srs#569, regex |
| First sentence restating the title | srs#569, token overlap between title and first sentence |
| Bold lead-in on every bullet | srs#569, ratio of matching bullets to total |
| Rationale sitting inside a constraint | Review. A regex cannot separate a `because` clause from a legitimate conditional |
| A term redefined in prose | Review, until `concept` records cover the vocabulary |
| A bulleted list where prose is correct | Review. Parallelism is a judgement |
| Uniform section length | Review. Visible across a part, not inside one field |
| Rule-of-three padding | Review. Only detectable by reading the third item |
| MUST inflation | Review. Whether a statement is a requirement or a description is a semantic call |
| An example that should replace a paragraph | Review |
