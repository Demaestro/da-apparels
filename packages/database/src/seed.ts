import { PrismaClient, ProductStatus, FabricCategory } from "@prisma/client";
import {
  LOOKBOOK_CATEGORIES,
  LOOKBOOK_PRODUCTS,
  type LookbookProductDefinition,
} from "@da-apparels/types";

const prisma = new PrismaClient();

function buildVariantRecords(product: LookbookProductDefinition, productId: string) {
  const sizes = product.sizes ?? ["S", "M", "L", "Custom"];

  return sizes.map((size, index) => ({
    id: `${product.slug}-variant-${size.toLowerCase()}`,
    productId,
    sku: `${product.slug.toUpperCase()}-${size}`,
    size,
    color: null,
    colorHex: null,
    stockQty: size === "Custom" ? 99 : Math.max(2, 8 - index),
    priceAdjust: size === "Custom" ? 10000 : 0,
  }));
}

function buildFabricRecords(product: LookbookProductDefinition, productId: string) {
  return [
    {
      id: `${product.slug}-fabric-satin`,
      productId,
      name: "Signature Satin",
      category: FabricCategory.SATIN,
      colorOptions: product.palette,
      textureImageUrl: null,
      priceAdjust: 0,
      inStock: true,
    },
    {
      id: `${product.slug}-fabric-lace`,
      productId,
      name: "Embellished Lace",
      category: FabricCategory.LACE,
      colorOptions: product.palette,
      textureImageUrl: null,
      priceAdjust: 12000,
      inStock: true,
    },
    {
      id: `${product.slug}-fabric-silk`,
      productId,
      name: "Silk Finish",
      category: FabricCategory.SILK,
      colorOptions: product.palette,
      textureImageUrl: null,
      priceAdjust: 18000,
      inStock: true,
    },
  ];
}

async function seedLookbookProduct(
  product: LookbookProductDefinition,
  categoryId: string,
) {
  const record = await prisma.product.upsert({
    where: { slug: product.slug },
    update: {
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      basePrice: product.basePrice,
      currency: "NGN",
      categoryId,
      isBespoke: true,
      hasArTryOn: product.hasArTryOn ?? true,
      status: ProductStatus.ACTIVE,
      metaTitle: `${product.name} | DA Apparels`,
      metaDescription: product.tagline,
    },
    create: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      basePrice: product.basePrice,
      currency: "NGN",
      categoryId,
      isBespoke: true,
      hasArTryOn: product.hasArTryOn ?? true,
      status: ProductStatus.ACTIVE,
      metaTitle: `${product.name} | DA Apparels`,
      metaDescription: product.tagline,
    },
  });

  const imageIds = product.images.map((_, index) => `${product.slug}-image-${index + 1}`);
  await prisma.productImage.deleteMany({
    where: { productId: record.id, id: { notIn: imageIds } },
  });

  await Promise.all(
    product.images.map((image, index) =>
      prisma.productImage.upsert({
        where: { id: `${product.slug}-image-${index + 1}` },
        update: {
          productId: record.id,
          cloudinaryId: `local:${product.slug}:${index + 1}`,
          url: image.url,
          altText: image.altText,
          width: 768,
          height: 1024,
          isPrimary: index === 0,
          sortOrder: index,
        },
        create: {
          id: `${product.slug}-image-${index + 1}`,
          productId: record.id,
          cloudinaryId: `local:${product.slug}:${index + 1}`,
          url: image.url,
          altText: image.altText,
          width: 768,
          height: 1024,
          isPrimary: index === 0,
          sortOrder: index,
        },
      }),
    ),
  );

  await Promise.all(
    buildVariantRecords(product, record.id).map((variant) =>
      prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: variant,
        create: variant,
      }),
    ),
  );

  await Promise.all(
    buildFabricRecords(product, record.id).map((fabric) =>
      prisma.fabricOption.upsert({
        where: { id: fabric.id },
        update: fabric,
        create: fabric,
      }),
    ),
  );

  await prisma.productTag.deleteMany({ where: { productId: record.id } });
  await prisma.productTag.createMany({
    data: ["lookbook", ...product.tags].map((tag) => ({
      id: `${product.slug}-tag-${tag.toLowerCase()}`,
      productId: record.id,
      tag,
    })),
  });
}

async function main() {
  const categories = new Map<string, string>();

  for (const category of LOOKBOOK_CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      },
    });

    categories.set(category.slug, record.id);
  }

  for (const product of LOOKBOOK_PRODUCTS) {
    const categoryId = categories.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Category ${product.categorySlug} was not seeded.`);
    }

    await seedLookbookProduct(product, categoryId);
  }

  console.log(`Seeded ${LOOKBOOK_PRODUCTS.length} lookbook products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
