import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceRecord, EmployeeUser } from '../../../../core/services/attendance.service';

@Component({
  selector: 'app-attendance-records',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './attendance-records.html',
  styleUrl: './attendance-records.scss',
})
export class AttendanceRecords implements OnInit {
  private readonly attendanceService = inject(AttendanceService);

  readonly allRecords = signal<AttendanceRecord[]>([]);
  readonly employees = signal<EmployeeUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterType = signal<'all' | 'check-in' | 'check-out'>('all');

  startDate = '';
  endDate = '';
  selectedUserId = '';

  readonly filteredRecords = computed(() => {
    const type = this.filterType();
    return this.allRecords().filter((r) => type === 'all' || r.type === type);
  });

  readonly todayStats = computed(() => {
    const today = new Date().toDateString();
    const todayRecords = this.allRecords().filter(
      (r) => new Date(r.timestamp).toDateString() === today,
    );
    const checkIns = todayRecords.filter((r) => r.type === 'check-in');
    const uniqueEmployees = new Set(checkIns.map((r) => r.userId)).size;
    const avgConfidence =
      checkIns.filter((r) => r.faceConfidence !== null).length > 0
        ? checkIns
            .filter((r) => r.faceConfidence !== null)
            .reduce((sum, r) => sum + r.faceConfidence!, 0) /
          checkIns.filter((r) => r.faceConfidence !== null).length
        : null;
    return { checkIns: checkIns.length, uniqueEmployees, avgConfidence };
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
        this.error.set('Failed to load attendance records.');
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.selectedUserId = '';
    this.filterType.set('all');
    this.loadRecords();
  }

  get hasActiveFilters(): boolean {
    return !!(this.startDate || this.endDate || this.selectedUserId);
  }

  faceConfidenceClass(confidence: number | null): string {
    if (confidence === null)
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    if (confidence >= 0.85)
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
    if (confidence >= 0.70)
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  }

  distanceClass(distance: number | null): string {
    if (distance === null) return 'text-slate-400';
    if (distance <= 100) return 'text-emerald-600 dark:text-emerald-400';
    if (distance <= 500) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  }

  mapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
