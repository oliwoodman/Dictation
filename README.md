<div align="center">

# Dictate

**Speak. It types.**

Lightning-fast voice-to-text for macOS. Press a hotkey, speak, and your words appear wherever you're typing — Slack, Chrome, VS Code, Notes, anywhere.

<img src="logo-256.png" width="120" alt="Dictate icon" />

</div>

---

Dictate is a tiny macOS menu bar app. Hold **Right Option + Space**, talk, let go, and your transcribed text is pasted into whatever app you're in. Transcription runs on [Groq's](https://groq.com) blazing-fast Whisper API, so words usually appear in under a second.

It's **bring-your-own-key (BYOK)** — you use your own free Groq API key, so your audio goes straight from your Mac to Groq and nowhere else. There's no account, no server, no subscription.

## Download

The easiest way to get started:

1. **[Download the latest release →](https://github.com/oliwoodman/Dictation/releases/latest)** (`Dictate.zip`)
2. Unzip it and drag **Dictate.app** into your **Applications** folder.
3. Open it. A guided wizard walks you through microphone + accessibility permissions and your Groq API key.

The app is signed and notarized by Apple, so it opens without security warnings. Requires **macOS 12.0 or later**.

## Getting a free Groq API key

Dictate needs a Groq API key to transcribe (it's free):

1. Go to [console.groq.com/keys](https://console.groq.com/keys).
2. Sign up / log in.
3. Click **Create API Key**, copy it (starts with `gsk_...`).
4. Paste it into Dictate's setup wizard.

Groq's free tier comfortably covers everyday dictation. Your key is stored locally on your Mac in `~/Library/Application Support/Dictate/config.json` and is only ever sent to Groq.

## How to use

- **Right Option + Space** — hold to record, release to transcribe and paste.
- A small floating waveform shows while you're recording.
- The menu bar icon gives you access to settings, changing your API key, and help.

## Build from source

No Xcode project needed — it's a single Swift file compiled with `swiftc`.

```bash
git clone https://github.com/oliwoodman/Dictation.git
cd Dictation
./build.sh
open Dictate.app
```

That produces an unsigned local build. To produce a signed + notarized build for distribution, set your Apple developer credentials:

```bash
SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)" \
APPLE_ID="you@example.com" \
TEAM_ID="YOURTEAMID" \
APP_PASSWORD="your-app-specific-password" \
./build.sh
```

**Requirements:** macOS 12.0+, Swift toolchain (Xcode Command Line Tools — `xcode-select --install`).

## How it works

Single-file Swift app ([`dictation.swift`](dictation.swift)) using Cocoa, AVFoundation, and Carbon:

- **DictationController** — recording + transcription. Captures audio with `AVAudioEngine`, sends it to Groq, pastes the result via `CGEvent`.
- **DictationPanel / WaveformView** — the floating recording UI with a real-time waveform.
- **OnboardingWizard** — first-run setup (permissions + API key).
- **MenuBarManager** — the menu bar item and its menu.

## Privacy

- Audio is sent **only** to Groq for transcription, over HTTPS.
- Your API key never leaves your machine except in requests to Groq.
- No analytics, no telemetry, no accounts.

## Contributing

Issues and pull requests are welcome. It's a single file — easy to dive into.

## License

[MIT](LICENSE) © Oli Woodman

---

<div align="center">
Built by <a href="https://instagram.com/buildwitholi">@buildwitholi</a>
</div>
