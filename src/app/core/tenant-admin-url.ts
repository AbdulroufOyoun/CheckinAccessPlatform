import { environment } from '../../environments/environment';

/** Normalize stored domain (e.g. `ratco` → `ratco.localhost`). */
export function normalizeTenantDomain(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.includes('.') ? trimmed : `${trimmed}.localhost`;
}

/** Full URL to CheckinAccessFront for this tenant (scheme + host + port). */
export function buildTenantAdminUrl(domain: string | null | undefined): string | null {
  const host = normalizeTenantDomain(domain);
  if (!host) {
    return null;
  }
  const scheme = environment.tenantAdmin.scheme || 'http';
  const port = environment.tenantAdmin.port ?? 4200;
  const omitPort = (scheme === 'http' && port === 80) || (scheme === 'https' && port === 443);
  const portPart = omitPort ? '' : `:${port}`;
  return `${scheme}://${host}${portPart}/`;
}
