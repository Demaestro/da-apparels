import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.getOrThrow("CLOUDINARY_CLOUD_NAME"),
      api_key: this.config.getOrThrow("CLOUDINARY_API_KEY"),
      api_secret: this.config.getOrThrow("CLOUDINARY_API_SECRET"),
      secure: true,
    });
  }

  async uploadProductImage(
    productId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `da-apparels/products/${productId}`,
          // Auto-generate WebP + AVIF for modern browsers
          format: "auto",
          quality: "auto:best",
          // Luxury imagery — preserve full detail
          transformation: [{ width: 2000, height: 2667, crop: "limit" }],
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error("Cloudinary upload failed", error);
            reject(new InternalServerErrorException("Image upload failed."));
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadFabricSwatch(fabricId: string, buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `da-apparels/swatches`,
          public_id: fabricId,
          format: "webp",
          quality: "auto",
          transformation: [{ width: 400, height: 400, crop: "fill" }],
        },
        (error, result) => {
          if (error || !result) reject(new InternalServerErrorException("Swatch upload failed."));
          else resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      this.logger.error(`Failed to delete Cloudinary asset: ${publicId}`, err);
    }
  }

  /**
   * Build an optimised Cloudinary URL for a given public_id.
   * Use this for generating responsive srcsets.
   */
  buildUrl(publicId: string, width: number, height?: number): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: "fill",
      gravity: "auto",
      format: "auto",
      quality: "auto",
      secure: true,
    });
  }
}
