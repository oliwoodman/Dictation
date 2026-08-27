import React from "react";
import { ACCENT } from "../constants";

const dockIcons = [
  { color: "#2563eb", label: "Finder" },
  { color: "#6366f1", label: "Safari" },
  { color: "#3b82f6", label: "Mail" },
  { color: "#10b981", label: "Messages" },
  { color: "#f59e0b", label: "Notes" },
  { color: "#8b5cf6", label: "Music" },
  { color: ACCENT, label: "Dictate" },
  { color: "#64748b", label: "Settings" },
];

export const Dock: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 18,
        backgroundColor: "rgba(50, 50, 55, 0.5)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {dockIcons.map((icon, i) => (
        <div
          key={i}
          style={{
            width: 48,
            height: 48,
            borderRadius: 11,
            backgroundColor: icon.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon.label === "Dictate" && (
            <svg width={28} height={28} viewBox="0 0 64 64" fill="none">
              {[0.2, 0.5, 0.8, 0.5, 0.2].map((h, j) => {
                const barW = 6;
                const spacing = 4;
                const totalW = 5 * barW + 4 * spacing;
                const startX = (64 - totalW) / 2;
                const barH = h * 36;
                return (
                  <rect
                    key={j}
                    x={startX + j * (barW + spacing)}
                    y={(64 - barH) / 2}
                    width={barW}
                    height={barH}
                    rx={barW / 2}
                    fill="white"
                  />
                );
              })}
            </svg>
          )}
          {icon.label === "Finder" && (
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <rect x={3} y={3} width={18} height={18} rx={3} fill="#1d4ed8" />
              <circle cx={9} cy={11} r={1.5} fill="white" />
              <circle cx={15} cy={11} r={1.5} fill="white" />
              <path d="M8 15c1 1.5 7 1.5 8 0" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};
