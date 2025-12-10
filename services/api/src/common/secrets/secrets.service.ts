import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Basic Secrets Management Service
 * 
 * For production, consider using:
 * - HashiCorp Vault
 * - AWS Secrets Manager
 * - Azure Key Vault
 * - Google Secret Manager
 * 
 * This is a basic implementation for development/testing.
 */
@Injectable()
export class SecretsService implements OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);
  private secrets: Map<string, { value: string; rotatedAt: Date }> = new Map();
  private readonly secretsFile = path.join(process.cwd(), '.secrets.json');

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.loadSecrets();
    this.logger.log('Secrets service initialized');
  }

  /**
   * Get a secret value
   */
  getSecret(key: string): string | null {
    const secret = this.secrets.get(key);
    if (!secret) {
      // Fallback to environment variables
      return this.configService.get<string>(key) || null;
    }
    return secret.value;
  }

  /**
   * Set a secret value
   */
  async setSecret(key: string, value: string): Promise<void> {
    this.secrets.set(key, {
      value,
      rotatedAt: new Date(),
    });
    await this.saveSecrets();
    this.logger.log(`Secret ${key} updated`);
  }

  /**
   * Rotate a secret (generate new value)
   */
  async rotateSecret(key: string, length: number = 32): Promise<string> {
    const newValue = crypto.randomBytes(length).toString('hex');
    await this.setSecret(key, newValue);
    this.logger.log(`Secret ${key} rotated`);
    return newValue;
  }

  /**
   * Check if secret needs rotation (older than specified days)
   */
  needsRotation(key: string, maxAgeDays: number = 90): boolean {
    const secret = this.secrets.get(key);
    if (!secret) {
      return false;
    }

    const ageDays = (Date.now() - secret.rotatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays > maxAgeDays;
  }

  /**
   * Get all secrets that need rotation
   */
  getSecretsNeedingRotation(maxAgeDays: number = 90): string[] {
    const keys: string[] = [];
    for (const [key] of this.secrets.entries()) {
      if (this.needsRotation(key, maxAgeDays)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private async loadSecrets() {
    try {
      if (fs.existsSync(this.secretsFile)) {
        const data = fs.readFileSync(this.secretsFile, 'utf8');
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
          this.secrets.set(key, {
            value: value as string,
            rotatedAt: new Date(), // Default to now if not stored
          });
        }
        this.logger.log(`Loaded ${this.secrets.size} secrets from file`);
      } else {
        // Initialize with default secrets from env
        await this.initializeDefaultSecrets();
      }
    } catch (error: any) {
      this.logger.error(`Failed to load secrets: ${error.message}`);
      await this.initializeDefaultSecrets();
    }
  }

  private async saveSecrets() {
    try {
      const data: Record<string, string> = {};
      for (const [key, secret] of this.secrets.entries()) {
        data[key] = secret.value;
      }
      fs.writeFileSync(this.secretsFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error: any) {
      this.logger.error(`Failed to save secrets: ${error.message}`);
    }
  }

  private async initializeDefaultSecrets() {
    // Initialize critical secrets from environment
    const criticalSecrets = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'PAYSTACK_SECRET_KEY',
      'PAYSTACK_WEBHOOK_SECRET',
    ];

    for (const key of criticalSecrets) {
      const value = this.configService.get<string>(key);
      if (value) {
        this.secrets.set(key, {
          value,
          rotatedAt: new Date(),
        });
      }
    }

    if (this.secrets.size > 0) {
      await this.saveSecrets();
      this.logger.log(`Initialized ${this.secrets.size} secrets from environment`);
    }
  }
}




