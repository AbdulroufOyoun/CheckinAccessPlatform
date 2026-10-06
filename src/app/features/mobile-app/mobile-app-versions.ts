import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PlatformMobileAppVersionService } from '../../core/services/platform-mobile-app-version.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/models/api-envelope';
import { MobileAppReleaseHistoryEntry } from '../../core/models/mobile-app-release-settings';

@Component({
  selector: 'app-mobile-app-versions',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './mobile-app-versions.html',
  styleUrl: './mobile-app-versions.css',
})
export class MobileAppVersionsPage implements OnInit {
  private readonly api = inject(PlatformMobileAppVersionService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  history: MobileAppReleaseHistoryEntry[] = [];

  form = this.fb.nonNullable.group({
    android_minimum_version: ['1.0.0', Validators.required],
    android_latest_version: ['1.0.0', Validators.required],
    android_store_url: [''],
    android_mandatory_latest: [false],
    ios_minimum_version: ['1.0.0', Validators.required],
    ios_latest_version: ['1.0.0', Validators.required],
    ios_store_url: [''],
    ios_mandatory_latest: [false],
    notes: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const data = await this.api.get();
      this.history = data.history ?? [];
      this.form.patchValue({
        android_minimum_version: data.android_minimum_version,
        android_latest_version: data.android_latest_version,
        android_store_url: data.android_store_url ?? '',
        ios_minimum_version: data.ios_minimum_version,
        ios_latest_version: data.ios_latest_version,
        ios_store_url: data.ios_store_url ?? '',
        android_mandatory_latest: false,
        ios_mandatory_latest: false,
        notes: '',
      });
    } catch (error) {
      this.toast.show(this.messageFromError(error, 'mobileApp.loadFailed'), 'danger');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    let androidMin = raw.android_minimum_version;
    let iosMin = raw.ios_minimum_version;
    if (raw.android_mandatory_latest) {
      androidMin = raw.android_latest_version;
    }
    if (raw.ios_mandatory_latest) {
      iosMin = raw.ios_latest_version;
    }

    const notes = raw.notes.trim();

    this.saving = true;
    this.cdr.detectChanges();
    try {
      const data = await this.api.update({
        android_minimum_version: androidMin,
        android_latest_version: raw.android_latest_version,
        android_store_url: raw.android_store_url.trim() || null,
        ios_minimum_version: iosMin,
        ios_latest_version: raw.ios_latest_version,
        ios_store_url: raw.ios_store_url.trim() || null,
        notes: notes || null,
      });
      this.history = data.history ?? [];
      this.form.patchValue({ notes: '' });
      this.toast.show(this.translate.instant('mobileApp.saved'), 'success');
    } catch (error) {
      this.toast.show(this.messageFromError(error, 'mobileApp.saveFailed'), 'danger');
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  changeLabel(field: string): string {
    const key = `mobileApp.fields.${field}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : field;
  }

  formatChangeValue(value: string | null): string {
    return value === null || value === '' ? '—' : value;
  }

  formatHistoryDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  private messageFromError(error: unknown, fallbackKey: string): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    return this.translate.instant(fallbackKey);
  }
}
