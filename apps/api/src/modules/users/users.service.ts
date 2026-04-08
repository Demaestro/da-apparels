import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../lib/prisma.service";
import { EncryptionService } from "../../lib/encryption.service";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { UpsertMeasurementsDto } from "./dto/upsert-measurements.dto";
import type { BodyMeasurements } from "@da-apparels/types";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  // ── Profile ─────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.ensureUserExists(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
  }

  // ── Measurements (User Vault) ────────────────────────────────────────────────

  async getMeasurements(userId: string): Promise<BodyMeasurements> {
    const record = await this.prisma.measurement.findUnique({ where: { userId } });
    if (!record) throw new NotFoundException("No measurements saved yet.");

    const plaintext = this.encryption.decrypt(
      record.encryptedData,
      record.iv,
      record.authTag,
    );
    return JSON.parse(plaintext) as BodyMeasurements;
  }

  async upsertMeasurements(userId: string, dto: UpsertMeasurementsDto) {
    await this.ensureUserExists(userId);

    const plaintext = JSON.stringify(dto satisfies BodyMeasurements);
    const { encryptedData, iv, authTag } = this.encryption.encrypt(plaintext);

    return this.prisma.measurement.upsert({
      where: { userId },
      create: { userId, encryptedData, iv, authTag },
      update: { encryptedData, iv, authTag },
      select: { updatedAt: true }, // never return encrypted blob to client
    });
  }

  // ── Orders (own history) ─────────────────────────────────────────────────────

  async getMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          items: { select: { productName: true, quantity: true } },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async ensureUserExists(userId: string) {
    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("User not found.");
  }
}
