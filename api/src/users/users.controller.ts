import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; name: string };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('me/face-descriptors')
  async saveFaceDescriptors(
    @Req() req: AuthenticatedRequest,
    @Body() body: { descriptors: number[][] },
  ): Promise<{ success: boolean }> {
    await this.usersService.saveFaceDescriptors(req.user.id, body.descriptors);
    return { success: true };
  }

  @Get('face-descriptors')
  getAllFaceDescriptors(): Promise<{ id: string; name: string; descriptors: number[][] }[]> {
    return this.usersService.getAllWithFaceDescriptors();
  }
}
