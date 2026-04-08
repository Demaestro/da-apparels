import type { BodyMeasurements } from "@/lib/types";
import type { MeasurementScaleProfile } from "./types";

const BASELINE = {
  chest: 90,
  waist: 74,
  hips: 100,
  shoulder: 40,
  height: 168,
  weight: 68,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeScale(value: number | undefined, baseline: number, min: number, max: number) {
  if (!value || Number.isNaN(value)) {
    return 1;
  }

  return clamp(value / baseline, min, max);
}

export function getMeasurementScaleProfile(
  measurements?: BodyMeasurements | null,
): MeasurementScaleProfile {
  if (!measurements) {
    return {
      chestScale: 1,
      waistScale: 1,
      hipScale: 1,
      shoulderScale: 1,
      heightScale: 1,
      drape: 1,
      overallScale: 1,
    };
  }

  const chestScale = safeScale(measurements.chest, BASELINE.chest, 0.82, 1.22);
  const waistScale = safeScale(measurements.waist, BASELINE.waist, 0.8, 1.22);
  const hipScale = safeScale(measurements.hips, BASELINE.hips, 0.84, 1.24);
  const shoulderScale = safeScale(measurements.shoulder, BASELINE.shoulder, 0.82, 1.2);
  const heightScale = safeScale(measurements.height, BASELINE.height, 0.88, 1.14);
  const weightScale = safeScale(measurements.weight, BASELINE.weight, 0.88, 1.18);

  return {
    chestScale,
    waistScale,
    hipScale,
    shoulderScale,
    heightScale,
    drape: clamp((hipScale * 0.45 + weightScale * 0.35 + heightScale * 0.2), 0.88, 1.18),
    overallScale: clamp(
      (chestScale + waistScale + hipScale + shoulderScale + heightScale) / 5,
      0.86,
      1.18,
    ),
  };
}
