import { auth, currentUser } from '@clerk/nextjs/server';
import { CurrentUser } from '@/types/user';
import { mapClerkUserToCurrentUser } from './auth';

/**
 * Get the current authenticated user on the server
 * Returns null if not authenticated
 */
export async function getServerCurrentUser(): Promise<CurrentUser | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  return mapClerkUserToCurrentUser(clerkUser);
}

/**
 * Require authentication on the server
 * Throws an error if not authenticated
 */
export async function requireAuth(): Promise<CurrentUser> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await getServerCurrentUser();

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Get just the user ID on the server (for quick auth checks)
 */
export async function getServerUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
