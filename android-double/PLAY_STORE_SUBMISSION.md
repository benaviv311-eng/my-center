# DOUBLE — Google Play submission package

Prepared for DOUBLE Android 1.0.0.

## App identity
- App name: DOUBLE
- Package name: `com.benaviv.doublegame`
- versionCode: 1
- versionName: 1.0.0
- Target SDK: 36 (Android 16)
- Min SDK: 24
- Category: Game / Casual
- Monetization: Free, no ads

## Play-ready artifact
Use the signed bundle created with the private upload key:
- `DOUBLE-release-signed.aab`

The upload key is intentionally NOT committed to this public repository.

## Privacy policy
Public URL:
https://benaviv311-eng.github.io/my-center/double-privacy.html

## Suggested store listing

### App name
DOUBLE

### Short description
Find the one matching symbol. Fast, colorful rounds for solo and two-player play.

### Full description
DOUBLE is a fast visual matching game built around one simple challenge: every pair of cards shares exactly one matching symbol — find it before time runs out or before your opponent does.

Play solo, chase faster reaction times, complete daily challenges, or compete head-to-head in several two-player modes.

Features:
- Classic speed mode
- Daily challenge
- Sprint challenges
- Survival and Knockout modes
- Two-player local competition
- Full-deck, Race, Combo, Sudden Death and Gold variants
- Multiple visual icon packs
- Reaction-time tracking
- Local best scores and statistics
- Music, sound effects and announcer styles
- Touch and keyboard controls

No account is required. DOUBLE contains no advertising.

## Data safety — current build
Static review of the DOUBLE v34 files found local storage usage for settings/statistics and no analytics, Firebase, Supabase, advertising SDKs, cookies, or explicit network data-submission code in the reviewed game files.

Recommended Play Console answers for the current build:
- Data collected by the developer: No
- Data shared with third parties by the developer: No
- Account creation: No
- Ads: No
- Precise location: No
- Contacts: No
- Camera: No
- Microphone: No
- Financial information: No
- Health information: No
- Local gameplay/settings data: stored on-device only

Re-check this section before every release if online features, cloud saves, analytics, ads, accounts, or multiplayer networking are added.

## Permissions
- INTERNET — loads the game from the project's HTTPS GitHub Pages site.
- VIBRATE — optional haptic feedback.

## Play App Signing
Use Google Play App Signing. Keep the private upload key secure and separate from Google's app-signing key.

For every future update:
1. Increase `versionCode`.
2. Build a new release AAB.
3. Sign it with the SAME upload key.
4. Verify the signed bundle before upload.

## 2026 compliance notes
- New mobile apps submitted after August 31, 2026 must target API 36 or higher. This project targets API 36.
- Play package-name registration / Android developer verification requirements are in effect in 2026, so register `com.benaviv.doublegame` in the Play Console as part of app setup.
