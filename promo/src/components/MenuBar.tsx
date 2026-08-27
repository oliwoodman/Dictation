import React from "react";
import { useCurrentFrame } from "remotion";
import { ACCENT, SCENE } from "../constants";

export const MenuBar: React.FC = () => {
  const frame = useCurrentFrame();
  const isRecording =
    frame >= SCENE.PANEL_IN && frame < SCENE.PANEL_OUT;
  const recordingSeconds = isRecording
    ? Math.floor((frame - SCENE.RECORDING_START) / 30)
    : 0;
  const timerText = `${Math.max(0, Math.floor(recordingSeconds / 60))}:${String(
    Math.max(0, recordingSeconds % 60)
  ).padStart(2, "0")}`;

  const barHeights = [0.25, 0.55, 0.85, 0.55, 0.25];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        backgroundColor: "rgba(30, 30, 32, 0.85)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 100,
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Apple logo */}
        <svg width={16} height={16} viewBox="0 0 16 16" fill="white">
          <path d="M12.14 8.75c-.02-1.86 1.52-2.76 1.59-2.8a3.46 3.46 0 0 0-2.72-1.47c-1.15-.12-2.25.68-2.84.68-.59 0-1.5-.66-2.47-.65a3.63 3.63 0 0 0-3.06 1.87c-1.3 2.26-.33 5.62.94 7.45.62.9 1.36 1.91 2.33 1.87.94-.04 1.29-.6 2.42-.6s1.45.6 2.44.58c1.01-.02 1.64-.91 2.26-1.82a7.88 7.88 0 0 0 1.02-2.1 3.33 3.33 0 0 1-1.91-3.01zM10.36 3.32A3.3 3.3 0 0 0 11.14.5a3.46 3.46 0 0 0-2.23 1.15 3.22 3.22 0 0 0-.82 2.73 2.84 2.84 0 0 0 2.27-1.06z" />
        </svg>
        <span
          style={{
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Notes
        </span>
        {["File", "Edit", "View"].map((item) => (
          <span
            key={item}
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {item}
          </span>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Wi-Fi icon */}
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" />
        </svg>

        {/* Battery */}
        <svg width={24} height={12} viewBox="0 0 24 12">
          <rect x={0} y={1} width={20} height={10} rx={2} fill="none" stroke="white" strokeWidth={1.5} />
          <rect x={2} y={3} width={15} height={6} rx={1} fill="white" />
          <rect x={21} y={4} width={2} height={4} rx={1} fill="white" />
        </svg>

        {/* Dictate menu bar icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              backgroundColor: isRecording ? ACCENT : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.1s",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 18 18">
              {barHeights.map((h, i) => {
                const barW = 2;
                const spacing = 1.5;
                const totalW = 5 * barW + 4 * spacing;
                const startX = (18 - totalW) / 2;
                const barH = h * 12;
                return (
                  <rect
                    key={i}
                    x={startX + i * (barW + spacing)}
                    y={(18 - barH) / 2}
                    width={barW}
                    height={barH}
                    rx={1}
                    fill="white"
                  />
                );
              })}
            </svg>
          </div>
          {isRecording && (
            <span
              style={{
                color: ACCENT,
                fontSize: 12,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontWeight: 500,
              }}
            >
              {timerText}
            </span>
          )}
        </div>

        {/* Clock */}
        <span
          style={{
            color: "white",
            fontSize: 14,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 500,
          }}
        >
          Wed 26 Feb 9:41
        </span>
      </div>
    </div>
  );
};
