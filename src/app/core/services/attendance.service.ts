import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  type: 'check-in' | 'check-out';
  faceConfidence: number | null;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  timestamp: string;
};

export type TodayAttendance = {
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
};

export type FaceDescriptorEntry = {
  id: string;
  name: string;
  descriptors: number[][];
};

export type EmployeeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000';

  record(type: 'check-in' | 'check-out', faceConfidence?: number, latitude?: number, longitude?: number): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.API_URL}/attendance`, {
      type,
      faceConfidence,
      latitude,
      longitude,
    });
  }

  getMyAttendance(startDate?: string, endDate?: string): Observable<AttendanceRecord[]> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.http.get<AttendanceRecord[]>(`${this.API_URL}/attendance/me`, { params });
  }

  getTodayAttendance(): Observable<TodayAttendance> {
    return this.http.get<TodayAttendance>(`${this.API_URL}/attendance/today`);
  }

  getAllAttendance(startDate?: string, endDate?: string, userId?: string): Observable<AttendanceRecord[]> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    if (userId) params['userId'] = userId;
    return this.http.get<AttendanceRecord[]>(`${this.API_URL}/attendance`, { params });
  }

  getEmployees(): Observable<EmployeeUser[]> {
    return this.http.get<EmployeeUser[]>(`${this.API_URL}/users`);
  }

  saveFaceDescriptors(descriptors: number[][]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.API_URL}/users/me/face-descriptors`,
      { descriptors },
    );
  }

  getAllFaceDescriptors(): Observable<FaceDescriptorEntry[]> {
    return this.http.get<FaceDescriptorEntry[]>(`${this.API_URL}/users/face-descriptors`);
  }
}
