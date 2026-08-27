import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { MenuBar } from "./MenuBar";
import { TextEditorWindow } from "./TextEditorWindow";

export const MacDesktop: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
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
        opacity,
      }}
    >
      {/* Wallpaper — dark gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, #2a2a2c 0%, #1c1c1e 70%)",
        }}
      />

      <MenuBar />
      <TextEditorWindow />
    </div>
  );
};
