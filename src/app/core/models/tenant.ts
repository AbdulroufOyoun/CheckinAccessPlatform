export type TenantModule = 'property' | 'education';

export interface TenantDomain {
  id?: number;
  domain: string;
  tenant_id?: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  domain: string | null;
  active: boolean;
  modules: TenantModule[];
  created_at?: string;
  domains?: TenantDomain[];
}

export interface CreateTenantPayload {
  company_name: string;
  domain: string;
  modules: TenantModule[];
}

export interface CreateTenantAdminPayload {
  tenant_id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export interface TenantAdmin {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  active?: boolean;
  roles?: string[];
  created_at?: string | null;
}
