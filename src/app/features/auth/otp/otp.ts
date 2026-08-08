import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/api-envelope';
import { LangSwitcher } from '../../../shared/lang-switcher/lang-switcher';

@Component({
  selector: 'app-otp',
  imports: [RouterLink, TranslatePipe, LangSwitcher, FormsModule],
  templateUrl: './otp.html',
  styleUrl: './otp.css',
})
export class OtpPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  hasError = false;
  errorMessage = '';
  devOtp: string | null = null;
  otp: string[] = ['', '', '', '', '', ''];

  ngOnInit(): void {
    this.devOtp = this.auth.getPendingOtp();
    if (this.devOtp && this.devOtp.length === 6) {
      this.otp = this.devOtp.split('');
      this.toast.show(`${this.translate.instant('auth.devOtp')}: ${this.devOtp}`, 'info');
    }
    this.cdr.detectChanges();
  }

  useDevOtp(): void {
    if (this.devOtp && this.devOtp.length === 6) {
      this.otp = this.devOtp.split('');
      this.hasError = false;
      this.cdr.detectChanges();
      void this.submit();
    }
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.otp[index] = value;
    this.hasError = false;
    this.cdr.detectChanges();
    if (value && index < 5) {
      const next = input.parentElement?.querySelectorAll('input')[index + 1] as HTMLInputElement | undefined;
      next?.focus();
    }
    if (this.otp.join('').length === 6) {
      void this.submit();
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.submit();
      return;
    }
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prev = input.parentElement?.querySelectorAll('input')[index - 1] as HTMLInputElement | undefined;
      prev?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) || '';
    if (!text) return;
    this.otp = text
      .padEnd(6, ' ')
      .split('')
      .map((c) => (c === ' ' ? '' : c))
      .slice(0, 6);
    while (this.otp.length < 6) this.otp.push('');
    this.cdr.detectChanges();
    if (this.otp.join('').length === 6) {
      void this.submit();
    }
  }

  async submit(): Promise<void> {
    if (this.loading) return;

    const code = this.otp.join('').replace(/\D/g, '').slice(0, 6);
    if (code.length < 6) {
      this.hasError = true;
      this.errorMessage = this.translate.instant('auth.otpIncomplete');
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.hasError = false;
    this.cdr.detectChanges();
    try {
      await this.auth.verify(code);
      this.toast.show(this.translate.instant('auth.loggedIn'), 'success');
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.hasError = true;
      this.errorMessage =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : this.translate.instant('auth.loginFailed');
      this.toast.show(this.errorMessage, 'danger');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
