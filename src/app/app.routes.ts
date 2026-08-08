import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginPage } from './features/auth/login/login';
import { OtpPage } from './features/auth/otp/otp';
import { ShellLayout } from './layout/shell/shell';
import { DashboardPage } from './features/dashboard/dashboard';
import { TenantsListPage } from './features/tenants/list/tenants-list';
import { TenantCreatePage } from './features/tenants/create/tenant-create';
import { TenantDetailPage } from './features/tenants/detail/tenant-detail';
import { UsersListPage } from './features/users/list/users-list';
import { UserCreatePage } from './features/users/create/user-create';
import { UserDetailPage } from './features/users/detail/user-detail';
import { ReportsPage } from './features/reports/reports';
import { AdminsPage } from './features/admins/admins';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', canActivate: [guestGuard], component: LoginPage },
  { path: 'otp', canActivate: [guestGuard], component: OtpPage },
  {
    path: '',
    canActivate: [authGuard],
    component: ShellLayout,
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'tenants', component: TenantsListPage },
      { path: 'tenants/new', component: TenantCreatePage },
      { path: 'tenants/:id', component: TenantDetailPage },
      { path: 'users', component: UsersListPage },
      { path: 'users/new', component: UserCreatePage },
      { path: 'users/:id', component: UserDetailPage },
      { path: 'reports', component: ReportsPage },
      { path: 'admins', component: AdminsPage },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
