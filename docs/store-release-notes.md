# Store release-note checks

The native app `/release` commands use this shared method when drafting notes and again before an authorized store submission or resubmission. It covers the public store summary, translations and synchronization of that text. It does not replace release sanity testing or authorize submission, publication, messaging or changes to legal terms.

Load this guide from one resolved `bitkit` default-branch commit and record the revision. Check the official policies below for the current release; the links were last checked on 2026-11-05. If the guide or a required policy cannot be read, record the missing check rather than claiming compliance. Release preparation can continue, but store submission waits for the outstanding check.

## 1. Draft from the released behavior

Use the candidate platform's versioned changelog and included changes. Write two or three short sentences about shipped features and material fixes. Exclude internal maintenance, CI, tests, hashes and PR numbers. A shared product change may inform both platforms, but validate each platform's text separately; never copy a sibling's store notes without checking them.

Prefer wording that describes the benefit without naming another operating system. For example, use “Improved wallet recovery” instead of “Improved wallet recovery across iOS and Android.” Keep the detailed cross-platform explanation in the engineering changelog when useful; do not remove it from technical history to satisfy a public store-summary rule.

## 2. Apply the destination store's rules

### App Store

[Apple guideline 2.3.10](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata) restricts references to other mobile platforms and alternative app marketplaces unless specific interactive functionality has been approved. Public App Store notes must omit Android and competing-store references by default. If such a reference is essential, record the relevant Apple approval before retaining it; do not infer an exception from cross-platform support alone.

Keep feature claims accurate and describe significant changes, following the rest of Apple's Accurate Metadata guidance. When preparing the final listing, inspect the public description, promotional text and creative assets for the same issue. Do not confuse supported blockchain-network or hardware-wallet names with competing mobile platforms.

### Google Play

[Google's metadata policy](https://support.google.com/googleplay/android-developer/answer/9898842?hl=en) requires accurate, relevant metadata and disallows misleading or excessive content. Its [release-note instructions](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en) prohibit promotional release notes and solicitations, and allow up to 500 Unicode characters per language. Keep every translated release note within that limit and verify the destination field accepts it.

Prefer the same platform-neutral benefit wording here. Do not describe Google's policy as Apple's blanket restriction on naming other platforms; a factual interoperability reference is assessed for relevance and accuracy.

## 3. Check every translation

Validate the English draft before translating, then review English, French, Spanish, Portuguese and German independently. Before submission, enumerate the actual configured store locales and record the language-to-locale mapping, including regional variants. Check every populated locale, not only the five source-language headings.

For each text, verify the feature claims, platform/store references, natural grammar and current destination length/format rules. For App Store text, run a case-insensitive search for competing-platform/store references (at least `Android`, `Google Play` and `Play Store`) across every translation and resolve each hit or record its documented approval. Also review translated references semantically; a clean string search alone is insufficient. Confirm no unsupported feature, extra promise or omitted material change appeared in translation. Never mark an unread or missing translation as checked.

## 4. Synchronize approved text and read it back

Keep one approved wording per platform/language. Synchronize it across:

- The app repo's `.ai/release-notes-{version}.md`.
- The existing platform/version review document in Drive, when used.
- The GitHub draft's `Store Release Notes` section (English only).
- Every corresponding store-console release-note field.

Read each destination before editing; preserve human edits, document formatting and other authored release content. Reconcile conflicting wording before replacing it. Update the existing GitHub section once, preserving the changelog; do not prepend another copy on retries. Update a reused Google Doc in place with supported tools and revision protection when available, then read it back. If a destination cannot be updated, record it as pending and name the required follow-up rather than asserting that all copies match.

An optional Drive document that was never created, or pending domain sharing alone, need not block submission when the approved local notes and store fields are verified. Record that omission explicitly. Differing wording in an existing review document still needs reconciliation before calling its contents approved or synchronized.

After saving the store fields, reopen/read back each configured locale and compare it with the approved text. Recheck any copied description, promotional text or creative assets before submission. Inspect the actual saved text, not a local source file alone. Preserve the intended build and release policy. Any later edit or rejection correction repeats the affected language, synchronization and final store-readback checks before resubmission.

## 5. Record two checkpoints

Save a compact record in `.ai/store-notes-check-{version}.md` and include its path/status in the release handoff:

- Platform/version, candidate source revision and changelog used.
- Shared-guide revision, official policy links and check date.
- Source languages checked, configured locale mapping and length/wording results.
- Local/Drive/GitHub synchronization results; explicitly list unavailable destinations.
- Store readback per locale, selected build and release policy when verified.
- Outstanding content questions, missing checks and their follow-up.

At generation time, store-console readback may be **pending**; do not block branch/build preparation solely because the store draft does not exist yet. Before each authorized submission or resubmission, complete the store readback and resolve content/policy questions. Report **verified** only for checks actually completed; a generated summary or a saved draft is not store approval.

A metadata-only rejection can normally be corrected using the existing candidate. Inspect the rejection and console requirements before deciding whether another binary is needed; do not rebuild or retag automatically just to change release-note wording.
