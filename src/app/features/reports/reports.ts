import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantModule, TenantSummary } from '../../core/models/tenant';
import { PlatformUser } from '../../core/models/user';
import { ApiError } from '../../core/models/api-envelope';

export type ReportId =
  | 'summary'
  | 'tenants_all'
  | 'tenants_active'
  | 'tenants_inactive'
  | 'modules'
  | 'users_all'
  | 'users_admins'
  | 'users_regular';

interface ReportDef {
  id: ReportId;
  titleKey: string;
  descKey: string;
  icon: 'chart' | 'building' | 'check' | 'pause' | 'modules' | 'users' | 'shield' | 'person';
}

@Component({
  selector: 'app-reports',
  imports: [FormsModule, TranslatePipe, DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsPage implements OnInit {
  private readonly tenantsApi = inject(TenantService);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly tenants = signal<TenantSummary[]>([]);
  readonly users = signal<PlatformUser[]>([]);
  readonly selectedReport = signal<ReportId>('summary');
  readonly moduleFilter = signal<'all' | TenantModule>('all');

  readonly catalog: ReportDef[] = [
    { id: 'summary', titleKey: 'reports.type.summary', descKey: 'reports.type.summaryDesc', icon: 'chart' },
    { id: 'tenants_all', titleKey: 'reports.type.tenantsAll', descKey: 'reports.type.tenantsAllDesc', icon: 'building' },
    { id: 'tenants_active', titleKey: 'reports.type.tenantsActive', descKey: 'reports.type.tenantsActiveDesc', icon: 'check' },
    { id: 'tenants_inactive', titleKey: 'reports.type.tenantsInactive', descKey: 'reports.type.tenantsInactiveDesc', icon: 'pause' },
    { id: 'modules', titleKey: 'reports.type.modules', descKey: 'reports.type.modulesDesc', icon: 'modules' },
    { id: 'users_all', titleKey: 'reports.type.usersAll', descKey: 'reports.type.usersAllDesc', icon: 'users' },
    { id: 'users_admins', titleKey: 'reports.type.usersAdmins', descKey: 'reports.type.usersAdminsDesc', icon: 'shield' },
    { id: 'users_regular', titleKey: 'reports.type.usersRegular', descKey: 'reports.type.usersRegularDesc', icon: 'person' },
  ];

  readonly activeTenants = computed(() => this.tenants().filter((t) => !!t.active));
  readonly inactiveTenants = computed(() => this.tenants().filter((t) => !t.active));
  readonly propertyCount = computed(
    () => this.tenants().filter((t) => t.modules?.includes('property')).length,
  );
  readonly educationCount = computed(
    () => this.tenants().filter((t) => t.modules?.includes('education')).length,
  );
  readonly bothModules = computed(
    () =>
      this.tenants().filter(
        (t) => t.modules?.includes('property') && t.modules?.includes('education'),
      ).length,
  );
  readonly noModules = computed(
    () => this.tenants().filter((t) => !t.modules?.length).length,
  );
  readonly platformAdminUsers = computed(() =>
    this.users().filter((u) => !!u.is_platform_admin),
  );
  readonly regularUsers = computed(() =>
    this.users().filter((u) => !u.is_platform_admin),
  );
  readonly activeUsers = computed(() => this.users().filter((u) => !!u.active));
  readonly activeRatio = computed(() => {
    const total = this.tenants().length;
    if (!total) return 0;
    return Math.round((this.activeTenants().length / total) * 100);
  });

  readonly currentDef = computed(
    () => this.catalog.find((r) => r.id === this.selectedReport()) ?? this.catalog[0],
  );

  readonly reportTenants = computed(() => {
    const id = this.selectedReport();
    const module = this.moduleFilter();
    let list =
      id === 'tenants_active'
        ? this.activeTenants()
        : id === 'tenants_inactive'
          ? this.inactiveTenants()
          : this.tenants();

    if (module !== 'all') {
      list = list.filter((t) => t.modules?.includes(module));
    }

    return list;
  });

  readonly reportUsers = computed(() => {
    const id = this.selectedReport();
    if (id === 'users_admins') return this.platformAdminUsers();
    if (id === 'users_regular') return this.regularUsers();
    return this.users();
  });

  readonly generatedAt = signal(new Date());

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  selectReport(id: ReportId): void {
    this.selectedReport.set(id);
    this.cdr.detectChanges();
  }

  setModuleFilter(value: 'all' | TenantModule): void {
    this.moduleFilter.set(value);
    this.cdr.detectChanges();
  }

  modulesLabel(t: TenantSummary): string {
    if (!t.modules?.length) return this.translate.instant('common.none');
    return t.modules.map((m) => this.translate.instant(`modules.${m}`)).join(', ');
  }

  printReport(): void {
    this.generatedAt.set(new Date());
    this.cdr.detectChanges();
    setTimeout(() => window.print(), 50);
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.cdr.detectChanges();
    try {
      const [tenants, users] = await Promise.all([
        this.tenantsApi.listForDashboard(),
        this.auth.user()?.is_platform_admin
          ? this.usersApi.listPlatformUsers().catch(() => [] as PlatformUser[])
          : Promise.resolve([] as PlatformUser[]),
      ]);
      this.tenants.set(Array.isArray(tenants) ? tenants : []);
      this.users.set(Array.isArray(users) ? users : []);
      this.generatedAt.set(new Date());
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('reports.loadFailed'),
        'danger',
      );
      this.tenants.set([]);
      this.users.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
