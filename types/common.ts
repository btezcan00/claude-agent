import { ReactNode } from 'react';

export type ViewMode = 'list' | 'grid';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface BadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export interface CaseStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  critical: number;
  high: number;
  unassigned: number;
}
