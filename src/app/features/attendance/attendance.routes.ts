import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
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
];
