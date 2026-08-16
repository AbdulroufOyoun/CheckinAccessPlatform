import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client.service';
import {
  CreatePlatformUserPayload,
  PlatformUser,
  UpdatePlatformUserPayload,
} from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiClient);

  async listPlatformUsers(
    q?: string,
    options?: { isPlatformAdmin?: boolean },
  ): Promise<PlatformUser[]> {
    const params: Record<string, string | boolean> = {};
    if (q?.trim()) {
      params['q'] = q.trim();
    }
    if (options?.isPlatformAdmin !== undefined) {
      params['is_platform_admin'] = options.isPlatformAdmin;
    }
    return this.api.get<PlatformUser[]>('users', Object.keys(params).length ? params : undefined);
  }

  async getPlatformUser(id: number | string): Promise<PlatformUser> {
    return this.api.get<PlatformUser>(`users/${id}`);
  }

  async createPlatformUser(payload: CreatePlatformUserPayload): Promise<PlatformUser> {
    return this.api.post<PlatformUser>('users', payload);
  }

  async updatePlatformUser(
    id: number | string,
    payload: UpdatePlatformUserPayload,
  ): Promise<PlatformUser> {
    return this.api.put<PlatformUser>(`users/${id}`, payload);
  }
}
