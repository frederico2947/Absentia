import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceType } from './attendance.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly usersService: UsersService,
  ) {}

  async record(
    userId: string,
    type: AttendanceType,
    faceConfidence?: number,
  ): Promise<Attendance> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

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
