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
        path: 'register-face',
        loadComponent: () =>
          import('./pages/face-register/face-register').then(
            (m) => m.FaceRegister
          ),
      },
    ],
  },
];
