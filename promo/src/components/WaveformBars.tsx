import React from "react";
import { useCurrentFrame } from "remotion";
import {
  ACCENT,
  BAR_COUNT,
  BAR_WIDTH,
  BAR_SPACING,
  BAR_MAX_HEIGHT,
  BAR_MIN_HEIGHT,
  SCENE,
} from "../constants";

// Deterministic pseudo-random for consistent renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const WaveformBars: React.FC = () => {
  const frame = useCurrentFrame();
  const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_SPACING;

  // frame is relative to Sequence start (PANEL_IN), convert to absolute
  const absoluteFrame = frame + SCENE.PANEL_IN;
  const isTranscribing = absoluteFrame >= SCENE.TRANSCRIBING_START;

  return (
    <div
      style={{
        width: totalWidth,
        height: BAR_MAX_HEIGHT,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: BAR_SPACING,
      }}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        let level: number;

        if (isTranscribing) {
          // Gentle sine wave with IIR smoothing — matches real app exactly
          const smoothing = 0.28;
          const framesInTranscribe = absoluteFrame - SCENE.TRANSCRIBING_START;
          let smoothed = 0.2; // Start near mid to avoid cold-start dip
          for (let f = 0; f <= framesInTranscribe; f++) {
            const phase = f * 0.12;
            const target =
              (Math.sin(phase + i * 0.4) * 0.5 + 0.5) * 0.35 + 0.05;
            smoothed += (target - smoothed) * smoothing;
          }
          level = smoothed;
        } else {
          // Recording mode — pseudo-random levels
          const targetSeed = Math.floor(frame / 6);
          const prevSeed = targetSeed - 1;

          const targetLevel =
            0.15 +
            seededRandom(targetSeed * 31 + i * 17) * 0.7;
          const prevLevel =
            0.15 +
            seededRandom(prevSeed * 31 + i * 17) * 0.7;

          // Interpolate between keyframes
          const t = (frame % 6) / 6;
          const smoothT = t * t * (3 - 2 * t); // smoothstep
          level = prevLevel + (targetLevel - prevLevel) * smoothT;

          // Add subtle jitter for organic feel
          const jitter =
            0.85 + seededRandom(frame * 7 + i * 13) * 0.3;
          level *= jitter;
          level = Math.min(1, Math.max(0.08, level));
        }

        const barHeight =
          BAR_MIN_HEIGHT + level * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT);

        return (
          <div
            key={i}
            style={{
              width: BAR_WIDTH,
              height: barHeight,
              backgroundColor: ACCENT,
              borderRadius: BAR_WIDTH / 2,
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
};
