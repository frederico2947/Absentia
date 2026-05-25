import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpsertOfficeLocationDto } from './dto/upsert-office-location.dto';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('office-location')
  getOfficeLocation() {
    return this.settingsService.getOfficeLocation();
  }

  @Put('office-location')
  async updateOfficeLocation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertOfficeLocationDto,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update office location');
    }
    return this.settingsService.saveOfficeLocation(
      dto.latitude,
      dto.longitude,
      dto.maxDistanceMeters ?? 500,
    );
  }
}
