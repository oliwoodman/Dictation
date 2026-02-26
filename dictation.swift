import Cocoa
import AVFoundation
import Carbon.HIToolbox

// MARK: - Constants

let kAppName = "Dictate"
let kAppVersion = "1.0.0"
let kTempAudio = NSTemporaryDirectory() + "dictate-recording.wav"
let kConfigDir = NSHomeDirectory() + "/Library/Application Support/Dictate"
let kConfigFile = kConfigDir + "/config.json"

let kBarCount = 20
let kPanelWidth: CGFloat = 320
let kPanelHeight: CGFloat = 96
let kBarWidth: CGFloat = 4.0
let kBarSpacing: CGFloat = 3.0
let kBarMaxHeight: CGFloat = 48
let kBarMinHeight: CGFloat = 4
let kCornerRadius: CGFloat = 20
let kRightOptionFlag: UInt64 = 0x40
let kSmoothingFactor: Float = 0.28  // Snappier response

// MARK: - Colors

let kAccent = NSColor(srgbRed: 193/255, green: 95/255, blue: 60/255, alpha: 1)       // #c15f3c
let kSecondary = NSColor(srgbRed: 177/255, green: 173/255, blue: 161/255, alpha: 1)   // #b1ada1
let kBgLight = NSColor(srgbRed: 244/255, green: 243/255, blue: 238/255, alpha: 1)     // #f4f3ee
let kBgDark = NSColor(srgbRed: 28/255, green: 28/255, blue: 30/255, alpha: 1)         // #1c1c1e

var isDarkMode: Bool {
    NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
}
func panelBg() -> NSColor { isDarkMode ? kBgDark : kBgLight }
func setupBg() -> NSColor { isDarkMode ? kBgDark : kBgLight }
func labelColor() -> NSColor { isDarkMode ? NSColor(srgbRed: 220/255, green: 218/255, blue: 213/255, alpha: 1) : kSecondary }

func makeCard(frame: NSRect) -> NSView {
    let card = NSView(frame: frame)
    card.wantsLayer = true
    card.layer?.cornerRadius = 12
    card.layer?.backgroundColor = (isDarkMode ? NSColor.white.withAlphaComponent(0.06) : NSColor.black.withAlphaComponent(0.06)).cgColor
    card.shadow = NSShadow()
    card.layer?.shadowColor = NSColor.black.cgColor
    card.layer?.shadowOpacity = 0.04
    card.layer?.shadowRadius = 8
    card.layer?.shadowOffset = CGSize(width: 0, height: -2)
    return card
}

// MARK: - Fonts

func titleFont(_ size: CGFloat) -> NSFont {
    let descriptor = NSFontDescriptor.preferredFontDescriptor(forTextStyle: .body)
        .withDesign(.rounded)?
        .withSymbolicTraits(.bold) ?? NSFontDescriptor()
    return NSFont(descriptor: descriptor, size: size) ?? NSFont.systemFont(ofSize: size, weight: .bold)
}

// MARK: - Brand Icon

func drawWaveformIcon(in rect: NSRect, color: NSColor, barCount: Int = 5) {
    let heights: [CGFloat] = [0.25, 0.55, 0.85, 0.55, 0.25]
    let barW = rect.width * 0.1
    let spacing = rect.width * 0.06
    let totalW = CGFloat(barCount) * barW + CGFloat(barCount - 1) * spacing
    let startX = rect.minX + (rect.width - totalW) / 2

    color.setFill()
    for i in 0..<barCount {
        let h = heights[i] * rect.height * 0.55
        let x = startX + CGFloat(i) * (barW + spacing)
        let y = rect.minY + (rect.height - h) / 2
        NSBezierPath(roundedRect: NSRect(x: x, y: y, width: barW, height: h),
                     xRadius: barW / 2, yRadius: barW / 2).fill()
    }
}

func makeMenuBarIcon(recording: Bool) -> NSImage {
    let size = NSSize(width: 18, height: 18)
    let image = NSImage(size: size, flipped: false) { rect in
        if recording {
            kAccent.setFill()
            // Filled rounded bg
            NSBezierPath(roundedRect: rect.insetBy(dx: 1, dy: 1), xRadius: 4, yRadius: 4).fill()
            drawWaveformIcon(in: rect.insetBy(dx: 2, dy: 2), color: .white)
        } else {
            drawWaveformIcon(in: rect, color: isDarkMode ? .white : .black)
        }
        return true
    }
    if !recording { image.isTemplate = true }
    return image
}

// MARK: - Config

func loadAPIKey() -> String? {
    if let data = try? Data(contentsOf: URL(fileURLWithPath: kConfigFile)),
       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
       let key = json["apiKey"] as? String, !key.isEmpty {
        return key
    }
    return nil
}

func saveAPIKey(_ key: String) {
    try? FileManager.default.createDirectory(atPath: kConfigDir, withIntermediateDirectories: true)
    var config: [String: Any] = ["apiKey": key]
    // Preserve existing config values
    if let data = try? Data(contentsOf: URL(fileURLWithPath: kConfigFile)),
       let existing = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
        for (k, v) in existing where k != "apiKey" { config[k] = v }
    }
    if let data = try? JSONSerialization.data(withJSONObject: config) {
        try? data.write(to: URL(fileURLWithPath: kConfigFile))
    }
}

func markOnboardingComplete() {
    try? FileManager.default.createDirectory(atPath: kConfigDir, withIntermediateDirectories: true)
    var config: [String: Any] = ["onboardingComplete": true, "version": kAppVersion]
    if let data = try? Data(contentsOf: URL(fileURLWithPath: kConfigFile)),
       let existing = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
        for (k, v) in existing { config[k] = v }
        config["onboardingComplete"] = true
    }
    if let data = try? JSONSerialization.data(withJSONObject: config) {
        try? data.write(to: URL(fileURLWithPath: kConfigFile))
    }
}

// MARK: - Audio Recorder

class AudioRecorder {
    let engine = AVAudioEngine()
    var audioFile: AVAudioFile?
    var onLevelsUpdate: (([Float]) -> Void)?
    var startTime: Date?

    func start() throws {
        let inputNode = engine.inputNode
        let hwFormat = inputNode.outputFormat(forBus: 0)
        audioFile = try AVAudioFile(forWriting: URL(fileURLWithPath: kTempAudio), settings: hwFormat.settings)
        startTime = Date()

        inputNode.installTap(onBus: 0, bufferSize: 4096, format: hwFormat) { [weak self] buffer, _ in
            guard let self = self, let channelData = buffer.floatChannelData?[0] else { return }
            let frameCount = Int(buffer.frameLength)

            // Compute per-band energy with overlap for richer visualisation
            var levels = [Float](repeating: 0, count: kBarCount)
            let segmentSize = max(1, frameCount / kBarCount)
            var overallRms: Float = 0
            for j in 0..<frameCount { overallRms += channelData[j] * channelData[j] }
            overallRms = sqrt(overallRms / Float(max(frameCount, 1)))

            for i in 0..<kBarCount {
                let start = i * segmentSize
                let end = min(start + segmentSize, frameCount)
                var sum: Float = 0
                for j in start..<end { sum += channelData[j] * channelData[j] }
                let bandRms = sqrt(sum / Float(max(end - start, 1)))
                // Blend band energy with overall level + jitter for organic feel
                let blended = bandRms * 0.6 + overallRms * 0.4
                let jitter = Float.random(in: 0.7...1.3)
                levels[i] = min(1.0, blended * 14.0 * jitter)
            }

            DispatchQueue.main.async { self.onLevelsUpdate?(levels) }
            try? self.audioFile?.write(from: buffer)
        }

        try engine.start()
    }

    func stop() -> TimeInterval {
        let duration = startTime.map { Date().timeIntervalSince($0) } ?? 0
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        audioFile = nil
        startTime = nil
        return duration
    }
}

// MARK: - Waveform View (Layer-based smooth animation)

class WaveformView: NSView {
    var barLayers: [CALayer] = []
    var displayLevels: [Float]
    var targetLevels: [Float]
    var animTimer: Timer?
    var phase: Double = 0  // For transcribing wave animation

