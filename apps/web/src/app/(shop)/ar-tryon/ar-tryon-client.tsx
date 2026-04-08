"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { SmartOverlay2D } from "@/components/ar/smart-overlay-2d";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { createOverlayFrame, extractGarmentAnchors } from "@/lib/ar/anchors";
import { getMeasurementScaleProfile } from "@/lib/ar/measurements";
import {
  getArBlurRadius,
  getArCapabilityProfile,
  subscribeToArCapabilityChanges,
} from "@/lib/ar/network";
import type {
  ArCapabilityProfile,
  ArLook,
  ArOverlayFrame,
  ArTemplate,
} from "@/lib/ar/types";
import type { PoseRuntime } from "@/lib/ar/pose";
import { getArPreviewProducts } from "@/lib/catalogue-data";
import type { BodyMeasurements } from "@/lib/types";

const MeshOverlayCanvas = dynamic(
  () =>
    import("@/components/ar/mesh-overlay-canvas").then((module) => ({
      default: module.MeshOverlayCanvas,
    })),
  {
    ssr: false,
  },
);

type ArMode =
  | "idle"
  | "preparing"
  | "requesting-camera"
  | "active"
  | "upload"
  | "no-camera"
  | "unsupported"
  | "error";

type PreviewSource = "camera" | "upload";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTemplate(categorySlug: string, slug: string): ArTemplate {
  if (slug.includes("suit") || slug.includes("coat")) return "suit";
  if (slug.includes("mini")) return "mini";
  if (slug.includes("asoebi")) return "structured";
  if (slug.includes("gown")) return "mermaid";
  if (categorySlug.toLowerCase().includes("occasion")) return "column";
  return "column";
}

function createLooks(): ArLook[] {
  return getArPreviewProducts().map((product) => {
    const palette = product.fabricOptions[0]?.colorOptions ?? ["#C9A94A", "#171717", "#F5F1E8"];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category.name,
      image: product.images[0]?.url ?? "/catalogue/safari-sundress.jpg",
      accent: palette[0] ?? "#C9A94A",
      secondary: palette[1] ?? "#171717",
      palette,
      template: getTemplate(product.category.slug, product.slug),
    };
  });
}

function readMeasurements(response?: { success: boolean; data?: BodyMeasurements }) {
  return response?.success ? response.data ?? null : null;
}

