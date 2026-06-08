import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

export type OfficeLocation = {
  latitude: number;
  longitude: number;
  maxDistanceMeters: number;
};

const DEFAULTS: OfficeLocation = {
  latitude: -6.2088,
  longitude: 106.8456,
  maxDistanceMeters: 500,
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
  ) {}

  private async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? null;
  }

  private async set(key: string, value: string): Promise<void> {
    await this.repo.upsert({ key, value }, ['key']);
  }

  async getOfficeLocation(): Promise<OfficeLocation> {
    const [lat, lng, dist] = await Promise.all([
      this.get('officeLatitude'),
      this.get('officeLongitude'),
      this.get('maxDistanceMeters'),
    ]);

    return {
      latitude: lat !== null ? parseFloat(lat) : DEFAULTS.latitude,
      longitude: lng !== null ? parseFloat(lng) : DEFAULTS.longitude,
      maxDistanceMeters: dist !== null ? parseInt(dist, 10) : DEFAULTS.maxDistanceMeters,
    };
  }

  async saveOfficeLocation(
    latitude: number,
    longitude: number,
    maxDistanceMeters: number,
  ): Promise<OfficeLocation> {
    await Promise.all([
      this.set('officeLatitude', String(latitude)),
      this.set('officeLongitude', String(longitude)),
      this.set('maxDistanceMeters', String(maxDistanceMeters)),
    ]);
    return { latitude, longitude, maxDistanceMeters };
  }
}