    override init(frame: NSRect) {
        displayLevels = Array(repeating: 0, count: kBarCount)
        targetLevels = Array(repeating: 0, count: kBarCount)
        super.init(frame: frame)
        wantsLayer = true
        layer?.masksToBounds = false
        setupBars()
    }

    required init?(coder: NSCoder) { fatalError() }

    func setupBars() {
        let totalW = CGFloat(kBarCount) * kBarWidth + CGFloat(kBarCount - 1) * kBarSpacing
        let startX = (bounds.width - totalW) / 2

        for i in 0..<kBarCount {
            let bar = CALayer()
            bar.backgroundColor = kAccent.cgColor
            bar.cornerRadius = kBarWidth / 2
            let x = startX + CGFloat(i) * (kBarWidth + kBarSpacing)
            bar.frame = CGRect(x: x, y: bounds.midY - kBarMinHeight / 2, width: kBarWidth, height: kBarMinHeight)
            layer?.addSublayer(bar)
            barLayers.append(bar)
        }
    }

    func startAnimating() {
        guard animTimer == nil else { return }
        animTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            self?.interpolate()
        }
    }

    func stopAnimating() {
        animTimer?.invalidate()
        animTimer = nil
    }

    func update(levels: [Float]) {
        targetLevels = levels
    }

    func setTranscribingMode(_ on: Bool) {
        if on { phase = 0 }
    }

    func interpolate() {
        CATransaction.begin()
        CATransaction.setDisableActions(true)

        let totalW = CGFloat(kBarCount) * kBarWidth + CGFloat(kBarCount - 1) * kBarSpacing
        let startX = (bounds.width - totalW) / 2

        for i in 0..<kBarCount {
            displayLevels[i] += (targetLevels[i] - displayLevels[i]) * kSmoothingFactor
            let level = max(0, min(1, displayLevels[i]))
            let h = max(kBarMinHeight, CGFloat(level) * kBarMaxHeight)
            let x = startX + CGFloat(i) * (kBarWidth + kBarSpacing)
            barLayers[i].frame = CGRect(x: x, y: bounds.midY - h / 2, width: kBarWidth, height: h)
        }

        CATransaction.commit()
    }

    func reset() {
        displayLevels = Array(repeating: 0, count: kBarCount)
        targetLevels = Array(repeating: 0, count: kBarCount)
        interpolate()
    }
}

// MARK: - Recording Panel

class DictationPanel: NSPanel {
    let waveformView: WaveformView
    let statusLabel = NSTextField(labelWithString: "")
    let timerLabel = NSTextField(labelWithString: "")
    let bgView: NSView
    let pulsingDot = NSView()
    var recordingTimer: Timer?
    var recordingStart: Date?
    var transcribeDotsTimer: Timer?

    init() {
        waveformView = WaveformView(frame: NSRect(x: 0, y: 28, width: kPanelWidth, height: 48))
        bgView = NSView(frame: NSRect(x: 0, y: 0, width: kPanelWidth, height: kPanelHeight))

        let screen = NSScreen.main?.visibleFrame ?? .zero
        super.init(
            contentRect: NSRect(x: screen.midX - kPanelWidth / 2, y: screen.minY + 50, width: kPanelWidth, height: kPanelHeight),
            styleMask: [.nonactivatingPanel, .borderless],
            backing: .buffered,
            defer: false
        )

        level = .floating
        isOpaque = false
        backgroundColor = .clear
        hasShadow = true
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        isMovableByWindowBackground = true

        bgView.wantsLayer = true
        bgView.layer?.cornerRadius = kCornerRadius
        bgView.layer?.borderWidth = 1
        bgView.layer?.shadowColor = NSColor.black.cgColor
        bgView.layer?.shadowOpacity = 0.15
        bgView.layer?.shadowRadius = 16
        bgView.layer?.shadowOffset = CGSize(width: 0, height: -4)
        contentView = bgView

        bgView.addSubview(waveformView)

        // Pulsing recording dot
        pulsingDot.wantsLayer = true
        pulsingDot.layer?.cornerRadius = 3
        pulsingDot.isHidden = true
        bgView.addSubview(pulsingDot)

        // Status label
        statusLabel.frame = NSRect(x: 0, y: 8, width: kPanelWidth, height: 16)
        statusLabel.alignment = .center
        statusLabel.font = NSFont.systemFont(ofSize: 10, weight: .medium)
        statusLabel.textColor = kSecondary
        statusLabel.backgroundColor = .clear
        statusLabel.isBordered = false
        bgView.addSubview(statusLabel)

        // Duration timer
        timerLabel.frame = NSRect(x: kPanelWidth - 56, y: 8, width: 44, height: 16)
        timerLabel.alignment = .right
        timerLabel.font = NSFont.monospacedDigitSystemFont(ofSize: 10, weight: .medium)
        timerLabel.backgroundColor = .clear
        timerLabel.isBordered = false
        timerLabel.isHidden = true
        bgView.addSubview(timerLabel)
    }

    func applyAppearance() {
        bgView.layer?.backgroundColor = panelBg().cgColor
        bgView.layer?.borderColor = kAccent.withAlphaComponent(isDarkMode ? 0.2 : 0.15).cgColor
        pulsingDot.layer?.backgroundColor = kAccent.cgColor
        statusLabel.textColor = labelColor()
        timerLabel.textColor = kSecondary.withAlphaComponent(0.5)
    }

    private func positionDot() {
        let text = statusLabel.stringValue
        let font = statusLabel.font!
        let textWidth = (text as NSString).size(withAttributes: [.font: font]).width
        let textStartX = (kPanelWidth - textWidth) / 2
        pulsingDot.frame = NSRect(x: textStartX - 13, y: 13, width: 6, height: 6)
    }

    private func startPulse() {
        pulsingDot.isHidden = false
        let pulse = CABasicAnimation(keyPath: "opacity")
        pulse.fromValue = 1.0
        pulse.toValue = 0.3
        pulse.duration = 0.8
        pulse.autoreverses = true
        pulse.repeatCount = .infinity
        pulse.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        pulsingDot.layer?.add(pulse, forKey: "pulse")
    }

    private func stopPulse() {
        pulsingDot.layer?.removeAnimation(forKey: "pulse")
        pulsingDot.isHidden = true
    }

    func showPanel() {
        applyAppearance()
        if let screen = NSScreen.main {
            setFrameOrigin(NSPoint(x: screen.visibleFrame.midX - kPanelWidth / 2, y: screen.visibleFrame.minY + 50))
        }
        statusLabel.stringValue = "RECORDING"
        statusLabel.font = NSFont.systemFont(ofSize: 10, weight: .semibold)
        statusLabel.textColor = kAccent.withAlphaComponent(0.8)
        waveformView.reset()
        waveformView.startAnimating()

        // Pulsing dot
        positionDot()
        startPulse()

        // Duration timer
        recordingStart = Date()
        timerLabel.stringValue = "0:00"
        timerLabel.isHidden = false
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, let start = self.recordingStart else { return }
            let elapsed = Int(Date().timeIntervalSince(start))
            self.timerLabel.stringValue = String(format: "%d:%02d", elapsed / 60, elapsed % 60)
        }

        alphaValue = 0
        orderFrontRegardless()
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.25
            ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
            self.animator().alphaValue = 1
        }
    }

    func showTranscribing() {
        // Stop recording indicators
        stopPulse()
        recordingTimer?.invalidate()
        recordingTimer = nil
        timerLabel.isHidden = true

        statusLabel.stringValue = "TRANSCRIBING"
        statusLabel.textColor = labelColor().withAlphaComponent(0.6)
        waveformView.setTranscribingMode(true)

        // Animated ellipsis
        var dotCount = 0
        transcribeDotsTimer = Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { [weak self] timer in
            guard let self = self, self.isVisible else { timer.invalidate(); return }
            dotCount = (dotCount + 1) % 4
            self.statusLabel.stringValue = "TRANSCRIBING" + String(repeating: ".", count: dotCount)
        }

        // Gentle sine wave animation
        var phase: Double = 0
        Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] timer in
            guard let self = self, self.isVisible else { timer.invalidate(); return }
            phase += 0.12
            var levels = [Float](repeating: 0, count: kBarCount)
            for i in 0..<kBarCount {
                let wave = sin(phase + Double(i) * 0.4) * 0.5 + 0.5
                levels[i] = Float(wave) * 0.35 + 0.05
            }
            self.waveformView.update(levels: levels)
        }
    }

    func hidePanel() {
        waveformView.stopAnimating()
        stopPulse()
        recordingTimer?.invalidate()
        recordingTimer = nil
        recordingStart = nil
        transcribeDotsTimer?.invalidate()
        transcribeDotsTimer = nil
        timerLabel.isHidden = true
        NSAnimationContext.runAnimationGroup({ ctx in
            ctx.duration = 0.2
            ctx.timingFunction = CAMediaTimingFunction(name: .easeIn)
            self.animator().alphaValue = 0
        }, completionHandler: {
            self.orderOut(nil)
            self.alphaValue = 1
            self.waveformView.reset()
        })
    }
}

