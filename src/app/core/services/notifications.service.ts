import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AppNotification = {
  id: string;
  userId: string;
  type: 'late_check_in' | 'missing_attendance';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);

  fetch(): Observable<AppNotification[]> {
    return this.http
      .get<AppNotification[]>(`${this.API_URL}/notifications`)
      .pipe(tap((data) => this.notifications.set(data)));
  }

  markRead(id: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_URL}/notifications/${id}/read`, {})
      .pipe(
        tap(() =>
          this.notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          ),
        ),
      );
  }

  markAllRead(): Observable<void> {
    return this.http
      .put<void>(`${this.API_URL}/notifications/read-all`, {})
      .pipe(
        tap(() =>
          this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true }))),
        ),
      );
  }

  deleteOne(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/notifications/${id}`)
      .pipe(tap(() => this.notifications.update((list) => list.filter((n) => n.id !== id))));
  }
}
