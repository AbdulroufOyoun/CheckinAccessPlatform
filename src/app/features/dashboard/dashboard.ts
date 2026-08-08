import { ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantSummary } from '../../core/models/tenant';
import { ApiError } from '../../core/models/api-envelope';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardPage implements OnInit {
  private readonly tenantsApi = inject(TenantService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly tenants = signal<TenantSummary[]>([]);

  readonly activeCount = computed(() => this.tenants().filter((t) => !!t.active).length);
  readonly inactiveCount = computed(() => this.tenants().length - this.activeCount());
  readonly recent = computed(() => this.tenants().slice(0, 8));

  readonly activeRatio = computed(() => {
    const total = this.tenants().length;
    if (!total) return 0;
    return Math.round((this.activeCount() / total) * 100);
  });

  readonly propertyCount = computed(
    () => this.tenants().filter((t) => t.modules?.includes('property')).length,
  );
  readonly educationCount = computed(
    () => this.tenants().filter((t) => t.modules?.includes('education')).length,
  );

  readonly greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'dashboard.greeting.morning';
    if (hour < 18) return 'dashboard.greeting.afternoon';
    return 'dashboard.greeting.evening';
  });

  readonly firstName = computed(() => {
    const name = this.auth.user()?.name?.trim();
    if (!name) return '';
    return name.split(/\s+/)[0];
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  mark(id: string): string {
    return (id || '?').slice(0, 2).toUpperCase();
  }

  openTenant(id: string): void {
    void this.router.navigate(['/tenants', id]);
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.cdr.detectChanges();
    try {
      const list = await this.tenantsApi.listForDashboard();
      this.tenants.set(Array.isArray(list) ? list : []);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : this.translate.instant('dashboard.loadFailed');
      this.toast.show(message, 'danger');
      this.tenants.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
