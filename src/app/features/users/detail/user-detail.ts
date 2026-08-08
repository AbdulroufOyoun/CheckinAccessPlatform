import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { PlatformUser } from '../../../core/models/user';
import { ApiError } from '../../../core/models/api-envelope';

@Component({
  selector: 'app-user-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();

  userId = '';
  user: PlatformUser | null = null;
  loading = true;
  saving = false;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.minLength(8), Validators.maxLength(255)]],
    is_platform_admin: [false],
    active: [true],
  });

  constructor() {
    this.sub.add(this.form.valueChanges.subscribe(() => this.cdr.detectChanges()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    await this.reload();
    if (this.route.snapshot.fragment === 'tenants') {
      queueMicrotask(() => document.getElementById('tenants')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  mark(name: string): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  openTenant(id: string): void {
    void this.router.navigate(['/tenants', id]);
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.user = await this.usersApi.getPlatformUser(this.userId);
      this.form.patchValue({
        name: this.user.name || '',
        email: this.user.email || '',
        mobile: this.user.mobile || '',
        password: '',
        is_platform_admin: !!this.user.is_platform_admin,
        active: this.user.active !== false,
      });
    } catch (error) {
      this.user = null;
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('users.loadOneFailed'),
        'danger',
      );
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();
    try {
      const raw = this.form.getRawValue();
      const payload: {
        name: string;
        email: string;
        mobile: string;
        is_platform_admin: boolean;
        active: boolean;
        password?: string;
      } = {
        name: raw.name.trim(),
        email: raw.email.trim(),
        mobile: raw.mobile.trim(),
        is_platform_admin: raw.is_platform_admin,
        active: raw.active,
      };
      if (raw.password.trim()) {
        payload.password = raw.password;
      }
      this.user = await this.usersApi.updatePlatformUser(this.userId, payload);
      this.form.patchValue({ password: '' });
      this.toast.show(this.translate.instant('users.updated'), 'success');
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('users.updateFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
