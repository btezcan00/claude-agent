'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { User, CurrentUser, Team } from '@/types/user';
import { mockUsers, mockTeams } from '@/data/mock-users';
import { mapClerkUserToCurrentUserClient } from '@/lib/auth';

interface UserContextValue {
  currentUser: CurrentUser | null;
  users: User[];
  teams: Team[];
  isLoaded: boolean;
  isSignedIn: boolean;
  getUserById: (id: string) => User | undefined;
  getTeamById: (id: string) => Team | undefined;
  getUserFullName: (user: User) => string;
  getUserInitials: (user: User) => string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  const currentUser = useMemo(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) {
      return null;
    }
    return mapClerkUserToCurrentUserClient(clerkUser);
  }, [clerkUser, isLoaded, isSignedIn]);

  const getUserById = (id: string): User | undefined => {
    // First check if it's the current user
    if (currentUser && currentUser.id === id) {
      return currentUser;
    }
    // Fall back to mock users for other users
    return mockUsers.find((user) => user.id === id);
  };

  const getTeamById = (id: string): Team | undefined => {
    return mockTeams.find((team) => team.id === id);
  };

  const getUserFullName = (user: User): string => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserInitials = (user: User): string => {
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  const value: UserContextValue = {
    currentUser,
    users: mockUsers,
    teams: mockTeams,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    getUserById,
    getTeamById,
    getUserFullName,
    getUserInitials,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}
