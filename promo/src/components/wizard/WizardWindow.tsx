import React from "react";
import { BG_DARK, WIZARD_WINDOW_W, WIZARD_WINDOW_H, WIZARD_SCALE } from "../../constants";

export const WizardWindow: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  scale?: number;
}> = ({ children, opacity = 1, scale = 1 }) => {
  const w = WIZARD_WINDOW_W * WIZARD_SCALE;
  const h = WIZARD_WINDOW_H * WIZARD_SCALE;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: w,
        height: h,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        opacity,
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
        }}
      >
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
      </div>

      {/* Content */}
      <div
        style={{
          backgroundColor: BG_DARK,
          height: h - 38,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};
