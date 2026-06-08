import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService, OfficeLocation, WorkSchedule } from '../../../../core/services/settings.service';
import { GeolocationService } from '../../../../core/services/geolocation.service';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly geoService = inject(GeolocationService);

  readonly loading = signal(true);
  readonly saveStatus = signal<SaveStatus>('idle');
  readonly saveError = signal('');
  readonly detectingLocation = signal(false);

  latitude = 0;
  longitude = 0;
  maxDistanceMeters = 500;
  workStartHour = 9;
  lateThresholdMinutes = 15;

  ngOnInit(): void {
    Promise.all([
      new Promise<void>((resolve) => {
        this.settingsService.getOfficeLocation().subscribe({
          next: (loc) => {
            this.latitude = loc.latitude;
            this.longitude = loc.longitude;
            this.maxDistanceMeters = loc.maxDistanceMeters;
            resolve();
          },
          error: () => resolve(),
        });
      }),
      new Promise<void>((resolve) => {
        this.settingsService.getWorkSchedule().subscribe({
          next: (ws) => {
            this.workStartHour = ws.workStartHour;
            this.lateThresholdMinutes = ws.lateThresholdMinutes;
            resolve();
          },
          error: () => resolve(),
        });
      }),
    ]).then(() => this.loading.set(false));
  }

  async useMyLocation(): Promise<void> {
    this.detectingLocation.set(true);
    const pos = await this.geoService.requestLocation();
    this.detectingLocation.set(false);
    if (pos) {
      this.latitude = pos.latitude;
      this.longitude = pos.longitude;
    }
  }

  save(): void {
    this.saveStatus.set('saving');
    this.saveError.set('');

    const location: OfficeLocation = {
      latitude: this.latitude,
      longitude: this.longitude,
      maxDistanceMeters: this.maxDistanceMeters,
    };

    const schedule: WorkSchedule = {
      workStartHour: this.workStartHour,
      lateThresholdMinutes: this.lateThresholdMinutes,
    };

    let done = 0;
    const onSuccess = () => {
      done++;
      if (done === 2) {
        this.saveStatus.set('saved');
        setTimeout(() => this.saveStatus.set('idle'), 3000);
      }
    };
    const onError = (err: { error?: { message?: string } }) => {
      this.saveStatus.set('error');
      this.saveError.set(err?.error?.message ?? 'Failed to save settings.');
    };

    this.settingsService.updateOfficeLocation(location).subscribe({ next: onSuccess, error: onError });
    this.settingsService.updateWorkSchedule(schedule).subscribe({ next: onSuccess, error: onError });
  }

  get mapsLink(): string {
    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
  }

  get lateDeadlineLabel(): string {
    const total = this.workStartHour * 60 + this.lateThresholdMinutes;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
