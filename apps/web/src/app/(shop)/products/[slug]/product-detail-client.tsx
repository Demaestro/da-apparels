"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { motion, AnimatePresence } from "framer-motion";
import { FabricCustomizer } from "@/components/fabric/fabric-customizer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart.store";
import type { Product } from "@/lib/api/products";

interface FabricSelection {
  fabricId: string | null;
  color: string | null;
  note: string;
}

function formatPrice(amount: string, currency: string, adjust = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency === "NGN" ? "NGN" : currency,
    minimumFractionDigits: 0,
  }).format(Number(amount) + adjust);
}

export function ProductDetailClient({ product }: { product: Product }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const [fabricSelection, setFabricSelection] = useState<FabricSelection>({
    fabricId: null,
    color: null,
    note: "",
  });
  const [addedToCart, setAddedToCart] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const activeImage = product.images[activeImageIndex];
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  const fabricPriceAdjust =
    product.fabricOptions.find((f) => f.id === fabricSelection.fabricId)?.priceAdjust ?? 0;
  const variantPriceAdjust = selectedVariant?.priceAdjust ?? 0;
  const totalAdjust = fabricPriceAdjust + Number(variantPriceAdjust);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.images[0]?.url ?? "",
      variantId: selectedVariantId ?? undefined,
      variantLabel: selectedVariant?.size ?? selectedVariant?.color ?? undefined,
      fabricOptionId: fabricSelection.fabricId ?? undefined,
      fabricColor: fabricSelection.color ?? undefined,
      fabricNote: fabricSelection.note || undefined,
      quantity: 1,
      unitPrice: Number(product.basePrice) + totalAdjust,
      currency: product.currency,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

        {/* ── Left: Image gallery ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Main image */}
          <motion.div
            key={activeImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[3/4] overflow-hidden bg-obsidian-50"
          >
            {activeImage && (
              <CldImage
                src={activeImage.url}
                alt={activeImage.altText ?? product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}

            {/* AR Try-On badge */}
            {product.hasArTryOn && (
              <button className="absolute bottom-4 right-4 bg-obsidian/80 backdrop-blur-sm text-gold font-sans text-xs tracking-widest uppercase px-4 py-2 hover:bg-gold hover:text-obsidian transition-all duration-200">
                AR Try-On
              </button>
            )}
          </motion.div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`aspect-square overflow-hidden border-2 transition-all duration-150 ${
                    i === activeImageIndex ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <CldImage
                    src={img.url}
                    alt={img.altText ?? `View ${i + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Product info ─────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Category & name */}
          <div>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-2">
              {product.category.name}
              {product.isBespoke && " · Bespoke"}
            </p>
            <h1 className="font-display text-4xl lg:text-5xl text-obsidian leading-tight">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="font-serif italic text-obsidian-400 mt-2">{product.tagline}</p>
            )}
          </div>

          {/* Price */}
          <p className="font-sans text-2xl text-obsidian">
            {formatPrice(product.basePrice, product.currency, totalAdjust)}
            {totalAdjust > 0 && (
              <span className="text-sm text-gold ml-2">
                (includes fabric adjustment)
              </span>
            )}
          </p>

          {/* Description */}
          <p className="font-sans text-sm text-obsidian-500 leading-loose">{product.description}</p>

          <div className="divider-gold" />

          {/* Variant selector (size / colour) */}
          {product.variants.length > 0 && (
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-gold mb-3">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={v.stockQty === 0}
                    className={`min-w-[3rem] border px-3 py-2 font-sans text-xs transition-all duration-150
                      ${selectedVariantId === v.id
                        ? "border-obsidian bg-obsidian text-ivory"
                        : "border-obsidian-200 hover:border-obsidian text-obsidian"
                      }
                      disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {v.size ?? v.color ?? v.sku}
                    {v.stockQty === 0 && <span className="block text-[9px] text-error">Out of stock</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fabric customiser */}
          {product.fabricOptions.length > 0 && (
            <>
              <div className="divider-gold" />
              <FabricCustomizer
                fabricOptions={product.fabricOptions}
                onSelectionChange={setFabricSelection}
              />
            </>
          )}

          <div className="divider-gold" />

          {/* Add to cart */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {addedToCart ? (
                <motion.div
                  key="added"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center py-4 border border-gold text-gold font-sans text-xs tracking-widest uppercase"
                >
                  Added to cart
                </motion.div>
              ) : (
                <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button className="w-full" size="lg" onClick={handleAddToCart}>
                    Add to Cart
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {product.isBespoke && (
              <p className="font-sans text-xs text-obsidian-400 text-center">
                This is a made-to-measure piece. Ensure your measurements are saved in your vault.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
