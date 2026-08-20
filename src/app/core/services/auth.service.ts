import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ApiClient } from './api-client.service';
import { LoginVerifyData, PlatformUser } from '../models/user';

const TOKEN_KEY = 'ca_platform_token';
const USER_KEY = 'ca_platform_user';
const OTP_EMAIL_KEY = 'ca_platform_otp_email';
const OTP_PASSWORD_KEY = 'ca_platform_otp_password';
const OTP_CODE_KEY = 'ca_platform_otp_code';
const ME_BOOTSTRAP_KEY = 'ca_platform_me_bootstrapped';
const ME_AT_KEY = 'ca_platform_me_at';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly tokenSignal = signal<string | null>(this.readStorage(TOKEN_KEY));
  private readonly userSignal = signal<PlatformUser | null>(this.readJson(USER_KEY));

  private mePromise: Promise<PlatformUser> | null = null;
  private meCachedAt = 0;
  private static readonly ME_TTL_MS = 300_000;

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const at = Number(sessionStorage.getItem(ME_AT_KEY) || 0);
      this.meCachedAt = Number.isFinite(at) ? at : 0;
    }
  }

  async login(email: string, password: string): Promise<{ sms?: string }> {
    const data = await this.api.post<{ sms?: string }>('users/login', { email, password });
    sessionStorage.setItem(OTP_EMAIL_KEY, email);
    sessionStorage.setItem(OTP_PASSWORD_KEY, password);
    if (data?.sms) {
      sessionStorage.setItem(OTP_CODE_KEY, String(data.sms));
    } else {
      sessionStorage.removeItem(OTP_CODE_KEY);
    }
    return data;
  }

  getPendingOtp(): string | null {
    try {
      return sessionStorage.getItem(OTP_CODE_KEY);
    } catch {
      return null;
    }
  }

  async verify(code: string): Promise<LoginVerifyData> {
    const email = sessionStorage.getItem(OTP_EMAIL_KEY) || '';
    const password = sessionStorage.getItem(OTP_PASSWORD_KEY) || '';
    if (!email || !password) {
      throw new Error('OTP session expired. Please login again.');
    }

    const data = await this.api.post<LoginVerifyData>('users/verify', {
      email,
      password,
      verification_code: code,
    });

    this.persistSession(data.token, data.user ?? { id: data.id, name: data.name, email });
    sessionStorage.removeItem(OTP_EMAIL_KEY);
    sessionStorage.removeItem(OTP_PASSWORD_KEY);
    sessionStorage.removeItem(OTP_CODE_KEY);
    return data;
  }

  private isMeBootstrapped(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return sessionStorage.getItem(ME_BOOTSTRAP_KEY) === '1';
  }

  private markMeBootstrapped(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem(ME_BOOTSTRAP_KEY, '1');
    sessionStorage.setItem(ME_AT_KEY, String(this.meCachedAt));
  }

  /** Use cached profile when available; only hits /me when needed (login or stale session). */
  async ensureMe(): Promise<PlatformUser> {
    const cached = this.userSignal();
    if (cached && this.isMeBootstrapped()) {
      return cached;
    }
    return this.refreshMe();
  }

  async refreshMe(force = false): Promise<PlatformUser> {
    const now = Date.now();
    const current = this.userSignal();
    if (!force && current && this.isMeBootstrapped()) {
      return current;
    }
    if (!force && current && now - this.meCachedAt < AuthService.ME_TTL_MS) {
      return current;
    }
    if (this.mePromise) {
      return this.mePromise;
    }

    this.mePromise = this.api
      .get<PlatformUser>('users/me')
      .then((me) => {
        this.userSignal.set(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        this.meCachedAt = Date.now();
        this.markMeBootstrapped();
        return me;
      })
      .finally(() => {
        this.mePromise = null;
      });

    return this.mePromise;
  }

  logout(navigate = true): void {
    this.mePromise = null;
    this.meCachedAt = 0;
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(OTP_EMAIL_KEY);
    sessionStorage.removeItem(OTP_PASSWORD_KEY);
    sessionStorage.removeItem(OTP_CODE_KEY);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(ME_BOOTSTRAP_KEY);
      sessionStorage.removeItem(ME_AT_KEY);
    }
    if (navigate) {
      void this.router.navigate(['/login']);
    }
  }

  private persistSession(token: string, user: PlatformUser): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.meCachedAt = Date.now();
    this.markMeBootstrapped();
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private readJson(key: string): PlatformUser | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as PlatformUser) : null;
    } catch {
      return null;
    }
  }
}
