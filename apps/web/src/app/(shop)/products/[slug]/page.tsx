import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProduct } from "@/lib/api/products";
import { getCatalogueProduct } from "@/lib/catalogue-data";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: { slug: string };
}

const getProduct = cache(async (slug: string) => {
  const res = await fetchProduct(slug);
  if (res.success && res.data) {
    return res.data;
  }

  return getCatalogueProduct(slug);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.tagline ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
