import type { ResolvedOptions } from './types.js';

const TOKENS = [
  'YYYY',
  'YY',
  'DD',
  'D',
  'MM',
  'M',
  'HH',
  'H',
  'hh',
  'h',
  'mm',
  'm',
  'A',
  'a'
] as const;
export type FormatPart = { type: 'token'; value: Token } | { type: 'literal'; value: string };
export const MASK_SEPARATORS = ['/', '-', '.', ',', ':', ' '] as const;
const TOKEN_MASK_LENGTH: Record<Token, number> = {
  YYYY: 4,
  YY: 2,
  DD: 2,
  D: 2,
  MM: 2,
  M: 2,
  HH: 2,
  H: 2,
  hh: 2,
  h: 2,
  mm: 2,
  m: 2,
  A: 2,
  a: 2
};

const DEFAULT_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const DEFAULT_WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

const ISO_DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;

export function parseIsoDateString(value: string): Date | null {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = hourStr !== undefined ? Number(hourStr) : 0;
  const minute = minuteStr !== undefined ? Number(minuteStr) : 0;
  const second = secondStr !== undefined ? Number(secondStr) : 0;

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;

  const date = new Date(year, month - 1, day, hour, minute, second, 0);
  return isValidDate(date) ? date : null;
}

export function toLocalStartOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function resolveTwoDigitYear(value: number, now = new Date()): number {
  const currentYear = now.getFullYear();
  let resolved = Math.floor(currentYear / 100) * 100 + value;
  if (resolved - currentYear > 50) resolved -= 100;
  else if (currentYear - resolved > 50) resolved += 100;
  return resolved;
}

const formatTokenCache = new Map<string, readonly FormatPart[]>();

export function tokenizeFormat(format: string): readonly FormatPart[] {
  const cached = formatTokenCache.get(format);
  if (cached) return cached;

  const parts: FormatPart[] = [];
  let i = 0;

  while (i < format.length) {
    if (format[i] === '[') {
      const end = format.indexOf(']', i);
      if (end !== -1) {
        const literal = format.slice(i + 1, end);
        for (const char of literal) {
          parts.push({ type: 'literal', value: char });
        }
        i = end + 1;
        continue;
      }
    }

    let matchedToken: Token | null = null;
    for (const token of TOKENS) {
      if (format.slice(i, i + token.length) === token) {
        matchedToken = token;
        break;
      }
    }

    if (matchedToken) {
      parts.push({ type: 'token', value: matchedToken });
      i += matchedToken.length;
      continue;
    }

    parts.push({ type: 'literal', value: format[i] });
    i += 1;
  }

  const tokenized = parts as readonly FormatPart[];
  formatTokenCache.set(format, tokenized);
  return tokenized;
}

export function applyMaskToInput(value: string, format: string): string {
  if (!value) return '';
  const parts = tokenizeFormat(format);
  const digits = value.replace(/\D/g, '');
  const meridiemChars = value.replace(/[^aApPmM]/g, '');

  let out = '';
  let digitIndex = 0;
  let meridiemIndex = 0;

  function hasRemainingData(startIndex: number): boolean {
    let d = digitIndex;
    let m = meridiemIndex;
    for (let i = startIndex; i < parts.length; i += 1) {
      const part = parts[i];
      if (part.type === 'literal') continue;
      if (part.value === 'A' || part.value === 'a') {
        if (m < meridiemChars.length) return true;
        continue;
      }
      if (d < digits.length) return true;
      d += TOKEN_MASK_LENGTH[part.value];
    }
    return false;
  }

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];

    if (part.type === 'literal') {
      if (hasRemainingData(i + 1)) {
        out += part.value;
      }
      continue;
    }

    if (part.value === 'A' || part.value === 'a') {
      const char = meridiemChars[meridiemIndex];
      if (!char) break;
      const isPm = char.toLowerCase() === 'p';
      const first = part.value === 'A' ? (isPm ? 'P' : 'A') : isPm ? 'p' : 'a';

      // Look ahead for 'M'
      const nextChar = meridiemChars[meridiemIndex + 1];
      const hasM = nextChar && nextChar.toLowerCase() === 'm';

      out += first;
      meridiemIndex += 1;
      if (hasM) {
        out += part.value === 'A' ? 'M' : 'm';
        meridiemIndex += 1;
      }
      continue;
    }

    const len = TOKEN_MASK_LENGTH[part.value];
    if (digitIndex >= digits.length) break;

    const chunk = digits.slice(digitIndex, digitIndex + len);
    out += chunk;
    digitIndex += chunk.length;

    if (chunk.length < len) break;
  }

  return out;
}

