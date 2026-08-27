import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { BG_DARK, SCENE, DURATION_FRAMES } from "./constants";
import { MacDesktop } from "./components/MacDesktop";
import { HotkeyBadge } from "./components/HotkeyBadge";
import { DictationPanel } from "./components/DictationPanel";
import { LogoOutro } from "./components/LogoOutro";

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG_DARK }}>
      {/* Desktop is present for the first 420 frames */}
      <Sequence from={SCENE.DESKTOP_IN} durationInFrames={SCENE.SETTLE_END}>
        <MacDesktop />
      </Sequence>

      {/* Hotkey badges */}
      <Sequence
        from={SCENE.HOTKEY_IN}
        durationInFrames={SCENE.HOTKEY_OUT - SCENE.HOTKEY_IN}
      >
        <HotkeyBadge />
      </Sequence>

      {/* Dictation panel */}
      <Sequence
        from={SCENE.PANEL_IN}
        durationInFrames={SCENE.PANEL_OUT - SCENE.PANEL_IN + 10}
      >
        <DictationPanel />
      </Sequence>

      {/* Outro */}
      <Sequence
        from={SCENE.OUTRO_START}
        durationInFrames={DURATION_FRAMES - SCENE.OUTRO_START}
      >
        <LogoOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
