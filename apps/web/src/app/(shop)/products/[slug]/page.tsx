import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProduct } from "@/lib/api/products";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const res = await fetchProduct(params.slug);
  if (!res.success || !res.data) return { title: "Product Not Found" };
  return {
    title: res.data.metaTitle ?? res.data.name,
    description: res.data.metaDescription ?? res.data.tagline ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const res = await fetchProduct(params.slug);
  if (!res.success || !res.data) notFound();

  return <ProductDetailClient product={res.data} />;
}
