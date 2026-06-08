import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceService, AttendanceRecord } from '../../../../core/services/attendance.service';

@Component({
  selector: 'app-attendance-history',
  imports: [DatePipe, DecimalPipe, RouterLink, FormsModule],
  templateUrl: './attendance-history.html',
  styleUrl: './attendance-history.scss',
})
export class AttendanceHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);

  readonly records = signal<AttendanceRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  startDate = '';
  endDate = '';

  readonly filteredRecords = computed(() => {
    return this.records();
  });

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);
    this.error.set('');
    this.attendanceService.getMyAttendance(this.startDate || undefined, this.endDate || undefined).subscribe({
      next: (data) => {
        this.records.set(data);
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
    this.loadRecords();
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
}
