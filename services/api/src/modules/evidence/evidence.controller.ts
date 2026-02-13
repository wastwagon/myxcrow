import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PhoneRequiredGuard } from '../auth/guards/phone-required.guard';
import { EscrowParticipantGuard } from '../escrow/guards/escrow-participant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('evidence')
@UseGuards(JwtAuthGuard, PhoneRequiredGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('presigned-url')
  async generatePresignedUrl(
    @Body() data: { escrowId: string; fileName: string; fileSize: number; mimeType: string },
  ) {
    return this.evidenceService.generatePresignedUploadUrl(
      data.escrowId,
      data.fileName,
      data.fileSize,
      data.mimeType,
    );
  }

  @Post('verify-upload')
  @UseGuards(EscrowParticipantGuard)
  async verifyUpload(
    @Body() data: {
      escrowId: string;
      objectName: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      type: string;
      description?: string;
      latitude?: number;
      longitude?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.evidenceService.verifyAndCreateEvidence({
      ...data,
      uploadedBy: user.id,
    });
  }

  @Get(':id')
  @UseGuards(EscrowParticipantGuard)
  async getEvidence(@Param('id') id: string) {
    return this.evidenceService.getEvidence(id);
  }

  @Get(':id/download')
  @UseGuards(EscrowParticipantGuard)
  async getDownloadUrl(@Param('id') id: string) {
    return this.evidenceService.getDownloadUrlForEvidence(id);
  }

  @Delete(':id')
  @UseGuards(EscrowParticipantGuard)
  async deleteEvidence(@Param('id') id: string) {
    return this.evidenceService.deleteEvidence(id);
  }
}




