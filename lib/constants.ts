import { CaseType, CaseStatus, PriorityLevel } from '@/types/case';
import { BadgeConfig } from '@/types/common';
import { UserRole } from '@/types/user';

export const CASE_TYPE_CONFIG: Record<CaseType, BadgeConfig & { icon: string }> = {
  'human-trafficking': {
    label: 'Human Trafficking',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: 'Users',
  },
  'illegal-drugs': {
    label: 'Illegal Drugs',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'Pill',
  },
  'illegal-prostitution': {
    label: 'Illegal Prostitution',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'AlertTriangle',
  },
};

export const CASE_STATUS_CONFIG: Record<CaseStatus, BadgeConfig & { icon: string }> = {
  'open': {
    label: 'Open',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-300',
    icon: 'Circle',
  },
  'in-progress': {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
    icon: 'Clock',
  },
  'closed': {
    label: 'Closed',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: 'CheckCircle',
  },
};

export const PRIORITY_CONFIG: Record<PriorityLevel, BadgeConfig & { icon: string }> = {
  'low': {
    label: 'Low',
    variant: 'outline',
    className: 'bg-slate-50 text-slate-600 border-slate-300',
    icon: 'ArrowDown',
  },
  'medium': {
    label: 'Medium',
    variant: 'secondary',
    className: 'bg-blue-50 text-blue-600 border-blue-300',
    icon: 'Minus',
  },
  'high': {
    label: 'High',
    variant: 'default',
    className: 'bg-orange-50 text-orange-600 border-orange-300',
    icon: 'ArrowUp',
  },
  'critical': {
    label: 'Critical',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-400',
    icon: 'AlertCircle',
  },
};

export const USER_ROLE_CONFIG: Record<UserRole, BadgeConfig> = {
  'admin': {
    label: 'Admin',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800',
  },
  'supervisor': {
    label: 'Supervisor',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800',
  },
  'investigator': {
    label: 'Investigator',
    variant: 'secondary',
    className: 'bg-green-100 text-green-800',
  },
  'analyst': {
    label: 'Analyst',
    variant: 'outline',
    className: 'bg-purple-100 text-purple-800',
  },
};

export const STATUS_WORKFLOW: Record<CaseStatus, CaseStatus[]> = {
  'open': ['in-progress'],
  'in-progress': ['open', 'closed'],
  'closed': ['in-progress'],
};

export const CASE_TYPES: CaseType[] = ['human-trafficking', 'illegal-drugs', 'illegal-prostitution'];
export const CASE_STATUSES: CaseStatus[] = ['open', 'in-progress', 'closed'];
export const PRIORITY_LEVELS: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];
