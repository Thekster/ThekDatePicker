import { describe, expect, it } from 'vitest';
import { applyMaskToInput, formatDate, parseDateByFormat } from '../../src/index';

describe('date utils', () => {
  it('formats by token format', () => {
    const date = new Date(2026, 1, 8, 9, 5);
    expect(formatDate(date, 'DD/MM/YYYY HH:mm')).toBe('08/02/2026 09:05');
    expect(formatDate(date, 'M/D/YY H:m')).toBe('2/8/26 9:5');
    expect(formatDate(new Date(2026, 1, 8, 21, 5), 'MM/DD/YYYY hh:mm A')).toBe('02/08/2026 09:05 PM');
  });

  it('parses valid and rejects invalid', () => {
    const parsed = parseDateByFormat('08/02/2026 09:05', 'DD/MM/YYYY HH:mm');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(1);
    expect(parsed?.getDate()).toBe(8);
    expect(parseDateByFormat('31/02/2026', 'DD/MM/YYYY')).toBeNull();
    const parsedAmPm = parseDateByFormat('02/08/2026 09:05 PM', 'MM/DD/YYYY hh:mm A');
    expect(parsedAmPm?.getHours()).toBe(21);
  });

  it('does not leave trailing separators while masking', () => {
    expect(applyMaskToInput('2026020808', 'YYYY-MM-DD HH:mm')).toBe('2026-02-08 08');
    expect(applyMaskToInput('20260208083', 'YYYY-MM-DD HH:mm')).toBe('2026-02-08 08:3');
    expect(applyMaskToInput('202602080832', 'YYYY-MM-DD HH:mm')).toBe('2026-02-08 08:32');
  });

  it('does not lock AM/PM while deleting', () => {
    expect(applyMaskToInput('020820260905pm', 'MM/DD/YYYY hh:mm A')).toBe('02/08/2026 09:05 PM');
    expect(applyMaskToInput('020820260905p', 'MM/DD/YYYY hh:mm A')).toBe('02/08/2026 09:05 P');
  });
});
