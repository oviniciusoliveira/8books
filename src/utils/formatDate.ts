import { format } from 'date-fns';

export function formatDate(date: string): string {
  return format(new Date(date), 'd MMM y').toLowerCase();
}
