#!/bin/bash
set -e

cd "$(dirname "$0")"

APP="Dictate.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
BINARY_NAME="dictate"

# Code signing identity (set to empty string to skip signing)
SIGN_IDENTITY="${SIGN_IDENTITY:-}"
APPLE_ID="${APPLE_ID:-}"
TEAM_ID="${TEAM_ID:-}"
APP_PASSWORD="${APP_PASSWORD:-}"

echo "=== Building Dictate.app ==="

rm -rf "$APP"
mkdir -p "$MACOS" "$RESOURCES"

# --- Generate app icon ---
echo "Generating app icon..."
cat > /tmp/genicon.swift << 'ICONSWIFT'
import Cocoa

let accent = NSColor(srgbRed: 193/255, green: 95/255, blue: 60/255, alpha: 1)
let outDir = CommandLine.arguments[1]

try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

func drawIcon(size: Int) -> NSImage {
    let s = CGFloat(size)
    let image = NSImage(size: NSSize(width: s, height: s))
    image.lockFocus()

    // Rounded rect background
    accent.setFill()
    let inset = s * 0.08
    NSBezierPath(roundedRect: NSRect(x: inset, y: inset, width: s - inset * 2, height: s - inset * 2),
                 xRadius: s * 0.22, yRadius: s * 0.22).fill()

    // Waveform bars
    NSColor.white.setFill()
    let barCount = 5
    let barW = s * 0.075
    let spacing = s * 0.055
    let totalW = CGFloat(barCount) * barW + CGFloat(barCount - 1) * spacing
    let startX = (s - totalW) / 2
    let heights: [CGFloat] = [0.2, 0.5, 0.8, 0.5, 0.2]

    for i in 0..<barCount {
        let h = heights[i] * s * 0.48
        let x = startX + CGFloat(i) * (barW + spacing)
        let y = (s - h) / 2
        NSBezierPath(roundedRect: NSRect(x: x, y: y, width: barW, height: h),
                     xRadius: barW / 2, yRadius: barW / 2).fill()
    }

    image.unlockFocus()
    return image
}

func savePNG(_ image: NSImage, to path: String) {
    guard let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else { return }
    try? png.write(to: URL(fileURLWithPath: path))
}

let pairs: [(Int, String)] = [
    (16, "icon_16x16.png"), (32, "icon_16x16@2x.png"),
    (32, "icon_32x32.png"), (64, "icon_32x32@2x.png"),
    (128, "icon_128x128.png"), (256, "icon_128x128@2x.png"),
    (256, "icon_256x256.png"), (512, "icon_256x256@2x.png"),
    (512, "icon_512x512.png"), (1024, "icon_512x512@2x.png"),
]

for (size, name) in pairs {
    savePNG(drawIcon(size: size), to: "\(outDir)/\(name)")
}
ICONSWIFT

ICONSET="/tmp/Dictate.iconset"
rm -rf "$ICONSET"
swiftc -framework Cocoa /tmp/genicon.swift -o /tmp/genicon
/tmp/genicon "$ICONSET"
iconutil -c icns "$ICONSET" -o "$RESOURCES/AppIcon.icns"
rm -rf "$ICONSET" /tmp/genicon /tmp/genicon.swift
echo "Icon generated."

# --- Info.plist ---
cat > "$CONTENTS/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>dictate</string>
    <key>CFBundleIdentifier</key>
    <string>com.oliwoodman.dictate</string>
    <key>CFBundleName</key>
    <string>Dictate</string>
    <key>CFBundleDisplayName</key>
    <string>Dictate</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>LSUIElement</key>
    <false/>
    <key>NSMicrophoneUsageDescription</key>
    <string>Dictate needs microphone access to record your voice for transcription.</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

# --- Compile main app ---
echo "Compiling..."
swiftc -O -o "$MACOS/$BINARY_NAME" dictation.swift \
    -framework Cocoa \
    -framework AVFoundation \
    -framework Carbon

echo "Compiled successfully."

# --- Code signing (if identity is set) ---
if [ -n "$SIGN_IDENTITY" ]; then
    echo ""
    echo "=== Code Signing ==="

    # Sign the binary
    codesign --force --sign "$SIGN_IDENTITY" \
        --options runtime \
        --entitlements entitlements.plist \
        "$MACOS/$BINARY_NAME"

    # Sign the app bundle
    codesign --force --sign "$SIGN_IDENTITY" \
        --options runtime \
        --entitlements entitlements.plist \
        "$APP"

    # Verify
    codesign --verify --verbose "$APP"
    echo "Code signing complete."

    # Create distributable zip
    echo "Creating distributable zip..."
    ditto -c -k --keepParent "$APP" "Dictate.zip"
    echo "Created Dictate.zip"

    # --- Notarization (if Apple ID is set) ---
    if [ -n "$APPLE_ID" ] && [ -n "$TEAM_ID" ] && [ -n "$APP_PASSWORD" ]; then
        echo ""
        echo "=== Notarization ==="
        xcrun notarytool submit "Dictate.zip" \
            --apple-id "$APPLE_ID" \
            --team-id "$TEAM_ID" \
            --password "$APP_PASSWORD" \
            --wait

        # Staple the notarization ticket
        xcrun stapler staple "$APP"
        echo "Notarization complete."

        # Re-create zip with stapled app
        rm -f "Dictate.zip"
        ditto -c -k --keepParent "$APP" "Dictate.zip"
        echo "Updated Dictate.zip with notarization ticket."
    else
        echo ""
        echo "Skipping notarization (set APPLE_ID, TEAM_ID, and APP_PASSWORD to enable)"
    fi
else
    echo ""
    echo "Skipping code signing (set SIGN_IDENTITY to enable)"
    echo "  Example: SIGN_IDENTITY='Developer ID Application: Your Name' ./build.sh"
fi

echo ""
echo "=== Built: $(pwd)/$APP ==="
echo ""
echo "To install:"
echo "  cp -r $APP /Applications/"
echo "  open /Applications/$APP"
echo ""
echo "Or run directly:"
echo "  open $APP"
