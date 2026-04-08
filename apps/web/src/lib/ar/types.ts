export type ArAssetQuality = "low" | "medium" | "high";
export type ArOverlayMode = "smart-2d" | "mesh-3d";
export type ArTemplate = "column" | "mermaid" | "mini" | "structured" | "suit";

export interface ArLook {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  accent: string;
  secondary: string;
  palette: string[];
  template: ArTemplate;
}

export interface ArCapabilityProfile {
  assetQuality: ArAssetQuality;
  overlayMode: ArOverlayMode;
  preferredTfBackend: "webgl" | "wasm";
  effectiveType: string;
  downlinkMbps: number | null;
  saveData: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  gpuTier: "weak" | "balanced" | "strong";
  reason: string;
}

export interface ArOverlayFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number;
  confidence: number;
}

export interface MeasurementScaleProfile {
  chestScale: number;
  waistScale: number;
  hipScale: number;
  shoulderScale: number;
  heightScale: number;
  drape: number;
  overallScale: number;
}

export interface PoseKeypointLike {
  x: number;
  y: number;
  score?: number;
  name?: string;
}
