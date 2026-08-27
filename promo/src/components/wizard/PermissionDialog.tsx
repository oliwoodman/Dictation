import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { FPS, ACCENT } from "../../constants";

const AppIcon: React.FC = () => {
  const s = 48;
  const heights = [0.25, 0.55, 0.85, 0.55, 0.25];
  const barW = 4;
  const spacing = 2.5;
  const totalW = 5 * barW + 4 * spacing;
  const startX = (32 - totalW) / 2;

  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: 12,
        backgroundColor: ACCENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 32 32" fill="none" width={s * 0.65} height={s * 0.65}>
        {heights.map((h, i) => {
          const barH = h * 18;
          return (
            <rect
              key={i}
              x={startX + i * (barW + spacing)}
              y={(32 - barH) / 2}
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

export const PermissionDialog: React.FC<{
  title: string;
  message: string;
  enterFrame: number;
  allowClickFrame: number;
  exitFrame: number;
}> = ({ title, message, enterFrame, allowClickFrame, exitFrame }) => {
  const frame = useCurrentFrame();

  if (frame < enterFrame || frame > exitFrame + 10) return null;

  const enterProgress = spring({
    frame: Math.max(0, frame - enterFrame),
    fps: FPS,
    config: { damping: 12, stiffness: 150, mass: 0.6 },
  });

  const exitProgress =
    frame >= exitFrame
      ? interpolate(frame, [exitFrame, exitFrame + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const scale =
    frame >= exitFrame
      ? interpolate(exitProgress, [0, 1], [1, 0.95])
      : interpolate(enterProgress, [0, 1], [0.9, 1]);

  const opacity = frame >= exitFrame ? 1 - exitProgress : enterProgress;

  const allowBtnScale =
    frame >= allowClickFrame && frame < allowClickFrame + 8
      ? interpolate(
          frame,
          [allowClickFrame, allowClickFrame + 3, allowClickFrame + 8],
          [1, 0.9, 1],
          { extrapolateRight: "clamp" }
        )
      : 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
          opacity,
        }}
      />
      {/* Dialog */}
      <div
        style={{
          position: "relative",
          width: 380,
          backgroundColor: "#2d2d2d",
          borderRadius: 14,
          padding: "28px 28px 20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.12)",
          transform: `scale(${scale})`,
          opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* App icon */}
        <AppIcon />

        {/* Title */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Don&apos;t Allow
          </div>
          <div
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              backgroundColor: "#0A84FF",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              transform: `scale(${allowBtnScale})`,
            }}
          >
            Allow
          </div>
        </div>
      </div>
    </div>
  );
};
