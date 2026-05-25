import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { RecordAttendanceDto } from './dto/record-attendance.dto';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; name: string };
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
    return this.attendanceService.record(req.user.id, dto.type, dto.faceConfidence);
  }

  @Get('me')
  getMyAttendance(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getByUser(req.user.id);
  }

  @Get('today')
  getTodayAttendance(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getTodayByUser(req.user.id);
  }

  @Get()
  getAll() {
    return this.attendanceService.getAll();
  }
}
