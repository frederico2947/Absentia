import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

type AttendanceRecord = {
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'leave';
};

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { date: '2026-05-21', checkIn: '08:02', checkOut: '17:05', status: 'present' },
  { date: '2026-05-20', checkIn: '08:45', checkOut: '17:00', status: 'late' },
  { date: '2026-05-19', checkIn: '07:58', checkOut: '17:10', status: 'present' },
  { date: '2026-05-16', checkIn: '--', checkOut: '--', status: 'leave' },
  { date: '2026-05-15', checkIn: '08:00', checkOut: '17:00', status: 'present' },
];

@Component({
  selector: 'app-employee-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss',
})
export class EmployeeDashboard {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly today = new Date();
  readonly attendance = MOCK_ATTENDANCE;

  readonly stats = computed(() => ({
    totalDays: 22,
    presentDays: 18,
    absentDays: 1,
    leaveDays: 3,
  }));

  statusClass(status: AttendanceRecord['status']): string {
    const map: Record<AttendanceRecord['status'], string> = {
      present: 'bg-emerald-100 text-emerald-700',
      late: 'bg-amber-100 text-amber-700',
      absent: 'bg-rose-100 text-rose-700',
      leave: 'bg-sky-100 text-sky-700',
    };
    return map[status];
  }
}
