import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { SCENE } from "../constants";

const TYPED_TEXT =
  "Let's schedule a meeting for Friday at 2pm to discuss the Q3 roadmap.";

export const TextEditorWindow: React.FC = () => {
  const frame = useCurrentFrame();

  // Text appears instantly
  const showText = frame >= SCENE.TEXT_START;
  const textOpacity = showText
    ? interpolate(frame, [SCENE.TEXT_START, SCENE.TEXT_START + 10], [0, 1], {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      })
    : 0;
  const cursorVisible = frame % 30 < 15;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -52%)",
        width: 1200,
        height: 700,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 38,
          backgroundColor: "#2d2d2f",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          position: "relative",
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#febc2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#28c840",
            }}
          />
        </div>
        {/* Title */}
        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Notes
        </span>
      </div>

      {/* Editor body */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          height: 662,
          padding: "36px 44px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Existing text */}
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 20,
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Meeting notes — Feb 2026
        </div>

        {/* Typed text area */}
        <div
          style={{
            color: "#e0e0e0",
            fontSize: 28,
            lineHeight: 1.7,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <span
            style={{
              opacity: !showText && cursorVisible ? 1 : 0,
              color: "#e0e0e0",
              fontWeight: 100,
            }}
          >
            |
          </span>
          <span style={{ opacity: textOpacity }}>
            {TYPED_TEXT}
          </span>
          {showText && (
            <span
              style={{
                opacity: cursorVisible ? 1 : 0,
                color: "#e0e0e0",
                fontWeight: 100,
              }}
            >
              |
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
