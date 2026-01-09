'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User, CurrentUser, Team } from '@/types/user';
import { mockUsers, mockTeams, currentUser } from '@/data/mock-users';

interface UserContextValue {
  currentUser: CurrentUser;
  users: User[];
  teams: Team[];
  getUserById: (id: string) => User | undefined;
  getTeamById: (id: string) => Team | undefined;
  getUserFullName: (user: User) => string;
  getUserInitials: (user: User) => string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const getUserById = (id: string): User | undefined => {
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