export function normalizeInputSeparatorsToFormat(value: string, format: string): string {
  const input = value.trim();
  if (!input) return input;
  const parts = tokenizeFormat(format);
  let cursor = 0;
  let out = '';

  for (const part of parts) {
    if (part.type === 'literal') {
      const ch = input[cursor];
      if (ch === part.value) {
        out += part.value;
        cursor += 1;
        continue;
      }
      if (ch && (MASK_SEPARATORS as readonly string[]).includes(ch)) {
        out += part.value;
        cursor += 1;
        continue;
      }
      out += part.value;
      continue;
    }

    if (part.value === 'A' || part.value === 'a') {
      const ch = input[cursor];
      if (!ch || !/[aApP]/.test(ch)) return value;
      const pm = ch.toLowerCase() === 'p';
      out += part.value === 'A' ? (pm ? 'PM' : 'AM') : pm ? 'pm' : 'am';
      if (/^[aApP][mM]$/.test(input.slice(cursor, cursor + 2))) cursor += 2;
      else cursor += 1;
      continue;
    }

    let minDigits = 1;
    let maxDigits = 2;
    if (part.value === 'YYYY') {
      minDigits = 4;
      maxDigits = 4;
    } else if (part.value === 'YY') {
      minDigits = 2;
      maxDigits = 2;
    } else if (
      part.value === 'DD' ||
      part.value === 'MM' ||
      part.value === 'HH' ||
      part.value === 'hh' ||
      part.value === 'mm'
    ) {
      minDigits = 2;
      maxDigits = 2;
    }

    let read = 0;
    while (read < maxDigits && /^\d$/.test(input[cursor + read] ?? '')) {
      read += 1;
    }
    if (read < minDigits) return value;

    out += input.slice(cursor, cursor + read);
    cursor += read;
  }

  return out;
}

function parseNumber(
  source: string,
  minDigits: number,
  maxDigits: number
): { value: number; read: number } | null {
  for (let len = maxDigits; len >= minDigits; len -= 1) {
    const chunk = source.slice(0, len);
    if (chunk.length !== len) continue;
    if (!/^\d+$/.test(chunk)) continue;
    return { value: Number(chunk), read: len };
  }
  return null;
}

export function parseDateByFormat(value: string, format: string): Date | null {
  const input = value.trim().replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
  if (!input) return null;

  const parts = tokenizeFormat(format);
  let cursor = 0;

  const now = new Date();
  let year = now.getFullYear();
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let usesMeridiem = false;
  let meridiem: 'AM' | 'PM' | null = null;

  for (const part of parts) {
    if (part.type === 'literal') {
      if (cursor >= input.length) {
        // If it's a separator and optional, we might skip, but let's be strict for now
        // if it's in the format, it should be in the input.
        return null;
      }
      if (input[cursor] === part.value) {
        cursor += 1;
        continue;
      }
      if (MASK_SEPARATORS.includes(part.value as (typeof MASK_SEPARATORS)[number])) {
        if (MASK_SEPARATORS.includes(input[cursor] as (typeof MASK_SEPARATORS)[number])) {
          cursor += 1;
          continue;
        }
        return null;
      }
      if (/\s/.test(part.value) && /\s/.test(input[cursor])) {
        while (cursor < input.length && /\s/.test(input[cursor])) {
          cursor += 1;
        }
        continue;
      }
      return null;
    }

    while (cursor < input.length && /\s/.test(input[cursor])) {
      cursor += 1;
    }

    const remaining = input.slice(cursor);
    let parsed: { value: number; read: number } | null = null;

    switch (part.value) {
      case 'YYYY':
        parsed = parseNumber(remaining, 4, 4);
        if (!parsed) return null;
        year = parsed.value;
        break;
      case 'YY':
        parsed = parseNumber(remaining, 2, 2);
        if (!parsed) return null;
        year = resolveTwoDigitYear(parsed.value, now);
        break;
      case 'MM':
        parsed = parseNumber(remaining, 2, 2);
        if (!parsed) return null;
        month = parsed.value;
        break;
      case 'M':
        parsed = parseNumber(remaining, 1, 2);
        if (!parsed) return null;
        month = parsed.value;
        break;
      case 'DD':
        parsed = parseNumber(remaining, 2, 2);
        if (!parsed) return null;
        day = parsed.value;
        break;
      case 'D':
        parsed = parseNumber(remaining, 1, 2);
        if (!parsed) return null;
        day = parsed.value;
        break;
      case 'HH':
        parsed = parseNumber(remaining, 2, 2);
        if (!parsed) return null;
        hour = parsed.value;
        break;
      case 'H':
        parsed = parseNumber(remaining, 1, 2);
        if (!parsed) return null;
        hour = parsed.value;
        break;
      case 'hh':
        parsed = parseNumber(remaining, 2, 2);
        if (!parsed) return null;
        hour = parsed.value;
        usesMeridiem = true;
        break;
      case 'h':
        parsed = parseNumber(remaining, 1, 2);
        if (!parsed) return null;
        hour = parsed.value;
        usesMeridiem = true;
        break;
      case 'mm':
        parsed = parseNumber(remaining, 2, 2);
        if (!parsed) return null;
        minute = parsed.value;
        break;
      case 'm':
        parsed = parseNumber(remaining, 1, 2);
        if (!parsed) return null;
        minute = parsed.value;
        break;
      case 'A': {
        const m = remaining.slice(0, 2).toUpperCase();
        if (m !== 'AM' && m !== 'PM') return null;
        meridiem = m as 'AM' | 'PM';
        parsed = { value: 0, read: 2 };
        usesMeridiem = true;
        break;
      }
      case 'a': {
        const m = remaining.slice(0, 2).toLowerCase();
        if (m !== 'am' && m !== 'pm') return null;
        meridiem = m.toUpperCase() as 'AM' | 'PM';
        parsed = { value: 0, read: 2 };
        usesMeridiem = true;
        break;
      }
    }

    cursor += parsed.read;
  }

  while (cursor < input.length && /\s/.test(input[cursor])) {
    cursor += 1;
  }

  if (cursor !== input.length) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month - 1)) return null;
  if (usesMeridiem) {
    if (hour < 1 || hour > 12) return null;
    const h12 = hour % 12;
    hour = meridiem === 'PM' ? h12 + 12 : h12;
  } else if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return isValidDate(date) ? date : null;
}

