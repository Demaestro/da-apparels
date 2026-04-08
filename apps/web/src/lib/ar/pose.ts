import type { PoseKeypointLike } from "./types";

export interface PoseRuntime {
  backend: "webgl" | "wasm";
  estimate(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options?: { flipHorizontal?: boolean },
  ): Promise<PoseKeypointLike[] | null>;
  dispose(): void;
}

async function enableBackend(preferredBackend: "webgl" | "wasm") {
  const tf = await import("@tensorflow/tfjs-core");

  const candidates =
    preferredBackend === "wasm"
      ? (["wasm", "webgl"] as const)
      : (["webgl", "wasm"] as const);

  for (const backend of candidates) {
    try {
      if (backend === "webgl") {
        await import("@tensorflow/tfjs-backend-webgl");
      } else {
        const wasm = await import("@tensorflow/tfjs-backend-wasm");
        if (typeof wasm.setWasmPaths === "function") {
          wasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/");
        }
      }

      await tf.setBackend(backend);
      await tf.ready();
      return backend;
    } catch {
      continue;
    }
  }

  await import("@tensorflow/tfjs-backend-webgl");
  await tf.setBackend("webgl");
  await tf.ready();
  return "webgl" as const;
}

export async function createPoseRuntime(options: { preferredBackend: "webgl" | "wasm" }) {
  const [{ createDetector, SupportedModels }, poseDetection] = await Promise.all([
    import("@tensorflow-models/pose-detection"),
    enableBackend(options.preferredBackend),
  ]);

  const detector = await createDetector(SupportedModels.BlazePose, {
    runtime: "tfjs",
    modelType: "lite",
    enableSmoothing: true,
  });

  return {
    backend: poseDetection,
    async estimate(source, config = {}) {
      const poses = await detector.estimatePoses(source, {
        flipHorizontal: config.flipHorizontal ?? false,
        maxPoses: 1,
      });

      if (!poses.length) {
        return null;
      }

      return poses[0].keypoints.map((keypoint) => ({
        x: keypoint.x,
        y: keypoint.y,
        score: keypoint.score ?? 0,
        name: keypoint.name,
      }));
    },
    dispose() {
      detector.dispose();
    },
  } satisfies PoseRuntime;
}
