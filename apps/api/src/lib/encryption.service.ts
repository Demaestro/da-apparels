import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * AES-256-GCM encryption service for the User Vault (body measurements).
 * The 32-byte key is loaded from ENCRYPTION_KEY env var (hex-encoded).
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const hex = this.config.getOrThrow<string>("ENCRYPTION_KEY");
    if (hex.length !== 64) {
      throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).");
    }
    this.key = Buffer.from(hex, "hex");
  }

  encrypt(plaintext: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    return {
      encryptedData: encrypted.toString("hex"),
      iv: iv.toString("hex"),
      authTag: cipher.getAuthTag().toString("hex"),
    };
  }

  decrypt(encryptedData: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }
}
