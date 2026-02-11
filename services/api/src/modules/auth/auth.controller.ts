import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
    }),
  )
  async register(@Req() req: Request, @UploadedFiles() files?: any[]) {
    // Multipart/form-data: global ValidationPipe can leave @Body() empty; multer puts fields in req.body.
    const raw = (req.body || {}) as Record<string, any>;
    const data = plainToClass(RegisterDto, raw, { enableImplicitConversion: true });
    const errors = await validate(data, { whitelist: true });
    if (errors.length > 0) {
      const messages = errors.flatMap((e) => (e.constraints ? Object.values(e.constraints) : []));
      throw new BadRequestException(messages.length ? messages.join('; ') : 'Validation failed');
    }

    // Parse files if provided (optional for MVP)
    let fileBuffers: { cardFront?: Buffer; cardBack?: Buffer; selfie?: Buffer } | undefined;

    if (files && files.length > 0) {
      fileBuffers = {};
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

      // Only validate all files are present if any files were uploaded
      if (!fileBuffers.cardFront || !fileBuffers.cardBack || !fileBuffers.selfie) {
        throw new BadRequestException(
          'If uploading files, all three are required: Ghana Card front, Ghana Card back, and selfie',
        );
      }
    }

    return this.authService.register(data, fileBuffers);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('password-reset/request')
  async requestPasswordReset(@Body() data: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Post('password-reset/confirm')
  async confirmPasswordReset(@Body() data: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(data.token, data.newPassword);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: any, @Body() data: { firstName?: string; lastName?: string }) {
    return this.authService.updateProfile(user.id, data);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() data: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, data.currentPassword, data.newPassword);
  }

  @Post('refresh')
  async refresh(@Body() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }
}

