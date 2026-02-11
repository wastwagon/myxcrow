import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Headers,
  Logger,
} from '@nestjs/common';
import { KYCService } from './kyc.service';
import { SmileIDService } from './smile-id.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('kyc')
export class KYCController {
  private readonly logger = new Logger(KYCController.name);

  constructor(
    private readonly kycService: KYCService,
    private readonly smileIdService: SmileIDService,
  ) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyKyc(@CurrentUser() user: any) {
    return this.kycService.getKYCDetails(user.id);
  }

  @Post('resubmit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
    }),
  )
  async resubmitKyc(
    @CurrentUser() user: any,
    @Body() body: { ghanaCardNumber: string },
    @UploadedFiles() files?: any[],
  ) {
    if (!body?.ghanaCardNumber) {
      throw new BadRequestException('ghanaCardNumber is required');
    }
    if (!files || files.length < 3) {
      throw new BadRequestException(
        'All files are required: Ghana Card front, Ghana Card back, and selfie',
      );
    }

    // Parse files...
    const fileBuffers: { cardFront?: Buffer; cardBack?: Buffer; selfie?: Buffer } = {};

    for (const file of files) {
      const fileName = file.originalname?.toLowerCase() || '';
      if (fileName.includes('card-front') || fileName.includes('front')) {
        fileBuffers.cardFront = file.buffer;
      } else if (fileName.includes('card-back') || fileName.includes('back')) {
        fileBuffers.cardBack = file.buffer;
      } else if (fileName.includes('selfie')) {
        fileBuffers.selfie = file.buffer;
      } else {
        if (!fileBuffers.cardFront) {
          fileBuffers.cardFront = file.buffer;
        } else if (!fileBuffers.cardBack) {
          fileBuffers.cardBack = file.buffer;
        } else if (!fileBuffers.selfie) {
          fileBuffers.selfie = file.buffer;
        }
      }
    }

    if (!fileBuffers.cardFront || !fileBuffers.cardBack || !fileBuffers.selfie) {
      throw new BadRequestException(
        'All files are required: Ghana Card front, Ghana Card back, and selfie',
      );
    }

    return this.kycService.resubmitKYC({
      userId: user.id,
      ghanaCardNumber: body.ghanaCardNumber,
      cardFrontBuffer: fileBuffers.cardFront,
      cardBackBuffer: fileBuffers.cardBack,
      selfieBuffer: fileBuffers.selfie,
    });
  }

  /**
   * Smile ID Webhook Callback
   */
  @Post('callback')
  async smileCallback(
    @Body() body: any,
    @Headers('signature') signature?: string,
    @Headers('timestamp') timestamp?: string,
  ) {
    this.logger.log(`Received Smile ID callback for user ${body.user_id}`);

    // Verify signature
    if (signature && timestamp) {
      const isValid = this.smileIdService.verifySignature(timestamp, signature);
      if (!isValid) {
        this.logger.warn(`Invalid signature for Smile ID callback. User: ${body.user_id}`);
        // In production, you might want to throw error here
      }
    }

    // Process callback via service
    const result = await this.smileIdService.processWebhook(body);

    // Update KYC status in our database
    await this.kycService.handleSmileIDCallback(result);

    return { received: true };
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async listPendingVerifications(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.kycService.listPendingVerifications(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getKYCDetails(@Param('userId') userId: string) {
    return this.kycService.getKYCDetails(userId);
  }

  @Put('approve/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveKYC(
    @Param('userId') userId: string,
    @Body() body: { notes?: string },
    @CurrentUser() admin: any,
  ) {
    return this.kycService.approveKYC(userId, admin.id, body.notes);
  }

  @Put('reject/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectKYC(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: any,
  ) {
    return this.kycService.rejectKYC(userId, admin.id, body.reason);
  }

  @Get('download/:objectName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getDownloadUrl(@Param('objectName') objectName: string) {
    const url = await this.kycService.getPresignedDownloadUrl(objectName);
    return { downloadUrl: url };
  }
}




