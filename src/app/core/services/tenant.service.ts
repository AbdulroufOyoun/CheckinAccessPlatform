import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client.service';
import { AuthService } from './auth.service';
import {
  CreateTenantAdminPayload,
  CreateTenantPayload,
  TenantAdmin,
  TenantModule,
  TenantSummary,
} from '../models/tenant';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);

  async listMine(): Promise<TenantSummary[]> {
    return this.api.get<TenantSummary[]>('tenants');
  }

  async listAll(): Promise<TenantSummary[]> {
    return this.api.get<TenantSummary[]>('tenants/all');
  }

  async listForDashboard(): Promise<TenantSummary[]> {
    const user = this.auth.user();
    if (user?.is_platform_admin) {
      try {
        return await this.listAll();
      } catch {
        return this.listMine();
      }
    }
    return this.listMine();
  }

  async get(id: string): Promise<TenantSummary> {
    return this.api.get<TenantSummary>(`tenants/${id}`);
  }

  async create(payload: CreateTenantPayload): Promise<TenantSummary> {
    return this.api.post<TenantSummary>('tenants', payload);
  }

  async updateDomain(id: string, domain: string): Promise<TenantSummary> {
    return this.api.put<TenantSummary>(`tenants/${id}`, { domain });
  }

  async updateModules(id: string, modules: TenantModule[]): Promise<TenantSummary> {
    return this.api.put<TenantSummary>(`tenants/${id}/modules`, { modules });
  }

  async activate(id: string): Promise<TenantSummary> {
    return this.api.post<TenantSummary>(`tenants/${id}/activate`);
  }

  async deactivate(id: string): Promise<TenantSummary> {
    return this.api.post<TenantSummary>(`tenants/${id}/deactivate`);
  }

  async listAdmins(tenantId: string): Promise<TenantAdmin[]> {
    return this.api.get<TenantAdmin[]>(`tenants/${tenantId}/admins`);
  }

  async createAdmin(payload: CreateTenantAdminPayload): Promise<TenantAdmin> {
    return this.api.post<TenantAdmin>('tenants/admin', payload);
  }

  async linkUser(tenantId: string, userId: number): Promise<unknown> {
    return this.api.post(`tenants/${tenantId}/users`, { user_id: userId });
  }

  async unlinkUser(tenantId: string, userId: number): Promise<unknown> {
    return this.api.delete(`tenants/${tenantId}/users/${userId}`);
  }
}
