import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginPage } from './features/auth/login/login';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', canActivate: [guestGuard], component: LoginPage },
  {
    path: 'otp',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/otp/otp').then((m) => m.OtpPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.ShellLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/tenants/list/tenants-list').then((m) => m.TenantsListPage),
      },
      {
        path: 'tenants/new',
        loadComponent: () =>
          import('./features/tenants/create/tenant-create').then((m) => m.TenantCreatePage),
      },
      {
        path: 'tenants/:id',
        loadComponent: () =>
          import('./features/tenants/detail/tenant-detail').then((m) => m.TenantDetailPage),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/list/users-list').then((m) => m.UsersListPage),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./features/users/create/user-create').then((m) => m.UserCreatePage),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/users/detail/user-detail').then((m) => m.UserDetailPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsPage),
      },
      {
        path: 'admins',
        loadComponent: () => import('./features/admins/admins').then((m) => m.AdminsPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
