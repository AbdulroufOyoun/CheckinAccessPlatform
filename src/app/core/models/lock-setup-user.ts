import { TenantSummary } from './tenant';

export interface LockSetupUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  active: boolean;
  tenants_count?: number;
  tenants?: TenantSummary[];
  created_at?: string;
}

export interface CreateLockSetupUserPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
  active?: boolean;
}

export interface UpdateLockSetupUserPayload {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  active?: boolean;
}
