"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getArPreviewProducts } from "@/lib/catalogue-data";

type ArMode = "idle" | "requesting" | "active" | "no-camera" | "unsupported";
type PreviewSource = "camera" | "upload";
type Template = "column" | "mermaid" | "mini" | "structured" | "suit";

interface GarmentLook {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  accent: string;
  secondary: string;
  template: Template;
}

function getTemplate(category: string, slug: string): Template {
  if (slug.includes("suit") || slug.includes("coat")) return "suit";
  if (slug.includes("mini")) return "mini";
  if (slug.includes("asoebi")) return "structured";
  if (slug.includes("gown")) return "mermaid";
  if (category.toLowerCase().includes("occasion")) return "column";
  return "column";
}

function createLooks(): GarmentLook[] {
  return getArPreviewProducts().map((product) => {
    const colors = product.fabricOptions[0]?.colorOptions ?? ["#C9A94A", "#0A0A0A"];
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category.name,
      image: product.images[0]?.url ?? "/catalogue/safari-sundress.jpg",
      accent: colors[0] ?? "#C9A94A",
      secondary: colors[1] ?? "#0A0A0A",
      template: getTemplate(product.category.slug, product.slug),
    };
  });
}

function StudioOverlay({
  look,
  opacity,
  scale,
  offsetX,
  offsetY,
}: {
  look: GarmentLook;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  const transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      style={{ opacity, transform, transformOrigin: "center center" }}
    >
      <svg
        viewBox="0 0 300 620"
        className="h-[78%] w-[68%] drop-shadow-[0_20px_40px_rgba(10,10,10,0.28)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`grad-${look.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={look.accent} stopOpacity="0.85" />
            <stop offset="100%" stopColor={look.secondary} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {look.template === "suit" && (
          <>
            <path d="M96 48c20-30 88-30 108 0l28 84-33 20-10 126H111L101 152l-33-20 28-84Z" fill={`url(#grad-${look.id})`} />
            <path d="M128 278h52v246h-52z" fill={`url(#grad-${look.id})`} opacity="0.92" />
            <path d="M180 278h52v246h-52z" fill={`url(#grad-${look.id})`} opacity="0.78" />
            <path d="M111 100h78l-22 48 13 72h-60l13-72-22-48Z" fill="rgba(250,248,243,0.2)" />
          </>
        )}

        {look.template === "mini" && (
          <path d="M105 72c18-24 72-24 90 0l24 72-22 18-18 30v86c0 20-16 36-36 36h-6c-20 0-36-16-36-36v-86l-18-30-22-18 24-72Z" fill={`url(#grad-${look.id})`} />
        )}

        {look.template === "structured" && (
          <path d="M96 62c20-24 88-24 108 0l24 72-16 16-2 320c0 66-42 110-84 110s-84-44-84-110l-2-320-16-16 24-72Z" fill={`url(#grad-${look.id})`} />
        )}

        {look.template === "mermaid" && (
          <path d="M96 62c20-24 88-24 108 0l24 72-18 18-10 220c0 44-10 80-28 112l40 102H88l40-102c-18-32-28-68-28-112l-10-220-18-18 24-72Z" fill={`url(#grad-${look.id})`} />
        )}

        {look.template === "column" && (
          <path d="M96 62c20-24 88-24 108 0l24 72-18 18-10 326c0 52-34 102-74 102s-74-50-74-102L42 152l-18-18 24-72Z" fill={`url(#grad-${look.id})`} />
        )}

        <path d="M110 112c26 8 54 8 80 0" stroke="rgba(250,248,243,0.5)" strokeWidth="6" strokeLinecap="round" />
        <path d="M88 200c42 24 82 24 124 0" stroke="rgba(250,248,243,0.35)" strokeWidth="4" strokeLinecap="round" />
        <path d="M100 300c38 18 64 18 100 0" stroke="rgba(250,248,243,0.25)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Control({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between font-sans text-[11px] tracking-widest uppercase text-obsidian-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-gold"
      />
    </label>
  );
}

