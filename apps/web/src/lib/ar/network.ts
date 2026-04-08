import type { ArCapabilityProfile } from "./types";

type NavigatorConnection = {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

type ExtendedNavigator = Navigator & {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  webkitConnection?: NavigatorConnection;
  deviceMemory?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getNavigatorConnection() {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const nav = navigator as ExtendedNavigator;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

function detectGpuTier(): ArCapabilityProfile["gpuTier"] {
  if (typeof document === "undefined") {
    return "balanced";
  }

  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl");

  if (!gl) {
    return "weak";
  }

  const renderer =
    typeof WebGLRenderingContext !== "undefined" &&
    gl instanceof WebGLRenderingContext
      ? (() => {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (!debugInfo) {
            return "";
          }

          return String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "");
        })()
      : "";

  if (/swiftshader|software|llvmpipe/i.test(renderer)) {
    return "weak";
  }

  if (/apple|metal|adreno\s*[67]|nvidia|radeon|geforce/i.test(renderer)) {
    return "strong";
  }

  return "balanced";
}

export function getArCapabilityProfile(): ArCapabilityProfile {
  if (typeof navigator === "undefined") {
    return {
      assetQuality: "medium",
      overlayMode: "smart-2d",
      preferredTfBackend: "wasm",
      effectiveType: "unknown",
      downlinkMbps: null,
      saveData: false,
      deviceMemoryGb: null,
      hardwareConcurrency: null,
      gpuTier: "balanced",
      reason: "AR capability defaults to the lightweight profile until the browser is available.",
    };
  }

  const nav = navigator as ExtendedNavigator;
  const connection = getNavigatorConnection();
  const effectiveType = connection?.effectiveType ?? "unknown";
  const downlinkMbps = typeof connection?.downlink === "number" ? connection.downlink : null;
  const saveData = Boolean(connection?.saveData);
  const deviceMemoryGb = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const hardwareConcurrency =
    typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null;
  const gpuTier = detectGpuTier();

  const verySlowNetwork =
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g" ||
    saveData ||
    (downlinkMbps !== null && downlinkMbps < 1.4);

  const constrainedDevice =
    gpuTier === "weak" ||
    (deviceMemoryGb !== null && deviceMemoryGb <= 4) ||
    (hardwareConcurrency !== null && hardwareConcurrency <= 4);

  if (verySlowNetwork || constrainedDevice) {
    return {
      assetQuality: "low",
      overlayMode: "smart-2d",
      preferredTfBackend: "wasm",
      effectiveType,
      downlinkMbps,
      saveData,
      deviceMemoryGb,
      hardwareConcurrency,
      gpuTier,
      reason:
        "This device is on a slower connection or lighter GPU path, so AR switches to the low-bandwidth 2D overlay with quantized assets.",
    };
  }

  const capableNetwork =
    effectiveType === "4g" ||
    effectiveType === "5g" ||
    (downlinkMbps !== null && downlinkMbps >= 4);

  const capableDevice =
    gpuTier === "strong" &&
    (deviceMemoryGb === null || deviceMemoryGb >= 6) &&
    (hardwareConcurrency === null || hardwareConcurrency >= 6);

  if (capableNetwork && capableDevice) {
    return {
      assetQuality: "high",
      overlayMode: "mesh-3d",
      preferredTfBackend: "webgl",
      effectiveType,
      downlinkMbps,
      saveData,
      deviceMemoryGb,
      hardwareConcurrency,
      gpuTier,
      reason:
        "Connection and device checks allow the higher-fidelity mesh overlay, while still keeping assets under the lightweight AR budget.",
    };
  }

  return {
    assetQuality: "medium",
    overlayMode: "mesh-3d",
    preferredTfBackend: "webgl",
    effectiveType,
    downlinkMbps,
    saveData,
    deviceMemoryGb,
    hardwareConcurrency,
    gpuTier,
    reason:
      "AR is using the balanced profile: local body tracking with a mesh overlay, medium textures, and conservative frame throttling.",
  };
}

export function getArBlurRadius(profile: ArCapabilityProfile) {
  return clamp(profile.assetQuality === "low" ? 18 : profile.assetQuality === "medium" ? 12 : 8, 8, 18);
}

export function subscribeToArCapabilityChanges(
  onChange: (profile: ArCapabilityProfile) => void,
) {
  const connection = getNavigatorConnection();
  if (!connection?.addEventListener || !connection?.removeEventListener) {
    return () => undefined;
  }

  const handleChange = () => onChange(getArCapabilityProfile());
  connection.addEventListener("change", handleChange);

  return () => connection.removeEventListener?.("change", handleChange);
}