export function formatDate(date: Date, format: string): string {
  const h24 = date.getHours();
  const h12 = ((h24 + 11) % 12) + 1;
  const replacements: Record<Token, string> = {
    YYYY: String(date.getFullYear()),
    YY: pad2(date.getFullYear() % 100),
    MM: pad2(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad2(date.getDate()),
    D: String(date.getDate()),
    HH: pad2(h24),
    H: String(h24),
    hh: pad2(h12),
    h: String(h12),
    mm: pad2(date.getMinutes()),
    m: String(date.getMinutes()),
    A: h24 >= 12 ? 'PM' : 'AM',
    a: h24 >= 12 ? 'pm' : 'am'
  };

  const parts = tokenizeFormat(format);
  return parts
    .map((part) => (part.type === 'token' ? replacements[part.value] : part.value))
    .join('');
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function rotateWeekdays(weekStartsOn: number): string[] {
  return DEFAULT_WEEKDAY_NAMES.slice(weekStartsOn).concat(
    DEFAULT_WEEKDAY_NAMES.slice(0, weekStartsOn)
  );
}

export function getMonthNames(locale?: string): string[] {
  try {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, month) => formatter.format(new Date(2026, month, 1)));
  } catch {
    return [...DEFAULT_MONTH_NAMES];
  }
}

export function getWeekdayNames(locale?: string): string[] {
  try {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const sunday = new Date(2026, 0, 4);
    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + offset);
      return formatter.format(d);
    });
  } catch {
    return [...DEFAULT_WEEKDAY_NAMES];
  }
}

export function rotateWeekdayLabels(labels: readonly string[], weekStartsOn: number): string[] {
  return labels.slice(weekStartsOn).concat(labels.slice(0, weekStartsOn));
}

export function formatSpokenDate(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return `${DEFAULT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

export function getAllowedInputSeparators(_options: ResolvedOptions): string[] {
  return [...MASK_SEPARATORS];
}

export function formatUsesMeridiem(format: string): boolean {
  return tokenizeFormat(format).some(
    (part) => part.type === 'token' && (part.value === 'A' || part.value === 'a')
  );
}

export function formatHasTimeTokens(format: string): boolean {
  const parts = tokenizeFormat(format);
  return parts.some(
    (part) =>
      part.type === 'token' &&
      (part.value === 'HH' ||
        part.value === 'H' ||
        part.value === 'hh' ||
        part.value === 'h' ||
        part.value === 'mm' ||
        part.value === 'm' ||
        part.value === 'A' ||
        part.value === 'a')
  );
}
