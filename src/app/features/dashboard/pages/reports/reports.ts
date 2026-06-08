import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceRecord, EmployeeUser } from '../../../../core/services/attendance.service';

export type DailyRow = {
  date: string;
  userId: string;
  userName: string;
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  workMinutes: number | null;
};

@Component({
  selector: 'app-reports',
  imports: [DatePipe, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly attendanceService = inject(AttendanceService);

  readonly allRecords = signal<AttendanceRecord[]>([]);
  readonly employees = signal<EmployeeUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  startDate = this.defaultStartDate();
  endDate = this.defaultEndDate();
  selectedUserId = '';

  readonly dailyRows = computed<DailyRow[]>(() => {
    const records = this.allRecords();
    const map = new Map<string, DailyRow>();

    for (const r of records) {
      const date = new Date(r.timestamp).toISOString().slice(0, 10);
      const key = `${r.userId}::${date}`;

      if (!map.has(key)) {
        map.set(key, {
          date,
          userId: r.userId,
          userName: r.userName,
          checkIn: null,
          checkOut: null,
          workMinutes: null,
        });
      }

      const row = map.get(key)!;
      if (r.type === 'check-in') {
        if (!row.checkIn || new Date(r.timestamp) < new Date(row.checkIn.timestamp)) {
          row.checkIn = r;
        }
      } else {
        if (!row.checkOut || new Date(r.timestamp) > new Date(row.checkOut.timestamp)) {
          row.checkOut = r;
        }
      }
    }

    for (const row of map.values()) {
      if (row.checkIn && row.checkOut) {
        const diff = new Date(row.checkOut.timestamp).getTime() - new Date(row.checkIn.timestamp).getTime();
        row.workMinutes = Math.round(diff / 60000);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      return d !== 0 ? d : a.userName.localeCompare(b.userName);
    });
  });

  readonly summary = computed(() => {
    const rows = this.dailyRows();
    const totalDays = rows.length;
    const completeDays = rows.filter((r) => r.checkIn && r.checkOut).length;
    const totalMinutes = rows
      .filter((r) => r.workMinutes !== null)
      .reduce((sum, r) => sum + r.workMinutes!, 0);
    const avgMinutes = completeDays > 0 ? Math.round(totalMinutes / completeDays) : null;
    const uniqueEmployees = new Set(rows.map((r) => r.userId)).size;
    return { totalDays, completeDays, avgMinutes, uniqueEmployees };
  });

  ngOnInit(): void {
    this.attendanceService.getEmployees().subscribe({
      next: (data) => this.employees.set(data),
    });
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);
    this.error.set('');
    this.attendanceService.getAllAttendance(
      this.startDate || undefined,
      this.endDate || undefined,
      this.selectedUserId || undefined,
    ).subscribe({
      next: (data) => {
        this.allRecords.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load attendance data.');
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.startDate = this.defaultStartDate();
    this.endDate = this.defaultEndDate();
    this.selectedUserId = '';
    this.loadRecords();
  }

  get hasActiveFilters(): boolean {
    return !!(this.selectedUserId);
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  durationClass(minutes: number | null): string {
    if (minutes === null) return 'text-slate-400';
    if (minutes >= 480) return 'text-emerald-600 dark:text-emerald-400';
    if (minutes >= 360) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  }

  initials(name: string): string {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  private defaultStartDate(): string {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }

  private defaultEndDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
