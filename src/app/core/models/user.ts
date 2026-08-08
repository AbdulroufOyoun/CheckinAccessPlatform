import { TenantSummary } from './tenant';

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  active?: boolean;
  is_platform_admin?: boolean;
  created_via_platform?: boolean;
  tenants_count?: number;
  tenants?: TenantSummary[];
  title?: string | null;
  nationality?: string | null;
  created_at?: string | null;
}

export interface CreatePlatformUserPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
  title?: string | null;
  nationality?: string | null;
  is_platform_admin?: boolean;
  active?: boolean;
}

export interface UpdatePlatformUserPayload {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  title?: string | null;
  nationality?: string | null;
  is_platform_admin?: boolean;
  active?: boolean;
}

export interface LoginVerifyData {
  id: number;
  name: string;
  token: string;
  user: PlatformUser;
}
