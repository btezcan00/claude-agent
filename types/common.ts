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

