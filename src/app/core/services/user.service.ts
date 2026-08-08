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

  async listPlatformUsers(q?: string): Promise<PlatformUser[]> {
    const params = q?.trim() ? { q: q.trim() } : undefined;
    return this.api.get<PlatformUser[]>('users', params);
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