// MARK: - Onboarding Icon Views

class CircleIconView: NSView {
    enum IconType { case mic, accessibility, key, check }
    let iconType: IconType

    init(type: IconType, frame: NSRect) {
        self.iconType = type
        super.init(frame: frame)
        wantsLayer = true
    }
    required init?(coder: NSCoder) { fatalError() }

    override func draw(_ dirtyRect: NSRect) {
        kAccent.withAlphaComponent(0.1).setFill()
        NSBezierPath(ovalIn: bounds).fill()

        let symbolName: String
        switch iconType {
        case .mic: symbolName = "mic.fill"
        case .accessibility: symbolName = "hand.raised.fill"
        case .key: symbolName = "key.fill"
        case .check: symbolName = "checkmark"
        }

        guard let symbol = NSImage(systemSymbolName: symbolName, accessibilityDescription: nil) else { return }
        let pointSize = bounds.width * 0.32
        let config = NSImage.SymbolConfiguration(pointSize: pointSize, weight: .medium)
        guard let configured = symbol.withSymbolConfiguration(config) else { return }

        let imageSize = configured.size
        let tinted = NSImage(size: imageSize, flipped: false) { rect in
            kAccent.set()
            rect.fill()
            configured.draw(in: rect, from: .zero, operation: .destinationIn, fraction: 1.0)
            return true
        }
        let imageRect = NSRect(
            x: (bounds.width - imageSize.width) / 2,
            y: (bounds.height - imageSize.height) / 2,
            width: imageSize.width,
            height: imageSize.height
        )
        tinted.draw(in: imageRect)
    }
}

// MARK: - Masked Key Field

class MaskedKeyField: NSTextField, NSTextFieldDelegate {
    var realKey = ""
    private var suppressUpdate = false

    override init(frame: NSRect) {
        super.init(frame: frame)
        delegate = self
    }

    required init?(coder: NSCoder) { fatalError() }

    private func dotCount() -> Int {
        let font = self.font ?? NSFont.systemFont(ofSize: 13)
        let bulletW = ("•" as NSString).size(withAttributes: [.font: font]).width
        let availW = frame.width - 12
        return max(1, Int(availW / bulletW))
    }

    func controlTextDidChange(_ obj: Notification) {
        guard !suppressUpdate else { return }
        guard let editor = currentEditor() as? NSTextView else { return }
        let current = editor.string
        if current.isEmpty {
            realKey = ""
            return
        }
        let clean = current.filter { $0 != "•" }
        if !clean.isEmpty {
            realKey = clean
        }
        let dots = String(repeating: "•", count: dotCount())
        suppressUpdate = true
        editor.string = dots
        editor.setSelectedRange(NSRange(location: dots.count, length: 0))
        suppressUpdate = false
    }

    func setKey(_ key: String) {
        realKey = key
        if key.isEmpty {
            stringValue = ""
        } else {
            stringValue = String(repeating: "•", count: dotCount())
        }
    }
}

// MARK: - Onboarding Wizard

class OnboardingWizard: NSWindow {
    var onComplete: ((String) -> Void)?
    var currentStep = 0
    let totalSteps = 4
    let contentBox: NSView
    var apiKey = ""
    var permissionTimer: Timer?

    init() {
        let w: CGFloat = 480
        let h: CGFloat = 540
        let screen = NSScreen.main!.frame
        contentBox = NSView(frame: NSRect(x: 0, y: 0, width: w, height: h))

        super.init(
            contentRect: NSRect(x: screen.midX - w / 2, y: screen.midY - h / 2, width: w, height: h),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        titlebarAppearsTransparent = true
        titleVisibility = .hidden
        isMovableByWindowBackground = true
        backgroundColor = setupBg()
        contentView?.addSubview(contentBox)

        showStep(0)
    }

    func showStep(_ step: Int) {
        currentStep = step
        permissionTimer?.invalidate()
        permissionTimer = nil
        contentBox.subviews.forEach { $0.removeFromSuperview() }

        let w = contentBox.bounds.width

        // Step indicator (only after welcome)
        if step > 0 {
            let steps = totalSteps - 1 // 3 real steps after welcome
            let currentReal = step - 1
            let indicatorY: CGFloat = contentBox.bounds.height - 50
            let dotSize: CGFloat = 8
            let lineW: CGFloat = 24
            let totalW = CGFloat(steps) * dotSize + CGFloat(steps - 1) * lineW
            let startX = (w - totalW) / 2

            for i in 0..<steps {
                let x = startX + CGFloat(i) * (dotSize + lineW)

                // Dot
                let dot = NSView(frame: NSRect(x: x, y: indicatorY, width: dotSize, height: dotSize))
                dot.wantsLayer = true
                dot.layer?.cornerRadius = dotSize / 2
                dot.layer?.backgroundColor = (i <= currentReal ? kAccent : kSecondary.withAlphaComponent(0.3)).cgColor
                contentBox.addSubview(dot)

                // Connecting line
                if i < steps - 1 {
                    let line = NSView(frame: NSRect(x: x + dotSize, y: indicatorY + 3, width: lineW, height: 2))
                    line.wantsLayer = true
                    line.layer?.cornerRadius = 1
                    line.layer?.backgroundColor = (i < currentReal ? kAccent : kSecondary.withAlphaComponent(0.2)).cgColor
                    contentBox.addSubview(line)
                }
            }
        }

        switch step {
        case 0: showWelcome()
        case 1: showPermissions()
        case 2: showAPIKeyStep()
        case 3: showComplete()
        default: break
        }
    }

    // MARK: Step 1 — Welcome

    func showWelcome() {
        let w = contentBox.bounds.width
        let h = contentBox.bounds.height

        // Logo
        let logoSize: CGFloat = 64
        let logoView = NSView(frame: NSRect(x: w / 2 - logoSize / 2, y: h - 120, width: logoSize, height: logoSize))
        logoView.wantsLayer = true
        logoView.layer?.cornerRadius = 16
        logoView.layer?.backgroundColor = kAccent.cgColor
        contentBox.addSubview(logoView)
        let logoIcon = LogoIconView(frame: NSRect(x: 0, y: 0, width: logoSize, height: logoSize))
        logoView.addSubview(logoIcon)

        let title = NSTextField(labelWithString: kAppName)
        title.font = titleFont(32)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 170, width: w, height: 40)
        contentBox.addSubview(title)

        let subtitle = NSTextField(labelWithString: "Voice-to-text for macOS")
        subtitle.font = NSFont.systemFont(ofSize: 15)
        subtitle.textColor = kSecondary
        subtitle.alignment = .center
        subtitle.frame = NSRect(x: 0, y: h - 196, width: w, height: 20)
        contentBox.addSubview(subtitle)

        // Feature rows
        let features: [(String, String)] = [
            ("Press a hotkey", "Right Option + Space starts recording"),
            ("Speak naturally", "Your voice is captured and sent for transcription"),
            ("Text appears instantly", "Transcribed text is pasted wherever you're typing"),
        ]

        let featureStartY = h - 270
        for (i, feature) in features.enumerated() {
            let y = featureStartY - CGFloat(i) * 56

            let numBg = NSView(frame: NSRect(x: 50, y: y, width: 28, height: 28))
            numBg.wantsLayer = true
            numBg.layer?.cornerRadius = 14
            numBg.layer?.backgroundColor = kAccent.withAlphaComponent(0.1).cgColor
            contentBox.addSubview(numBg)

            let num = NSTextField(labelWithString: "\(i + 1)")
            num.font = NSFont.systemFont(ofSize: 13, weight: .semibold)
            num.textColor = kAccent
            num.alignment = .center
            num.sizeToFit()
            num.frame = NSRect(x: 50, y: y + (28 - num.frame.height) / 2,
                               width: 28, height: num.frame.height)
            contentBox.addSubview(num)

            let titleLabel = NSTextField(labelWithString: feature.0)
            titleLabel.font = NSFont.systemFont(ofSize: 14, weight: .medium)
            titleLabel.textColor = isDarkMode ? .white : NSColor(white: 0.15, alpha: 1)
            titleLabel.frame = NSRect(x: 90, y: y + 10, width: w - 140, height: 18)
            contentBox.addSubview(titleLabel)

            let descLabel = NSTextField(labelWithString: feature.1)
            descLabel.font = NSFont.systemFont(ofSize: 12)
            descLabel.textColor = kSecondary
            descLabel.frame = NSRect(x: 90, y: y - 6, width: w - 140, height: 16)
            contentBox.addSubview(descLabel)
        }

        let setupNote = NSTextField(labelWithString: "Quick setup — takes about 2 minutes")
        setupNote.font = NSFont.systemFont(ofSize: 12)
        setupNote.textColor = kSecondary.withAlphaComponent(0.6)
        setupNote.alignment = .center
        setupNote.frame = NSRect(x: 0, y: 80, width: w, height: 16)
        contentBox.addSubview(setupNote)

        let btn = AccentButton(title: "Get Started", frame: NSRect(x: w / 2 - 80, y: 28, width: 160, height: 44))
        btn.onClick = { [weak self] in self?.showStep(1) }
        contentBox.addSubview(btn)
    }

