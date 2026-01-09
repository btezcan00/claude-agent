export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'investigator'
  | 'analyst';

export type Department =
  | 'investigations'
  | 'analysis'
  | 'field-operations'
  | 'management';

export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: Department;
  title: string;
  avatar?: string;
  activeCasesCount: number;
  maxCaseCapacity: number;
  isActive: boolean;
  joinedAt: string;
  lastActiveAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
}

export type Permission =
  | 'cases:read'
  | 'cases:create'
  | 'cases:update'
  | 'cases:delete'
  | 'cases:assign'
  | 'team:read'
  | 'team:manage'
  | 'admin:access';

export interface CurrentUser extends User {
  permissions: Permission[];
}
