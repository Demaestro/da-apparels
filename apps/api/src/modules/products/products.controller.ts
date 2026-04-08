import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

type AuthRequest = { user: { id: string } };

@Controller("products")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private products: ProductsService) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  @Public()
  @Get()
  async list(@Query() dto: ListProductsDto) {
    const result = await this.products.list(dto);
    return { success: true, ...result };
  }

  @Public()
  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    return { success: true, data: await this.products.findBySlug(slug) };
  }

  // ── Authenticated ──────────────────────────────────────────────────────────

  @Get("recommended")
  async recommended(@Req() req: AuthRequest) {
    return { success: true, data: await this.products.getRecommended(req.user.id) };
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles("ADMIN", "SUPER_ADMIN")
  async create(@Body() dto: CreateProductDto) {
    return { success: true, data: await this.products.create(dto) };
  }

  @Post(":id/images")
  @Roles("ADMIN", "SUPER_ADMIN")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body("altText") altText?: string,
  ) {
    return { success: true, data: await this.products.addImage(id, file, altText) };
  }

  @Delete(":id/images/:imageId")
  @Roles("ADMIN", "SUPER_ADMIN")
  async removeImage(@Param("id") id: string, @Param("imageId") imageId: string) {
    await this.products.removeImage(id, imageId);
    return { success: true, message: "Image removed." };
  }
}