    // MARK: Step 2 — Permissions (mic + accessibility combined)

    func showPermissions() {
        let w = contentBox.bounds.width
        let h = contentBox.bounds.height

        let title = NSTextField(labelWithString: "Permissions")
        title.font = titleFont(26)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 106, width: w, height: 34)
        contentBox.addSubview(title)

        let desc = NSTextField(wrappingLabelWithString: "\(kAppName) needs two permissions to work.\nGrant them below, then continue.")
        desc.font = NSFont.systemFont(ofSize: 13)
        desc.textColor = kSecondary
        desc.alignment = .center
        desc.frame = NSRect(x: 40, y: h - 152, width: w - 80, height: 34)
        contentBox.addSubview(desc)

        let micGranted = AVCaptureDevice.authorizationStatus(for: .audio) == .authorized
        let axGranted = AXIsProcessTrusted()

        // --- Microphone Row ---
        let micY: CGFloat = h - 240
        let micCard = makeCard(frame: NSRect(x: 36, y: micY, width: w - 72, height: 80))
        contentBox.addSubview(micCard)

        let micIcon = CircleIconView(type: micGranted ? .check : .mic, frame: NSRect(x: 16, y: 18, width: 44, height: 44))
        micCard.addSubview(micIcon)

        let micTitle = NSTextField(labelWithString: "Microphone")
        micTitle.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        micTitle.textColor = isDarkMode ? .white : NSColor(white: 0.15, alpha: 1)
        micTitle.frame = NSRect(x: 72, y: 43, width: 200, height: 18)
        micCard.addSubview(micTitle)

        let micDescText = micGranted ? "Access granted" : "Required to record your voice"
        let micDesc = NSTextField(labelWithString: micDescText)
        micDesc.font = NSFont.systemFont(ofSize: 12)
        micDesc.textColor = micGranted ? kAccent.withAlphaComponent(0.7) : kSecondary
        micDesc.frame = NSRect(x: 72, y: 23, width: 200, height: 16)
        micCard.addSubview(micDesc)

