import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notif = this.repo.create(input);
    return this.repo.save(notif);
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;
    const entities = inputs.map((i) => this.repo.create(i));
    await this.repo.save(entities);
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async deleteById(id: string, userId: string): Promise<void> {
    await this.repo.delete({ id, userId });
  }

  /** Remove notifications older than `days` days to keep the table lean. */
  async purgeOlderThan(days: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await this.repo.delete({ createdAt: LessThan(cutoff) });
  }

  /** Check if a notification of a given type already exists for a user today (prevents duplicates). */
  async existsForUserToday(userId: string, type: NotificationType): Promise<boolean> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const count = await this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.type = :type', { type })
      .andWhere('n.createdAt >= :start', { start })
      .andWhere('n.createdAt <= :end', { end })
      .getCount();
    return count > 0;
  }
}
