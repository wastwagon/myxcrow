import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;
  private readonly pbkdf2Iterations = 100000;

  constructor(private configService: ConfigService) {}

  private getEncryptionKey(): string {
    const key = this.configService.get<string>('ENCRYPTION_KEY') || this.configService.get<string>('JWT_SECRET') || 'default-key-change-in-production';
    if (key === 'default-key-change-in-production') {
      this.logger.warn('Using default encryption key! Set ENCRYPTION_KEY in production!');
    }
    return key;
  }

  /**
   * Encrypt sensitive PII data
   */
  encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);

      const derivedKey = crypto.pbkdf2Sync(
        key,
        salt,
        this.pbkdf2Iterations,
        this.keyLength,
        'sha512',
      );

      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      const result = Buffer.concat([
        salt,
        iv,
        tag,
        encrypted,
      ]).toString('hex');

      return `enc:${result}`;
    } catch (error: any) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive PII data
   */
  decrypt(encryptedData: string): string {
    try {
      if (!encryptedData.startsWith('enc:')) {
        // Legacy unencrypted data
        return encryptedData;
      }

      const key = this.getEncryptionKey();
      const buffer = Buffer.from(encryptedData.substring(4), 'hex');

      const salt = buffer.slice(0, this.saltLength);
      const iv = buffer.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = buffer.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength,
      );
      const encrypted = buffer.slice(this.saltLength + this.ivLength + this.tagLength);

      const derivedKey = crypto.pbkdf2Sync(
        key,
        salt,
        this.pbkdf2Iterations,
        this.keyLength,
        'sha512',
      );

      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');

      return decrypted;
    } catch (error: any) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Check if data is encrypted
   */
  isEncrypted(data: string): boolean {
    return data.startsWith('enc:');
  }
}




