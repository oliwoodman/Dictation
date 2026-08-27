import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export interface CursorWaypoint {
  x: number;
  y: number;
  arriveAt: number;
  clickAt?: number;
}

export const AnimatedCursor: React.FC<{ waypoints: CursorWaypoint[] }> = ({
  waypoints,
}) => {
  const frame = useCurrentFrame();

  if (waypoints.length === 0) return null;

  // Find current position by interpolating between waypoints
  let x = waypoints[0].x;
  let y = waypoints[0].y;

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    const next = waypoints[i + 1];
    if (!next) {
      if (frame >= wp.arriveAt) {
        x = wp.x;
        y = wp.y;
      }
      break;
    }
    if (frame >= wp.arriveAt && frame <= next.arriveAt) {
      const moveStart = wp.arriveAt + 10; // pause briefly before moving
      x = interpolate(frame, [moveStart, next.arriveAt], [wp.x, next.x], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      y = interpolate(frame, [moveStart, next.arriveAt], [wp.y, next.y], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    }
    if (frame > next.arriveAt) {
      x = next.x;
      y = next.y;
    }
  }

  // Check if clicking right now
  let isClicking = false;
  let clickProgress = 0;
  for (const wp of waypoints) {
    if (wp.clickAt !== undefined) {
      if (frame >= wp.clickAt && frame < wp.clickAt + 10) {
        isClicking = true;
        clickProgress = (frame - wp.clickAt) / 10;
        break;
      }
    }
  }

  const cursorScale = isClicking
    ? interpolate(clickProgress, [0, 0.3, 1], [1, 0.85, 1])
    : 1;

  // Fade cursor in/out
  const opacity = interpolate(frame, [15, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        zIndex: 200,
        pointerEvents: "none",
        transform: `scale(${cursorScale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Click ring */}
      {isClicking && (
        <div
          style={{
            position: "absolute",
            left: 2,
            top: 2,
            width: interpolate(clickProgress, [0, 1], [4, 28]),
            height: interpolate(clickProgress, [0, 1], [4, 28]),
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.4)",
            opacity: interpolate(clickProgress, [0, 0.5, 1], [0.8, 0.4, 0]),
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      {/* Cursor arrow */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L5 19L9.5 14.5L14 21L16.5 19.5L12 13L18 13L5 3Z"
          fill="white"
          stroke="#333"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
