import { ChangeDetectorRef, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { PlatformUser } from '../../core/models/user';
import { ApiError } from '../../core/models/api-envelope';

@Component({
  selector: 'app-admins',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './admins.html',
  styleUrl: './admins.css',
})
export class AdminsPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly platformUsers = signal<PlatformUser[]>([]);

  readonly platformAdmins = computed(() =>
    this.platformUsers().filter((u) => !!u.is_platform_admin),
  );

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
  });

  constructor() {
    this.sub.add(this.form.valueChanges.subscribe(() => this.cdr.detectChanges()));
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  mark(name: string): string {
    const parts = (name || '?').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  openUser(id: number): void {
    void this.router.navigate(['/users', id]);
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.cdr.detectChanges();
    try {
      const users = await this.usersApi.listPlatformUsers();
      this.platformUsers.set(Array.isArray(users) ? users : []);
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('admins.loadFailed'),
        'danger',
      );
      this.platformUsers.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.saving.set(true);
    this.cdr.detectChanges();
    try {
      const raw = this.form.getRawValue();
      const created = await this.usersApi.createPlatformUser({
        name: raw.name.trim(),
        email: raw.email.trim(),
        mobile: raw.mobile.trim(),
        password: raw.password,
        is_platform_admin: true,
      });
      this.platformUsers.set([created, ...this.platformUsers()]);
      this.form.reset({ name: '', email: '', mobile: '', password: '' });
      this.toast.show(this.translate.instant('admins.platformCreated'), 'success');
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('admins.platformFailed'),
        'danger',
      );
    } finally {
      this.saving.set(false);
      this.cdr.detectChanges();
    }
  }
}
