import dayjs from 'dayjs';

export function money(value: unknown, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function yuan(value: unknown) {
  return `${money(value)} 元`;
}

export function integer(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('zh-CN');
}

export function textOf(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function todayText() {
  return dayjs().format('YYYY-MM-DD');
}

export function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function toServerDate(value: string) {
  if (!value) return '';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format('YYYY-MM-DD HH:mm:ss');
}

export function toInputDate(value: unknown) {
  if (!value) return '';
  const parsed = dayjs(String(value));
  if (!parsed.isValid()) return '';
  return parsed.format('YYYY-MM-DDTHH:mm');
}

export function inRange(value: unknown, start: string, end: string) {
  if (!start && !end) return true;
  const parsed = dayjs(String(value || ''));
  if (!parsed.isValid()) return false;
  if (start && parsed.isBefore(dayjs(start).startOf('day'))) return false;
  if (end && parsed.isAfter(dayjs(end).endOf('day'))) return false;
  return true;
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
