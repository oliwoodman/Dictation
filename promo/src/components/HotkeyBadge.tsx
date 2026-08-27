import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { FPS } from "../constants";

export const HotkeyBadge: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in (frames 0-15)
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Slide up
  const slideUp = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Press animation (frames 15-30)
  const pressScale =
    frame >= 15 && frame < 30
      ? interpolate(frame, [15, 20, 25, 30], [1, 0.93, 0.93, 1], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        })
      : 1;

  // Fade out (frames 35-44)
  const fadeOut = interpolate(frame, [35, 44], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const opacity = Math.min(fadeIn, fadeOut);

  const keyStyle: React.CSSProperties = {
    padding: "18px 36px",
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    border: "1.5px solid #3a3a3a",
    boxShadow:
      pressScale < 1
        ? "0 2px 0 #3a3a3a"
        : "0 5px 0 #3a3a3a",
    color: "#ccc",
    fontSize: 32,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontWeight: 500,
    transform: `scale(${pressScale})`,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "38%",
        left: "50%",
        transform: `translate(-50%, -50%) translateY(${slideUp}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        zIndex: 50,
      }}
    >
      <div style={keyStyle}>Right Option</div>
      <span
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 36,
          fontWeight: 300,
        }}
      >
        +
      </span>
      <div style={keyStyle}>Space</div>
    </div>
  );
};
