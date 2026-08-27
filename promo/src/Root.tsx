import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { SetupWizardVideo } from "./SetupWizardVideo";
import { WIDTH, HEIGHT, FPS, DURATION_FRAMES, WIZARD_DURATION } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DictatePromo"
        component={Video}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SetupWizard"
        component={SetupWizardVideo}
        durationInFrames={WIZARD_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
