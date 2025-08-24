import { format } from 'date-fns';

export function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date)) return '—';
  return format(date, 'dd/MM/yyyy');
}

export default formatDate;
