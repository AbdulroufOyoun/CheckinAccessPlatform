import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TenantService } from '../../../core/services/tenant.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantAdmin, TenantModule, TenantSummary } from '../../../core/models/tenant';
import { PlatformUser } from '../../../core/models/user';
import { ApiError } from '../../../core/models/api-envelope';

@Component({
  selector: 'app-tenant-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './tenant-detail.html',
  styleUrl: './tenant-detail.css',
})
export class TenantDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tenantsApi = inject(TenantService);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly modal = inject(NgbModal);

  @ViewChild('deactivateModal') private deactivateModal?: TemplateRef<unknown>;

  tenantId = '';
  tenant: TenantSummary | null = null;
  platformUsers: PlatformUser[] = [];
  tenantAdmins: TenantAdmin[] = [];
  loading = true;
  saving = false;

  domainForm = this.fb.nonNullable.group({
    domain: ['', Validators.required],
  });

  modulesForm = this.fb.nonNullable.group({
    property: [true],
    education: [false],
  });

  adminForm = this.fb.nonNullable.group({
    name: ['Admin', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  linkForm = this.fb.nonNullable.group({
    user_id: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    this.tenantId = this.route.snapshot.paramMap.get('id') || '';
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const [tenant, users, admins] = await Promise.all([
        this.tenantsApi.get(this.tenantId),
        this.usersApi.listPlatformUsers().catch(() => [] as PlatformUser[]),
        this.tenantsApi.listAdmins(this.tenantId).catch(() => [] as TenantAdmin[]),
      ]);
      this.tenant = tenant;
      this.platformUsers = Array.isArray(users) ? users : [];
      this.tenantAdmins = Array.isArray(admins) ? admins : [];
      this.domainForm.patchValue({ domain: this.tenant.domain || '' });
      this.modulesForm.patchValue({
        property: this.tenant.modules?.includes('property') ?? false,
        education: this.tenant.modules?.includes('education') ?? false,
      });
    } catch (error) {
      this.tenant = null;
      this.tenantAdmins = [];
      const message =
        error instanceof ApiError ? error.message : this.translate.instant('tenants.loadOneFailed');
      this.toast.show(message, 'danger');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  adminMark(name: string): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  roleLabel(roles?: string[]): string {
    if (!roles?.length) return this.translate.instant('tenants.adminRole');
    return roles.join(', ');
  }

  async saveDomain(): Promise<void> {
    if (this.domainForm.invalid) return;
    this.saving = true;
    this.cdr.detectChanges();
    try {
      this.tenant = await this.tenantsApi.updateDomain(
        this.tenantId,
        this.domainForm.controls.domain.value.trim(),
      );
      this.toast.show(this.translate.instant('tenants.domainUpdated'), 'success');
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('tenants.updateFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async saveModules(): Promise<void> {
    const modules: TenantModule[] = [];
    if (this.modulesForm.controls.property.value) modules.push('property');
    if (this.modulesForm.controls.education.value) modules.push('education');
    if (!modules.length) {
      this.toast.show(this.translate.instant('tenants.selectModule'), 'warning');
      return;
    }
    this.saving = true;
    this.cdr.detectChanges();
    try {
      this.tenant = await this.tenantsApi.updateModules(this.tenantId, modules);
      this.toast.show(this.translate.instant('tenants.modulesUpdated'), 'success');
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('tenants.updateFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async toggleActive(): Promise<void> {
    if (!this.tenant) return;
    if (this.tenant.active) {
      const confirmed = await this.confirmDeactivate();
      if (!confirmed) return;
    }
    this.saving = true;
    this.cdr.detectChanges();
    try {
      this.tenant = this.tenant.active
        ? await this.tenantsApi.deactivate(this.tenantId)
        : await this.tenantsApi.activate(this.tenantId);
      this.toast.show(
        this.translate.instant(this.tenant.active ? 'tenants.activated' : 'tenants.deactivated'),
        'success',
      );
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('tenants.statusFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  private async confirmDeactivate(): Promise<boolean> {
    if (!this.deactivateModal) return false;
    const ref = this.modal.open(this.deactivateModal, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      windowClass: 'ca-confirm-window',
      backdropClass: 'ca-confirm-backdrop',
      modalDialogClass: 'ca-confirm-dialog',
      ariaLabelledBy: 'ca-deactivate-title',
    });
    try {
      await ref.result;
      return true;
    } catch {
      return false;
    }
  }

  async createAdmin(): Promise<void> {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.cdr.detectChanges();
    try {
      const raw = this.adminForm.getRawValue();
      const created = await this.tenantsApi.createAdmin({
        tenant_id: this.tenantId,
        name: raw.name,
        email: raw.email,
        mobile: raw.mobile,
        password: raw.password,
      });
      this.tenantAdmins = [...this.tenantAdmins, created];
      this.toast.show(this.translate.instant('tenants.adminCreated'), 'success');
      this.adminForm.reset({ name: 'Admin', email: '', mobile: '', password: '' });
      try {
        this.tenantAdmins = await this.tenantsApi.listAdmins(this.tenantId);
      } catch {
        /* keep optimistic list */
      }
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('tenants.adminFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async linkUser(): Promise<void> {
    const userId = Number(this.linkForm.controls.user_id.value);
    if (!userId) {
      this.linkForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.cdr.detectChanges();
    try {
      await this.tenantsApi.linkUser(this.tenantId, userId);
      this.toast.show(this.translate.instant('tenants.userLinked'), 'success');
      this.linkForm.reset({ user_id: '' });
    } catch (error) {
      this.toast.show(
        error instanceof ApiError ? error.message : this.translate.instant('tenants.linkFailed'),
        'danger',
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
