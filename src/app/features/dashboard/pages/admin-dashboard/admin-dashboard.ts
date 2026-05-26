import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttendanceService, AttendanceRecord } from '../../../../core/services/attendance.service';
import { AuthService } from '../../../../core/services/auth.service';

type LeaveRequest = {
  id: string;
  employee: string;
  type: string;
  from: string;
  to: string;
  status: 'pending' | 'approved' | 'rejected';
};

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: '1', employee: 'Alice Johnson', type: 'Annual Leave', from: '2026-05-26', to: '2026-05-28', status: 'pending' },
  { id: '2', employee: 'Bob Smith', type: 'Sick Leave', from: '2026-05-22', to: '2026-05-23', status: 'pending' },
  { id: '3', employee: 'Carol White', type: 'Annual Leave', from: '2026-06-02', to: '2026-06-06', status: 'pending' },
];

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly today = new Date();
  readonly leaveRequests = MOCK_LEAVE_REQUESTS;
  readonly allRecords = signal<AttendanceRecord[]>([]);
  readonly loading = signal(true);

  readonly todayCheckIns = computed(() => {
    const todayStr = new Date().toDateString();
    return this.allRecords()
      .filter((r) => r.type === 'check-in' && new Date(r.timestamp).toDateString() === todayStr)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  readonly stats = computed(() => {
    const todayStr = new Date().toDateString();
    const todayRecords = this.allRecords().filter(
      (r) => new Date(r.timestamp).toDateString() === todayStr,
    );
    const presentToday = new Set(
      todayRecords.filter((r) => r.type === 'check-in').map((r) => r.userId),
    ).size;
    return {
      totalEmployees: '—',
      presentToday,
      onLeave: 0,
      pendingRequests: MOCK_LEAVE_REQUESTS.length,
    };
  });

  ngOnInit(): void {
    this.attendanceService.getAllAttendance().subscribe({
      next: (data) => {
        this.allRecords.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusClass(status: LeaveRequest['status']): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700',
    };
    return map[status] ?? '';
  }

  faceConfidenceClass(confidence: number | null): string {
    if (confidence === null) return 'text-slate-400';
    if (confidence >= 0.85) return 'text-emerald-600';
    if (confidence >= 0.70) return 'text-amber-600';
    return 'text-rose-600';
  }

  initials(name: string): string {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
