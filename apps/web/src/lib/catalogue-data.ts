import {
  LOOKBOOK_CATEGORIES,
  LOOKBOOK_PRODUCTS,
  type LookbookProductDefinition,
} from "@/lib/lookbook";
import type { Product, ProductImage, ProductSummary } from "./api/products";

const IMAGE_WIDTH = 768;
const IMAGE_HEIGHT = 1024;

const categoryMap = new Map(
  LOOKBOOK_CATEGORIES.map((category) => [category.slug, { name: category.name, slug: category.slug }]),
);

function image(url: string, altText: string, isPrimary = false): ProductImage {
  return {
    url,
    altText,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    isPrimary,
  };
}

function buildVariants(slug: string, sizes = ["S", "M", "L", "Custom"]) {
  return sizes.map((size, index) => ({
    id: `${slug}-variant-${size.toLowerCase()}`,
    sku: `${slug.toUpperCase()}-${size}`,
    size,
    color: null,
    colorHex: null,
    stockQty: size === "Custom" ? 99 : 8 - index,
    priceAdjust: size === "Custom" ? 10000 : 0,
  }));
}

function buildFabricOptions(slug: string, palette: string[]) {
  return [
    {
      id: `${slug}-fabric-satin`,
      name: "Signature Satin",
      category: "SATIN",
      colorOptions: palette,
      textureImageUrl: undefined,
      priceAdjust: 0,
      inStock: true,
    },
    {
      id: `${slug}-fabric-lace`,
      name: "Embellished Lace",
      category: "LACE",
      colorOptions: palette,
      textureImageUrl: undefined,
      priceAdjust: 12000,
      inStock: true,
    },
    {
      id: `${slug}-fabric-silk`,
      name: "Silk Finish",
      category: "SILK",
      colorOptions: palette,
      textureImageUrl: undefined,
      priceAdjust: 18000,
      inStock: true,
    },
  ];
}

function toCatalogueProduct(input: LookbookProductDefinition): Product {
  const category = categoryMap.get(input.categorySlug);

  if (!category) {
    throw new Error(`Unknown lookbook category: ${input.categorySlug}`);
  }

  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    basePrice: String(input.basePrice),
    currency: "NGN",
    isBespoke: true,
    hasArTryOn: input.hasArTryOn ?? true,
    images: input.images.map((item, index) => image(item.url, item.altText, index === 0)),
    variants: buildVariants(input.slug, input.sizes),
    fabricOptions: buildFabricOptions(input.slug, input.palette),
    category,
    tags: [{ tag: "lookbook" }, ...input.tags.map((tag) => ({ tag }))],
    metaTitle: `${input.name} | DA Apparels`,
    metaDescription: input.tagline,
  };
}

export const LOCAL_CATALOGUE: Product[] = LOOKBOOK_PRODUCTS.map(toCatalogueProduct);

export function getFeaturedCatalogueProducts() {
  return LOCAL_CATALOGUE.slice(0, 8);
}

export function getArPreviewProducts() {
  return LOCAL_CATALOGUE.filter((product) => product.hasArTryOn);
}

export function getCatalogueProduct(slug: string) {
  return LOCAL_CATALOGUE.find((product) => product.slug === slug) ?? null;
}

export function filterCatalogueProducts(filters: {
  categorySlug?: string;
  search?: string;
  tag?: string;
}) {
  const search = filters.search?.trim().toLowerCase();
  const tag = filters.tag?.trim().toLowerCase();

  return LOCAL_CATALOGUE.filter((product) => {
    if (filters.categorySlug && product.category.slug !== filters.categorySlug) {
      return false;
    }

    if (tag && !product.tags.some((item) => item.tag.toLowerCase() === tag)) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      product.name,
      product.tagline ?? "",
      product.description,
      product.category.name,
      ...product.tags.map((item) => item.tag),
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

export function toProductSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    basePrice: product.basePrice,
    currency: product.currency,
    isBespoke: product.isBespoke,
    hasArTryOn: product.hasArTryOn,
    images: product.images.map(({ url, altText, width, height }) => ({
      url,
      altText,
      width,
      height,
    })),
    category: product.category,
    tags: product.tags,
  };
}

export function getCatalogueSummaries(filters: {
  categorySlug?: string;
  search?: string;
  tag?: string;
}) {
  return filterCatalogueProducts(filters).map(toProductSummary);
}

export function isLookbookProduct(product: Pick<Product, "id" | "tags">) {
  return product.id.startsWith("lookbook-") || product.tags.some((item) => item.tag === "lookbook");
}
