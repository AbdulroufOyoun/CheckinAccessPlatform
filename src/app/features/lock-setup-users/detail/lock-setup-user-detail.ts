import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LockSetupUser } from '../../../core/models/lock-setup-user';
import { ApiError } from '../../../core/models/api-envelope';
import { LockSetupUserService } from '../../../core/services/lock-setup-user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-lock-setup-user-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './lock-setup-user-detail.html',
  styleUrl: '../list/lock-setup-users-list.css',
})
export class LockSetupUserDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly lockSetupUsersApi = inject(LockSetupUserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();

  userId = '';
  user: LockSetupUser | null = null;
  loading = true;
  saving = false;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.minLength(8), Validators.maxLength(255)]],
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
  }

  mark(name: string): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.user = await this.lockSetupUsersApi.get(this.userId);
      this.form.patchValue({
        name: this.user.name || '',
        email: this.user.email || '',
        mobile: this.user.mobile || '',
        password: '',
        active: this.user.active !== false,
      });
    } catch (error) {
      this.user = null;
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('lockSetupUsers.loadFailed'),
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
        active: boolean;
        password?: string;
      } = {
        name: raw.name.trim(),
        email: raw.email.trim(),
        mobile: raw.mobile.trim(),
        active: raw.active,
      };
      if (raw.password.trim()) {
        payload.password = raw.password;
      }
      this.user = await this.lockSetupUsersApi.update(this.userId, payload);
      this.form.patchValue({ password: '' });
      this.toast.show(this.translate.instant('lockSetupUsers.updated'), 'success');
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('lockSetupUsers.updateFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
