"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./product-card";
import { fetchProducts } from "@/lib/api/products";

interface ProductGridProps {
  categorySlug?: string;
  search?: string;
  tag?: string;
}

export function ProductGrid({ categorySlug, search, tag }: ProductGridProps) {
  const params: Record<string, string> = {};
  if (categorySlug) params.categorySlug = categorySlug;
  if (search) params.search = search;
  if (tag) params.tag = tag;

  const { data, isLoading } = useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] skeleton" />
        ))}
      </div>
    );
  }

  const products = data?.data?.products ?? [];

  if (!products.length) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-2xl text-obsidian-400">No pieces found.</p>
        <p className="font-sans text-sm text-obsidian-300 mt-2">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
