"use client";

import type { ArLook, ArOverlayFrame } from "@/lib/ar/types";

function GarmentShape({ look }: { look: ArLook }) {
  return (
    <svg viewBox="0 0 300 620" className="h-full w-full drop-shadow-[0_18px_34px_rgba(10,10,10,0.24)]">
      <defs>
        <linearGradient id={`smart-grad-${look.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={look.accent} stopOpacity="0.94" />
          <stop offset="55%" stopColor={look.palette[1] ?? look.secondary} stopOpacity="0.88" />
          <stop offset="100%" stopColor={look.secondary} stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={`smart-sheen-${look.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {look.template === "suit" && (
        <>
          <path d="M88 50c18-26 106-26 124 0l24 74-28 18-14 126H106L92 142l-28-18 24-74Z" fill={`url(#smart-grad-${look.id})`} />
          <path d="M114 272h54v260h-54z" fill={`url(#smart-grad-${look.id})`} />
          <path d="M176 272h54v260h-54z" fill={`url(#smart-grad-${look.id})`} opacity="0.84" />
          <path d="M110 96h82l-20 46 14 70h-70l14-70-20-46Z" fill="rgba(255,255,255,0.16)" />
        </>
      )}

      {look.template === "mini" && (
        <path d="M106 66c18-26 70-26 88 0l20 72-20 18-10 116c-2 28-20 48-44 48h-6c-24 0-42-20-44-48l-10-116-20-18 20-72Z" fill={`url(#smart-grad-${look.id})`} />
      )}

      {look.template === "structured" && (
        <path d="M96 62c22-24 86-24 108 0l24 72-14 16-6 310c0 68-38 120-82 120s-82-52-82-120l-6-310-14-16 24-72Z" fill={`url(#smart-grad-${look.id})`} />
      )}

      {look.template === "mermaid" && (
        <path d="M96 58c22-24 86-24 108 0l24 76-18 18-10 210c0 44-6 80-28 126l36 104H92l36-104c-22-46-28-82-28-126L90 152l-18-18 24-76Z" fill={`url(#smart-grad-${look.id})`} />
      )}

      {look.template === "column" && (
        <path d="M94 58c22-22 90-22 112 0l22 76-18 18-8 316c-2 72-34 120-76 120s-74-48-76-120l-8-316-18-18 22-76Z" fill={`url(#smart-grad-${look.id})`} />
      )}

      <ellipse cx="150" cy="132" rx="84" ry="56" fill={`url(#smart-sheen-${look.id})`} opacity="0.56" />
      <path d="M94 214c40 22 74 22 112 0" stroke="rgba(255,255,255,0.3)" strokeWidth="6" strokeLinecap="round" />
      <path d="M102 304c34 16 62 16 96 0" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" />
      <path d="M86 402c46 20 82 20 128 0" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function SmartOverlay2D({
  look,
  frame,
  brightness,
  blurRadius,
  assetReady,
}: {
  look: ArLook;
  frame: ArOverlayFrame | null;
  brightness: number;
  blurRadius: number;
  assetReady: boolean;
}) {
  if (!frame) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${frame.x * 100}%`,
        top: `${frame.y * 100}%`,
        width: `${frame.width * 100}%`,
        height: `${frame.height * 100}%`,
        transform: `translate(-50%, -50%) rotate(${frame.rotationDeg}deg)`,
        opacity: Math.max(0.5, frame.confidence) * (assetReady ? 0.92 : 0.65),
        filter: `blur(${assetReady ? 0 : blurRadius}px) brightness(${0.82 + brightness * 0.46}) saturate(${1.1 + brightness * 0.3})`,
        transition: "filter 320ms ease, opacity 320ms ease, transform 180ms ease-out",
      }}
      aria-hidden="true"
    >
      <GarmentShape look={look} />
    </div>
  );
}
