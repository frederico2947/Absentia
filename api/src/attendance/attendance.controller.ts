import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { RecordAttendanceDto } from './dto/record-attendance.dto';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  record(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordAttendanceDto,
  ) {
    return this.attendanceService.record(req.user.id, dto.type, dto.faceConfidence, dto.latitude, dto.longitude);
  }

  @Get('me')
  getMyAttendance(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getMyFiltered(req.user.id, startDate, endDate);
  }

  @Get('today')
  getTodayAttendance(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getTodayByUser(req.user.id);
  }

  @Get()
  getAll(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
    return this.attendanceService.getFiltered(startDate, endDate, userId);
  }
}
