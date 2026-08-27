import React from "react";
import { useCurrentFrame, interpolate, spring, Img, staticFile } from "remotion";
import { BG_DARK, SECONDARY, FPS } from "../constants";

export const LogoOutro: React.FC = () => {
  const frame = useCurrentFrame();

  // Dark overlay fade (frames 0-25)
  const overlayOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Logo entrance (frames 25-55)
  const logoScale = spring({
    frame: frame - 25,
    fps: FPS,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });
  const logoOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Title fade (frames 45-60)
  const titleOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Tagline fade (frames 60-75)
  const taglineOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // URL fade (frames 75-90)
  const urlOpacity = interpolate(frame, [75, 90], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: BG_DARK,
          opacity: overlayOpacity,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Logo */}
        <Img
          src={staticFile("logo-256.png")}
          style={{
            width: 200,
            height: 200,
            borderRadius: 46,
            opacity: logoOpacity,
            transform: `scale(${0.85 + logoScale * 0.15})`,
          }}
        />

        {/* Title */}
        <span
          style={{
            marginTop: 36,
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            opacity: titleOpacity,
            letterSpacing: -1,
          }}
        >
          Dictate
        </span>

        {/* Tagline */}
        <span
          style={{
            marginTop: 16,
            fontSize: 32,
            color: SECONDARY,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            opacity: taglineOpacity,
          }}
        >
          Speak. It types.
        </span>

        {/* URL */}
        <span
          style={{
            position: "absolute",
            bottom: 70,
            fontSize: 22,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            opacity: urlOpacity,
          }}
        >
          oliwoodman.com/dictate
        </span>
      </div>
    </div>
  );
};
