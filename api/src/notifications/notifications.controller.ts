import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Req() req: AuthenticatedRequest): Promise<Notification[]> {
    return this.notificationsService.findForUser(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@Req() req: AuthenticatedRequest): Promise<void> {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    return this.notificationsService.deleteById(id, req.user.id);
  }
}
