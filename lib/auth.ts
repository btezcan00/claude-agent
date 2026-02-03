import { User as ClerkUser } from '@clerk/nextjs/server';
import { CurrentUser, UserRole, Department, Permission } from '@/types/user';

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'signals:read',
    'signals:create',
    'signals:update',
    'signals:delete',
    'signals:assign',
    'cases:read',
    'cases:create',
    'cases:update',
    'cases:delete',
    'cases:assign',
    'team:read',
    'team:manage',
    'admin:access',
  ],
  supervisor: [
    'signals:read',
    'signals:create',
    'signals:update',
    'signals:delete',
    'signals:assign',
    'cases:read',
    'cases:create',
    'cases:update',
    'cases:delete',
    'cases:assign',
    'team:read',
    'team:manage',
  ],
  investigator: [
    'signals:read',
    'signals:create',
    'signals:update',
    'cases:read',
    'cases:create',
    'cases:update',
    'team:read',
  ],
  analyst: [
    'signals:read',
    'signals:create',
    'cases:read',
    'team:read',
  ],
};

// Default values for new users
const DEFAULT_ROLE: UserRole = 'analyst';
const DEFAULT_DEPARTMENT: Department = 'analysis';
const DEFAULT_TITLE = 'Team Member';

export interface ClerkUserMetadata {
  role?: UserRole;
  department?: Department;
  title?: string;
  employeeId?: string;
  phone?: string;
}

/**
 * Maps a Clerk user to the application's CurrentUser type
 */
export function mapClerkUserToCurrentUser(clerkUser: ClerkUser): CurrentUser {
  const metadata = (clerkUser.publicMetadata || {}) as ClerkUserMetadata;

  const role = metadata.role || DEFAULT_ROLE;
  const department = metadata.department || DEFAULT_DEPARTMENT;
  const title = metadata.title || DEFAULT_TITLE;
  const employeeId = metadata.employeeId || `EMP-${clerkUser.id.slice(-6).toUpperCase()}`;

  return {
    id: clerkUser.id,
    employeeId,
    firstName: clerkUser.firstName || 'User',
    lastName: clerkUser.lastName || '',
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    phone: metadata.phone,
    role,
    department,
    title,
    avatar: clerkUser.imageUrl,
    isActive: true,
    joinedAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
    lastActiveAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : undefined,
    permissions: ROLE_PERMISSIONS[role],
  };
}

/**
 * Client-side version for mapping useUser() result
 */
export function mapClerkUserToCurrentUserClient(clerkUser: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string;
  createdAt: Date | null;
  lastSignInAt: Date | null;
  publicMetadata: Record<string, unknown>;
}): CurrentUser {
  const metadata = (clerkUser.publicMetadata || {}) as ClerkUserMetadata;

  const role = metadata.role || DEFAULT_ROLE;
  const department = metadata.department || DEFAULT_DEPARTMENT;
  const title = metadata.title || DEFAULT_TITLE;
  const employeeId = metadata.employeeId || `EMP-${clerkUser.id.slice(-6).toUpperCase()}`;

  return {
    id: clerkUser.id,
    employeeId,
    firstName: clerkUser.firstName || 'User',
    lastName: clerkUser.lastName || '',
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    phone: metadata.phone,
    role,
    department,
    title,
    avatar: clerkUser.imageUrl,
    isActive: true,
    joinedAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
    lastActiveAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : undefined,
    permissions: ROLE_PERMISSIONS[role],
  };
}
