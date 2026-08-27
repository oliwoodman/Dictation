import React from "react";
import { interpolate } from "remotion";
import { ACCENT, SECONDARY, WIZARD_SCALE } from "../../constants";
import { StepIndicator } from "./StepIndicator";

const KeyIcon: React.FC = () => {
  const s = 56 * WIZARD_SCALE;
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: s / 2,
        backgroundColor: `${ACCENT}1a`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={s * 0.45}
        height={s * 0.45}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="8" cy="15" r="5" stroke={ACCENT} strokeWidth="2" />
        <path
          d="M12 11l8-8M16 3l4 4"
          stroke={ACCENT}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const WizardAPIKey: React.FC<{
  localFrame: number;
  dotsTyped: number; // 0-20, how many mask dots to show
  continueClickFrame?: number;
}> = ({ localFrame, dotsTyped, continueClickFrame }) => {
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

  const btnScale =
    continueClickFrame !== undefined &&
    localFrame >= continueClickFrame &&
    localFrame < continueClickFrame + 8
      ? interpolate(localFrame, [continueClickFrame, continueClickFrame + 3, continueClickFrame + 8], [1, 0.92, 1], { extrapolateRight: "clamp" })
      : 1;

  const keyText = dotsTyped > 0 ? "gsk_" + "•".repeat(dotsTyped) : "";
  const showCursor = dotsTyped > 0 && dotsTyped < 20 && localFrame % 20 < 10;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${32 * WIZARD_SCALE}px ${36 * WIZARD_SCALE}px`,
      }}
    >
      {/* Key icon */}
      <div
        style={{
          opacity: fade(0),
          transform: `translateY(${slideUp(0)}px)`,
          marginBottom: 12 * WIZARD_SCALE,
        }}
      >
        <KeyIcon />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: fade(5),
          transform: `translateY(${slideUp(5)}px)`,
          fontSize: 26 * WIZARD_SCALE,
          fontWeight: 700,
          color: ACCENT,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 8 * WIZARD_SCALE,
        }}
      >
        Connect to Groq
      </div>

      {/* Description */}
      <div
        style={{
          opacity: fade(10),
          fontSize: 13 * WIZARD_SCALE,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
          lineHeight: 1.5,
          marginBottom: 20 * WIZARD_SCALE,
        }}
      >
        Dictate uses Groq's free Whisper API for transcription.
        <br />
        Their free tier gives you 25 transcriptions per day.
      </div>

      {/* Instructions card */}
      <div
        style={{
          opacity: fade(15),
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 12 * WIZARD_SCALE,
          padding: `${14 * WIZARD_SCALE}px ${18 * WIZARD_SCALE}px`,
          marginBottom: 14 * WIZARD_SCALE,
        }}
      >
        <div
          style={{
            fontSize: 11 * WIZARD_SCALE,
            fontWeight: 600,
            color: ACCENT,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            marginBottom: 8 * WIZARD_SCALE,
          }}
        >
          How to get your free key:
        </div>
        {[
          "1. Sign up at console.groq.com (free)",
          "2. Go to API Keys",
          "3. Create a key and paste it below",
        ].map((step) => (
          <div
            key={step}
            style={{
              fontSize: 12 * WIZARD_SCALE,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              lineHeight: 1.8,
            }}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Groq link */}
      <div
        style={{
          opacity: fade(20),
          fontSize: 13 * WIZARD_SCALE,
          color: ACCENT,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          textDecoration: "underline",
          marginBottom: 20 * WIZARD_SCALE,
        }}
      >
        Open console.groq.com/keys
      </div>

      {/* API KEY label */}
      <div
        style={{
          width: "100%",
          opacity: fade(22),
        }}
      >
        <div
          style={{
            fontSize: 10 * WIZARD_SCALE,
            fontWeight: 600,
            color: `${SECONDARY}99`,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: 0.5,
            marginBottom: 6 * WIZARD_SCALE,
          }}
        >
          API KEY
        </div>
        {/* Input field */}
        <div
          style={{
            width: "100%",
            height: 34 * WIZARD_SCALE,
            borderRadius: 6 * WIZARD_SCALE,
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            padding: `0 ${10 * WIZARD_SCALE}px`,
          }}
        >
          <span
            style={{
              fontSize: 13 * WIZARD_SCALE,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: keyText ? "rgba(255,255,255,0.8)" : `${SECONDARY}66`,
            }}
          >
            {keyText || "gsk_..."}
            {showCursor && (
              <span style={{ color: "rgba(255,255,255,0.6)" }}>|</span>
            )}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Continue button */}
      <div
        style={{
          opacity: dotsTyped >= 20 ? 1 : 0.3,
          transform: `scale(${btnScale})`,
        }}
      >
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

      {/* Step indicator */}
      <div style={{ marginTop: 20 * WIZARD_SCALE }}>
        <StepIndicator currentStep={1} />
      </div>
    </div>
  );
};
