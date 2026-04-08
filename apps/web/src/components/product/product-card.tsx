"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ProductSummary } from "@/lib/api/products";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart.store";

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency === "NGN" ? "NGN" : currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const primaryImage = product.images[0];
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  function handleQuickAdd() {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: primaryImage?.url ?? "",
      variantLabel: product.isBespoke ? "Custom" : undefined,
      quantity: 1,
      unitPrice: Number(product.basePrice),
      currency: product.currency,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        {/* Image */}
        <div className="relative overflow-hidden bg-obsidian-50 aspect-[3/4]">
          {primaryImage ? (
            <SmartImage
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              quality={84}
            />
          ) : (
            <div className="absolute inset-0 skeleton" />
          )}

          {/* Luxury badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isBespoke && (
              <span className="bg-obsidian text-gold font-sans text-[10px] tracking-widest uppercase px-2 py-1">
                Bespoke
              </span>
            )}
            {product.hasArTryOn && (
              <span className="bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2 py-1">
                AR Try-On
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 space-y-1">
          <p className="font-sans text-[10px] tracking-widest uppercase text-gold">
            {product.category.name}
          </p>
          <h3 className="font-serif text-base text-obsidian leading-snug group-hover:text-gold transition-colors duration-200">
            {product.name}
          </h3>
          {product.tagline && (
            <p className="font-sans text-xs text-obsidian-400 line-clamp-1">{product.tagline}</p>
          )}
          <p className="font-sans text-sm text-obsidian font-medium mt-1">
            {formatPrice(product.basePrice, product.currency)}
          </p>
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href={`/products/${product.slug}`} className="btn-ghost w-full text-center">
          View Piece
        </Link>
        <Button
          type="button"
          variant={added ? "gold" : "primary"}
          size="sm"
          className="w-full"
          onClick={handleQuickAdd}
        >
          {added ? "Added" : "Add to Cart"}
        </Button>
      </div>
    </motion.article>
  );
}
