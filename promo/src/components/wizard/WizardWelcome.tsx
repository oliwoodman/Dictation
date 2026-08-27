import React from "react";
import { interpolate } from "remotion";
import { ACCENT, SECONDARY, WIZARD_SCALE } from "../../constants";

const FEATURES = [
  {
    num: "1",
    title: "Press a hotkey",
    desc: "Right Option + Space starts recording",
  },
  {
    num: "2",
    title: "Speak naturally",
    desc: "Your voice is captured and sent for transcription",
  },
  {
    num: "3",
    title: "Text appears instantly",
    desc: "Transcribed text is pasted wherever you're typing",
  },
];

// Waveform bars for the logo icon
const LogoIcon: React.FC = () => {
  const s = 64 * WIZARD_SCALE;
  const heights = [0.25, 0.55, 0.85, 0.55, 0.25];
  const barW = 4;
  const spacing = 3;
  const totalW = 5 * barW + 4 * spacing;
  const viewBox = 40;
  const startX = (viewBox - totalW) / 2;

  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: 16 * WIZARD_SCALE,
        backgroundColor: ACCENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        width={s * 0.6}
        height={s * 0.6}
      >
        {heights.map((h, i) => {
          const barH = h * 24;
          return (
            <rect
              key={i}
              x={startX + i * (barW + spacing)}
              y={(viewBox - barH) / 2}
              width={barW}
              height={barH}
              rx={barW / 2}
              fill="white"
            />
          );
        })}
      </svg>
    </div>
  );
};

export const WizardWelcome: React.FC<{
  localFrame: number;
  pressFrame?: number;
}> = ({ localFrame, pressFrame }) => {
  const fade = (delay: number) =>
    interpolate(localFrame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const slideUp = (delay: number) =>
    interpolate(localFrame, [delay, delay + 12], [10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const btnScale =
    pressFrame !== undefined &&
    localFrame >= pressFrame &&
    localFrame < pressFrame + 8
      ? interpolate(localFrame, [pressFrame, pressFrame + 3, pressFrame + 8], [1, 0.92, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

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
      {/* Logo */}
      <div
        style={{
          opacity: fade(0),
          transform: `translateY(${slideUp(0)}px)`,
          marginBottom: 12 * WIZARD_SCALE,
        }}
      >
        <LogoIcon />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: fade(5),
          transform: `translateY(${slideUp(5)}px)`,
          fontSize: 32 * WIZARD_SCALE,
          fontWeight: 700,
          color: ACCENT,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 4 * WIZARD_SCALE,
        }}
      >
        Dictate
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: fade(10),
          transform: `translateY(${slideUp(10)}px)`,
          fontSize: 15 * WIZARD_SCALE,
          color: SECONDARY,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 28 * WIZARD_SCALE,
        }}
      >
        Voice-to-text for macOS
      </div>

      {/* Feature rows */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16 * WIZARD_SCALE,
          marginBottom: 24 * WIZARD_SCALE,
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.num}
            style={{
              opacity: fade(18 + i * 6),
              transform: `translateY(${slideUp(18 + i * 6)}px)`,
              display: "flex",
              alignItems: "flex-start",
              gap: 12 * WIZARD_SCALE,
            }}
          >
            <div
              style={{
                width: 28 * WIZARD_SCALE,
                height: 28 * WIZARD_SCALE,
                borderRadius: 14 * WIZARD_SCALE,
                backgroundColor: `${ACCENT}1a`,
                color: ACCENT,
                fontSize: 13 * WIZARD_SCALE,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {f.num}
            </div>
            <div>
              <div
                style={{
                  fontSize: 14 * WIZARD_SCALE,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  marginBottom: 2,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 12 * WIZARD_SCALE,
                  color: SECONDARY,
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div
        style={{
          opacity: fade(40),
          fontSize: 12 * WIZARD_SCALE,
          color: `${SECONDARY}99`,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          marginBottom: 16 * WIZARD_SCALE,
        }}
      >
        Quick setup — takes about 2 minutes
      </div>

      {/* Get Started button */}
      <div
        style={{
          opacity: fade(45),
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
            textAlign: "center",
          }}
        >
          Get Started
        </div>
      </div>
    </div>
  );
};