        if !micGranted {
            let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)
            if micStatus == .denied || micStatus == .restricted {
                let micBtn = AccentButton(title: "Open Settings", frame: NSRect(x: micCard.bounds.width - 140, y: 23, width: 120, height: 34))
                micBtn.onClick = {
                    NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")!)
                }
                micCard.addSubview(micBtn)
                micDesc.stringValue = "Denied — enable in Settings"
                micDesc.textColor = kAccent
            } else {
                let micBtn = AccentButton(title: "Grant Access", frame: NSRect(x: micCard.bounds.width - 140, y: 23, width: 120, height: 34))
                micBtn.onClick = { [weak self] in
                    AVCaptureDevice.requestAccess(for: .audio) { granted in
                        DispatchQueue.main.async { self?.showStep(1) }
                    }
                }
                micCard.addSubview(micBtn)
            }
        }

        // --- Accessibility Row ---
        let axY: CGFloat = micY - 104
        let axCard = makeCard(frame: NSRect(x: 36, y: axY, width: w - 72, height: 80))
        contentBox.addSubview(axCard)

        let axIcon = CircleIconView(type: axGranted ? .check : .accessibility, frame: NSRect(x: 16, y: 18, width: 44, height: 44))
        axCard.addSubview(axIcon)

        let axTitle = NSTextField(labelWithString: "Accessibility")
        axTitle.font = NSFont.systemFont(ofSize: 14, weight: .medium)
        axTitle.textColor = isDarkMode ? .white : NSColor(white: 0.15, alpha: 1)
        axTitle.frame = NSRect(x: 72, y: 43, width: 200, height: 18)
        axCard.addSubview(axTitle)

        let axDescText = axGranted ? "Access granted" : "Required for the global hotkey"
        let axDesc = NSTextField(labelWithString: axDescText)
        axDesc.font = NSFont.systemFont(ofSize: 12)
        axDesc.textColor = axGranted ? kAccent.withAlphaComponent(0.7) : kSecondary
        axDesc.frame = NSRect(x: 72, y: 23, width: 200, height: 16)
        axCard.addSubview(axDesc)

        if !axGranted {
            let axBtn = AccentButton(title: "Open Settings", frame: NSRect(x: axCard.bounds.width - 140, y: 23, width: 120, height: 34))
            axBtn.onClick = {
                NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)
            }
            axCard.addSubview(axBtn)

            let tip = NSTextField(wrappingLabelWithString: "Not working? Try removing \(kAppName) from the Accessibility list in Settings, then re-adding it.")
            tip.font = NSFont.systemFont(ofSize: 11)
            tip.textColor = kSecondary.withAlphaComponent(0.6)
            tip.alignment = .center
            tip.frame = NSRect(x: 40, y: axY - 38, width: w - 80, height: 28)
            contentBox.addSubview(tip)
        }

        // Poll for both permissions
        if !micGranted || !axGranted {
            permissionTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
                let micNow = AVCaptureDevice.authorizationStatus(for: .audio) == .authorized
                let axNow = AXIsProcessTrusted()
                if micNow != micGranted || axNow != axGranted {
                    self?.showStep(1) // Refresh to update status
                }
            }
        }

        // Continue button (only if both granted)
        if micGranted && axGranted {
            let btn = AccentButton(title: "Continue", frame: NSRect(x: w / 2 - 80, y: 28, width: 160, height: 44))
            btn.onClick = { [weak self] in self?.showStep(2) }
            contentBox.addSubview(btn)
        } else {
            let waitLabel = NSTextField(labelWithString: "Grant both permissions to continue")
            waitLabel.font = NSFont.systemFont(ofSize: 12)
            waitLabel.textColor = kSecondary.withAlphaComponent(0.5)
            waitLabel.alignment = .center
            waitLabel.frame = NSRect(x: 0, y: 34, width: w, height: 16)
            contentBox.addSubview(waitLabel)
        }
    }

    // MARK: Step 3 — API Key

    func showAPIKeyStep() {
        let w = contentBox.bounds.width
        let h = contentBox.bounds.height

        let iconView = CircleIconView(type: .key, frame: NSRect(x: w / 2 - 28, y: h - 118, width: 56, height: 56))
        contentBox.addSubview(iconView)

        let title = NSTextField(labelWithString: "Connect to Groq")
        title.font = titleFont(26)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 164, width: w, height: 34)
        contentBox.addSubview(title)

        let desc = NSTextField(wrappingLabelWithString: "\(kAppName) uses Groq's free Whisper API for transcription.\nTheir free tier gives you 25 transcriptions per day.")
        desc.font = NSFont.systemFont(ofSize: 13)
        desc.textColor = isDarkMode ? .white : NSColor(white: 0.2, alpha: 1)
        desc.alignment = .center
        desc.frame = NSRect(x: 40, y: h - 216, width: w - 80, height: 40)
        contentBox.addSubview(desc)

        // Instructions card
        let cardY: CGFloat = h - 340
        let card = makeCard(frame: NSRect(x: 36, y: cardY, width: w - 72, height: 110))
        contentBox.addSubview(card)

        let stepsTitle = NSTextField(labelWithString: "How to get your free key:")
        stepsTitle.font = NSFont.systemFont(ofSize: 11, weight: .semibold)
        stepsTitle.textColor = kAccent
        stepsTitle.frame = NSRect(x: 16, y: 78, width: card.bounds.width - 32, height: 14)
        card.addSubview(stepsTitle)

        let steps = ["1. Sign up at console.groq.com (free)", "2. Go to API Keys", "3. Create a key and paste it below"]
        for (i, step) in steps.enumerated() {
            let label = NSTextField(labelWithString: step)
            label.font = NSFont.systemFont(ofSize: 12)
            label.textColor = kSecondary
            label.frame = NSRect(x: 16, y: 78 - CGFloat(i + 1) * 20, width: card.bounds.width - 32, height: 16)
            card.addSubview(label)
        }

        // Open Groq link
        let groqLink = makeLink("Open console.groq.com/keys", url: "https://console.groq.com/keys", centered: true)
        groqLink.frame = NSRect(x: 0, y: cardY - 28, width: w, height: 16)
        contentBox.addSubview(groqLink)

        // API key field
        let fieldLabel = NSTextField(labelWithString: "API KEY")
        fieldLabel.font = NSFont.systemFont(ofSize: 10, weight: .semibold)
        fieldLabel.textColor = kSecondary.withAlphaComponent(0.6)
        fieldLabel.frame = NSRect(x: 40, y: 130, width: w - 80, height: 14)
        contentBox.addSubview(fieldLabel)

        let keyField = MaskedKeyField(frame: NSRect(x: 38, y: 98, width: w - 76, height: 28))
        keyField.placeholderString = "gsk_..."
        keyField.font = NSFont.monospacedSystemFont(ofSize: 13, weight: .regular)
        keyField.bezelStyle = .roundedBezel
        keyField.focusRingType = .none
        contentBox.addSubview(keyField)

        let statusLabel = NSTextField(labelWithString: "")
        statusLabel.font = NSFont.systemFont(ofSize: 12, weight: .medium)
        statusLabel.alignment = .center
        statusLabel.frame = NSRect(x: 40, y: 72, width: w - 80, height: 16)
        contentBox.addSubview(statusLabel)

        let btn = AccentButton(title: "Continue", frame: NSRect(x: w / 2 - 80, y: 28, width: 160, height: 44))
        btn.onClick = { [weak self] in
            let key = keyField.realKey.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !key.isEmpty else {
                statusLabel.stringValue = "Please enter your API key"
                statusLabel.textColor = kAccent
                return
            }
            statusLabel.stringValue = "Validating..."
            statusLabel.textColor = kSecondary
            self?.validateAPIKey(key) { valid in
                DispatchQueue.main.async {
                    if valid {
                        self?.apiKey = key
                        saveAPIKey(key)
                        self?.showStep(3)
                    } else {
                        statusLabel.stringValue = "Invalid key — please check and try again"
                        statusLabel.textColor = kAccent
                    }
                }
            }
        }
        contentBox.addSubview(btn)
    }

    func validateAPIKey(_ key: String, completion: @escaping (Bool) -> Void) {
        guard key.hasPrefix("gsk_") else { completion(false); return }
        var request = URLRequest(url: URL(string: "https://api.groq.com/openai/v1/models")!)
        request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 10
        URLSession.shared.dataTask(with: request) { _, response, _ in
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                completion(true)
            } else {
                completion(false)
            }
        }.resume()
    }

    // MARK: Step 4 — Complete

    func showComplete() {
        let w = contentBox.bounds.width
        let h = contentBox.bounds.height

        let iconView = CircleIconView(type: .check, frame: NSRect(x: w / 2 - 28, y: h - 118, width: 56, height: 56))
        contentBox.addSubview(iconView)

        let title = NSTextField(labelWithString: "You're all set")
        title.font = titleFont(28)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 164, width: w, height: 36)
        contentBox.addSubview(title)

        // Shortcut display card
        let cardW: CGFloat = 280
        let cardH: CGFloat = 80
        let card = NSView(frame: NSRect(x: w / 2 - cardW / 2, y: h - 270, width: cardW, height: cardH))
        card.wantsLayer = true
        card.layer?.cornerRadius = 12
        card.layer?.backgroundColor = kAccent.withAlphaComponent(0.08).cgColor
        card.layer?.borderColor = kAccent.withAlphaComponent(0.15).cgColor
        card.layer?.borderWidth = 1
        contentBox.addSubview(card)

        let shortcutLabel = NSTextField(labelWithString: "Your shortcut")
        shortcutLabel.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        shortcutLabel.textColor = kAccent.withAlphaComponent(0.7)
        shortcutLabel.alignment = .center
        shortcutLabel.frame = NSRect(x: 0, y: 48, width: cardW, height: 14)
        card.addSubview(shortcutLabel)

        let shortcut = NSTextField(labelWithString: "Right Option + Space")
        shortcut.font = NSFont.systemFont(ofSize: 18, weight: .semibold)
        shortcut.textColor = kAccent
        shortcut.alignment = .center
        shortcut.frame = NSRect(x: 0, y: 18, width: cardW, height: 26)
        card.addSubview(shortcut)

        let instructions = NSTextField(wrappingLabelWithString: "Press the shortcut to start recording.\nPress it again to stop and paste your text.\nWorks in any app on your Mac.")
        instructions.font = NSFont.systemFont(ofSize: 13)
        instructions.textColor = isDarkMode ? NSColor(white: 0.8, alpha: 1) : NSColor(white: 0.3, alpha: 1)
        instructions.alignment = .center
        instructions.frame = NSRect(x: 40, y: h - 340, width: w - 80, height: 60)
        contentBox.addSubview(instructions)

        let menuTip = NSTextField(wrappingLabelWithString: "Look for the waveform icon in your menu bar for options.")
        menuTip.font = NSFont.systemFont(ofSize: 12)
        menuTip.textColor = kSecondary.withAlphaComponent(0.6)
        menuTip.alignment = .center
        menuTip.frame = NSRect(x: 40, y: 86, width: w - 80, height: 30)
        contentBox.addSubview(menuTip)

        let btn = AccentButton(title: "Start Using \(kAppName)", frame: NSRect(x: w / 2 - 100, y: 28, width: 200, height: 44))
        btn.onClick = { [weak self] in
            guard let self = self else { return }
            let key = self.apiKey.isEmpty ? (loadAPIKey() ?? "") : self.apiKey
            markOnboardingComplete()
            // Hide window without triggering close lifecycle
            self.orderOut(nil)
            self.onComplete?(key)
        }
        contentBox.addSubview(btn)
    }
}

// MARK: - Setup Window (used for changing API key after onboarding)

class SetupWindow: NSWindow {
    var onComplete: ((String) -> Void)?
    var apiKeyField: MaskedKeyField!

