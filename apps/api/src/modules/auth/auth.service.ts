import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../../lib/prisma.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { JwtPayload } from "@da-apparels/types";
import { EMAIL_QUEUE, type EmailJob } from "../../workers/email.worker";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;
const RESET_PASSWORD_TOKEN_TTL = "1h";
const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZag4A9hZ0pniS3pSkeCZMt2rtI8xu";

type PasswordResetJwtPayload = JwtPayload & {
  type?: string;
  passwordFingerprint?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue<EmailJob>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists.");
    }

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
    return this.buildTokenPair(user.id, user.email, user.role);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, role: true, passwordHash: true, isActive: true },
    });

    if (!user || !user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("This account has been deactivated.");
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.buildTokenPair(user.id, user.email, user.role);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async refresh(rawRefreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { token: rawRefreshToken },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedException("Refresh token expired or invalid.");
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException("Account deactivated.");
    }

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

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.session.deleteMany({ where: { token: refreshToken } });
      return;
    }

    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        profile: { select: { firstName: true } },
      },
    });

    if (!user || !user.passwordHash) {
      return;
    }

    const resetToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "password-reset",
        passwordFingerprint: this.buildPasswordFingerprint(user.passwordHash),
      },
      {
        secret: this.config.getOrThrow("JWT_SECRET"),
        expiresIn: RESET_PASSWORD_TOKEN_TTL,
      },
    );

    await this.emailQueue.add(
      {
        type: "PASSWORD_RESET",
        to: user.email,
        firstName: user.profile?.firstName ?? undefined,
        resetUrl: this.buildPasswordResetUrl(resetToken),
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Password reset requested for: ${user.id}`);
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: PasswordResetJwtPayload;

    try {
      payload = await this.jwt.verifyAsync<PasswordResetJwtPayload>(token, {
        secret: this.config.getOrThrow("JWT_SECRET"),
      });
    } catch {
      throw new BadRequestException("Reset link is invalid or has expired.");
    }

    if (!payload.sub || payload.type !== "password-reset") {
      throw new BadRequestException("Reset link is invalid or has expired.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, passwordHash: true },
    });

    if (
      !user ||
      !user.isActive ||
      !user.passwordHash ||
      payload.passwordFingerprint !== this.buildPasswordFingerprint(user.passwordHash)
    ) {
      throw new BadRequestException("Reset link is invalid or has expired.");
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    await this.prisma.session.deleteMany({ where: { userId: payload.sub } });
  }

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

  private buildPasswordResetUrl(token: string) {
    const appUrl = this.config.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
    return `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
  }

  private buildPasswordFingerprint(passwordHash: string) {
    return crypto.createHash("sha256").update(passwordHash).digest("hex");
  }
}
