import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceType } from './attendance.entity';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
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

    return this.attendanceRepository.save(attendance);
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
}

