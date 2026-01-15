import { SignalType, SignalSource } from '@/types/signal';
import { BadgeConfig } from '@/types/common';
import { UserRole } from '@/types/user';

export const SIGNAL_TYPE_CONFIG: Record<SignalType, BadgeConfig & { icon: string }> = {
  'bogus-scheme': {
    label: 'Bogus Scheme',
    variant: 'default',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'AlertTriangle',
  },
  'human-trafficking': {
    label: 'Human Trafficking',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: 'Users',
  },
  'drug-trafficking': {
    label: 'Drug Trafficking',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'Pill',
  },
  'bibob-research': {
    label: 'Bibob Research',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'FileSearch',
  },
  'money-laundering': {
    label: 'Money Laundering',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: 'Banknote',
  },
};

export const SIGNAL_SOURCE_CONFIG: Record<SignalSource, BadgeConfig & { icon: string }> = {
  'police': {
    label: 'Police',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'Shield',
  },
  'bibob-request': {
    label: 'Bibob Request',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'FileText',
  },
  'anonymous-report': {
    label: 'Anonymous Report',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'EyeOff',
  },
  'municipal-department': {
    label: 'Municipal Department',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: 'Building2',
  },
  'other': {
    label: 'Other',
    variant: 'outline',
    className: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: 'MoreHorizontal',
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

export const SIGNAL_TYPES: SignalType[] = ['bogus-scheme', 'human-trafficking', 'drug-trafficking', 'bibob-research', 'money-laundering'];
export const SIGNAL_SOURCES: SignalSource[] = ['police', 'bibob-request', 'anonymous-report', 'municipal-department', 'other'];

export const FOLDER_COLORS: string[] = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];
