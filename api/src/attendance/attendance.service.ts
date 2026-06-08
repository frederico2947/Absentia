import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceType } from './attendance.entity';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async record(
    userId: string,
    type: AttendanceType,
    faceConfidence?: number,
    latitude?: number,
    longitude?: number,
  ): Promise<Attendance> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    let distance: number | null = null;
    if (latitude !== undefined && longitude !== undefined) {
      const { latitude: officeLat, longitude: officeLng, maxDistanceMeters } =
        await this.settingsService.getOfficeLocation();

      distance = Math.round(
        this.haversineDistance(officeLat, officeLng, latitude, longitude),
      );

      if (maxDistanceMeters > 0 && distance > maxDistanceMeters) {
        throw new BadRequestException(
          `You are ${distance}m away from the office. Attendance must be recorded within ${maxDistanceMeters}m of the office.`,
        );
      }
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existing = await this.attendanceRepository.findOne({
      where: { userId, type, timestamp: Between(start, end) },
    });

    if (existing) {
      throw new BadRequestException(`Already ${type === 'check-in' ? 'checked in' : 'checked out'} today`);
    }

    const attendance = this.attendanceRepository.create({
      userId,
      userName: user.name,
      type,
      faceConfidence: faceConfidence ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      distance,
    });

    const saved = await this.attendanceRepository.save(attendance);

    if (type === 'check-in') {
      await this.fireLatCheckInAlerts(userId, user.name, saved.timestamp);
    }

    return saved;
  }

  private async fireLatCheckInAlerts(userId: string, userName: string, timestamp: Date): Promise<void> {
    const { workStartHour, lateThresholdMinutes } = await this.settingsService.getWorkSchedule();
    const lateMinute = workStartHour * 60 + lateThresholdMinutes;
    const checkInMinute = timestamp.getHours() * 60 + timestamp.getMinutes();

    if (checkInMinute <= lateMinute) return;

    const alreadyNotified = await this.notificationsService.existsForUserToday(userId, 'late_check_in');
    if (alreadyNotified) return;

    const lateBy = checkInMinute - lateMinute;
    const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await this.notificationsService.create({
      userId,
      type: 'late_check_in',
      title: 'Late Check-In',
      message: `You checked in at ${timeStr}, which is ${lateBy} minute(s) past the ${workStartHour}:${String(lateThresholdMinutes).padStart(2, '0')} deadline.`,
    });

    const admins = await this.usersService.findAdmins();
    const adminNotifs = admins.map((admin) => ({
      userId: admin.id,
      type: 'late_check_in' as const,
      title: 'Late Check-In Alert',
      message: `${userName} checked in at ${timeStr}, ${lateBy} minute(s) late.`,
    }));
    await this.notificationsService.createMany(adminNotifs);
  }

  async getByUser(userId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  async getTodayByUser(userId: string): Promise<{ checkIn: Attendance | null; checkOut: Attendance | null }> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [checkIn, checkOut] = await Promise.all([
      this.attendanceRepository.findOne({
        where: { userId, type: 'check-in', timestamp: Between(start, end) },
      }),
      this.attendanceRepository.findOne({
        where: { userId, type: 'check-out', timestamp: Between(start, end) },
      }),
    ]);

    return { checkIn: checkIn ?? null, checkOut: checkOut ?? null };
  }

  async getAll(): Promise<Attendance[]> {
    return this.attendanceRepository.find({ order: { timestamp: 'DESC' } });
  }

  async getFiltered(startDate?: string, endDate?: string, userId?: string): Promise<Attendance[]> {
    const qb: SelectQueryBuilder<Attendance> = this.attendanceRepository.createQueryBuilder('a');

    if (userId) {
      qb.andWhere('a.userId = :userId', { userId });
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('a.timestamp >= :start', { start });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('a.timestamp <= :end', { end });
    }

    return qb.orderBy('a.timestamp', 'DESC').getMany();
  }

  async getMyFiltered(userId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    const qb: SelectQueryBuilder<Attendance> = this.attendanceRepository.createQueryBuilder('a');
    qb.where('a.userId = :userId', { userId });

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('a.timestamp >= :start', { start });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('a.timestamp <= :end', { end });
    }

    return qb.orderBy('a.timestamp', 'DESC').getMany();
  }
}

