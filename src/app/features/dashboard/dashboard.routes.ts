import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { DashboardLayout } from '../../layouts/dashboard-layout/dashboard-layout';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home').then(
            (m) => m.DashboardHome,
          ),
      },
      {
        path: 'employee',
        canActivate: [roleGuard(['employee'])],
        data: { title: 'Dashboard' },
        loadComponent: () =>
          import('./pages/employee-dashboard/employee-dashboard').then(
            (m) => m.EmployeeDashboard,
          ),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['admin'])],
        data: { title: 'Dashboard' },
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboard,
          ),
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['admin'])],
        data: { title: 'Settings' },
        loadComponent: () =>
          import('./pages/settings/settings').then(
            (m) => m.Settings,
          ),
      },
    ],
  },
];
