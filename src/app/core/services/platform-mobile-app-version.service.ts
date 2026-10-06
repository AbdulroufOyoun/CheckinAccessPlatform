import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client.service';
import {
  MobileAppReleaseSettings,
  MobileAppReleaseUpdatePayload,
} from '../models/mobile-app-release-settings';

@Injectable({ providedIn: 'root' })
export class PlatformMobileAppVersionService {
  private readonly api = inject(ApiClient);

  get(): Promise<MobileAppReleaseSettings> {
    return this.api.get<MobileAppReleaseSettings>('platform/mobile-app-versions');
  }

  update(payload: MobileAppReleaseUpdatePayload): Promise<MobileAppReleaseSettings> {
    return this.api.put<MobileAppReleaseSettings>('platform/mobile-app-versions', payload);
  }
}
