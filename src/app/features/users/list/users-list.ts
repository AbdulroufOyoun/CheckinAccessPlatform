import { ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { PlatformUser } from '../../../core/models/user';
import { ApiError } from '../../../core/models/api-envelope';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-users-list',
  imports: [RouterLink, FormsModule, TranslatePipe],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersListPage implements OnInit {
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly query = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly users = signal<PlatformUser[]>([]);

  readonly activeCount = computed(() => this.users().filter((u) => !!u.active).length);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.status();
    return this.users().filter((u) => {
      if (u.is_platform_admin) return false;
      if (status === 'active' && !u.active) return false;
      if (status === 'inactive' && u.active) return false;
      if (!q) return true;
      return (
        String(u.id).includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.mobile || '').toLowerCase().includes(q)
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

  mark(name: string): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  tone(id: number): number {
    return id % 3;
  }

  openUser(id: number): void {
    void this.router.navigate(['/users', id]);
  }

  openUserTenants(event: Event, id: number): void {
    event.stopPropagation();
    void this.router.navigate(['/users', id], { fragment: 'tenants' });
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.cdr.detectChanges();
    try {
      const list = await this.usersApi.listPlatformUsers(undefined, { isPlatformAdmin: false });
      this.users.set(Array.isArray(list) ? list : []);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : this.translate.instant('users.loadFailed');
      this.toast.show(message, 'danger');
      this.users.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