export function ArTryOnClient({ initialPieceSlug }: { initialPieceSlug?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const looks = useMemo(createLooks, []);
  const initialLook =
    looks.find((item) => item.slug === initialPieceSlug) ??
    looks[0];

  const [mode, setMode] = useState<ArMode>("idle");
  const [previewSource, setPreviewSource] = useState<PreviewSource>("camera");
  const [selectedLook, setSelectedLook] = useState<GarmentLook>(initialLook);
  const [streamActive, setStreamActive] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(78);
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(16);

  const startCamera = useCallback(async () => {
    setMode("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPreviewSource("camera");
      setStreamActive(true);
      setMode("active");
    } catch (error) {
      const exception = error as DOMException;
      setMode(exception.name === "NotAllowedError" ? "no-camera" : "unsupported");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreamActive(false);
    setMode("idle");
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);
    };
  }, [stopCamera, uploadedPreview]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && streamRef.current) {
        stopCamera();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stopCamera]);

  function resetOverlay() {
    setOpacity(78);
    setScale(100);
    setOffsetX(0);
    setOffsetY(16);
  }

  function handleUpload(file?: File) {
    if (!file) return;
    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);
    const nextUrl = URL.createObjectURL(file);
    setUploadedPreview(nextUrl);
    setPreviewSource("upload");
    stopCamera();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
      <div className="mb-8 sm:mb-12">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-3">DA Apparels</p>
        <h1 className="font-display text-4xl sm:text-5xl text-obsidian mb-3">AR Preview Studio</h1>
        <p className="font-sans text-sm text-obsidian-400 max-w-2xl leading-relaxed">
          Preview a stylized live drape of any featured piece on your camera or your own uploaded photo.
          It is a faster, lighter studio preview built for mobile devices while the full body-tracking pipeline is integrated.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-10">
        <div className="space-y-4">
          <div className="relative aspect-[3/4] sm:aspect-[4/3] lg:aspect-[3/4] overflow-hidden bg-obsidian rounded-none">
            {previewSource === "camera" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  streamActive ? "opacity-100" : "opacity-0"
                }`}
                style={{ transform: "scaleX(-1)" }}
              />
            )}

            {previewSource === "upload" && uploadedPreview && (
              <Image
                src={uploadedPreview}
                alt="Uploaded style preview"
                fill
                unoptimized
                className="object-cover"
              />
            )}

            {(streamActive || uploadedPreview) && (
              <StudioOverlay
                look={selectedLook}
                opacity={opacity / 100}
                scale={scale / 100}
                offsetX={offsetX}
                offsetY={offsetY}
              />
            )}

            {!streamActive && !uploadedPreview && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-4">
                {mode === "idle" && (
                  <>
                    <div className="w-16 h-16 border border-gold/30 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    </div>
                    <p className="font-serif text-xl text-ivory">Preview a piece live</p>
                    <p className="font-sans text-xs text-obsidian-300 leading-loose max-w-xs">
                      Use your front camera or upload a full-body photo to align the look.
                    </p>
                  </>
                )}
                {mode === "requesting" && (
                  <div className="space-y-3">
                    <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-sans text-xs text-obsidian-300">Requesting cameraâ€¦</p>
                  </div>
                )}
                {mode === "no-camera" && (
                  <>
                    <p className="font-serif text-lg text-ivory">Camera access denied</p>
                    <p className="font-sans text-xs text-obsidian-300 leading-loose max-w-xs">
                      Allow camera access in your browser settings, or switch to photo upload below.
                    </p>
                  </>
                )}
                {mode === "unsupported" && (
                  <>
                    <p className="font-serif text-lg text-ivory">Camera unavailable</p>
                    <p className="font-sans text-xs text-obsidian-300 leading-loose max-w-xs">
                      Continue with the upload option if this device does not expose a front camera.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="absolute top-3 right-3 bg-obsidian/60 backdrop-blur-sm px-2 py-1">
              <p className="font-sans text-[9px] tracking-widest uppercase text-gold/80">Live Studio</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="gold" size="sm" onClick={startCamera}>
              Start Camera
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload Photo
            </Button>
            <Button variant="ghost" size="sm" onClick={resetOverlay}>
              Reset Fit
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
        </div>

        <div className="space-y-6">
          <div className="border border-obsidian-100 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-sans text-xs tracking-widest uppercase text-gold">Selected Piece</p>
              {streamActive && (
                <button onClick={stopCamera} className="font-sans text-[11px] tracking-widest uppercase text-obsidian-400 hover:text-gold transition-colors">
                  Stop Camera
                </button>
              )}
            </div>

            <div className="relative aspect-[4/5] overflow-hidden bg-obsidian-50">
              <Image src={selectedLook.image} alt={selectedLook.name} fill className="object-cover" />
            </div>

            <div>
              <p className="font-serif text-lg text-obsidian">{selectedLook.name}</p>
              <p className="font-sans text-xs text-obsidian-400 mt-1">{selectedLook.category}</p>
            </div>
          </div>

          <div className="border border-obsidian-100 bg-white p-5 space-y-4">
            <p className="font-sans text-xs tracking-widest uppercase text-gold">Fit Controls</p>
            <Control label="Opacity" value={opacity} min={30} max={95} step={1} onChange={setOpacity} />
            <Control label="Scale" value={scale} min={70} max={130} step={1} onChange={setScale} />
            <Control label="Horizontal" value={offsetX} min={-70} max={70} step={1} onChange={setOffsetX} />
            <Control label="Vertical" value={offsetY} min={-80} max={80} step={1} onChange={setOffsetY} />
          </div>

          <div className="space-y-3">
            <p className="font-sans text-xs tracking-widest uppercase text-gold">Choose a Piece</p>
            <div className="grid grid-cols-2 gap-3">
              {looks.map((look) => (
                <button
                  key={look.id}
                  onClick={() => setSelectedLook(look)}
                  className={`border p-2 text-left transition-all duration-200 ${
                    selectedLook.id === look.id
                      ? "border-gold bg-gold/5"
                      : "border-obsidian-100 hover:border-obsidian-300"
                  }`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-obsidian-50">
                    <Image src={look.image} alt={look.name} fill className="object-cover" />
                  </div>
                  <p className="mt-2 font-serif text-sm text-obsidian line-clamp-2">{look.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
