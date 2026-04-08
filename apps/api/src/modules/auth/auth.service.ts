import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../../lib/prisma.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { JwtPayload } from "@da-apparels/types";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── Registration ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("An account with this email already exists.");

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      include: { profile: true },
    });

    this.logger.log(`New user registered: ${user.id}`);
    // TODO: enqueue email verification job via BullMQ

    return this.buildTokenPair(user.id, user.email, user.role);
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, role: true, passwordHash: true, isActive: true },
    });

    if (!user || !user.passwordHash) {
      // Constant-time comparison to prevent timing attacks
      await bcrypt.compare(dto.password, "$2b$12$invalidhashtopreventtimingattack");
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.isActive) throw new UnauthorizedException("This account has been deactivated.");

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException("Invalid email or password.");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.buildTokenPair(user.id, user.email, user.role);

    // Persist refresh session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return tokens;
  }

  // ── Refresh ─────────────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { token: rawRefreshToken },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException("Refresh token expired or invalid.");
    }

    if (!session.user.isActive) throw new UnauthorizedException("Account deactivated.");

    // Rotate — delete old session, create new one
    const newTokens = await this.buildTokenPair(
      session.user.id,
      session.user.email,
      session.user.role,
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return newTokens;
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.session.deleteMany({ where: { token: refreshToken } });
    } else {
      // Logout all sessions for this user
      await this.prisma.session.deleteMany({ where: { userId } });
    }
  }

  // ── Password Reset ───────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    // Store hashed token with 1-hour expiry — use a dedicated table in production
    // For now, stored in a short-lived Redis key (TODO: implement Redis token store)
    this.logger.log(`Password reset requested for: ${user.id}`);
    // TODO: enqueue email-queue job with resetToken
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: validate token from Redis, get userId, then:
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    // await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // await this.prisma.session.deleteMany({ where: { userId } }); // force re-login
    throw new BadRequestException("Password reset flow — Redis token store not yet wired.");
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async buildTokenPair(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow("JWT_SECRET"),
        expiresIn: this.config.get("JWT_EXPIRES_IN", "15m"),
      }),
      crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex"),
    ]);

    return { accessToken, refreshToken };
  }
}
