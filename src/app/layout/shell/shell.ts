import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { LangSwitcher } from '../../shared/lang-switcher/lang-switcher';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LangSwitcher],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellLayout implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  readonly moreOpen = signal(false);
  readonly routeLoading = signal(true);

  readonly initials = computed(() => {
    const name = this.auth.user()?.name?.trim() || this.auth.user()?.email || 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  constructor() {
    this.router.events
      .pipe(
        filter(
          (
            event,
          ): event is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.routeLoading.set(true);
          this.closeMore();
          return;
        }
        this.closeMore();
        if (event instanceof NavigationEnd) {
          this.updateTitle(event.urlAfterRedirects);
        }
        this.routeLoading.set(false);
      });

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.updateTitle(this.router.url);
    });
  }

  ngOnInit(): void {
    this.updateTitle(this.router.url);
    void this.auth.ensureMe();
  }

  onRouteActivate(): void {
    this.routeLoading.set(false);
  }

  private updateTitle(url: string): void {
    const appName = this.translate.instant('app.name') || 'CheckinAccess';
    const t = (key: string): string => this.translate.instant(key) || key;

    const path = (url || '').split('?')[0];
    let pageTitle = '';

    if (path === '/dashboard' || path.startsWith('/dashboard/')) {
      pageTitle = t('dashboard.overview');
    } else if (path === '/tenants') {
      pageTitle = t('tenants.title');
    } else if (path.startsWith('/tenants/new')) {
      pageTitle = t('tenants.createTitle');
    } else if (path.startsWith('/tenants/')) {
      const tenantId = path.split('/')[2] || '';
      pageTitle = tenantId ? `${t('tenants.title')} ${tenantId}` : t('tenants.title');
    } else if (path === '/users') {
      pageTitle = t('users.title');
    } else if (path.startsWith('/users/new')) {
      pageTitle = t('users.createTitle');
    } else if (path.startsWith('/users/')) {
      const userId = path.split('/')[2] || '';
      pageTitle = userId ? `${t('users.title')} ${userId}` : t('users.title');
    } else if (path === '/reports') {
      pageTitle = t('nav.reports');
    } else if (path === '/admins') {
      pageTitle = t('nav.admins');
    }

    if (!pageTitle || pageTitle === appName) {
      this.title.setTitle(appName);
      return;
    }

    this.title.setTitle(`${pageTitle} | ${appName}`);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.moreOpen()) {
      this.closeMore();
    }
  }

  openMore(): void {
    this.moreOpen.set(true);
  }

  closeMore(): void {
    this.moreOpen.set(false);
  }

  toggleMore(): void {
    this.moreOpen.update((open) => !open);
  }

  logout(): void {
    this.closeMore();
    this.auth.logout();
  }
}
