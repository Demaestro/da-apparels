import { Injectable, NotFoundException, ConflictException, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PrismaService } from "../../lib/prisma.service";
import { CloudinaryService } from "./cloudinary.service";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { ListProductsDto } from "./dto/list-products.dto";
import { ProductStatus } from "@prisma/client";

const PRODUCT_CACHE_TTL = 5 * 60 * 1000; // 5 min
const PRODUCT_DETAIL_SELECT = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  basePrice: true,
  currency: true,
  status: true,
  isBespoke: true,
  hasArTryOn: true,
  metaTitle: true,
  metaDescription: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, altText: true, width: true, height: true, isPrimary: true },
  },
  variants: {
    select: { id: true, sku: true, size: true, color: true, colorHex: true, stockQty: true, priceAdjust: true },
  },
  fabricOptions: {
    where: { inStock: true },
    select: { id: true, name: true, category: true, colorOptions: true, textureImageUrl: true, priceAdjust: true, inStock: true },
  },
  tags: { select: { tag: true } },
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // ── Public: list products ────────────────────────────────────────────────────

  async list(dto: ListProductsDto) {
    const cacheKey = `products:list:${JSON.stringify(dto)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = { status: ProductStatus.ACTIVE };
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: "insensitive" } },
        { description: { contains: dto.search, mode: "insensitive" } },
      ];
    }
    if (dto.categorySlug) {
      where.category = { slug: dto.categorySlug };
    }
    if (dto.tag) {
      where.tags = { some: { tag: dto.tag } };
    }
    if (dto.status) where.status = dto.status;

    const skip = (dto.page - 1) * dto.limit;
    const orderBy = { [dto.sortBy ?? "createdAt"]: dto.sortOrder ?? "desc" };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: dto.limit,
        orderBy,
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          basePrice: true,
          currency: true,
          isBespoke: true,
          hasArTryOn: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, altText: true, width: true, height: true },
          },
          category: { select: { name: true, slug: true } },
          tags: { select: { tag: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      products,
      meta: { total, page: dto.page, limit: dto.limit, totalPages: Math.ceil(total / dto.limit) },
    };

    await this.cache.set(cacheKey, result, PRODUCT_CACHE_TTL);
    return result;
  }

  // ── Public: single product ───────────────────────────────────────────────────

  async findBySlug(slug: string) {
    const cacheKey = `products:detail:${slug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: PRODUCT_DETAIL_SELECT,
    });

    if (!product || product.status === ProductStatus.ARCHIVED) {
      throw new NotFoundException(`Product "${slug}" not found.`);
    }

    await this.cache.set(cacheKey, product, PRODUCT_CACHE_TTL);
    return product;
  }

  // ── Style-quiz-based recommendations ───────────────────────────────────────

  async getRecommended(userId: string) {
    const quiz = await this.prisma.styleQuizResult.findUnique({
      where: { userId },
    });

    if (!quiz) {
      // Fall back to latest collection
      return this.prisma.product.findMany({
        where: { status: ProductStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, slug: true, name: true, basePrice: true, currency: true, images: { take: 1 } },
      });
    }

    // Match products by tags aligned with quiz preferred styles
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        tags: { some: { tag: { in: quiz.preferredStyles } } },
      },
      orderBy: { createdAt: "desc" },
      take: 16,
      select: { id: true, slug: true, name: true, basePrice: true, currency: true, images: { take: 1 } },
    });
  }

  // ── Admin: create ────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug "${dto.slug}" is already in use.`);

    return this.prisma.product.create({
      data: {
        ...dto,
        basePrice: dto.basePrice,
      },
      select: { id: true, slug: true, name: true, status: true },
    });
  }

  // ── Admin: upload image to Cloudinary ───────────────────────────────────────

  async addImage(productId: string, file: Express.Multer.File, altText?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, _count: { select: { images: true } } },
    });
    if (!product) throw new NotFoundException("Product not found.");

    const uploaded = await this.cloudinary.uploadProductImage(productId, file.buffer, file.mimetype);

    const image = await this.prisma.productImage.create({
      data: {
        productId,
        cloudinaryId: uploaded.public_id,
        url: uploaded.secure_url,
        altText: altText ?? "",
        width: uploaded.width,
        height: uploaded.height,
        isPrimary: product._count.images === 0, // first image is primary
        sortOrder: product._count.images,
      },
    });

    // Invalidate cache
    await this.cache.del(`products:detail:${productId}`);
    return image;
  }

  async removeImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException("Image not found.");

    await this.cloudinary.deleteImage(image.cloudinaryId);
    await this.prisma.productImage.delete({ where: { id: imageId } });
    await this.cache.del(`products:detail:${productId}`);
  }
}
