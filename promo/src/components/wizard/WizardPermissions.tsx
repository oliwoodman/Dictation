import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, SECONDARY, FPS, WIZARD_SCALE } from "../../constants";
import { StepIndicator } from "./StepIndicator";

// SVG icons
const MicIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="12" rx="3" fill={ACCENT} />
    <path
      d="M5 11a7 7 0 0014 0"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 18v4M8 22h8"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const HandIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M8 13V5.5a1.5 1.5 0 013 0V12M11 5.5v-2a1.5 1.5 0 013 0V12M14 5.5a1.5 1.5 0 013 0V12"
      stroke={ACCENT}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17 9.5a1.5 1.5 0 013 0V14a8 8 0 01-16 0V9a1.5 1.5 0 013 0"
      stroke={ACCENT}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 13l4 4L19 7"
      stroke={ACCENT}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PermCard: React.FC<{
  title: string;
  desc: string;
  buttonText: string;
  icon: React.ReactNode;
  checkIcon: React.ReactNode;
  granted: boolean;
  grantedScale: number;
  opacity: number;
  btnPressScale: number;
}> = ({
  title,
  desc,
  buttonText,
  icon,
  checkIcon,
  granted,
  grantedScale,
  opacity,
  btnPressScale,
}) => {
  const iconSize = 44 * WIZARD_SCALE;

  return (
    <div
      style={{
        opacity,
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 12 * WIZARD_SCALE,
        padding: `${16 * WIZARD_SCALE}px`,
        display: "flex",
        alignItems: "center",
        gap: 12 * WIZARD_SCALE,
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconSize / 2,
          backgroundColor: `${ACCENT}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {granted ? (
          <div style={{ transform: `scale(${grantedScale})` }}>
            {checkIcon}
          </div>
        ) : (
          icon
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14 * WIZARD_SCALE,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12 * WIZARD_SCALE,
            color: granted ? `${ACCENT}b3` : SECONDARY,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            marginTop: 2,
          }}
        >
          {granted ? "Access granted" : desc}
        </div>
      </div>

      {/* Button (hidden when granted) */}
      {!granted && (
        <div
          style={{
            backgroundColor: ACCENT,
            color: "white",
            fontSize: 12 * WIZARD_SCALE,
            fontWeight: 600,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            padding: `${7 * WIZARD_SCALE}px ${16 * WIZARD_SCALE}px`,
            borderRadius: 17 * WIZARD_SCALE,
            whiteSpace: "nowrap",
            flexShrink: 0,
            transform: `scale(${btnPressScale})`,
          }}
        >
          {buttonText}
        </div>
      )}
    </div>
  );
};

export const WizardPermissions: React.FC<{
  localFrame: number;
  micGrantedFrame: number;
  axGrantedFrame: number;
  micClickFrame: number;
  axClickFrame: number;
  continueShowFrame: number;
  continueClickFrame: number;
}> = ({
  localFrame,
  micGrantedFrame,
  axGrantedFrame,
  micClickFrame,
  axClickFrame,
  continueShowFrame,
  continueClickFrame,
}) => {
  const fade = (delay: number) =>
    interpolate(localFrame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const micGranted = localFrame >= micGrantedFrame;
  const axGranted = localFrame >= axGrantedFrame;
  const bothGranted = micGranted && axGranted;

  const micCheckScale = micGranted
    ? spring({
        frame: localFrame - micGrantedFrame,
        fps: FPS,
        config: { damping: 10, stiffness: 150, mass: 0.5 },
      })
    : 0;

  const axCheckScale = axGranted
    ? spring({
        frame: localFrame - axGrantedFrame,
        fps: FPS,
        config: { damping: 10, stiffness: 150, mass: 0.5 },
      })
    : 0;

  const micBtnPress =
    localFrame >= micClickFrame && localFrame < micClickFrame + 8
      ? interpolate(localFrame, [micClickFrame, micClickFrame + 3, micClickFrame + 8], [1, 0.9, 1], { extrapolateRight: "clamp" })
      : 1;

  const axBtnPress =
    localFrame >= axClickFrame && localFrame < axClickFrame + 8
      ? interpolate(localFrame, [axClickFrame, axClickFrame + 3, axClickFrame + 8], [1, 0.9, 1], { extrapolateRight: "clamp" })
      : 1;

  const continueBtnScale =
    localFrame >= continueClickFrame && localFrame < continueClickFrame + 8
      ? interpolate(localFrame, [continueClickFrame, continueClickFrame + 3, continueClickFrame + 8], [1, 0.92, 1], { extrapolateRight: "clamp" })
      : 1;

  const continueOpacity = interpolate(
    localFrame,
    [continueShowFrame, continueShowFrame + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const iconSize = 20 * WIZARD_SCALE;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${40 * WIZARD_SCALE}px ${36 * WIZARD_SCALE}px`,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: fade(0),
          fontSize: 26 * WIZARD_SCALE,
          fontWeight: 700,
          color: ACCENT,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 8 * WIZARD_SCALE,
        }}
      >
        Permissions
      </div>

      {/* Description */}
      <div
        style={{
          opacity: fade(5),
          fontSize: 13 * WIZARD_SCALE,
          color: SECONDARY,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
          marginBottom: 28 * WIZARD_SCALE,
          lineHeight: 1.5,
        }}
      >
        Dictate needs two permissions to work.
        <br />
        Grant them below, then continue.
      </div>

      {/* Microphone card */}
      <div style={{ width: "100%", marginBottom: 12 * WIZARD_SCALE }}>
        <PermCard
          title="Microphone"
          desc="Required to record your voice"
          buttonText="Grant Access"
          icon={<MicIcon size={iconSize} />}
          checkIcon={<CheckIcon size={iconSize} />}
          granted={micGranted}
          grantedScale={micCheckScale}
          opacity={fade(10)}
          btnPressScale={micBtnPress}
        />
      </div>

      {/* Accessibility card */}
      <div style={{ width: "100%", marginBottom: 28 * WIZARD_SCALE }}>
        <PermCard
          title="Accessibility"
          desc="Required for the global hotkey"
          buttonText="Open Settings"
          icon={<HandIcon size={iconSize} />}
          checkIcon={<CheckIcon size={iconSize} />}
          granted={axGranted}
          grantedScale={axCheckScale}
          opacity={fade(15)}
          btnPressScale={axBtnPress}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Wait text or Continue button */}
      {bothGranted ? (
        <div style={{ opacity: continueOpacity, transform: `scale(${continueBtnScale})` }}>
          <div
            style={{
              backgroundColor: ACCENT,
              color: "white",
              fontSize: 15 * WIZARD_SCALE,
              fontWeight: 600,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              padding: `${10 * WIZARD_SCALE}px ${32 * WIZARD_SCALE}px`,
              borderRadius: 22 * WIZARD_SCALE,
            }}
          >
            Continue
          </div>
        </div>
      ) : (
        <div
          style={{
            opacity: fade(20),
            fontSize: 12 * WIZARD_SCALE,
            color: `${SECONDARY}80`,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Grant both permissions to continue
        </div>
      )}

      {/* Step indicator */}
      <div style={{ marginTop: 20 * WIZARD_SCALE }}>
        <StepIndicator currentStep={0} />
      </div>
    </div>
  );
};
