import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from './notifications.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AttendanceAlertsScheduler {
  private readonly logger = new Logger(AttendanceAlertsScheduler.name);

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Runs every hour.
   * Checks if we have passed the late-check-in scan window
   * (workStartHour + lateThresholdMinutes + 30 min grace) and fires
   * missing-attendance notifications for employees who still haven't checked in.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkMissingAttendance(): Promise<void> {
    const now = new Date();
    const { workStartHour, lateThresholdMinutes } = await this.settingsService.getWorkSchedule();

    // Only run between workStartHour+lateThreshold+30min and workStartHour+4h
    const scanStartMinutes = workStartHour * 60 + lateThresholdMinutes + 30;
    const scanEndMinutes = workStartHour * 60 + 4 * 60;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes < scanStartMinutes || nowMinutes > scanEndMinutes) {
      return;
    }

    this.logger.log('Running missing-attendance scan…');

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    // All employees (role = 'employee')
    const employees = await this.usersRepo.find({ where: { role: 'employee' } });

    // Employees who have already checked in today
    const checkedInToday = await this.attendanceRepo.find({
      where: { type: 'check-in', timestamp: Between(start, end) },
      select: ['userId'],
    });
    const checkedInIds = new Set(checkedInToday.map((a) => a.userId));

    // Admins to notify
    const admins = await this.usersRepo.find({ where: { role: 'admin' } });

    for (const emp of employees) {
      if (checkedInIds.has(emp.id)) continue;

      const alreadyNotified = await this.notificationsService.existsForUserToday(
        emp.id,
        'missing_attendance',
      );
      if (alreadyNotified) continue;

      // Notify the employee
      await this.notificationsService.create({
        userId: emp.id,
        type: 'missing_attendance',
        title: 'No Check-In Recorded',
        message: `You have not checked in today (${now.toLocaleDateString()}). Please check in or contact your manager.`,
      });

      // Notify admins
      const adminNotifs = admins.map((admin) => ({
        userId: admin.id,
        type: 'missing_attendance' as const,
        title: 'Employee Missing Attendance',
        message: `${emp.name} has not checked in today (${now.toLocaleDateString()}).`,
      }));
      await this.notificationsService.createMany(adminNotifs);
    }

    // Purge notifications older than 30 days
    await this.notificationsService.purgeOlderThan(30);
    this.logger.log('Missing-attendance scan complete.');
  }
}