    init(existingKey: String? = nil) {
        let w: CGFloat = 440
        let h: CGFloat = 340
        let screen = NSScreen.main!.frame

        super.init(
            contentRect: NSRect(x: screen.midX - w / 2, y: screen.midY - h / 2, width: w, height: h),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        titlebarAppearsTransparent = true
        titleVisibility = .hidden
        isMovableByWindowBackground = true
        backgroundColor = setupBg()

        let cv = contentView!

        // Logo icon
        let logoView = NSView(frame: NSRect(x: w / 2 - 24, y: h - 88, width: 48, height: 48))
        logoView.wantsLayer = true
        logoView.layer?.cornerRadius = 12
        logoView.layer?.backgroundColor = kAccent.cgColor
        cv.addSubview(logoView)

        let logoIcon = LogoIconView(frame: NSRect(x: 0, y: 0, width: 48, height: 48))
        logoView.addSubview(logoIcon)

        // Title
        let title = NSTextField(labelWithString: "Change API Key")
        title.font = titleFont(24)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 130, width: w, height: 34)
        cv.addSubview(title)

        // API key label
        let label = NSTextField(labelWithString: "GROQ API KEY")
        label.font = NSFont.systemFont(ofSize: 10, weight: .semibold)
        label.textColor = kSecondary.withAlphaComponent(0.7)
        label.frame = NSRect(x: 62, y: h - 168, width: w - 124, height: 14)
        cv.addSubview(label)

        // API key field (masked)
        apiKeyField = MaskedKeyField(frame: NSRect(x: 60, y: h - 200, width: w - 120, height: 30))
        apiKeyField.placeholderString = "gsk_..."
        apiKeyField.font = NSFont.monospacedSystemFont(ofSize: 13, weight: .regular)
        apiKeyField.bezelStyle = .roundedBezel
        apiKeyField.focusRingType = .none
        if let key = existingKey { apiKeyField.setKey(key) }
        cv.addSubview(apiKeyField)

        // Link — below field
        let link = makeLink("Get a free key at console.groq.com/keys", url: "https://console.groq.com/keys")
        link.frame = NSRect(x: 60, y: h - 222, width: w - 120, height: 16)
        cv.addSubview(link)

        // Button
        let btn = AccentButton(title: "Save", frame: NSRect(x: w / 2 - 80, y: 28, width: 160, height: 44))
        btn.onClick = { [weak self] in self?.submit() }
        cv.addSubview(btn)
    }

    func submit() {
        let key = apiKeyField.realKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else { return }
        saveAPIKey(key)
        onComplete?(key)
        close()
    }
}

class LogoIconView: NSView {
    override func draw(_ dirtyRect: NSRect) {
        drawWaveformIcon(in: bounds.insetBy(dx: 6, dy: 6), color: .white, barCount: 5)
    }
}

func makeLink(_ text: String, url: String, centered: Bool = false) -> NSTextField {
    let field = NSTextField(labelWithString: "")
    let para = NSMutableParagraphStyle()
    para.alignment = centered ? .center : .left
    let attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 12),
        .foregroundColor: kAccent.withAlphaComponent(0.8),
        .underlineStyle: NSUnderlineStyle.single.rawValue,
        .link: URL(string: url)!,
        .paragraphStyle: para,
    ]
    field.attributedStringValue = NSAttributedString(string: text, attributes: attrs)
    field.isSelectable = true
    field.allowsEditingTextAttributes = true
    return field
}

// MARK: - Accent Button

class AccentButton: NSView {
    var title: String
    var onClick: (() -> Void)?
    private var isHovered = false
    private var isPressed = false
    private let label = NSTextField(labelWithString: "")

    init(title: String, frame: NSRect) {
        self.title = title
        super.init(frame: frame)
        wantsLayer = true
        layer?.cornerRadius = frame.height / 2

        let fontSize: CGFloat = frame.height <= 36 ? 13 : 15
        label.stringValue = title
        label.font = NSFont.systemFont(ofSize: fontSize, weight: .semibold)
        label.textColor = .white
        label.alignment = .center
        addSubview(label)

        addTrackingArea(NSTrackingArea(
            rect: bounds, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
            owner: self, userInfo: nil
        ))
        updateState()
    }

    required init?(coder: NSCoder) { fatalError() }

    override func layout() {
        super.layout()
        label.sizeToFit()
        label.frame = NSRect(x: 0, y: (bounds.height - label.frame.height) / 2,
                             width: bounds.width, height: label.frame.height)
    }

    private func updateState() {
        let targetColor = isPressed ? kAccent.blended(withFraction: 0.15, of: .black)! :
                        isHovered ? kAccent.blended(withFraction: 0.1, of: .white)! : kAccent
        let targetScale: CGFloat = isPressed ? 0.96 : isHovered ? 1.02 : 1.0

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.2
            ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
            self.animator().layer?.backgroundColor = targetColor.cgColor
            let transform = CGAffineTransform(scaleX: targetScale, y: targetScale)
            self.animator().layer?.setAffineTransform(transform)
        }
    }

    override func mouseEntered(with event: NSEvent) { isHovered = true; updateState() }
    override func mouseExited(with event: NSEvent) { isHovered = false; isPressed = false; updateState() }
    override func mouseDown(with event: NSEvent) { isPressed = true; updateState() }
    override func mouseUp(with event: NSEvent) {
        isPressed = false; updateState()
        if isHovered { onClick?() }
    }
}

// MARK: - Menu Bar

class MenuBarManager: NSObject {
    let statusItem: NSStatusItem
    var onChangeKey: (() -> Void)?
    var recordingTimer: Timer?
    var recordingStart: Date?

    override init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        super.init()

        updateIdle()
        buildMenu()
    }

    func buildMenu() {
        let menu = NSMenu()

        let header = NSMenuItem(title: kAppName, action: nil, keyEquivalent: "")
        header.isEnabled = false
        header.attributedTitle = NSAttributedString(
            string: "\(kAppName) v\(kAppVersion)",
            attributes: [.font: titleFont(13)]
        )
        menu.addItem(header)

        menu.addItem(.separator())

        let shortcutItem = NSMenuItem(title: "Right Option + Space to record", action: nil, keyEquivalent: "")
        shortcutItem.isEnabled = false
        menu.addItem(shortcutItem)

        menu.addItem(.separator())

        let helpItem = NSMenuItem(title: "How to Use\u{2026}", action: #selector(showHelp), keyEquivalent: "")
        helpItem.target = self
        menu.addItem(helpItem)

        let groqItem = NSMenuItem(title: "Get Groq API Key", action: #selector(openGroqConsole), keyEquivalent: "")
        groqItem.target = self
        menu.addItem(groqItem)

        let changeItem = NSMenuItem(title: "Change API Key\u{2026}", action: #selector(changeKey), keyEquivalent: "")
        changeItem.target = self
        menu.addItem(changeItem)

        menu.addItem(.separator())

        let aboutItem = NSMenuItem(title: "About \(kAppName)", action: #selector(showAbout), keyEquivalent: "")
        aboutItem.target = self
        menu.addItem(aboutItem)

        menu.addItem(.separator())

        menu.addItem(NSMenuItem(title: "Quit \(kAppName)", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))

        statusItem.menu = menu
    }

    func updateIdle() {
        recordingTimer?.invalidate()
        recordingTimer = nil
        recordingStart = nil

        statusItem.button?.image = makeMenuBarIcon(recording: false)
        statusItem.button?.title = ""
        statusItem.length = NSStatusItem.squareLength
    }

    func setRecording(_ recording: Bool) {
        if recording {
            recordingStart = Date()
            statusItem.length = NSStatusItem.variableLength
            statusItem.button?.image = makeMenuBarIcon(recording: true)
            updateRecordingTitle()

            recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
                self?.updateRecordingTitle()
            }
        } else {
            updateIdle()
        }
    }

    func setTranscribing() {
        recordingTimer?.invalidate()
        recordingTimer = nil
        statusItem.button?.image = makeMenuBarIcon(recording: true)
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.monospacedDigitSystemFont(ofSize: 12, weight: .medium),
            .foregroundColor: kAccent,
        ]
        statusItem.button?.attributedTitle = NSAttributedString(string: " Transcribing\u{2026}", attributes: attrs)
    }

    private func updateRecordingTitle() {
        guard let start = recordingStart else { return }
        let elapsed = Int(Date().timeIntervalSince(start))
        let mins = elapsed / 60
        let secs = elapsed % 60
        let timeStr = String(format: " %d:%02d", mins, secs)

        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.monospacedDigitSystemFont(ofSize: 12, weight: .medium),
            .foregroundColor: kAccent,
        ]
        statusItem.button?.attributedTitle = NSAttributedString(string: timeStr, attributes: attrs)
    }

    @objc func changeKey() { onChangeKey?() }
    var onShowHelp: (() -> Void)?
    var onShowAbout: (() -> Void)?
    @objc func showHelp() { onShowHelp?() }
    @objc func showAbout() { onShowAbout?() }
    @objc func openGroqConsole() { NSWorkspace.shared.open(URL(string: "https://console.groq.com/keys")!) }
}

