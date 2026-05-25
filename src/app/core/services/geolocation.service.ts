import { Injectable, signal } from '@angular/core';

export type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

export type GeolocationPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  readonly status = signal<GeolocationStatus>('idle');
  readonly position = signal<GeolocationPosition | null>(null);
  readonly errorMessage = signal<string>('');

  get isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  requestLocation(): Promise<GeolocationPosition | null> {
    if (!this.isSupported) {
      this.status.set('unavailable');
      this.errorMessage.set('Geolocation is not supported by your browser.');
      return Promise.resolve(null);
    }

    this.status.set('loading');
    this.errorMessage.set('');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          this.position.set(result);
          this.status.set('granted');
          resolve(result);
        },
        (err) => {
          this.position.set(null);
          if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
            this.status.set('denied');
            this.errorMessage.set('Location access denied. Attendance will be recorded without location.');
          } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
            this.status.set('unavailable');
            this.errorMessage.set('Location unavailable. Attendance will be recorded without location.');
          } else {
            this.status.set('unavailable');
            this.errorMessage.set('Location timed out. Attendance will be recorded without location.');
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }
}
