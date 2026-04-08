import { api } from "./client";

export interface ProductImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface FabricOptionUI {
  id: string;
  name: string;
  category: string;
  colorOptions: string[];
  textureImageUrl?: string;
  priceAdjust: number;
  inStock: boolean;
}

export interface ProductVariantUI {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stockQty: number;
  priceAdjust: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  basePrice: string; // Prisma Decimal serialises to string
  currency: string;
  isBespoke: boolean;
  hasArTryOn: boolean;
  images: ProductImage[];
  variants: ProductVariantUI[];
  fabricOptions: FabricOptionUI[];
  category: { name: string; slug: string };
  tags: { tag: string }[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  basePrice: string;
  currency: string;
  isBespoke: boolean;
  hasArTryOn: boolean;
  images: Pick<ProductImage, "url" | "altText" | "width" | "height">[];
  category: { name: string; slug: string };
  tags: { tag: string }[];
}

export async function fetchProducts(params: Record<string, string | number>) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return api.get<{ products: ProductSummary[]; meta: { total: number; totalPages: number; page: number; limit: number } }>(
    `/products${qs ? `?${qs}` : ""}`,
    { skipAuth: true },
  );
}

export async function fetchProduct(slug: string) {
  return api.get<Product>(`/products/${slug}`, { skipAuth: true });
}

export async function fetchRecommended() {
  return api.get<ProductSummary[]>("/products/recommended");
}
