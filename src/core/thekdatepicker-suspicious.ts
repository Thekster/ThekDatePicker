import type { ResolvedOptions } from './types.js';

export function isSuspiciousDate(date: Date, options: Pick<
  ResolvedOptions,
  'suspiciousWarning' | 'suspiciousYearSpan' | 'suspiciousMinYear' | 'suspiciousMaxYear'
>): boolean {
  if (!options.suspiciousWarning) return false;
  const year = date.getFullYear();
  const nowYear = new Date().getFullYear();
  const span = options.suspiciousYearSpan;
  const lowerBound = nowYear - span;
  const upperBound = nowYear + span;

  if (year < lowerBound || year > upperBound) return true;
  if (options.suspiciousMinYear != null && year < options.suspiciousMinYear) return true;
  if (options.suspiciousMaxYear != null && year > options.suspiciousMaxYear) return true;
  return false;
}
