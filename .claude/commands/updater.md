---
description: Manage updater release files for iOS and Android — edit, upload, verify, commit.
---

# Updater Release Workflow

You are guiding the user through publishing an updater release for Bitkit.

## Architecture

Both platform release files live in this repo:
- `updater/ios/release.json` → uploaded to `synonymdev/bitkit` GitHub release tagged `updater`
- `updater/android/release.json` → uploaded to `synonymdev/bitkit-android` GitHub release tagged `updater`

Apps fetch their respective file at:
- iOS: `https://github.com/synonymdev/bitkit/releases/download/updater/release.json`
- Android: `https://github.com/synonymdev/bitkit-android/releases/download/updater/release.json`

### How the apps consume it
- **iOS:** `AppUpdateService` (`Bitkit/Services/AppUpdateService.swift`), URL from `Env.swift:280`. Compares `buildNumber` against current app build; `critical: true` shows a blocking full-screen.
- **Android:** `AppUpdaterService` (`to.bitkit.services.AppUpdaterService`), URL from `Env.kt:133`. Same comparison logic.

## Critical JSON rules

### iOS `release.json`
**Only include the `ios` entry — NEVER include null entries for other platforms.**
iOS `JSONDecoder` maps `platforms` as `[String: AppUpdateInfo]` (non-optional values). A null value breaks decoding and crashes the app.

Template:
```json
{
  "platforms": {
    "ios": {
      "version": "VERSION_TAG",
      "buildNumber": BUILD_NUMBER,
      "notes": "https://github.com/synonymdev/bitkit-ios/releases/tag/VERSION_TAG",
      "pub_date": "ISO_8601_TIMESTAMP",
      "url": "https://apps.apple.com/app/bitkit-wallet/id6502440655",
      "critical": false
    }
  }
}
```

### Android `release.json`
**Must include `"ios": null` explicitly.** Early Android releases lack a serialization default for the `ios` field — omitting it would crash the app.

Template:
```json
{
  "platforms": {
    "ios": null,
    "android": {
      "version": "VERSION_TAG",
      "buildNumber": BUILD_NUMBER,
      "notes": "https://github.com/synonymdev/bitkit-android/releases/tag/VERSION_TAG",
      "pub_date": "ISO_8601_TIMESTAMP",
      "url": "https://play.google.com/store/apps/details?id=to.bitkit",
      "critical": false
    }
  }
}
```

### Field reference
- `version`: git tag, e.g. `v2.0.5`
- `buildNumber`: integer build number from the release
- `notes`: URL to the GitHub release for that version tag on the platform repo
- `pub_date`: ISO 8601 timestamp — **sourced from the git tag timestamp** of the matching version tag on the platform repo
- `url`: app store URL (fixed per platform)
- `critical`: boolean — `true` shows a blocking full-screen update prompt

## Workflow

Follow these steps in order. Use `AskUserQuestion` for each decision point.

### Step 1 — Choose platform

Ask the user which platform to update. Options: **iOS**, **Android**, or **Both** (default: both).

### Step 2 — Infer values automatically

For each selected platform, fetch the latest tag and its metadata:

**iOS:**
```bash
# Get the latest tag
gh api repos/synonymdev/bitkit-ios/tags --jq '.[0]'

# Get the tag's commit SHA, then fetch the commit timestamp for pub_date
# If it's a lightweight tag, .object.sha is the commit directly
# If it's an annotated tag, .object.sha points to a tag object — dereference it
gh api repos/synonymdev/bitkit-ios/git/ref/tags/VERSION_TAG
```

**Android:**
```bash
gh api repos/synonymdev/bitkit-android/tags --jq '.[0]'
gh api repos/synonymdev/bitkit-android/git/ref/tags/VERSION_TAG
```

For `pub_date`, resolve the tag ref:
1. Fetch `git/ref/tags/VERSION_TAG` → get `.object.type` and `.object.sha`
2. If type is `"tag"` (annotated): fetch `git/tags/SHA` → use `.tagger.date`
3. If type is `"commit"` (lightweight): fetch `git/commits/SHA` → use `.committer.date`

For `buildNumber`: check the associated GitHub release for a build number, or ask the user.

Ask whether `critical` should be true (default: **false**).

### Step 3 — Confirm values

Present all inferred values to the user in a clear summary table and ask for confirmation before proceeding. Example:

```
Platform: iOS
  version:     v2.0.6
  buildNumber: 180
  pub_date:    2026-02-25T10:30:00Z
  critical:    false

Platform: Android
  version:     v2.0.4
  buildNumber: 178
  pub_date:    2026-02-25T12:00:00Z
  critical:    false
```

Wait for explicit user confirmation.

### Step 4 — Edit local release files

Read the current `updater/ios/release.json` and/or `updater/android/release.json`, then edit them with the confirmed values.

**Remember the JSON rules:**
- iOS file: only the `ios` key, no nulls
- Android file: must include `"ios": null`

### Step 5 — Upload to GitHub releases

```bash
# iOS
gh release upload updater updater/ios/release.json --clobber --repo synonymdev/bitkit

# Android
gh release upload updater updater/android/release.json --clobber --repo synonymdev/bitkit-android
```

### Step 6 — Verify

Fetch the uploaded files and confirm they match:

```bash
curl -sL https://github.com/synonymdev/bitkit/releases/download/updater/release.json | jq .
curl -sL https://github.com/synonymdev/bitkit-android/releases/download/updater/release.json | jq .
```

Show the output to the user and confirm it looks correct.

### Step 7 — Commit and push

Stage and commit the updated release file(s) to the repo, then push.

### Step 8 — Present links

Show the user the updater release pages:
- iOS: https://github.com/synonymdev/bitkit/releases/tag/updater
- Android: https://github.com/synonymdev/bitkit-android/releases/tag/updater
