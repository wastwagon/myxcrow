import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';

function parseS3Endpoint(endpoint: string) {
  let endPoint = endpoint;
  let port = 9000;
  let useSSL = false;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    const url = new URL(endpoint);
    endPoint = url.hostname;
    useSSL = url.protocol === 'https:';
    port = parseInt(url.port || (useSSL ? '443' : '80'), 10);
  } else {
    endPoint = endpoint.replace(/^https?:\/\//, '').split(':')[0];
    const portMatch = endpoint.match(/:(\d+)/);
    if (portMatch) port = parseInt(portMatch[1], 10);
  }
  return { endPoint, port, useSSL };
}

@Injectable()
export class ChatStorageService {
  private readonly logger = new Logger(ChatStorageService.name);
  private client: MinIO.Client | null = null;
  private bucketName = 'evidence';
  private configured = false;

  constructor(private configService: ConfigService) {
    const endpoint =
      this.configService.get<string>('S3_ENDPOINT') ||
      this.configService.get<string>('MINIO_ENDPOINT');
    if (!endpoint) return;

    const accessKey =
      this.configService.get<string>('S3_ACCESS_KEY') ||
      this.configService.get<string>('MINIO_ACCESS_KEY') ||
      'minioadmin';
    const secretKey =
      this.configService.get<string>('S3_SECRET_KEY') ||
      this.configService.get<string>('MINIO_SECRET_KEY') ||
      'minioadmin';

    const internal = parseS3Endpoint(endpoint);
    this.client = new MinIO.Client({ ...internal, accessKey, secretKey });
    this.bucketName =
      this.configService.get<string>('S3_BUCKET') ||
      this.configService.get<string>('MINIO_BUCKET') ||
      'evidence';
    this.configured = true;
  }

  isReady() {
    return this.configured && !!this.client;
  }

  async putObject(objectName: string, buffer: Buffer, mimeType: string) {
    if (!this.client) {
      throw new ServiceUnavailableException('File storage is not configured');
    }
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error: any) {
      this.logger.warn(`Chat storage bucket check failed: ${error?.message}`);
    }
    await this.client.putObject(this.bucketName, objectName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async getObject(objectName: string) {
    if (!this.client) {
      throw new ServiceUnavailableException('File storage is not configured');
    }
    return this.client.getObject(this.bucketName, objectName);
  }

  async getUrl(objectName: string, expiresIn = 3600) {
    if (!this.client) {
      throw new ServiceUnavailableException('File storage is not configured');
    }
    return this.client.presignedGetObject(this.bucketName, objectName, expiresIn);
  }
}
