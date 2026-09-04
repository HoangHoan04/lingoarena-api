export const AUTH_SELF_API_PATHS = [
  '/api/admin/auth/me',
  '/api/admin/auth/get-info-user',
  '/api/admin/auth/update-password',
  '/api/admin/auth/sessions',
  '/api/admin/auth/logout',
  '/api/admin/auth/refresh-token',
  '/api/admin/auth/pagination-user-token',
  '/api/admin/auth/remove-user-token',
];

export function parsePathList(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return trimmed
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function normalizeRequestPath(url?: string): string {
  if (!url) return '';
  const path = url.split('?')[0];
  return path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
}

export function matchApiPath(requestPath: string, pattern: string): boolean {
  if (!pattern) return false;
  const normalizedPattern = normalizeRequestPath(pattern);
  const normalizedRequest = normalizeRequestPath(requestPath);

  if (normalizedPattern.endsWith('*')) {
    return normalizedRequest.startsWith(normalizedPattern.slice(0, -1));
  }

  return (
    normalizedRequest === normalizedPattern || normalizedRequest.startsWith(`${normalizedPattern}/`)
  );
}

export function isAuthSelfPath(requestPath: string): boolean {
  const normalized = normalizeRequestPath(requestPath);
  return AUTH_SELF_API_PATHS.some(path => matchApiPath(normalized, path));
}

export interface UserPermissionProfile {
  roles: { id: string; code: string; name: string }[];
  permissions: string[];
  pathWebs: string[];
  apiAccess: string[];
  apiNoAccess: string[];
}

export function mergeRolePermissions(
  roles: {
    id?: string;
    code: string;
    name: string;
    permissionCodes?: string[] | null;
    permissionKeys?: string;
    apiAllowPaths?: string;
    apiDenyPaths?: string;
    roleStringify?: string;
    lstPathApiAccess?: string;
    lstPathApiNoAccess?: string;
  }[],
): UserPermissionProfile {
  const permissionSet = new Set<string>();
  const pathWebSet = new Set<string>();
  const apiAccessSet = new Set<string>();
  const apiNoAccessSet = new Set<string>();

  for (const role of roles) {
    (role.permissionCodes || []).forEach(item => {
      permissionSet.add(item);
      pathWebSet.add(item);
      if (item.startsWith('/api')) apiAccessSet.add(item);
    });
    const menuKeys = role.permissionKeys ?? role.roleStringify;
    const allowPaths = role.apiAllowPaths ?? role.lstPathApiAccess;
    const denyPaths = role.apiDenyPaths ?? role.lstPathApiNoAccess;

    parsePathList(menuKeys).forEach(item => {
      permissionSet.add(item);
      pathWebSet.add(item);
    });
    parsePathList(allowPaths).forEach(item => apiAccessSet.add(item));
    parsePathList(denyPaths).forEach(item => apiNoAccessSet.add(item));
  }

  return {
    roles: roles
      .filter(role => role.id)
      .map(role => ({ id: role.id!, code: role.code, name: role.name })),
    permissions: [...permissionSet],
    pathWebs: [...pathWebSet],
    apiAccess: [...apiAccessSet],
    apiNoAccess: [...apiNoAccessSet],
  };
}

export function canAccessApiPath(
  requestPath: string,
  profile: UserPermissionProfile,
  isAdmin: boolean,
): boolean {
  const normalized = normalizeRequestPath(requestPath);

  if (isAdmin) return true;
  if (isAuthSelfPath(normalized)) return true;

  if (profile.apiNoAccess.some(path => matchApiPath(normalized, path))) {
    return false;
  }

  if (!profile.apiAccess.length) {
    return false;
  }

  return profile.apiAccess.some(path => matchApiPath(normalized, path));
}
