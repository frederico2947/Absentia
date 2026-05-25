import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/attendance-home/attendance-home').then(
        (m) => m.AttendanceHome
      ),
  },
];