// MARK: - Groq Whisper API

func transcribe(fileURL: URL, apiKey: String, completion: @escaping (Result<String, Error>) -> Void) {
    let url = URL(string: "https://api.groq.com/openai/v1/audio/transcriptions")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"

    let boundary = "Boundary-\(UUID().uuidString)"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

    var body = Data()
    func field(_ name: String, _ value: String) {
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(value)\r\n".data(using: .utf8)!)
    }

    field("model", "whisper-large-v3-turbo")
    field("response_format", "text")

    guard let audioData = try? Data(contentsOf: fileURL) else {
        completion(.failure(NSError(domain: "Dictate", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot read audio file"])))
        return
    }

    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: audio/wav\r\n\r\n".data(using: .utf8)!)
    body.append(audioData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

    request.httpBody = body

    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(NSError(domain: "Dictate", code: 1, userInfo: [NSLocalizedDescriptionKey: "URLError: \(error.localizedDescription)"])))
            return
        }
        if let http = response as? HTTPURLResponse {
            if http.statusCode == 401 {
                completion(.failure(NSError(domain: "Dictate", code: 401, userInfo: [NSLocalizedDescriptionKey: "401 Unauthorized — invalid API key"])))
                return
            }
            if http.statusCode == 429 {
                completion(.failure(NSError(domain: "Dictate", code: 429, userInfo: [NSLocalizedDescriptionKey: "Rate limit exceeded (429)"])))
                return
            }
            if http.statusCode != 200 {
                let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? "Unknown error"
                completion(.failure(NSError(domain: "Dictate", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(http.statusCode): \(body)"])))
                return
            }
        }
        guard let data = data else {
            completion(.failure(NSError(domain: "Dictate", code: 2, userInfo: [NSLocalizedDescriptionKey: "No response"])))
            return
        }
        let text = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if text.isEmpty {
            completion(.failure(NSError(domain: "Dictate", code: 3, userInfo: [NSLocalizedDescriptionKey: "Empty transcription"])))
        } else {
            completion(.success(text))
        }
    }.resume()
}

// MARK: - Paste

func pasteText(_ text: String) {
    let pb = NSPasteboard.general
    pb.clearContents()
    pb.setString(text, forType: .string)

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
        let source = CGEventSource(stateID: .hidSystemState)
        let vKey = CGKeyCode(kVK_ANSI_V)
        let down = CGEvent(keyboardEventSource: source, virtualKey: vKey, keyDown: true)
        down?.flags = .maskCommand
        let up = CGEvent(keyboardEventSource: source, virtualKey: vKey, keyDown: false)
        up?.flags = .maskCommand
        down?.post(tap: .cghidEventTap)
        up?.post(tap: .cghidEventTap)
    }
}

// MARK: - Controller

class DictationController {
    let apiKey: String
    let recorder = AudioRecorder()
    let panel = DictationPanel()
    var isRecording = false
    var onRecordingStateChange: ((Bool) -> Void)?
    var onTranscribing: (() -> Void)?

    init(apiKey: String) {
        self.apiKey = apiKey
        recorder.onLevelsUpdate = { [weak self] levels in
            self?.panel.waveformView.update(levels: levels)
        }
    }

    func toggle() {
        if isRecording { stopAndTranscribe() } else { startRecording() }
    }

    func startRecording() {
        guard AVCaptureDevice.authorizationStatus(for: .audio) == .authorized else {
            showError("Microphone access is required to record.", detail: "Open System Settings to grant permission.", buttonTitle: "Open Settings") {
                NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")!)
            }
            return
        }
        do {
            try recorder.start()
            isRecording = true
            onRecordingStateChange?(true)
            panel.showPanel()
        } catch {
            showError("Couldn't start recording.", detail: "Check that your microphone is connected and try again.")
        }
    }

    func stopAndTranscribe() {
        isRecording = false

        let duration = recorder.stop()

        if duration < 0.5 {
            onRecordingStateChange?(false)
            panel.hidePanel()
            try? FileManager.default.removeItem(atPath: kTempAudio)
            return
        }

        panel.showTranscribing()
        onTranscribing?()

        let fileURL = URL(fileURLWithPath: kTempAudio)
        transcribe(fileURL: fileURL, apiKey: apiKey) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let text):
                    if text.isEmpty || text.lowercased().contains("no speech") {
                        self?.showError("No speech detected.", detail: "Try speaking a bit louder or closer to your microphone.")
                    } else {
                        pasteText(text)
                    }
                case .failure(let error):
                    let msg = error.localizedDescription
                    if msg.contains("Rate limit") || msg.contains("429") {
                        self?.showError("Groq rate limit reached.", detail: "You've hit the free tier limit (25/day). Try again tomorrow, or upgrade your Groq plan.", buttonTitle: "Upgrade Groq") {
                            NSWorkspace.shared.open(URL(string: "https://console.groq.com")!)
                        }
                    } else if msg.contains("401") || msg.contains("Unauthorized") || msg.contains("invalid") {
                        self?.showError("Invalid API key.", detail: "Your Groq API key appears to be invalid. Would you like to update it?", buttonTitle: "Change API Key") {
                            self?.onChangeKey?()
                        }
                    } else if msg.contains("URLError") || msg.contains("offline") || msg.contains("not connected") {
                        self?.showError("No internet connection.", detail: "Check your network connection and try again.")
                    } else {
                        self?.showError("Transcription failed.", detail: msg)
                    }
                }
                self?.onRecordingStateChange?(false)
                self?.panel.hidePanel()
                try? FileManager.default.removeItem(atPath: kTempAudio)
            }
        }
    }

    var onChangeKey: (() -> Void)?

    func showError(_ message: String, detail: String, buttonTitle: String? = nil, action: (() -> Void)? = nil) {
        let alert = NSAlert()
        alert.messageText = message
        alert.informativeText = detail
        alert.alertStyle = .warning
        alert.icon = NSImage(named: NSImage.cautionName)
        if let buttonTitle = buttonTitle {
            alert.addButton(withTitle: buttonTitle)
            alert.addButton(withTitle: "OK")
        } else {
            alert.addButton(withTitle: "OK")
        }
        let response = alert.runModal()
        if response == .alertFirstButtonReturn, action != nil {
            action?()
        }
    }
}

// MARK: - Global Hotkey

func installEventTap(controller: DictationController) {
    let eventMask: CGEventMask = (1 << CGEventType.keyDown.rawValue)

    guard let tap = CGEvent.tapCreate(
        tap: .cgSessionEventTap,
        place: .headInsertEventTap,
        options: .defaultTap,
        eventsOfInterest: eventMask,
        callback: { _, _, event, refcon -> Unmanaged<CGEvent>? in
            // Minimal work here — only check Space (49) with Right Option
            if event.getIntegerValueField(.keyboardEventKeycode) == 49 {
                let flags = event.flags
                if flags.contains(.maskAlternate) && (flags.rawValue & kRightOptionFlag) != 0 {
                    let ctrl = Unmanaged<DictationController>.fromOpaque(refcon!).takeUnretainedValue()
                    DispatchQueue.main.async { ctrl.toggle() }
                    return nil
                }
            }
            return Unmanaged.passUnretained(event)
        },
        userInfo: Unmanaged.passUnretained(controller).toOpaque()
    ) else {
        fputs("Event tap failed — Accessibility permission not yet granted.\n", stderr)
        return
    }

    let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
    CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
    CGEvent.tapEnable(tap: tap, enable: true)
    fputs("Dictate ready. Press Right Option + Space to record.\n", stderr)
}

func startHotkey(controller: DictationController) {
    let opts = [kAXTrustedCheckOptionPrompt.takeUnretainedValue(): true] as CFDictionary
    if AXIsProcessTrustedWithOptions(opts) {
        installEventTap(controller: controller)
    } else {
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
            if AXIsProcessTrusted() {
                timer.invalidate()
                installEventTap(controller: controller)
            }
        }
    }
}

// MARK: - Help Window

