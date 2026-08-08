import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantModule } from '../../../core/models/tenant';
import { ApiError } from '../../../core/models/api-envelope';

@Component({
  selector: 'app-tenant-create',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './tenant-create.html',
  styleUrl: './tenant-create.css',
})
export class TenantCreatePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly tenantsApi = inject(TenantService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();
  private domainTouchedManually = false;

  loading = false;
  form = this.fb.nonNullable.group({
    company_name: [
      '',
      [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-z0-9][a-z0-9_-]*$/)],
    ],
    domain: ['', [Validators.required, Validators.maxLength(255)]],
    property: [true],
    education: [false],
  });

  constructor() {
    this.sub.add(this.form.valueChanges.subscribe(() => this.cdr.detectChanges()));
    this.sub.add(
      this.form.controls.domain.valueChanges.subscribe(() => {
        if (document.activeElement?.id === 'domain') {
          this.domainTouchedManually = true;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get companyId(): string {
    return this.form.controls.company_name.value.trim();
  }

  get mark(): string {
    const id = this.companyId || '?';
    return id.slice(0, 2).toUpperCase();
  }

  get resolvedDomain(): string {
    const raw = this.form.controls.domain.value.trim();
    if (!raw) return 'company.localhost';
    return raw.includes('.') ? raw : `${raw}.localhost`;
  }

  get selectedModules(): TenantModule[] {
    const modules: TenantModule[] = [];
    if (this.form.controls.property.value) modules.push('property');
    if (this.form.controls.education.value) modules.push('education');
    return modules;
  }

  get moduleCount(): number {
    return this.selectedModules.length;
  }

  onCompanyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_-]/g, '');
    if (cleaned !== input.value) {
      this.form.controls.company_name.setValue(cleaned, { emitEvent: true });
      input.value = cleaned;
    }
    if (!this.domainTouchedManually && cleaned) {
      this.form.controls.domain.setValue(`${cleaned}.localhost`, { emitEvent: true });
    }
    if (!cleaned && !this.domainTouchedManually) {
      this.form.controls.domain.setValue('', { emitEvent: true });
    }
  }

  onCompanyBlur(): void {
    const company = this.companyId;
    if (company && !this.form.controls.domain.value) {
      this.form.controls.domain.setValue(`${company}.localhost`);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const raw = this.form.getRawValue();
    const modules = this.selectedModules;
    if (!modules.length) {
      this.toast.show(this.translate.instant('tenants.selectModule'), 'warning');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    try {
      const tenant = await this.tenantsApi.create({
        company_name: raw.company_name.trim(),
        domain: this.resolvedDomain,
        modules,
      });
      this.toast.show(this.translate.instant('tenants.created'), 'success');
      await this.router.navigate(['/tenants', tenant.id]);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : this.translate.instant('tenants.createFailed');
      this.toast.show(message, 'danger');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