function sampleAmbientLight(
  source: HTMLVideoElement | HTMLImageElement,
  canvas: HTMLCanvasElement | null,
) {
  if (!canvas) {
    return 0.62;
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return 0.62;
  }

  const width = 24;
  const height = 24;
  canvas.width = width;
  canvas.height = height;
  context.drawImage(source, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  let total = 0;

  for (let index = 0; index < data.length; index += 4) {
    total += data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
  }

  return clamp(total / ((data.length / 4) * 255), 0.22, 0.96);
}

function describeProfile(profile: ArCapabilityProfile) {
  if (profile.overlayMode === "smart-2d") {
    return "3G smart overlay";
  }

  return profile.assetQuality === "high" ? "3D mesh overlay" : "Balanced mesh overlay";
}

export function ArTryOnClient({ initialPieceSlug }: { initialPieceSlug?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadImageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brightnessCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRuntimeRef = useRef<PoseRuntime | null>(null);
  const animationFrameRef = useRef<number>();
  const lastEstimateRef = useRef(0);
  const estimatingRef = useRef(false);
  const mountedRef = useRef(true);

  const looks = useMemo(createLooks, []);
  const initialLook =
    looks.find((look) => look.slug === initialPieceSlug) ??
    looks[0];

  const [mode, setMode] = useState<ArMode>("idle");
  const [previewSource, setPreviewSource] = useState<PreviewSource>("camera");
  const [selectedLook, setSelectedLook] = useState<ArLook>(initialLook);
  const [selectedColor, setSelectedColor] = useState(initialLook.palette[0] ?? initialLook.accent);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [capabilityProfile, setCapabilityProfile] = useState<ArCapabilityProfile>(() =>
    getArCapabilityProfile(),
  );
  const [runtimeStatus, setRuntimeStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [trackingStatus, setTrackingStatus] = useState<
    "idle" | "aligning" | "tracking" | "lost"
  >("idle");
  const [overlayFrame, setOverlayFrame] = useState<ArOverlayFrame | null>(null);
  const [ambientLight, setAmbientLight] = useState(0.62);
  const [assetReady, setAssetReady] = useState(false);
  const [runtimeRequested, setRuntimeRequested] = useState(false);

  const deferredFrame = useDeferredValue(overlayFrame);
  const blurRadius = getArBlurRadius(capabilityProfile);

  const { data: measurementResponse } = useQuery({
    queryKey: ["measurements", "ar"],
    queryFn: () => api.get<BodyMeasurements>("/users/me/measurements"),
    enabled: runtimeRequested,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const measurementProfile = useMemo(
    () => getMeasurementScaleProfile(readMeasurements(measurementResponse)),
    [measurementResponse],
  );

  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    estimatingRef.current = false;
  }, []);

  const stopCamera = useCallback(() => {
    stopTracking();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, [stopTracking]);

  const updateOverlay = useCallback(
    async (
      source: HTMLVideoElement | HTMLImageElement,
      options: { flipHorizontal: boolean },
    ) => {
      const runtime = poseRuntimeRef.current;
      if (!runtime) {
        return;
      }

      const keypoints = await runtime.estimate(source, options);
      const sourceWidth =
        source instanceof HTMLVideoElement
          ? source.videoWidth || source.clientWidth
          : source.naturalWidth || source.width || source.clientWidth;
      const sourceHeight =
        source instanceof HTMLVideoElement
          ? source.videoHeight || source.clientHeight
          : source.naturalHeight || source.height || source.clientHeight;

      if (!keypoints || !sourceWidth || !sourceHeight) {
        startTransition(() => {
          setOverlayFrame(null);
          setTrackingStatus("lost");
        });
        return;
      }

      const anchors = extractGarmentAnchors(keypoints);
      if (!anchors) {
        startTransition(() => {
          setOverlayFrame(null);
          setTrackingStatus("lost");
        });
        return;
      }

      const nextFrame = createOverlayFrame(
        anchors,
        sourceWidth,
        sourceHeight,
        measurementProfile,
        selectedLook.template,
      );
      const nextBrightness = sampleAmbientLight(source, brightnessCanvasRef.current);

      startTransition(() => {
        setOverlayFrame(nextFrame);
        setAmbientLight(nextBrightness);
        setTrackingStatus("tracking");
      });
    },
    [measurementProfile, selectedLook.template],
  );

  const ensurePoseRuntime = useCallback(async (profile: ArCapabilityProfile) => {
    if (poseRuntimeRef.current) {
      return poseRuntimeRef.current;
    }

    setRuntimeStatus("loading");
    setRuntimeRequested(true);

    const { createPoseRuntime } = await import("@/lib/ar/pose");
    const runtime = await createPoseRuntime({
      preferredBackend: profile.preferredTfBackend,
    });

    if (!mountedRef.current) {
      runtime.dispose();
      throw new Error("AR session was closed before the runtime finished loading.");
    }

    poseRuntimeRef.current = runtime;
    setRuntimeStatus("ready");
    return runtime;
  }, []);

  const beginTracking = useCallback(() => {
    stopTracking();
    setTrackingStatus("aligning");

    const intervalMs =
      capabilityProfile.assetQuality === "low"
        ? 170
        : capabilityProfile.assetQuality === "medium"
          ? 120
          : 85;

    const tick = async () => {
      animationFrameRef.current = window.requestAnimationFrame(tick);

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !poseRuntimeRef.current || estimatingRef.current) {
        return;
      }

      const now = performance.now();
      if (now - lastEstimateRef.current < intervalMs) {
        return;
      }

      lastEstimateRef.current = now;
      estimatingRef.current = true;

      try {
        await updateOverlay(video, { flipHorizontal: true });
      } finally {
        estimatingRef.current = false;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }, [capabilityProfile.assetQuality, stopTracking, updateOverlay]);

  const handleUpload = useCallback(
    async (file?: File) => {
      if (!file) {
        return;
      }

      const profile = getArCapabilityProfile();
      setCapabilityProfile(profile);
      setRuntimeRequested(true);
      setMode("preparing");
      setPreviewSource("upload");
      setTrackingStatus("aligning");
      stopCamera();

      try {
        await ensurePoseRuntime(profile);
        setUploadedPreview((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }

          return URL.createObjectURL(file);
        });
        setMode("upload");
      } catch {
        setRuntimeStatus("error");
        setMode("error");
      }
    },
    [ensurePoseRuntime, stopCamera],
  );

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMode("unsupported");
      return;
    }

    const profile = getArCapabilityProfile();
    setCapabilityProfile(profile);
    setRuntimeRequested(true);
    setMode("preparing");
    setPreviewSource("camera");
    setTrackingStatus("aligning");
    stopCamera();

    try {
      await ensurePoseRuntime(profile);
      setMode("requesting-camera");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: profile.assetQuality === "low" ? 720 : 960 },
          height: { ideal: profile.assetQuality === "low" ? 960 : 1280 },
          frameRate: { ideal: profile.assetQuality === "low" ? 20 : 24, max: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setUploadedPreview((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
      setMode("active");
      beginTracking();
    } catch (error) {
      const domException = error as DOMException;
      setRuntimeStatus((current) => (current === "loading" ? "error" : current));
      setMode(domException?.name === "NotAllowedError" ? "no-camera" : "unsupported");
    }
  }, [beginTracking, ensurePoseRuntime, stopCamera]);

  useEffect(() => {
    mountedRef.current = true;
    setCapabilityProfile(getArCapabilityProfile());

    const unsubscribe = subscribeToArCapabilityChanges((profile) => {
      setCapabilityProfile(profile);
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
      stopCamera();
      poseRuntimeRef.current?.dispose();
      poseRuntimeRef.current = null;
    };
  }, [stopCamera]);

  useEffect(() => {
    setSelectedColor(selectedLook.palette[0] ?? selectedLook.accent);
  }, [selectedLook]);

  useEffect(() => {
    setAssetReady(false);
    const timer = window.setTimeout(
      () => setAssetReady(true),
      capabilityProfile.assetQuality === "low" ? 720 : capabilityProfile.assetQuality === "medium" ? 500 : 360,
    );

    return () => window.clearTimeout(timer);
  }, [capabilityProfile.assetQuality, selectedColor, selectedLook.id]);

  useEffect(() => {
    if (
      mode !== "upload" ||
      !uploadedPreview ||
      !poseRuntimeRef.current ||
      !uploadImageRef.current ||
      !uploadImageRef.current.complete
    ) {
      return;
    }

    void updateOverlay(uploadImageRef.current, { flipHorizontal: false });
  }, [measurementProfile, mode, selectedLook.template, updateOverlay, uploadedPreview]);

  useEffect(() => {
    if (mode === "active" && previewSource === "camera" && streamRef.current) {
      beginTracking();
    }
  }, [beginTracking, mode, previewSource]);

  useEffect(() => {
    return () => {
      if (uploadedPreview) {
        URL.revokeObjectURL(uploadedPreview);
      }
    };
  }, [uploadedPreview]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-32">
      <div className="mb-8 flex flex-col gap-4 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 font-sans text-xs uppercase tracking-[0.34em] text-gold">
            Smart AR Try-On
          </p>
          <h1 className="font-display text-4xl text-obsidian sm:text-5xl">
            Lightweight mobile AR built for real-world bandwidth.
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-sm leading-loose text-obsidian-500">
            The camera shell stays light until you tap start. TensorFlow.js body tracking runs on
            the phone, then the app picks a 3G-safe 2D overlay or a higher-fidelity mesh overlay
            automatically based on connection quality and device strength.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-gold/20 bg-gold/5 px-4 py-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold">Connection</p>
            <p className="mt-2 font-serif text-lg text-obsidian">{capabilityProfile.effectiveType.toUpperCase()}</p>
          </div>
          <div className="border border-obsidian-100 px-4 py-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold">Render Mode</p>
            <p className="mt-2 font-serif text-lg text-obsidian">{describeProfile(capabilityProfile)}</p>
          </div>
          <div className="border border-obsidian-100 px-4 py-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold">Fit Intelligence</p>
            <p className="mt-2 font-serif text-lg text-obsidian">
              {measurementResponse?.success ? "Vault measurements" : "Default profile"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden bg-obsidian">
            <Image
              src={selectedLook.image}
              alt={selectedLook.name}
              fill
              priority
              className="object-cover opacity-20 blur-2xl scale-105"
            />

            {previewSource === "camera" && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  mode === "active" ? "opacity-100" : "opacity-0"
                }`}
                style={{ transform: "scaleX(-1)" }}
              />
            )}

            {previewSource === "upload" && uploadedPreview && (
              <img
                ref={uploadImageRef}
                src={uploadedPreview}
                alt="Uploaded style preview"
                className="absolute inset-0 h-full w-full object-cover"
                onLoad={() => {
                  if (uploadImageRef.current) {
                    void updateOverlay(uploadImageRef.current, { flipHorizontal: false });
                  }
                }}
              />
            )}

            {capabilityProfile.overlayMode === "mesh-3d" ? (
              <MeshOverlayCanvas
                look={selectedLook}
                selectedColor={selectedColor}
                frame={deferredFrame}
                brightness={ambientLight}
                quality={capabilityProfile.assetQuality}
                blurRadius={blurRadius}
                assetReady={assetReady}
              />
            ) : (
              <SmartOverlay2D
                look={selectedLook}
                frame={deferredFrame}
                brightness={ambientLight}
                blurRadius={blurRadius}
                assetReady={assetReady}
              />
            )}

            {!deferredFrame && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                <div className="max-w-md space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/25">
                    <span className="font-serif text-2xl text-gold">AR</span>
                  </div>
                  <p className="font-serif text-2xl text-ivory-warm">
                    {mode === "preparing" || mode === "requesting-camera"
                      ? "Preparing local tracking"
                      : "Start the try-on session"}
                  </p>
                  <p className="font-sans text-xs leading-loose text-obsidian-200">
                    {mode === "preparing" || mode === "requesting-camera"
                      ? "Loading the body tracker and the optimized overlay pipeline."
                      : "Use the front camera or upload a full-body image. The garment will pin to shoulders, waist, hips, and lower-body anchors automatically."}
                  </p>
                </div>
              </div>
            )}

            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="bg-obsidian/75 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.26em] text-gold backdrop-blur">
                {describeProfile(capabilityProfile)}
              </span>
              <span className="bg-white/90 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.26em] text-obsidian backdrop-blur">
                TF.js {runtimeStatus === "ready" ? poseRuntimeRef.current?.backend?.toUpperCase() : capabilityProfile.preferredTfBackend.toUpperCase()}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 grid gap-2 sm:grid-cols-3">
              <div className="bg-obsidian/72 px-3 py-2 backdrop-blur-sm">
                <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-gold">Tracking</p>
                <p className="mt-1 font-serif text-sm text-ivory-warm">
                  {trackingStatus === "tracking"
                    ? "Locked on body anchors"
                    : trackingStatus === "aligning"
                      ? "Align torso in frame"
                      : trackingStatus === "lost"
                        ? "Recenter shoulders and hips"
                        : "Idle"}
                </p>
              </div>
              <div className="bg-obsidian/72 px-3 py-2 backdrop-blur-sm">
                <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-gold">Lighting</p>
                <p className="mt-1 font-serif text-sm text-ivory-warm">
                  {ambientLight > 0.72 ? "Bright scene" : ambientLight > 0.48 ? "Balanced scene" : "Low light"}
                </p>
              </div>
              <div className="bg-obsidian/72 px-3 py-2 backdrop-blur-sm">
                <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-gold">Measurements</p>
                <p className="mt-1 font-serif text-sm text-ivory-warm">
                  {measurementResponse?.success ? "Scaled from vault" : "Using house fit"}
                </p>
              </div>
            </div>

            <canvas ref={brightnessCanvasRef} className="hidden" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              variant="gold"
              size="sm"
              onClick={startCamera}
              loading={mode === "preparing" || mode === "requesting-camera"}
            >
              Start Smart Try-On
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOverlayFrame(null);
                setTrackingStatus("idle");
                stopCamera();
                setUploadedPreview((current) => {
                  if (current) {
                    URL.revokeObjectURL(current);
                  }

                  return null;
                });
                setMode("idle");
              }}
            >
              Reset Session
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />

          <div className="border border-obsidian-100 p-5">
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-gold">
              Runtime Notes
            </p>
            <p className="mt-3 font-sans text-sm leading-loose text-obsidian-500">
              {capabilityProfile.reason}
            </p>
            {(mode === "no-camera" || mode === "unsupported" || mode === "error") && (
              <p className="mt-3 font-sans text-xs text-error">
                {mode === "no-camera"
                  ? "Camera permission was denied. You can still use photo upload."
                  : "This browser could not start the live camera path. Upload mode remains available."}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-obsidian-100 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.28em] text-gold">
                  Selected Piece
                </p>
                <h2 className="mt-2 font-display text-3xl text-obsidian">{selectedLook.name}</h2>
                <p className="mt-2 font-sans text-sm leading-loose text-obsidian-500">
                  {selectedLook.category}. Smart overlay assets load only after you start try-on.
                </p>
              </div>
              <Link href={`/products/${selectedLook.slug}`} className="btn-ghost shrink-0">
                View Piece
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {looks.map((look) => (
                <button
                  key={look.id}
                  type="button"
                  onClick={() => setSelectedLook(look)}
                  className={`text-left transition-all ${
                    selectedLook.id === look.id ? "opacity-100" : "opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-obsidian-50">
                    <Image
                      src={look.image}
                      alt={look.name}
                      fill
                      sizes="(max-width: 1024px) 33vw, 18vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/90 to-transparent px-3 py-3">
                      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">
                        {look.category}
                      </p>
                      <p className="mt-1 font-serif text-sm text-ivory-warm">{look.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-obsidian-100 bg-white p-6">
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-gold">
              Fabric Palette
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {selectedLook.palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`flex items-center gap-3 border px-3 py-2 ${
                    selectedColor === color
                      ? "border-obsidian bg-obsidian text-ivory-warm"
                      : "border-obsidian-100 text-obsidian"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em]">
                    {color}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 font-sans text-xs leading-loose text-obsidian-400">
              The overlay texture is generated from the selected fabric palette, then shaded using
              the live camera brightness so it reads more like fabric and less like a sticker.
            </p>
          </div>

          <div className="border border-gold/20 bg-gold/5 p-6">
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-gold">
              Optimization Pipeline
            </p>
            <ol className="mt-4 space-y-3 font-sans text-sm leading-loose text-obsidian-500">
              <li>1. A lightweight route shell loads first.</li>
              <li>2. TensorFlow.js and the AR renderer lazy-load only after you tap try-on.</li>
              <li>3. BlazePose runs on-device, then the overlay mode switches by network and GPU profile.</li>
              <li>4. Saved vault measurements tune width, drape, and garment proportion automatically.</li>
            </ol>
          </div>

          <div className="border border-obsidian-100 p-6">
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-gold">
              Fit Tuning
            </p>
            <p className="mt-3 font-sans text-sm leading-loose text-obsidian-500">
              For the cleanest result, keep your full torso in view and save your measurements in
              the vault before starting. The current session uses{" "}
              {measurementResponse?.success ? "your saved encrypted measurements" : "the default DA fit profile"}.
            </p>
            <div className="mt-5">
              <Link href="/account/vault" className="btn-ghost">
                Open Measurement Vault
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
