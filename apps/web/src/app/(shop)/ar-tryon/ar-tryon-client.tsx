"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type ArMode = "idle" | "requesting" | "active" | "unsupported" | "no-camera";

const SAMPLE_GARMENTS = [
  { id: "1", name: "Ivory Silk Blouse", color: "rgba(250,248,243,0.35)", category: "Top" },
  { id: "2", name: "Obsidian Evening Gown", color: "rgba(10,10,10,0.55)", category: "Dress" },
  { id: "3", name: "Gold-Trim Kaftan", color: "rgba(201,169,74,0.35)", category: "Kaftan" },
  { id: "4", name: "Teal Bespoke Suit", color: "rgba(26,74,58,0.4)", category: "Suit" },
];

/**
 * AR Try-On — real camera feed via WebRTC + garment overlay.
 * Production upgrade path:
 *   1. Load 8th Wall XR SDK: <script src="//apps.8thwall.com/xrweb?appKey=YOUR_KEY" />
 *   2. Use XR8.GlTextureRenderer + body-tracking pipeline
 *   3. Replace CSS overlay with actual 3D garment mesh on body landmarks
 */
export function ArTryOnClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<ArMode>("idle");
  const [selectedGarment, setSelectedGarment] = useState(SAMPLE_GARMENTS[0]);
  const [streamActive, setStreamActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setMode("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setMode("active");
      }
    } catch (err) {
      const error = err as DOMException;
      if (error.name === "NotAllowedError") setMode("no-camera");
      else setMode("unsupported");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreamActive(false);
    setMode("idle");
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const [hasCamera, setHasCamera] = useState(false);
  useEffect(() => {
    setHasCamera(typeof navigator !== "undefined" && !!navigator.mediaDevices);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
      <div className="mb-8 sm:mb-12">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-3">DA Apparels</p>
        <h1 className="font-display text-4xl sm:text-5xl text-obsidian mb-3">AR Try-On</h1>
        <p className="font-sans text-sm text-obsidian-400 max-w-xl leading-relaxed">
          See our pieces on you before you order. Your camera stays on your device — nothing is uploaded.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-10">
        {/* Camera viewport */}
        <div className="relative aspect-[3/4] sm:aspect-[4/3] lg:aspect-[3/4] bg-obsidian overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${streamActive ? "opacity-100" : "opacity-0"}`}
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Garment overlay */}
          <AnimatePresence>
            {streamActive && (
              <motion.div
                key={selectedGarment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              >
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: "22%",
                    width: "68%",
                    height: "50%",
                    background: selectedGarment.color,
                    backdropFilter: "blur(1px)",
                    clipPath: "polygon(15% 0%, 85% 0%, 100% 8%, 100% 100%, 0% 100%, 0% 8%)",
                    border: "1px solid rgba(201,169,74,0.3)",
                    transition: "background 0.4s ease",
                  }}
                />
                <div
                  className="absolute left-1/2 -translate-x-1/2 h-px"
                  style={{
                    top: "calc(22% + 1px)",
                    width: "68%",
                    background: "linear-gradient(90deg, transparent, rgba(201,169,74,0.8), transparent)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* State overlays */}
          {!streamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-4">
              {mode === "idle" && (
                <>
                  <div className="w-16 h-16 border border-gold/30 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                  <p className="font-serif text-xl text-ivory">Try on a piece</p>
                  <p className="font-sans text-xs text-obsidian-300 leading-loose">
                    Camera stays on your device only.
                  </p>
                  {hasCamera ? (
                    <Button variant="gold" size="sm" onClick={startCamera} className="mt-2">
                      Activate Camera
                    </Button>
                  ) : (
                    <p className="font-sans text-xs text-error mt-2">Camera not available on this device.</p>
                  )}
                </>
              )}
              {mode === "requesting" && (
                <div className="space-y-3">
                  <div className="h-6 w-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-sans text-xs text-obsidian-300">Requesting camera…</p>
                </div>
              )}
              {mode === "no-camera" && (
                <>
                  <p className="font-serif text-lg text-ivory">Camera access denied</p>
                  <p className="font-sans text-xs text-obsidian-300 leading-loose max-w-xs">
                    Allow camera access in your browser settings, then try again.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setMode("idle")} className="mt-2 border-gold/30 text-gold">
                    Try Again
                  </Button>
                </>
              )}
              {mode === "unsupported" && (
                <>
                  <p className="font-serif text-lg text-ivory">Camera not found</p>
                  <p className="font-sans text-xs text-obsidian-300 leading-loose max-w-xs">
                    Try on a device with a front-facing camera.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Active controls */}
          {streamActive && (
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="bg-obsidian/70 backdrop-blur-sm px-3 py-2">
                <p className="font-sans text-[10px] tracking-widest uppercase text-gold">{selectedGarment.category}</p>
                <p className="font-serif text-sm text-ivory">{selectedGarment.name}</p>
              </div>
              <button onClick={stopCamera} className="bg-obsidian/70 backdrop-blur-sm p-2 text-obsidian-300 hover:text-gold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="absolute top-3 right-3 bg-obsidian/60 backdrop-blur-sm px-2 py-1">
            <p className="font-sans text-[9px] tracking-widest uppercase text-gold/70">AR · 8th Wall</p>
          </div>
        </div>

        {/* Garment selector */}
        <div className="space-y-4">
          <p className="font-sans text-xs tracking-widest uppercase text-gold">Select a Piece</p>
          {SAMPLE_GARMENTS.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGarment(g)}
              className={`w-full text-left border p-4 transition-all duration-200 group ${
                selectedGarment.id === g.id ? "border-gold bg-gold/5" : "border-obsidian-100 hover:border-obsidian-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 border border-obsidian-100" style={{ background: g.color.replace(/[\d.]+\)$/, "0.7)") }} />
                <div>
                  <p className="font-sans text-[10px] tracking-widest uppercase text-gold mb-0.5">{g.category}</p>
                  <p className="font-serif text-sm text-obsidian group-hover:text-gold transition-colors">{g.name}</p>
                </div>
              </div>
            </button>
          ))}

          <div className="border border-gold/20 bg-gold/5 p-4 mt-4">
            <p className="font-sans text-xs text-obsidian-500 leading-loose">
              <span className="text-gold font-medium">Full AR coming soon.</span>{" "}
              Production version uses 8th Wall body-tracking to drape real garment meshes over your silhouette.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
