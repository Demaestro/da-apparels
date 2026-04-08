import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";

export const metadata: Metadata = { title: "Collections" };

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; tag?: string };
}) {
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 sm:pb-24">
      {/* Header */}
      <div className="mb-8 sm:mb-12 border-b border-gold/20 pb-6 sm:pb-8">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-3">DA Apparels</p>
        <h1 className="font-display text-4xl sm:text-5xl text-obsidian">The Collection</h1>
      </div>

      <ProductGrid
        categorySlug={searchParams.category}
        search={searchParams.search}
        tag={searchParams.tag}
      />
    </div>
  );
}
