import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttendanceService, AttendanceRecord } from '../../../../core/services/attendance.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employee-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss',
})
export class EmployeeDashboard implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly today = new Date();
  readonly records = signal<AttendanceRecord[]>([]);
  readonly loading = signal(true);

  readonly recentRecords = computed(() => this.records().slice(0, 6));

  readonly stats = computed(() => {
    const now = new Date();
    const monthRecords = this.records().filter((r) => {
      const d = new Date(r.timestamp);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const checkInDays = new Set(
      monthRecords.filter((r) => r.type === 'check-in').map((r) => new Date(r.timestamp).toDateString()),
    ).size;
    const checkOutDays = new Set(
      monthRecords.filter((r) => r.type === 'check-out').map((r) => new Date(r.timestamp).toDateString()),
    ).size;
    return {
      totalDays: checkInDays,
      presentDays: checkInDays,
      completeDays: checkOutDays,
      totalRecords: this.records().length,
    };
  });

  ngOnInit(): void {
    this.attendanceService.getMyAttendance().subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(record: AttendanceRecord): string {
    return record.type === 'check-in' ? 'Check In' : 'Check Out';
  }

  typeClass(record: AttendanceRecord): string {
    return record.type === 'check-in'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-sky-100 text-sky-700';
  }
}
