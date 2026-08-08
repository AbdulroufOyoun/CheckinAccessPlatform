import { ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantSummary } from '../../../core/models/tenant';
import { ApiError } from '../../../core/models/api-envelope';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-tenants-list',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './tenants-list.html',
  styleUrl: './tenants-list.css',
})
export class TenantsListPage implements OnInit {
  private readonly tenantsApi = inject(TenantService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly query = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly tenants = signal<TenantSummary[]>([]);

  readonly activeCount = computed(() => this.tenants().filter((t) => t.active).length);
  readonly inactiveCount = computed(() => this.tenants().length - this.activeCount());

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.status();
    return this.tenants().filter((t) => {
      if (status === 'active' && !t.active) return false;
      if (status === 'inactive' && t.active) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        (t.domain || '').toLowerCase().includes(q) ||
        (t.name || '').toLowerCase().includes(q)
      );
    });
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  setStatus(value: StatusFilter): void {
    this.status.set(value);
  }

  onQuery(value: string): void {
    this.query.set(value);
  }

  openTenant(id: string): void {
    void this.router.navigate(['/tenants', id]);
  }

  mark(id: string): string {
    return (id || '?').slice(0, 2).toUpperCase();
  }

  tone(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash + id.charCodeAt(i) * (i + 1)) % 3;
    }
    return hash;
  }

  moduleLabels(t: TenantSummary): string[] {
    const modules = Array.isArray(t.modules) ? t.modules : [];
    return modules.map((m) => this.translate.instant('modules.' + m));
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.cdr.detectChanges();
    try {
      const list = await this.tenantsApi.listForDashboard();
      const rows = Array.isArray(list) ? list : [];
      this.tenants.set(
        rows.map((t) => ({
          ...t,
          modules: Array.isArray(t.modules) ? t.modules : [],
        })),
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : this.translate.instant('tenants.loadFailed');
      this.toast.show(message, 'danger');
      this.tenants.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
