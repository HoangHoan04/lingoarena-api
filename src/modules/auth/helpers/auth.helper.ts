import { UserEntity, UserProfileEntity } from '~/entities';

export type PublicAuthUser = {
  id: string;
  email: string;
  phone: string | null;
  username: string | null;
  roles: string[];
  role: string | null;
  fullName: string | null;
  displayName: string | null;
  name: string;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt?: Date | null;
  preferredLanguage?: string;
  timezone?: string;
  profile: UserProfileEntity | null;
  permissions?: string[];
};

export function normalizeLoginIdentifier(raw: string): string {
  return (raw || '').trim();
}

export function normalizeEmail(raw: string): string {
  return normalizeLoginIdentifier(raw).toLowerCase();
}

export function isJwtLike(token: string): boolean {
  return token.split('.').length === 3 && !token.startsWith('mock-');
}

export function resolveDisplayName(
  profile?: Pick<UserProfileEntity, 'displayName' | 'fullName'> | null,
  user?: Pick<UserEntity, 'username' | 'email'> | null,
): string {
  return profile?.displayName || profile?.fullName || user?.username || user?.email || '';
}

export function buildPublicUser(
  user: UserEntity,
  profile?: UserProfileEntity | null,
  roles: string[] = [],
  permissions: string[] = [],
): PublicAuthUser {
  const displayName = resolveDisplayName(profile, user) || user.email;
  return {
    id: user.id,
    email: user.email,
    phone: user.phone || null,
    username: user.username || null,
    roles,
    role: roles[0] || null,
    fullName: profile?.fullName || null,
    displayName,
    name: displayName,
    avatarUrl: profile?.avatarUrl || null,
    emailVerifiedAt: user.emailVerifiedAt || null,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt || null,
    preferredLanguage: user.preferredLanguage || 'vi',
    timezone: user.timezone || 'Asia/Ho_Chi_Minh',
    profile: profile || null,
    permissions,
  };
}

export function resolveCustomerFrontendUrl(): string {
  return (
    process.env.GOOGLE_FRONTEND_REDIRECT_URL ||
    process.env.FACEBOOK_FRONTEND_REDIRECT_URL ||
    process.env.CUSTOMER_URL ||
    'http://localhost:2504'
  );
}

export function buildOAuthFrontendRedirect(options: {
  frontendUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}): string {
  const base = options.frontendUrl || resolveCustomerFrontendUrl();
  const url = new URL(base);

  if (!url.pathname.includes('oauth-callback')) {
    const prefix = url.pathname.replace(/\/$/, '');
    url.pathname = `${prefix}/oauth-callback`;
  }

  url.search = '';

  if (options.error) {
    url.searchParams.set('error', options.error);
    return url.toString();
  }

  if (options.accessToken) {
    url.searchParams.set('accessToken', options.accessToken);
  }
  if (options.refreshToken) {
    url.searchParams.set('refreshToken', options.refreshToken);
  }

  return url.toString();
}
