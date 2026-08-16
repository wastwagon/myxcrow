import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUser as ICurrentUser } from './interfaces/current-user.interface';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { SendPhoneOtpDto } from './dto/send-phone-otp.dto';
import { UserRole } from '@prisma/client';
import {
  ADMIN_REFRESH_COOKIE,
  REFRESH_COOKIE,
  clearAllAuthCookies,
  clearAdminCookies,
  parseCookieHeader,
  setAuthCookies,
  stashAdminCookies,
} from './auth-cookies';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
    }),
  )
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @UploadedFiles() files?: any[],
  ) {
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

    const result = await this.authService.register(data, fileBuffers);
    setAuthCookies(req, res, result);
    return result;
  }

  @Post('login')
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() data: LoginDto,
  ) {
    const result = await this.authService.login(data);
    setAuthCookies(req, res, result);
    return result;
  }

  @Post('password-reset/request')
  async requestPasswordReset(@Body() data: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(data.identifier);
  }

  @Post('password-reset/confirm')
  async confirmPasswordReset(@Body() data: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(data.token, data.newPassword);
  }

  @Post('send-phone-otp')
  async sendPhoneOtp(@Body() data: SendPhoneOtpDto) {
    return this.authService.sendPhoneOtp(data.phone);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: ICurrentUser) {
    const profile = await this.authService.getProfile(user.id);
    return {
      ...profile,
      impersonatedBy: user.impersonatedBy,
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: ICurrentUser, @Body() data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.authService.updateProfile(user.id, data);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: ICurrentUser,
    @Body() data: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, data.currentPassword, data.newPassword);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() user: ICurrentUser,
    @Body() data: { password: string },
  ) {
    if (!data?.password?.trim()) {
      throw new BadRequestException('Password is required to delete your account');
    }
    return this.authService.deleteAccount(user.id, data.password.trim());
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() data?: { refreshToken?: string },
  ) {
    const cookies = parseCookieHeader(req.headers.cookie);
    const refreshToken = data?.refreshToken || cookies[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const result = await this.authService.refreshToken(refreshToken);
    setAuthCookies(req, res, result, { impersonating: result.impersonating });
    return result;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    clearAllAuthCookies(res);
    return { success: true };
  }

  @Post('admin/impersonate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminImpersonate(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() admin: ICurrentUser,
    @Body() body: { userId: string },
  ) {
    if (admin.impersonatedBy) {
      throw new BadRequestException('Stop impersonating before starting another session');
    }
    const result = await this.authService.adminImpersonate(admin.id, body.userId);
    stashAdminCookies(req, res);
    setAuthCookies(req, res, result, { impersonating: true });
    return result;
  }

  @Post('admin/stop-impersonate')
  @UseGuards(JwtAuthGuard)
  async stopImpersonate(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: ICurrentUser,
  ) {
    if (!user.impersonatedBy) {
      throw new BadRequestException('Not impersonating');
    }
    const cookies = parseCookieHeader(req.headers.cookie);
    const adminRefresh = cookies[ADMIN_REFRESH_COOKIE];
    if (!adminRefresh) {
      throw new BadRequestException('Admin session expired. Sign in again.');
    }
    const restored = await this.authService.refreshToken(adminRefresh);
    if (!restored.user?.roles?.includes(UserRole.ADMIN)) {
      throw new UnauthorizedException('Admin session could not be restored');
    }
    setAuthCookies(req, res, restored);
    clearAdminCookies(res);
    return { user: restored.user };
  }
}

