# Dictate

macOS menu bar app for voice-to-text. Press Right Option + Space, speak, and transcribed text is pasted wherever you're typing. Uses Groq's Whisper API (BYOK — user brings their own free API key).

## Architecture

Single-file Swift app (`dictation.swift`, ~1685 lines) compiled directly with `swiftc` — no Xcode project. Frameworks: Cocoa, AVFoundation, Carbon.

### Key components:
- **DictationController** — Core recording/transcription logic. Manages AVAudioEngine, sends audio to Groq API, pastes result via CGEvent
- **DictationPanel** — Floating NSPanel with waveform visualizer, shown during recording/transcribing
- **OnboardingWizard** — 4-step first-run wizard (Welcome → Permissions → API Key → Complete)
- **MenuBarManager** — NSStatusItem menu with shortcuts, help, about, change API key
- **SetupWindow** — Standalone API key change dialog (post-onboarding)
- **WaveformView** — Real-time audio level bars using CADisplayLink

### Config
- Config dir: `~/Library/Application Support/Dictate/config.json`
- Stores: `apiKey`, `onboardingComplete`
- Old "Dictation" config dir is auto-migrated on launch

## Build & Distribution

```bash
# Dev build (unsigned)
./build.sh

# Signed + notarized build
SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)" \
APPLE_ID="you@example.com" \
TEAM_ID="YOURTEAMID" \
APP_PASSWORD="<app-specific-password>" \
./build.sh
```

Output: `Dictate.app` and `Dictate.zip` (attach to a GitHub Release).

- Bundle ID: `com.oliwoodman.dictate`
- Entitlements: `entitlements.plist` (mic, Apple Events, unsigned executable memory)
- Minimum macOS: 12.0

## Branding

- Accent color: `#c15f3c`
- App icon: Waveform bars on rounded rect (generated in build.sh via Swift script)
- Fonts: SF Rounded Bold for titles, system fonts elsewhere

## Promo videos

`promo/` is a Remotion project that renders the product promo and the setup-wizard walkthrough; its README says how.

## Distribution

Open source under the MIT license. Prebuilt, signed + notarized `Dictate.zip` is
attached to GitHub Releases for non-technical users; developers can build from
source with `./build.sh`.
