import { format, formatDistanceToNow, isBefore } from 'date-fns';
import { nl } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy', { locale: nl });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy HH:mm', { locale: nl });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: nl });
}

export function isOverdue(dueDate: string | Date | undefined): boolean {
  if (!dueDate) return false;
  return isBefore(new Date(dueDate), new Date());
}

export function formatDateForInput(date: string | Date | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
}
