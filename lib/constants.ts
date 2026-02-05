import { SignalType, SignalSource } from '@/types/signal';
import { BadgeConfig } from '@/types/common';
import { UserRole } from '@/types/user';

export const SIGNAL_TYPE_CONFIG: Record<SignalType, BadgeConfig & { icon: string }> = {
  'malafide-constructie': {
    label: 'Malafide Constructie',
    variant: 'default',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'AlertTriangle',
  },
  'mensenhandel': {
    label: 'Mensenhandel',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: 'Users',
  },
  'drugshandel': {
    label: 'Drugshandel',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'Pill',
  },
  'bibob-onderzoek': {
    label: 'Bibob Onderzoek',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'FileSearch',
  },
  'witwassen': {
    label: 'Witwassen',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: 'Banknote',
  },
};

export const SIGNAL_SOURCE_CONFIG: Record<SignalSource, BadgeConfig & { icon: string }> = {
  'politie': {
    label: 'Politie',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'Shield',
  },
  'bibob-aanvraag': {
    label: 'Bibob Aanvraag',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'FileText',
  },
  'anonieme-melding': {
    label: 'Anonieme Melding',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'EyeOff',
  },
  'gemeentelijke-afdeling': {
    label: 'Gemeentelijke Afdeling',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: 'Building2',
  },
  'overig': {
    label: 'Overig',
    variant: 'outline',
    className: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: 'MoreHorizontal',
  },
};

export const USER_ROLE_CONFIG: Record<UserRole, BadgeConfig> = {
  'admin': {
    label: 'Beheerder',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800',
  },
  'supervisor': {
    label: 'Leidinggevende',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800',
  },
  'investigator': {
    label: 'Onderzoeker',
    variant: 'secondary',
    className: 'bg-green-100 text-green-800',
  },
  'analyst': {
    label: 'Analist',
    variant: 'outline',
    className: 'bg-purple-100 text-purple-800',
  },
};

export const SIGNAL_TYPES: SignalType[] = ['malafide-constructie', 'mensenhandel', 'drugshandel', 'bibob-onderzoek', 'witwassen'];
export const SIGNAL_SOURCES: SignalSource[] = ['politie', 'bibob-aanvraag', 'anonieme-melding', 'gemeentelijke-afdeling', 'overig'];

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
