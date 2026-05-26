import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AttendanceService, AttendanceRecord } from '../../../../core/services/attendance.service';

@Component({
  selector: 'app-attendance-records',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './attendance-records.html',
  styleUrl: './attendance-records.scss',
})
export class AttendanceRecords implements OnInit {
  private readonly attendanceService = inject(AttendanceService);

  readonly allRecords = signal<AttendanceRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly searchQuery = signal('');
  readonly filterType = signal<'all' | 'check-in' | 'check-out'>('all');

  readonly filteredRecords = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();
    return this.allRecords().filter((r) => {
      const matchesType = type === 'all' || r.type === type;
      const matchesSearch = !query || r.userName.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
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
    this.attendanceService.getAllAttendance().subscribe({
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
