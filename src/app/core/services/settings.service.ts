import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type OfficeLocation = {
  latitude: number;
  longitude: number;
  maxDistanceMeters: number;
};

export type WorkSchedule = {
  workStartHour: number;
  lateThresholdMinutes: number;
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  getOfficeLocation(): Observable<OfficeLocation> {
    return this.http.get<OfficeLocation>(`${this.API_URL}/settings/office-location`);
  }

  updateOfficeLocation(data: OfficeLocation): Observable<OfficeLocation> {
    return this.http.put<OfficeLocation>(`${this.API_URL}/settings/office-location`, data);
  }

  getWorkSchedule(): Observable<WorkSchedule> {
    return this.http.get<WorkSchedule>(`${this.API_URL}/settings/work-schedule`);
  }

  updateWorkSchedule(data: WorkSchedule): Observable<WorkSchedule> {
    return this.http.put<WorkSchedule>(`${this.API_URL}/settings/work-schedule`, data);
  }
}
