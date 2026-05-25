import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

type LeaveRequest = {
  id: string;
  employee: string;
  type: string;
  from: string;
  to: string;
  status: 'pending' | 'approved' | 'rejected';
};

type AttendanceSummary = {
  name: string;
  department: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  checkIn: string;
};

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: '1', employee: 'Alice Johnson', type: 'Annual Leave', from: '2026-05-26', to: '2026-05-28', status: 'pending' },
  { id: '2', employee: 'Bob Smith', type: 'Sick Leave', from: '2026-05-22', to: '2026-05-23', status: 'pending' },
  { id: '3', employee: 'Carol White', type: 'Annual Leave', from: '2026-06-02', to: '2026-06-06', status: 'pending' },
];

const MOCK_ATTENDANCE: AttendanceSummary[] = [
  { name: 'Alice Johnson', department: 'Engineering', status: 'present', checkIn: '08:02' },
  { name: 'Bob Smith', department: 'Marketing', status: 'late', checkIn: '09:15' },
  { name: 'Carol White', department: 'HR', status: 'leave', checkIn: '--' },
  { name: 'David Lee', department: 'Finance', status: 'present', checkIn: '07:55' },
  { name: 'Eva Martinez', department: 'Engineering', status: 'absent', checkIn: '--' },
];

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly today = new Date();
  readonly leaveRequests = MOCK_LEAVE_REQUESTS;
  readonly attendanceSummary = MOCK_ATTENDANCE;

  readonly stats = {
    totalEmployees: 48,
    presentToday: 39,
    onLeave: 5,
    pendingRequests: 3,
  };

  statusClass(status: AttendanceSummary['status'] | LeaveRequest['status']): string {
    const map: Record<string, string> = {
      present: 'bg-emerald-100 text-emerald-700',
      late: 'bg-amber-100 text-amber-700',
      absent: 'bg-rose-100 text-rose-700',
      leave: 'bg-sky-100 text-sky-700',
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700',
    };
    return map[status] ?? '';
  }
}
