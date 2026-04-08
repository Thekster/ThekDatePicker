import { toLocalStartOfDay } from "./date-utils.js";

export function getDefaultFocusedDay(
  selectedDate: Date | null,
  minDate: Date | null,
  maxDate: Date | null,
  isDateDisabled: (date: Date) => boolean,
): Date {
  const candidate = selectedDate ? new Date(selectedDate) : new Date();
  const normalized = toLocalStartOfDay(candidate);
  if (isDateDisabled(normalized)) {
    if (minDate) return toLocalStartOfDay(minDate);
    if (maxDate) return toLocalStartOfDay(maxDate);
  }
  return normalized;
}

export function moveFocusedDay(baseTs: number, deltaDays: number): Date {
  const base = new Date(baseTs);
  base.setDate(base.getDate() + deltaDays);
  return base;
}

export function moveFocusToWeekBoundary(
  baseTs: number,
  weekStartsOn: number,
  toEnd: boolean,
): Date {
  const base = new Date(baseTs);
  const currentDay = base.getDay();
  const startOffset = (currentDay - weekStartsOn + 7) % 7;
  const endOffset = 6 - startOffset;
  base.setDate(base.getDate() + (toEnd ? endOffset : -startOffset));
  return base;
}

export function moveFocusedMonth(baseTs: number, deltaMonths: number): Date {
  const base = new Date(baseTs);
  const day = base.getDate();
  base.setDate(1);
  base.setMonth(base.getMonth() + deltaMonths);
  base.setDate(Math.min(day, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()));
  return base;
}
