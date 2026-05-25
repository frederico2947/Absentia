import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SettingsService, OfficeLocation } from '../../../../core/services/settings.service';
import { GeolocationService } from '../../../../core/services/geolocation.service';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, DecimalPipe],
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

  ngOnInit(): void {
    this.settingsService.getOfficeLocation().subscribe({
      next: (loc) => {
        this.latitude = loc.latitude;
        this.longitude = loc.longitude;
        this.maxDistanceMeters = loc.maxDistanceMeters;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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

    const payload: OfficeLocation = {
      latitude: this.latitude,
      longitude: this.longitude,
      maxDistanceMeters: this.maxDistanceMeters,
    };

    this.settingsService.updateOfficeLocation(payload).subscribe({
      next: () => {
        this.saveStatus.set('saved');
        setTimeout(() => this.saveStatus.set('idle'), 3000);
      },
      error: (err) => {
        this.saveStatus.set('error');
        this.saveError.set(err?.error?.message ?? 'Failed to save settings.');
      },
    });
  }

  get mapsLink(): string {
    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
  }
}
