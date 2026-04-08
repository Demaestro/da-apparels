"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ArAssetQuality, ArLook, ArOverlayFrame } from "@/lib/ar/types";

function createFabricTexture(look: ArLook, selectedColor: string, quality: ArAssetQuality) {
  const canvas = document.createElement("canvas");
  const width = quality === "high" ? 512 : quality === "medium" ? 384 : 256;
  const height = Math.round(width * 1.6);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, selectedColor);
  gradient.addColorStop(0.45, look.palette[1] ?? look.secondary);
  gradient.addColorStop(1, look.secondary);

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.22;
  context.fillStyle = "#ffffff";
  for (let row = 0; row < 18; row += 1) {
    context.fillRect(0, row * (height / 18), width, 2);
  }

  context.globalAlpha = 0.16;
  for (let column = -height; column < width; column += 24) {
    context.save();
    context.translate(column, 0);
    context.rotate(Math.PI / 6);
    context.fillRect(0, 0, 10, height * 1.4);
    context.restore();
  }

  context.globalAlpha = 0.18;
  const sheen = context.createLinearGradient(0, 0, width, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0.02)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0.24)");
  sheen.addColorStop(0.7, "rgba(255,255,255,0.06)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = sheen;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function FabricMesh({
  look,
  selectedColor,
  brightness,
  quality,
  assetReady,
}: {
  look: ArLook;
  selectedColor: string;
  brightness: number;
  quality: ArAssetQuality;
  assetReady: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const segments = quality === "high" ? 24 : quality === "medium" ? 18 : 10;
  const texture = useMemo(
    () => createFabricTexture(look, selectedColor, quality),
    [look, selectedColor, quality],
  );

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1.15, 1.85, segments, segments + 6),
    [segments],
  );
  const basePositions = useMemo(
    () => Float32Array.from(geometry.attributes.position.array as ArrayLike<number>),
    [geometry],
  );

  useEffect(() => {
    return () => {
      texture?.dispose();
      geometry.dispose();
    };
  }, [geometry, texture]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) {
      return;
    }

    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const time = clock.getElapsedTime();
    const waveDepth = quality === "high" ? 0.06 : quality === "medium" ? 0.045 : 0.025;

    for (let index = 0; index < positions.count; index += 1) {
      const baseX = basePositions[index * 3];
      const baseY = basePositions[index * 3 + 1];
      const verticalWeight = 1 - Math.min(1, Math.abs(baseY));
      const ripple =
        Math.sin(time * 1.8 + baseY * 5.5 + baseX * 2.2) *
        waveDepth *
        verticalWeight;

      positions.setXYZ(index, baseX + ripple, baseY, ripple * 0.65);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, -0.18, 0.08);
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, 0.12, 0.08);
    mesh.rotation.z = Math.sin(time * 1.2) * 0.03;
  });

  return (
    <mesh ref={meshRef} scale={[1.2, 1.2, 1]}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        {...({
          map: texture ?? undefined,
          color: selectedColor,
          transparent: true,
          opacity: assetReady ? 0.94 : 0.7,
          metalness: 0.18 + brightness * 0.08,
          roughness: 0.34,
          side: THREE.DoubleSide,
        } as any)}
      />
    </mesh>
  );
}

export function MeshOverlayCanvas({
  look,
  selectedColor,
  frame,
  brightness,
  quality,
  blurRadius,
  assetReady,
}: {
  look: ArLook;
  selectedColor: string;
  frame: ArOverlayFrame | null;
  brightness: number;
  quality: ArAssetQuality;
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
        opacity: Math.max(0.56, frame.confidence),
        filter: `blur(${assetReady ? 0 : blurRadius}px)`,
        transition: "filter 320ms ease, opacity 220ms ease",
      }}
      aria-hidden="true"
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 120 }}
        dpr={[1, quality === "high" ? 1.8 : 1.2]}
        gl={{ alpha: true, antialias: quality !== "low" }}
      >
        <ambientLight intensity={1 + brightness * 1.2} />
        <directionalLight position={[1.8, 2.4, 2]} intensity={1.2 + brightness * 0.9} color="#fff5e6" />
        <directionalLight position={[-1.2, -0.8, 2]} intensity={0.35 + brightness * 0.4} color="#dbeafe" />
        <FabricMesh
          look={look}
          selectedColor={selectedColor}
          brightness={brightness}
          quality={quality}
          assetReady={assetReady}
        />
      </Canvas>
    </div>
  );
}
