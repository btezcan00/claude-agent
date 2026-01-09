import { User, Team, CurrentUser } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    employeeId: 'GOV-10001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@gov.agency',
    phone: '+1-555-0101',
    role: 'supervisor',
    department: 'investigations',
    title: 'Senior Supervisor',
    avatar: undefined,
    activeCasesCount: 3,
    maxCaseCapacity: 8,
    isActive: true,
    joinedAt: '2020-03-15T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'user-002',
    employeeId: 'GOV-10002',
    firstName: 'James',
    lastName: 'Rodriguez',
    email: 'james.rodriguez@gov.agency',
    phone: '+1-555-0102',
    role: 'investigator',
    department: 'field-operations',
    title: 'Field Investigator',
    avatar: undefined,
    activeCasesCount: 5,
    maxCaseCapacity: 6,
    isActive: true,
    joinedAt: '2021-06-20T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'user-003',
    employeeId: 'GOV-10003',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@gov.agency',
    phone: '+1-555-0103',
    role: 'analyst',
    department: 'analysis',
    title: 'Intelligence Analyst',
    avatar: undefined,
    activeCasesCount: 4,
    maxCaseCapacity: 10,
    isActive: true,
    joinedAt: '2022-01-10T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'user-004',
    employeeId: 'GOV-10004',
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'michael.thompson@gov.agency',
    phone: '+1-555-0104',
    role: 'investigator',
    department: 'investigations',
    title: 'Investigator',
    avatar: undefined,
    activeCasesCount: 6,
    maxCaseCapacity: 6,
    isActive: true,
    joinedAt: '2019-08-05T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'user-005',
    employeeId: 'GOV-10005',
    firstName: 'Lisa',
    lastName: 'Patel',
    email: 'lisa.patel@gov.agency',
    phone: '+1-555-0105',
    role: 'admin',
    department: 'management',
    title: 'Division Chief',
    avatar: undefined,
    activeCasesCount: 0,
    maxCaseCapacity: 2,
    isActive: true,
    joinedAt: '2018-02-14T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
  },
];

export const mockTeams: Team[] = [
  {
    id: 'team-001',
    name: 'Special Investigations Unit',
    description: 'Handles high-priority and complex cases',
    leaderId: 'user-001',
    memberIds: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'],
    createdAt: '2020-01-01T00:00:00Z',
  },
];

export const currentUser: CurrentUser = {
  ...mockUsers[0],
  permissions: [
    'cases:read',
    'cases:create',
    'cases:update',
    'cases:delete',
    'cases:assign',
    'team:read',
    'team:manage',
  ],
};

export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

export function getUserInitials(user: User): string {
  return `${user.firstName[0]}${user.lastName[0]}`;
}
