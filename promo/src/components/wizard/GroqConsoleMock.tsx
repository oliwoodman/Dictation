import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { FPS } from "../../constants";

export const GroqConsoleMock: React.FC<{
  createClickFrame: number;
  copyClickFrame: number;
}> = ({ createClickFrame, copyClickFrame }) => {
  const frame = useCurrentFrame();

  const created = frame >= createClickFrame;
  const copied = frame >= copyClickFrame;

  const createBtnScale =
    frame >= createClickFrame && frame < createClickFrame + 8
      ? interpolate(frame, [createClickFrame, createClickFrame + 3, createClickFrame + 8], [1, 0.9, 1], { extrapolateRight: "clamp" })
      : 1;

  const copyBtnScale =
    frame >= copyClickFrame && frame < copyClickFrame + 8
      ? interpolate(frame, [copyClickFrame, copyClickFrame + 3, copyClickFrame + 8], [1, 0.9, 1], { extrapolateRight: "clamp" })
      : 1;

  // Key row slides in after create click
  const keyRowOpacity = created
    ? interpolate(frame, [createClickFrame + 5, createClickFrame + 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const keyRowSlide = created
    ? interpolate(frame, [createClickFrame + 5, createClickFrame + 15], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 12;

  // "Copied!" text fade in
  const copiedOpacity = copied
    ? interpolate(frame, [copyClickFrame, copyClickFrame + 5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900,
        height: 520,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Browser title bar */}
      <div
        style={{
          height: 38,
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 12,
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

        {/* URL bar */}
        <div
          style={{
            flex: 1,
            height: 26,
            borderRadius: 6,
            backgroundColor: "#0d0d0d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 40,
            marginRight: 80,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            console.groq.com/keys
          </span>
        </div>
      </div>

      {/* Page body */}
      <div
        style={{
          backgroundColor: "#0a0a0a",
          height: 482,
          display: "flex",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 200,
            backgroundColor: "#0f0f0f",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            padding: "20px 16px",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "white",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              marginBottom: 28,
            }}
          >
            GroqCloud
          </div>
          {["Playground", "API Keys", "Settings"].map((item, i) => (
            <div
              key={item}
              style={{
                fontSize: 14,
                color:
                  i === 1
                    ? "white"
                    : "rgba(255,255,255,0.4)",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                padding: "8px 12px",
                borderRadius: 6,
                backgroundColor: i === 1 ? "rgba(255,255,255,0.08)" : "transparent",
                marginBottom: 4,
                fontWeight: i === 1 ? 500 : 400,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "28px 36px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "white",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              API Keys
            </div>

            {/* Create API Key button */}
            {!created && (
              <div
                style={{
                  backgroundColor: "#f55036",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  padding: "9px 20px",
                  borderRadius: 8,
                  transform: `scale(${createBtnScale})`,
                  whiteSpace: "nowrap",
                }}
              >
                Create API Key
              </div>
            )}
          </div>

          {/* Empty state before creation */}
          {!created && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "rgba(255,255,255,0.3)",
                fontSize: 14,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              No API keys yet. Create one to get started.
            </div>
          )}

          {/* Key row (appears after create click) */}
          <div
            style={{
              opacity: keyRowOpacity,
              transform: `translateY(${keyRowSlide}px)`,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Key name */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  marginBottom: 4,
                }}
              >
                Default API Key
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                gsk_xR7m...9kLp
              </div>
            </div>

            {/* Copy button */}
            <div
              style={{
                position: "relative",
                transform: `scale(${copyBtnScale})`,
              }}
            >
              <div
                style={{
                  backgroundColor: copied ? "#28c840" : "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  padding: "8px 20px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
