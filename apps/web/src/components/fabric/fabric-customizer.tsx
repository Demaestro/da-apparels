"use client";

/**
 * FabricCustomizer — the Fabric Customisation UI state engine.
 *
 * State model:
 *   selectedFabricId → drives fabric detail panel
 *   selectedColor    → drives product preview overlay
 *   customNote       → free-text for bespoke requests
 *
 * This component is intentionally self-contained using Zustand so the
 * parent ProductPage can remain a Server Component.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CldImage } from "next-cloudinary";

export interface FabricOptionUI {
  id: string;
  name: string;
  category: string;
  colorOptions: string[]; // hex codes
  textureImageUrl?: string;
  priceAdjust: number;
  inStock: boolean;
}

interface FabricCustomizerProps {
  fabricOptions: FabricOptionUI[];
  onSelectionChange: (selection: {
    fabricId: string | null;
    color: string | null;
    note: string;
  }) => void;
}

export function FabricCustomizer({ fabricOptions, onSelectionChange }: FabricCustomizerProps) {
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const selectedFabric = fabricOptions.find((f) => f.id === selectedFabricId) ?? null;

  function selectFabric(id: string) {
    const fabric = fabricOptions.find((f) => f.id === id)!;
    const defaultColor = fabric.colorOptions[0] ?? null;
    setSelectedFabricId(id);
    setSelectedColor(defaultColor);
    onSelectionChange({ fabricId: id, color: defaultColor, note });
  }

  function selectColor(hex: string) {
    setSelectedColor(hex);
    onSelectionChange({ fabricId: selectedFabricId, color: hex, note });
  }

  return (
    <div className="space-y-8">
      {/* Step 1 — Choose Fabric */}
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-gold mb-4">
          01 — Select Fabric
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fabricOptions.map((fabric) => (
            <button
              key={fabric.id}
              onClick={() => selectFabric(fabric.id)}
              disabled={!fabric.inStock}
              className={`group relative border p-4 text-left transition-all duration-200 ${
                selectedFabricId === fabric.id
                  ? "border-gold bg-gold/5"
                  : "border-obsidian-200 hover:border-obsidian-400"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {fabric.textureImageUrl && (
                <div className="mb-3 aspect-square overflow-hidden bg-obsidian-100">
                  <CldImage
                    src={fabric.textureImageUrl}
                    alt={fabric.name}
                    width={120}
                    height={120}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <p className="font-serif text-sm text-obsidian">{fabric.name}</p>
              <p className="font-sans text-xs text-obsidian-400 mt-0.5">{fabric.category}</p>
              {fabric.priceAdjust > 0 && (
                <p className="font-sans text-xs text-gold mt-1">
                  +₦{fabric.priceAdjust.toLocaleString()}
                </p>
              )}
              {selectedFabricId === fabric.id && (
                <motion.div
                  layoutId="fabric-indicator"
                  className="absolute top-2 right-2 h-2 w-2 rounded-full bg-gold"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Choose Colour */}
      <AnimatePresence>
        {selectedFabric && (
          <motion.div
            key="color-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <p className="font-sans text-xs tracking-widest uppercase text-gold mb-4">
              02 — Choose Colour
            </p>
            <div className="flex flex-wrap gap-3">
              {selectedFabric.colorOptions.map((hex) => (
                <button
                  key={hex}
                  onClick={() => selectColor(hex)}
                  title={hex}
                  style={{ backgroundColor: hex }}
                  className={`h-10 w-10 border-2 transition-all duration-150 ${
                    selectedColor === hex
                      ? "border-gold scale-110 shadow-md"
                      : "border-transparent hover:border-obsidian-300"
                  }`}
                  aria-label={`Select colour ${hex}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3 — Bespoke note */}
      <AnimatePresence>
        {selectedFabric && (
          <motion.div
            key="note-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="font-sans text-xs tracking-widest uppercase text-gold mb-4">
              03 — Bespoke Instructions (optional)
            </p>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                onSelectionChange({ fabricId: selectedFabricId, color: selectedColor, note: e.target.value });
              }}
              rows={3}
              placeholder="e.g. 'Please add gold-thread embroidery on the collar…'"
              className="w-full border border-obsidian-200 bg-transparent px-4 py-3
                         font-sans text-sm text-obsidian placeholder:text-obsidian-300
                         focus:outline-none focus:border-gold transition-colors resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
