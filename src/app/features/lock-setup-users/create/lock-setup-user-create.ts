import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LockSetupUserService } from '../../../core/services/lock-setup-user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/api-envelope';

@Component({
  selector: 'app-lock-setup-user-create',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './lock-setup-user-create.html',
  styleUrl: '../../users/create/user-create.css',
})
export class LockSetupUserCreatePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly lockSetupUsersApi = inject(LockSetupUserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();

  loading = false;
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
  });

  constructor() {
    this.sub.add(this.form.valueChanges.subscribe(() => this.cdr.detectChanges()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    try {
      const raw = this.form.getRawValue();
      await this.lockSetupUsersApi.create({
        name: raw.name.trim(),
        email: raw.email.trim(),
        mobile: raw.mobile.trim(),
        password: raw.password,
      });
      this.toast.show(this.translate.instant('lockSetupUsers.created'), 'success');
      await this.router.navigate(['/lock-setup-users']);
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('lockSetupUsers.createFailed'),
        'danger',
      );
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
