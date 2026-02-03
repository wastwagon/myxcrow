import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';

// Optional dependencies - loaded dynamically
let faceapi: any;
let Canvas: any;
let Image: any;
let ImageData: any;
let loadImage: any;

try {
  faceapi = require('face-api.js');
  const canvasModule = require('canvas');
  Canvas = canvasModule.Canvas;
  Image = canvasModule.Image;
  ImageData = canvasModule.ImageData;
  loadImage = canvasModule.loadImage;
} catch (error) {
  // Dependencies not available - face matching will be disabled
  console.warn('face-api.js or canvas not available, face matching will be disabled');
}

@Injectable()
export class FaceMatchingService {
  private readonly logger = new Logger(FaceMatchingService.name);
  private modelsLoaded = false;
  private readonly modelsPath = path.join(__dirname, '../../../models');

  /**
   * Load face-api.js models (only once)
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      return;
    }

    if (!faceapi || !Canvas) {
      throw new BadRequestException('Face matching service is not available. Required dependencies are missing.');
    }

    try {
      this.logger.log('Loading face-api.js models...');

      // Set up canvas environment for face-api.js
      faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

      // Check if models directory exists
      const fs = require('fs');
      if (!fs.existsSync(this.modelsPath)) {
        this.logger.warn(`Models directory not found: ${this.modelsPath}`);
        this.logger.warn('Please run: npm run download-face-models');
        throw new Error('Face recognition models not found. Please download models first.');
      }

      // Load models
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath);

      this.modelsLoaded = true;
      this.logger.log('Face-api.js models loaded successfully');
    } catch (error: any) {
      this.logger.error('Failed to load face-api.js models:', error.message);
      if (error.message.includes('not found')) {
        throw new Error('Face recognition models not found. Please run: npm run download-face-models');
      }
      throw new Error('Face recognition models not available. Please ensure models are installed.');
    }
  }

  /**
   * Extract face descriptor from image buffer
   */
  private async extractFaceDescriptor(imageBuffer: Buffer): Promise<Float32Array> {
    if (!faceapi || !loadImage || !Canvas) {
      throw new BadRequestException('Face matching service is not available. Required dependencies are missing.');
    }

    try {
      // Load image
      const img = await loadImage(imageBuffer);
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Detect face
      const detection = await faceapi
        .detectSingleFace(canvas as any)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new BadRequestException('No face detected in image. Please ensure your face is clearly visible.');
      }

      return detection.descriptor;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error extracting face descriptor:', error);
      throw new BadRequestException('Failed to process image. Please ensure it is a valid image file.');
    }
  }

  /**
   * Compare two faces and return similarity score
   * @param cardImageBuffer Ghana Card image buffer
   * @param selfieImageBuffer Selfie image buffer
   * @returns Similarity score (0-1, where 1 = identical) and pass status
   */
  async compareFaces(
    cardImageBuffer: Buffer,
    selfieImageBuffer: Buffer,
  ): Promise<{ score: number; passed: boolean; threshold: number }> {
    // Ensure models are loaded
    await this.loadModels();

    try {
      this.logger.log('Extracting faces from images...');

      // Extract face descriptors
      const cardFace = await this.extractFaceDescriptor(cardImageBuffer);
      const selfieFace = await this.extractFaceDescriptor(selfieImageBuffer);

      // Calculate Euclidean distance (lower = more similar)
      const distance = faceapi.euclideanDistance(cardFace, selfieFace);

      // Convert to similarity score (0-1, higher = more similar)
      // Using formula: similarity = 1 / (1 + distance)
      // This gives us a score where:
      // - distance 0.0 = similarity 1.0 (identical)
      // - distance 0.6 = similarity 0.625 (very similar)
      // - distance 1.0 = similarity 0.5 (moderately similar)
      const similarity = 1 / (1 + distance);

      // Round to 2 decimal places
      const score = Math.round(similarity * 100) / 100;

      // Threshold: 0.60 = 60% similarity required
      const threshold = 0.6;
      const passed = score >= threshold;

      this.logger.log(`Face match result: ${(score * 100).toFixed(1)}% similarity (threshold: ${(threshold * 100).toFixed(0)}%)`);

      return {
        score,
        passed,
        threshold,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error comparing faces:', error);
      throw new BadRequestException('Failed to compare faces. Please try again with clearer images.');
    }
  }

  /**
   * Validate image quality and perform basic anti-spoofing checks
   */
  async validateImage(imageBuffer: Buffer, fieldName: string): Promise<void> {
    if (!loadImage || !faceapi) {
      // If face matching is not available, just do basic validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxSize) {
        throw new BadRequestException(`${fieldName} file too large. Maximum 5MB allowed.`);
      }
      return; // Skip face detection if dependencies not available
    }

    try {
      const img = await loadImage(imageBuffer);

      // Check minimum resolution (higher resolution = harder to spoof)
      const minResolution = fieldName.toLowerCase().includes('selfie') ? 480 : 400;
      if (img.width < minResolution || img.height < minResolution) {
        throw new BadRequestException(
          `${fieldName} resolution too low. Minimum ${minResolution}x${minResolution} pixels required. Current: ${img.width}x${img.height}`,
        );
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxSize) {
        throw new BadRequestException(`${fieldName} file too large. Maximum 5MB allowed.`);
      }

      // Check minimum file size (very small files might be screenshots or low quality)
      const minSize = 50 * 1024; // 50KB minimum
      if (imageBuffer.length < minSize) {
        throw new BadRequestException(
          `${fieldName} file appears to be too small or low quality. Please use a clear, high-quality image.`,
        );
      }

      // Try to detect at least one face
      await this.loadModels();
      const detection = await faceapi.detectSingleFace(img as any).withFaceLandmarks();
      
      if (!detection) {
        throw new BadRequestException(
          `No face detected in ${fieldName}. Please ensure your face is clearly visible and well-lit.`,
        );
      }

      // Additional validation for selfie: check face size relative to image
      // Very small faces might indicate a photo of a photo
      if (fieldName.toLowerCase().includes('selfie')) {
        const faceBox = detection.detection.box;
        const faceArea = faceBox.width * faceBox.height;
        const imageArea = img.width * img.height;
        const faceRatio = faceArea / imageArea;

        // Face should be at least 5% of the image area for a good selfie
        if (faceRatio < 0.05) {
          this.logger.warn(`Selfie face appears small (${(faceRatio * 100).toFixed(1)}% of image). Possible spoofing attempt.`);
          // Don't reject, but log for review
        }

        // Check if face is reasonably centered (not a photo of a photo)
        const faceCenterX = faceBox.x + faceBox.width / 2;
        const faceCenterY = faceBox.y + faceBox.height / 2;
        const imageCenterX = img.width / 2;
        const imageCenterY = img.height / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(faceCenterX - imageCenterX, 2) + Math.pow(faceCenterY - imageCenterY, 2),
        );
        const maxDistance = Math.min(img.width, img.height) * 0.4; // 40% of image dimension

        if (distanceFromCenter > maxDistance) {
          this.logger.warn(`Selfie face is off-center. Possible spoofing attempt.`);
          // Don't reject, but log for review
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Invalid ${fieldName}. Please upload a valid image file (JPG or PNG).`);
    }
  }
}

