import { Routes } from '@angular/router';
import { DashboardLayout } from '../../layouts/dashboard-layout/dashboard-layout';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/attendance-home/attendance-home').then(
            (m) => m.AttendanceHome
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/attendance-history/attendance-history').then(
            (m) => m.AttendanceHistory
          ),
      },
      {
        path: 'register-face',
        loadComponent: () =>
          import('./pages/face-register/face-register').then(
            (m) => m.FaceRegister
          ),
      },
    ],
  },
];
