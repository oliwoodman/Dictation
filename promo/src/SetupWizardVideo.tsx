import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring } from "remotion";
import {
  BG_DARK,
  FPS,
  WIZARD_SCALE,
  WIZARD_WINDOW_W,
  WIZARD_WINDOW_H,
  WIZ,
  ACCENT,
} from "./constants";
import { WizardWindow } from "./components/wizard/WizardWindow";
import { WizardWelcome } from "./components/wizard/WizardWelcome";
import { WizardPermissions } from "./components/wizard/WizardPermissions";
import { WizardAPIKey } from "./components/wizard/WizardAPIKey";
import { WizardComplete } from "./components/wizard/WizardComplete";
import { GroqConsoleMock } from "./components/wizard/GroqConsoleMock";
import { PermissionDialog } from "./components/wizard/PermissionDialog";

export const SetupWizardVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Wizard window enter/exit
  const wizEnterScale = spring({
    frame: frame - WIZ.FADE_IN,
    fps: FPS,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });
  const wizEnterOpacity = interpolate(frame, [WIZ.FADE_IN, WIZ.FADE_IN + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wizExitScale = interpolate(
    frame,
    [WIZ.WIZARD_CLOSE, WIZ.WIZARD_CLOSE + 20],
    [1, 0.9],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const wizExitOpacity = interpolate(
    frame,
    [WIZ.WIZARD_CLOSE, WIZ.WIZARD_CLOSE + 20],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const wizScale =
    frame < WIZ.WIZARD_CLOSE
      ? 0.95 + wizEnterScale * 0.05
      : wizExitScale;
  const wizOpacity =
    frame < WIZ.WIZARD_CLOSE ? wizEnterOpacity : wizExitOpacity;

  // Determine active step
  const step =
    frame < WIZ.T01
      ? 0
      : frame < WIZ.T12
        ? 1
        : frame < WIZ.T23
          ? 2
          : 3;

  // Step transition animations (cross-fade)
  const transitionAlpha = (transStart: number) => {
    if (frame < transStart) return { exitO: 1, enterO: 0, exitX: 0, enterX: 30 };
    const exitO = interpolate(frame, [transStart, transStart + 15], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const enterO = interpolate(frame, [transStart, transStart + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const exitX = interpolate(frame, [transStart, transStart + 15], [0, -30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const enterX = interpolate(frame, [transStart, transStart + 15], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { exitO, enterO, exitX, enterX };
  };

  // Groq console overlay
  const groqIn = interpolate(frame, [WIZ.GROQ_CUT_IN, WIZ.GROQ_CUT_IN + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const groqOut = interpolate(frame, [WIZ.GROQ_CUT_OUT - 15, WIZ.GROQ_CUT_OUT], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const groqOpacity = Math.min(groqIn, groqOut);
  const groqSlideX = interpolate(frame, [WIZ.GROQ_CUT_IN, WIZ.GROQ_CUT_IN + 15], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Wizard blur/dim when Groq is visible
  const wizDim = frame >= WIZ.GROQ_CUT_IN && frame < WIZ.GROQ_CUT_OUT
    ? interpolate(frame, [WIZ.GROQ_CUT_IN, WIZ.GROQ_CUT_IN + 15], [1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : frame >= WIZ.GROQ_CUT_OUT
      ? interpolate(frame, [WIZ.GROQ_CUT_OUT - 15, WIZ.GROQ_CUT_OUT], [0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;

  // API key dots typing animation
  const dotsTyped =
    frame >= WIZ.API_PASTE_START
      ? Math.min(
          20,
          Math.floor(
            interpolate(
              frame,
              [WIZ.API_PASTE_START, WIZ.API_PASTE_START + 30],
              [0, 20],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          )
        )
      : 0;

  // Final fade
  const finalFade = interpolate(frame, [WIZ.FADE_OUT, WIZ.FADE_OUT + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Render step content
  const renderStepContent = () => {
    const t01 = transitionAlpha(WIZ.T01);
    const t12 = transitionAlpha(WIZ.T12);
    const t23 = transitionAlpha(WIZ.T23);

    return (
      <>
        {/* Step 0: Welcome */}
        {frame < WIZ.T01 + 15 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: frame >= WIZ.T01 ? t01.exitO : 1,
              transform: frame >= WIZ.T01 ? `translateX(${t01.exitX}px)` : undefined,
            }}
          >
            <WizardWelcome
              localFrame={frame - WIZ.WELCOME_START}
              pressFrame={WIZ.WELCOME_CLICK - WIZ.WELCOME_START}
            />
          </div>
        )}

        {/* Step 1: Permissions */}
        {frame >= WIZ.T01 && frame < WIZ.T12 + 15 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: frame < WIZ.T01 + 15 ? t01.enterO : frame >= WIZ.T12 ? t12.exitO : 1,
              transform:
                frame < WIZ.T01 + 15
                  ? `translateX(${t01.enterX}px)`
                  : frame >= WIZ.T12
                    ? `translateX(${t12.exitX}px)`
                    : undefined,
            }}
          >
            <WizardPermissions
              localFrame={frame - WIZ.PERM_START}
              micClickFrame={WIZ.PERM_MIC_CLICK - WIZ.PERM_START}
              micGrantedFrame={WIZ.PERM_MIC_GRANTED - WIZ.PERM_START}
              axClickFrame={WIZ.PERM_AX_CLICK - WIZ.PERM_START}
              axGrantedFrame={WIZ.PERM_AX_GRANTED - WIZ.PERM_START}
              continueShowFrame={WIZ.PERM_CONTINUE_SHOW - WIZ.PERM_START}
              continueClickFrame={WIZ.PERM_CONTINUE_CLICK - WIZ.PERM_START}
            />
          </div>
        )}

        {/* Step 2: API Key */}
        {frame >= WIZ.T12 && frame < WIZ.T23 + 15 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: frame < WIZ.T12 + 15 ? t12.enterO : frame >= WIZ.T23 ? t23.exitO : 1,
              transform:
                frame < WIZ.T12 + 15
                  ? `translateX(${t12.enterX}px)`
                  : frame >= WIZ.T23
                    ? `translateX(${t23.exitX}px)`
                    : undefined,
            }}
          >
            <WizardAPIKey
              localFrame={frame - WIZ.API_START}
              dotsTyped={dotsTyped}
              continueClickFrame={WIZ.API_CONTINUE_CLICK - WIZ.API_START}
            />
          </div>
        )}

        {/* Step 3: Complete */}
        {frame >= WIZ.T23 && frame < WIZ.WIZARD_CLOSE && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: frame < WIZ.T23 + 15 ? t23.enterO : 1,
              transform:
                frame < WIZ.T23 + 15 ? `translateX(${t23.enterX}px)` : undefined,
            }}
          >
            <WizardComplete
              localFrame={frame - WIZ.COMPLETE_START}
              keyPressFrame={WIZ.COMPLETE_KEY_PRESS - WIZ.COMPLETE_START}
              clickFrame={WIZ.COMPLETE_CLICK - WIZ.COMPLETE_START}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG_DARK }}>
      {/* Wizard window */}
      {frame < WIZ.WIZARD_CLOSE + 20 && (
        <div style={{ opacity: wizDim }}>
          <WizardWindow opacity={wizOpacity} scale={wizScale}>
            {renderStepContent()}
          </WizardWindow>
        </div>
      )}

      {/* Microphone permission dialog */}
      <PermissionDialog
        title={`"Dictate" Would Like to\nAccess the Microphone`}
        message="Dictate needs microphone access to record your voice."
        enterFrame={WIZ.PERM_MIC_DIALOG}
        allowClickFrame={WIZ.PERM_MIC_ALLOW}
        exitFrame={WIZ.PERM_MIC_ALLOW + 2}
      />

      {/* Accessibility permission dialog */}
      <PermissionDialog
        title={`"Dictate" Would Like\nAccessibility Access`}
        message="This allows Dictate to use a global keyboard shortcut."
        enterFrame={WIZ.PERM_AX_DIALOG}
        allowClickFrame={WIZ.PERM_AX_ALLOW}
        exitFrame={WIZ.PERM_AX_ALLOW + 2}
      />

      {/* Groq console overlay */}
      {frame >= WIZ.GROQ_CUT_IN && frame < WIZ.GROQ_CUT_OUT && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: groqOpacity,
            transform: `translateX(${groqSlideX}px)`,
          }}
        >
          <Sequence from={WIZ.GROQ_CUT_IN} durationInFrames={WIZ.GROQ_CUT_OUT - WIZ.GROQ_CUT_IN}>
            <GroqConsoleMock
              createClickFrame={WIZ.GROQ_CREATE_CLICK - WIZ.GROQ_CUT_IN}
              copyClickFrame={WIZ.GROQ_COPY_CLICK - WIZ.GROQ_CUT_IN}
            />
          </Sequence>
        </div>
      )}

      {/* Dictate logo after wizard closes */}
      {frame >= WIZ.LOGO_IN && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            opacity: interpolate(
              frame,
              [WIZ.LOGO_IN, WIZ.LOGO_IN + 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
            transform: `scale(${spring({
              frame: Math.max(0, frame - WIZ.LOGO_IN),
              fps: FPS,
              config: { damping: 14, stiffness: 100, mass: 0.8 },
            }) * 0.1 + 0.9})`,
          }}
        >
          {/* Waveform icon */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 64 64" fill="none" width={64} height={64}>
              {[0.25, 0.55, 0.85, 0.55, 0.25].map((h, i) => {
                const barW = 6;
                const spacing = 4;
                const totalW = 5 * barW + 4 * spacing;
                const startX = (64 - totalW) / 2;
                const barH = h * 36;
                return (
                  <rect
                    key={i}
                    x={startX + i * (barW + spacing)}
                    y={(64 - barH) / 2}
                    width={barW}
                    height={barH}
                    rx={barW / 2}
                    fill="white"
                  />
                );
              })}
            </svg>
          </div>
          {/* App name */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: -0.5,
            }}
          >
            Dictate
          </div>
        </div>
      )}

      {/* Final fade to black */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: BG_DARK,
          opacity: finalFade,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