class HelpWindow: NSWindow {
    init() {
        let w: CGFloat = 400
        let h: CGFloat = 340
        let screen = NSScreen.main!.frame

        super.init(
            contentRect: NSRect(x: screen.midX - w / 2, y: screen.midY - h / 2, width: w, height: h),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        titlebarAppearsTransparent = true
        titleVisibility = .hidden
        isMovableByWindowBackground = true
        backgroundColor = setupBg()

        let cv = contentView!

        let title = NSTextField(labelWithString: "How to Use \(kAppName)")
        title.font = titleFont(22)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 60, width: w, height: 30)
        cv.addSubview(title)

        let steps = [
            "1. Press Right Option + Space to start recording",
            "2. Speak clearly — your voice is captured via the mic",
            "3. Press Right Option + Space again to stop",
            "4. Your speech is transcribed and pasted automatically",
            "",
            "Tips:",
            "- Works in any app that accepts text input",
            "- Recordings under 0.5s are ignored (to prevent accidental triggers)",
            "- Uses Groq's Whisper API for fast, accurate transcription",
            "- Your free Groq key allows 25 transcriptions per day",
        ]

        var y = h - 90
        for step in steps {
            let label = NSTextField(labelWithString: step)
            label.font = NSFont.systemFont(ofSize: 13)
            label.textColor = step.hasPrefix("Tips:") ? kAccent : (isDarkMode ? .white : .black)
            label.frame = NSRect(x: 30, y: y, width: w - 60, height: 18)
            label.lineBreakMode = .byWordWrapping
            cv.addSubview(label)
            y -= step.isEmpty ? 10 : 22
        }
    }
}

// MARK: - About Window

class AboutWindow: NSWindow {
    init() {
        let w: CGFloat = 340
        let h: CGFloat = 280
        let screen = NSScreen.main!.frame

        super.init(
            contentRect: NSRect(x: screen.midX - w / 2, y: screen.midY - h / 2, width: w, height: h),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        titlebarAppearsTransparent = true
        titleVisibility = .hidden
        isMovableByWindowBackground = true
        backgroundColor = setupBg()

        let cv = contentView!

        // Logo
        let logoView = NSView(frame: NSRect(x: w / 2 - 24, y: h - 80, width: 48, height: 48))
        logoView.wantsLayer = true
        logoView.layer?.cornerRadius = 12
        logoView.layer?.backgroundColor = kAccent.cgColor
        cv.addSubview(logoView)
        let logoIcon = LogoIconView(frame: NSRect(x: 0, y: 0, width: 48, height: 48))
        logoView.addSubview(logoIcon)

        let title = NSTextField(labelWithString: kAppName)
        title.font = titleFont(24)
        title.textColor = kAccent
        title.alignment = .center
        title.frame = NSRect(x: 0, y: h - 115, width: w, height: 30)
        cv.addSubview(title)

        let version = NSTextField(labelWithString: "Version \(kAppVersion)")
        version.font = NSFont.systemFont(ofSize: 12)
        version.textColor = kSecondary
        version.alignment = .center
        version.frame = NSRect(x: 0, y: h - 138, width: w, height: 18)
        cv.addSubview(version)

        let desc = NSTextField(labelWithString: "Lightning-fast voice-to-text for macOS\nPowered by Groq Whisper API")
        desc.font = NSFont.systemFont(ofSize: 13)
        desc.textColor = isDarkMode ? .white : .black
        desc.alignment = .center
        desc.maximumNumberOfLines = 2
        desc.frame = NSRect(x: 20, y: h - 185, width: w - 40, height: 36)
        cv.addSubview(desc)

        let credit = NSTextField(labelWithString: "Made by Oli Woodman")
        credit.font = NSFont.systemFont(ofSize: 11)
        credit.textColor = kSecondary
        credit.alignment = .center
        credit.frame = NSRect(x: 0, y: 20, width: w, height: 16)
        cv.addSubview(credit)
    }
}

// MARK: - App Delegate

class AppDelegate: NSObject, NSApplicationDelegate {
    var menuBar: MenuBarManager!
    var controller: DictationController?
    var setupWindow: SetupWindow?
    var onboardingWindow: OnboardingWizard?
    var helpWindow: HelpWindow?
    var aboutWindow: AboutWindow?

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return false
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            showAboutWindow()
        }
        return true
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMainMenu()

        // Migrate old config directory if needed
        let oldConfigDir = NSHomeDirectory() + "/Library/Application Support/Dictation"
        let oldConfigFile = oldConfigDir + "/config.json"
        if FileManager.default.fileExists(atPath: oldConfigFile) && !FileManager.default.fileExists(atPath: kConfigFile) {
            try? FileManager.default.createDirectory(atPath: kConfigDir, withIntermediateDirectories: true)
            try? FileManager.default.copyItem(atPath: oldConfigFile, toPath: kConfigFile)
        }

        menuBar = MenuBarManager()
        menuBar.onChangeKey = { [weak self] in self?.showSetup(existingKey: loadAPIKey()) }
        menuBar.onShowHelp = { [weak self] in self?.showHelpWindow() }
        menuBar.onShowAbout = { [weak self] in self?.showAboutWindow() }

        // If user already has an API key (existing user or migrated), skip onboarding
        if let key = loadAPIKey(), !key.isEmpty {
            if !isOnboardingComplete() { markOnboardingComplete() }
            activate(withKey: key)
        } else {
            showOnboarding()
        }
    }

    func setupMainMenu() {
        let mainMenu = NSMenu()

        // App menu
        let appMenu = NSMenu()
        appMenu.addItem(NSMenuItem(title: "Quit \(kAppName)", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        let appMenuItem = NSMenuItem()
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // Edit menu (enables Cmd+V/C/X in text fields)
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(NSMenuItem(title: "Undo", action: Selector(("undo:")), keyEquivalent: "z"))
        editMenu.addItem(NSMenuItem(title: "Redo", action: Selector(("redo:")), keyEquivalent: "Z"))
        editMenu.addItem(.separator())
        editMenu.addItem(NSMenuItem(title: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x"))
        editMenu.addItem(NSMenuItem(title: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c"))
        editMenu.addItem(NSMenuItem(title: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v"))
        editMenu.addItem(NSMenuItem(title: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a"))
        let editMenuItem = NSMenuItem()
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        NSApp.mainMenu = mainMenu
    }

    func isOnboardingComplete() -> Bool {
        guard let data = try? Data(contentsOf: URL(fileURLWithPath: kConfigFile)),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return false }
        return json["onboardingComplete"] as? Bool ?? false
    }

    func showOnboarding() {
        let wizard = OnboardingWizard()
        wizard.onComplete = { [weak self] key in
            let finalKey = key.isEmpty ? (loadAPIKey() ?? "") : key
            guard !finalKey.isEmpty else {
                self?.onboardingWindow = nil
                self?.showSetup()
                return
            }
            self?.activate(withKey: finalKey)
            self?.onboardingWindow = nil
        }
        wizard.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        onboardingWindow = wizard
    }

    func showSetup(existingKey: String? = nil) {
        let setup = SetupWindow(existingKey: existingKey)
        setup.onComplete = { [weak self] key in
            self?.setupWindow = nil
            self?.activate(withKey: key)
        }
        setup.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        setupWindow = setup
    }

    func showHelpWindow() {
        let help = HelpWindow()
        help.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        helpWindow = help
    }

    func showAboutWindow() {
        let about = AboutWindow()
        about.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        aboutWindow = about
    }

    func activate(withKey key: String) {
        controller = DictationController(apiKey: key)
        controller?.onRecordingStateChange = { [weak self] recording in
            self?.menuBar.setRecording(recording)
        }
        controller?.onTranscribing = { [weak self] in
            self?.menuBar.setTranscribing()
        }
        controller?.onChangeKey = { [weak self] in
            self?.showSetup(existingKey: loadAPIKey())
        }

        // Ensure mic permission is requested so the app appears in System Settings
        if AVCaptureDevice.authorizationStatus(for: .audio) == .notDetermined {
            AVCaptureDevice.requestAccess(for: .audio) { _ in }
        }

        startHotkey(controller: controller!)
    }
}

// MARK: - Main

let app = NSApplication.shared
app.setActivationPolicy(.regular)

let delegate = AppDelegate()
app.delegate = delegate
app.run()
