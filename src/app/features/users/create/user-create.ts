import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/api-envelope';

@Component({
  selector: 'app-user-create',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css',
})
export class UserCreatePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UserService);
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
    is_platform_admin: [false],
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
      await this.usersApi.createPlatformUser({
        name: raw.name.trim(),
        email: raw.email.trim(),
        mobile: raw.mobile.trim(),
        password: raw.password,
        is_platform_admin: raw.is_platform_admin,
      });
      this.toast.show(this.translate.instant('users.created'), 'success');
      await this.router.navigate(['/users']);
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('users.createFailed'),
        'danger',
      );
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
