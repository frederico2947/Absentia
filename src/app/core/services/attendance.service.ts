import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  type: 'check-in' | 'check-out';
  faceConfidence: number | null;
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

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000';

  record(type: 'check-in' | 'check-out', faceConfidence?: number): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.API_URL}/attendance`, {
      type,
      faceConfidence,
    });
  }

  getMyAttendance(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.API_URL}/attendance/me`);
  }

  getTodayAttendance(): Observable<TodayAttendance> {
    return this.http.get<TodayAttendance>(`${this.API_URL}/attendance/today`);
  }

  getAllAttendance(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.API_URL}/attendance`);
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
