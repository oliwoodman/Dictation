import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { ACCENT, BG_DARK, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS, PANEL_SCALE, SCENE } from "../constants";
import { WaveformBars } from "./WaveformBars";

export const DictationPanel: React.FC = () => {
  const frame = useCurrentFrame();

  // Enter animation (frames 0-10 relative to sequence start)
  const enterOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const enterSlide = interpolate(frame, [0, 10], [15, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Exit animation
  const exitStart = SCENE.PANEL_OUT - SCENE.PANEL_IN;
  const exitOpacity = interpolate(
    frame,
    [exitStart, exitStart + 8],
    [1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const opacity = Math.min(enterOpacity, exitOpacity);

  // State
  const absoluteFrame = frame + SCENE.PANEL_IN;
  const isTranscribing = absoluteFrame >= SCENE.TRANSCRIBING_START;
  const recordingSeconds = Math.max(
    0,
    Math.floor((absoluteFrame - SCENE.RECORDING_START) / 30)
  );
  const timerText = `${Math.floor(recordingSeconds / 60)}:${String(
    recordingSeconds % 60
  ).padStart(2, "0")}`;

  // Pulsing dot
  const dotCycle = (absoluteFrame % 24) / 24;
  const dotOpacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(dotCycle * Math.PI * 2));

  // Transcribing dots
  const dotCount = Math.floor((absoluteFrame / 12) % 4);
  const transcribingText = "TRANSCRIBING" + ".".repeat(dotCount);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: "50%",
        transform: `translateX(-50%) translateY(${enterSlide}px) scale(${PANEL_SCALE})`,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        borderRadius: PANEL_RADIUS,
        backgroundColor: BG_DARK,
        border: `1px solid rgba(193, 95, 60, 0.2)`,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.3)",
        opacity,
        overflow: "hidden",
      }}
    >
      {/* Waveform area */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WaveformBars />
      </div>

      {/* Bottom bar: status + timer */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 16,
          right: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!isTranscribing && (
          <>
            {/* Pulsing dot */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: ACCENT,
                opacity: dotOpacity,
                marginRight: 6,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: `rgba(193, 95, 60, 0.8)`,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                letterSpacing: 0.5,
              }}
            >
              RECORDING
            </span>
          </>
        )}
        {isTranscribing && (
          <span
            style={{
              fontSize: 10,
              color: "rgba(220, 218, 213, 0.6)",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: 0.5,
            }}
          >
            {transcribingText}
          </span>
        )}
        {!isTranscribing && (
          <span
            style={{
              position: "absolute",
              right: 0,
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(177, 173, 161, 0.5)",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {timerText}
          </span>
        )}
      </div>
    </div>
  );
};
