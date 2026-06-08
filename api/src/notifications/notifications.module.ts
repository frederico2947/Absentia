import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AttendanceAlertsScheduler } from './attendance-alerts.scheduler';
import { Attendance } from '../attendance/attendance.entity';
import { User } from '../users/user.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Notification, Attendance, User]),
    SettingsModule,
  ],
  providers: [NotificationsService, AttendanceAlertsScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
