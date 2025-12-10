import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
    }),
  )
  async register(@Body() data: RegisterDto, @UploadedFiles() files?: any[]) {
    // Parse files if provided
    let fileBuffers: { cardFront?: Buffer; cardBack?: Buffer; selfie?: Buffer } | undefined;

    if (files && files.length > 0) {
      fileBuffers = {};
      // Files come in order: card-front, card-back, selfie (based on FormData append order)
      // Or we can check the originalname
      for (const file of files) {
        const fileName = file.originalname?.toLowerCase() || '';
        if (fileName.includes('card-front') || fileName.includes('front')) {
          fileBuffers.cardFront = file.buffer;
        } else if (fileName.includes('card-back') || fileName.includes('back')) {
          fileBuffers.cardBack = file.buffer;
        } else if (fileName.includes('selfie')) {
          fileBuffers.selfie = file.buffer;
        } else {
          // If name doesn't match, assign by order
          if (!fileBuffers.cardFront) {
            fileBuffers.cardFront = file.buffer;
          } else if (!fileBuffers.cardBack) {
            fileBuffers.cardBack = file.buffer;
          } else if (!fileBuffers.selfie) {
            fileBuffers.selfie = file.buffer;
          }
        }
      }

      // Validate all required files are present
      if (!fileBuffers.cardFront || !fileBuffers.cardBack || !fileBuffers.selfie) {
        throw new BadRequestException(
          'All files are required: Ghana Card front, Ghana Card back, and selfie',
        );
      }
    }

    return this.authService.register(data, fileBuffers);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
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

  @Post('refresh')
  async refresh(@Body() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }
}

