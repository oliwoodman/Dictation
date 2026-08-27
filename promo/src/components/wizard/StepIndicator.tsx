import React from "react";
import { ACCENT, SECONDARY } from "../../constants";

export const StepIndicator: React.FC<{ currentStep: number }> = ({
  currentStep,
}) => {
  const dotSize = 8;
  const lineW = 24;
  const gap = 4;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
      }}
    >
      {[0, 1, 2].map((step, i) => (
        <React.Fragment key={step}>
          <div
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor:
                step <= currentStep ? ACCENT : `${SECONDARY}4d`,
            }}
          />
          {i < 2 && (
            <div
              style={{
                width: lineW,
                height: 2,
                backgroundColor:
                  step < currentStep ? ACCENT : `${SECONDARY}33`,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
