import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client.service';
import {
  CreateLockSetupUserPayload,
  LockSetupUser,
  UpdateLockSetupUserPayload,
} from '../models/lock-setup-user';

@Injectable({ providedIn: 'root' })
export class LockSetupUserService {
  private readonly api = inject(ApiClient);

  async list(q?: string): Promise<LockSetupUser[]> {
    const params = q?.trim() ? { q: q.trim() } : undefined;
    return this.api.get<LockSetupUser[]>('lock-setup-users', params);
  }

  async get(id: number | string): Promise<LockSetupUser> {
    return this.api.get<LockSetupUser>(`lock-setup-users/${id}`);
  }

  async create(payload: CreateLockSetupUserPayload): Promise<LockSetupUser> {
    return this.api.post<LockSetupUser>('lock-setup-users', payload);
  }

  async update(id: number | string, payload: UpdateLockSetupUserPayload): Promise<LockSetupUser> {
    return this.api.put<LockSetupUser>(`lock-setup-users/${id}`, payload);
  }
}
