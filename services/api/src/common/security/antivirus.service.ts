import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Antivirus Scanning Service
 * 
 * This is a basic implementation. For production, consider:
 * - ClamAV integration
 * - Cloud-based scanning (AWS Macie, Google Cloud Security Scanner)
 * - VirusTotal API
 * - Custom ML-based detection
 * 
 * Current implementation:
 * - File type validation
 * - Size limits
 * - Basic malicious pattern detection
 */
@Injectable()
export class AntivirusService {
  private readonly logger = new Logger(AntivirusService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly blockedExtensions: string[];

  constructor(private configService: ConfigService) {
    this.maxFileSize = parseInt(
      this.configService.get<string>('MAX_FILE_SIZE_BYTES') || '10485760', // 10MB default
      10,
    );

    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    this.blockedExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.app',
      '.deb',
      '.pkg',
      '.dmg',
    ];
  }

  /**
   * Scan file buffer for malicious content
   */
  async scanFile(
    buffer: Buffer,
    filename: string,
    mimeType?: string,
  ): Promise<{ safe: boolean; reason?: string; details?: any }> {
    try {
      // 1. Check file size
      if (buffer.length > this.maxFileSize) {
        return {
          safe: false,
          reason: `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
        };
      }

      // 2. Check file extension
      const extension = this.getFileExtension(filename);
      if (this.blockedExtensions.includes(extension.toLowerCase())) {
        return {
          safe: false,
          reason: `File extension ${extension} is not allowed`,
        };
      }

      // 3. Check MIME type if provided
      if (mimeType && !this.allowedMimeTypes.includes(mimeType)) {
        return {
          safe: false,
          reason: `MIME type ${mimeType} is not allowed`,
        };
      }

      // 4. Basic pattern detection (very basic - production should use proper AV)
      const suspiciousPatterns = this.detectSuspiciousPatterns(buffer);
      if (suspiciousPatterns.length > 0) {
        return {
          safe: false,
          reason: 'Suspicious patterns detected in file',
          details: { patterns: suspiciousPatterns },
        };
      }

      // 5. Check for executable signatures
      const hasExecutableSignature = this.hasExecutableSignature(buffer);
      if (hasExecutableSignature) {
        return {
          safe: false,
          reason: 'File appears to be an executable',
        };
      }

      return { safe: true };
    } catch (error: any) {
      this.logger.error(`Antivirus scan failed: ${error.message}`);
      // Fail safe: reject if scan fails
      return {
        safe: false,
        reason: `Scan failed: ${error.message}`,
      };
    }
  }

  /**
   * Scan file from path
   */
  async scanFileFromPath(filePath: string, filename: string): Promise<{ safe: boolean; reason?: string }> {
    try {
      const buffer = fs.readFileSync(filePath);
      return this.scanFile(buffer, filename);
    } catch (error: any) {
      this.logger.error(`Failed to read file for scanning: ${error.message}`);
      return {
        safe: false,
        reason: `Failed to read file: ${error.message}`,
      };
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot) : '';
  }

  /**
   * Detect suspicious patterns in file content
   * This is a very basic implementation - production should use proper AV
   */
  private detectSuspiciousPatterns(buffer: Buffer): string[] {
    const patterns: string[] = [];
    const content = buffer.toString('binary', 0, Math.min(buffer.length, 1024)); // Check first 1KB

    // Check for common script injection patterns
    const suspiciousStrings = [
      '<script',
      'javascript:',
      'onerror=',
      'onload=',
      'eval(',
      'exec(',
      'system(',
      'shell_exec',
    ];

    for (const pattern of suspiciousStrings) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Check if file has executable signature
   */
  private hasExecutableSignature(buffer: Buffer): boolean {
    if (buffer.length < 2) {
      return false;
    }

    // Check for common executable signatures
    const signatures = [
      Buffer.from([0x4d, 0x5a]), // MZ (Windows PE)
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF (Linux)
      Buffer.from([0xca, 0xfe, 0xba, 0xbe]), // Java class file
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP (could be JAR)
    ];

    for (const sig of signatures) {
      if (buffer.subarray(0, sig.length).equals(sig)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate file hash for integrity checking
   */
  calculateFileHash(buffer: Buffer, algorithm: 'md5' | 'sha256' = 'sha256'): string {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }
}




