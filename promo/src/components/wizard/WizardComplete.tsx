import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, SECONDARY, FPS, WIZARD_SCALE } from "../../constants";
import { StepIndicator } from "./StepIndicator";

const KeyCap: React.FC<{
  label: string;
  pressed: boolean;
  pressScale: number;
}> = ({ label, pressed, pressScale }) => (
  <div
    style={{
      padding: `${8 * WIZARD_SCALE}px ${14 * WIZARD_SCALE}px`,
      borderRadius: 7 * WIZARD_SCALE,
      backgroundColor: pressed ? "#2a2a2a" : "#333",
      border: `1px solid ${pressed ? "#444" : "#4a4a4a"}`,
      boxShadow: pressed
        ? `0 ${1 * WIZARD_SCALE}px 0 #222`
        : `0 ${3 * WIZARD_SCALE}px 0 #222`,
      color: pressed ? ACCENT : "#ccc",
      fontSize: 14 * WIZARD_SCALE,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontWeight: 600,
      transform: `scale(${pressScale}) translateY(${pressed ? 2 * WIZARD_SCALE : 0}px)`,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

export const WizardComplete: React.FC<{
  localFrame: number;
  clickFrame?: number;
  keyPressFrame?: number;
}> = ({ localFrame, clickFrame, keyPressFrame }) => {
  const fade = (delay: number) =>
    interpolate(localFrame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const slideUp = (delay: number) =>
    interpolate(localFrame, [delay, delay + 12], [8, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const checkScale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 10, stiffness: 120, mass: 0.6 },
  });

  const btnScale =
    clickFrame !== undefined &&
    localFrame >= clickFrame &&
    localFrame < clickFrame + 8
      ? interpolate(localFrame, [clickFrame, clickFrame + 3, clickFrame + 8], [1, 0.92, 1], { extrapolateRight: "clamp" })
      : 1;

  // Keyboard key press animation
  const keysPressed =
    keyPressFrame !== undefined && localFrame >= keyPressFrame;
  const keyPressScale =
    keyPressFrame !== undefined &&
    localFrame >= keyPressFrame &&
    localFrame < keyPressFrame + 12
      ? interpolate(localFrame, [keyPressFrame, keyPressFrame + 4, keyPressFrame + 12], [1, 0.92, 1], { extrapolateRight: "clamp" })
      : 1;

  // Glow effect after key press
  const keyGlow =
    keyPressFrame !== undefined && localFrame >= keyPressFrame
      ? interpolate(localFrame, [keyPressFrame, keyPressFrame + 8, keyPressFrame + 20], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const iconSize = 56 * WIZARD_SCALE;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${36 * WIZARD_SCALE}px ${36 * WIZARD_SCALE}px`,
      }}
    >
      {/* Check icon */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize / 2,
          backgroundColor: `${ACCENT}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${checkScale})`,
          marginBottom: 16 * WIZARD_SCALE,
        }}
      >
        <svg
          width={iconSize * 0.45}
          height={iconSize * 0.45}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke={ACCENT}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: fade(8),
          transform: `translateY(${slideUp(8)}px)`,
          fontSize: 28 * WIZARD_SCALE,
          fontWeight: 700,
          color: ACCENT,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 20 * WIZARD_SCALE,
        }}
      >
        You're all set
      </div>

      {/* Shortcut card with animated keys */}
      <div
        style={{
          opacity: fade(15),
          transform: `translateY(${slideUp(15)}px)`,
          backgroundColor: `${ACCENT}14`,
          border: `1px solid ${ACCENT}26`,
          borderRadius: 12 * WIZARD_SCALE,
          padding: `${16 * WIZARD_SCALE}px ${28 * WIZARD_SCALE}px`,
          textAlign: "center",
          marginBottom: 20 * WIZARD_SCALE,
          boxShadow: keyGlow > 0 ? `0 0 ${20 * keyGlow}px ${ACCENT}40` : "none",
        }}
      >
        <div
          style={{
            fontSize: 11 * WIZARD_SCALE,
            fontWeight: 500,
            color: `${ACCENT}b3`,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            marginBottom: 10 * WIZARD_SCALE,
          }}
        >
          Your shortcut
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8 * WIZARD_SCALE,
          }}
        >
          <KeyCap
            label="Right Option"
            pressed={keysPressed}
            pressScale={keyPressScale}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 16 * WIZARD_SCALE,
              fontWeight: 300,
            }}
          >
            +
          </span>
          <KeyCap
            label="Space"
            pressed={keysPressed}
            pressScale={keyPressScale}
          />
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          opacity: fade(22),
          fontSize: 13 * WIZARD_SCALE,
          color: "rgba(255,255,255,0.75)",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
          lineHeight: 1.6,
          marginBottom: 16 * WIZARD_SCALE,
        }}
      >
        Press the shortcut to start recording.
        <br />
        Press it again to stop and paste your text.
        <br />
        Works in any app on your Mac.
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Menu bar tip */}
      <div
        style={{
          opacity: fade(30),
          fontSize: 12 * WIZARD_SCALE,
          color: `${SECONDARY}99`,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
          marginBottom: 16 * WIZARD_SCALE,
        }}
      >
        Look for the waveform icon in your menu bar for options.
      </div>

      {/* Start Using Dictate button */}
      <div style={{ opacity: fade(35), transform: `scale(${btnScale})` }}>
        <div
          style={{
            backgroundColor: ACCENT,
            color: "white",
            fontSize: 15 * WIZARD_SCALE,
            fontWeight: 600,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            padding: `${10 * WIZARD_SCALE}px ${28 * WIZARD_SCALE}px`,
            borderRadius: 22 * WIZARD_SCALE,
          }}
        >
          Start Using Dictate
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ marginTop: 20 * WIZARD_SCALE }}>
        <StepIndicator currentStep={2} />
      </div>
    </div>
  );
};
