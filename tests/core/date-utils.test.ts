import { describe, expect, it } from 'vitest';
import { applyMaskToInput, formatDate, parseDateByFormat } from '../../src/index';
import { MASK_SEPARATORS } from '../../src/core/date-utils';

describe('date utils', () => {
  it('formats by token format', () => {
    const date = new Date(2026, 1, 8, 9, 5);
    expect(formatDate(date, 'DD/MM/YYYY HH:mm')).toBe('08/02/2026 09:05');
    expect(formatDate(date, 'M/D/YY H:m')).toBe('2/8/26 9:5');
    expect(formatDate(new Date(2026, 1, 8, 21, 5), 'MM/DD/YYYY hh:mm A')).toBe('02/08/2026 09:05 PM');
  });

  it('formats with literal words containing date tokens using escaping', () => {
    const date = new Date(2026, 10, 22, 14, 30);
    // [Date] should be treated as literal "Date"
    expect(formatDate(date, '[Date]: DD/MM/YYYY')).toBe('Date: 22/11/2026');
    // MMMM is not a single token, but it contains MM twice, so it becomes 1111 unless escaped
    expect(formatDate(date, 'MMMM DD, YYYY')).toBe('1111 22, 2026');
    expect(formatDate(date, '[MMMM] DD, YYYY')).toBe('MMMM 22, 2026');
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

  it('correctly identifies meridiem usage with escaped literals', async () => {
    const { formatUsesMeridiem } = await import('../../src/core/date-utils');
    expect(formatUsesMeridiem('DD/MM/YYYY HH:mm')).toBe(false);
    expect(formatUsesMeridiem('hh:mm A')).toBe(true);
    expect(formatUsesMeridiem('[Date]: DD/MM/YYYY')).toBe(false); // 'a' in 'Date' is escaped literal
  });

  it('normalizes separators with escaped literals', async () => {
    const { normalizeInputSeparatorsToFormat } = await import('../../src/core/date-utils');
    // 'Date: 22-11-2026' -> 'Date: 22/11/2026'
    expect(normalizeInputSeparatorsToFormat('Date: 22-11-2026', '[Date]: DD/MM/YYYY')).toBe('Date: 22/11/2026');
  });

  it('parses dates with escaped literals', () => {
    const date = parseDateByFormat('Date: 22/11/2026', '[Date]: DD/MM/YYYY');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(22);
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

  it('supports all documented format tokens for formatting', () => {
    const date = new Date(2026, 1, 8, 21, 5);
    const tokenExpectations: Array<[string, string]> = [
      ['YYYY', '2026'],
      ['YY', '26'],
      ['MM', '02'],
      ['M', '2'],
      ['DD', '08'],
      ['D', '8'],
      ['HH', '21'],
      ['H', '21'],
      ['hh', '09'],
      ['h', '9'],
      ['mm', '05'],
      ['m', '5'],
      ['A', 'PM'],
      ['a', 'pm'],
    ];

    for (const [token, expected] of tokenExpectations) {
      expect(formatDate(date, token)).toBe(expected);
    }
  });

  it('supports all documented token groups for parsing', () => {
    const yyyy = parseDateByFormat('2026-02-08 21:05', 'YYYY-MM-DD HH:mm');
    expect(yyyy?.getFullYear()).toBe(2026);
    expect(yyyy?.getMonth()).toBe(1);
    expect(yyyy?.getDate()).toBe(8);
    expect(yyyy?.getHours()).toBe(21);
    expect(yyyy?.getMinutes()).toBe(5);

    const yy = parseDateByFormat('26-2-8 9:5', 'YY-M-D H:m');
    expect(yy?.getFullYear()).toBe(2026);
    expect(yy?.getMonth()).toBe(1);
    expect(yy?.getDate()).toBe(8);
    expect(yy?.getHours()).toBe(9);
    expect(yy?.getMinutes()).toBe(5);

    const meridiemUpper = parseDateByFormat('02/08/2026 09:05 PM', 'MM/DD/YYYY hh:mm A');
    expect(meridiemUpper?.getHours()).toBe(21);

    const meridiemLower = parseDateByFormat('2/8/2026 9:5 pm', 'M/D/YYYY h:m a');
    expect(meridiemLower?.getHours()).toBe(21);
  });

  it('parses YY using 2000-2099 window', () => {
    const y99 = parseDateByFormat('99-02-08', 'YY-MM-DD');
    const y00 = parseDateByFormat('00-02-08', 'YY-MM-DD');
    expect(y99?.getFullYear()).toBe(2099);
    expect(y00?.getFullYear()).toBe(2000);
  });

  it('supports all allowed separators in mask, parse, and format', () => {
    const date = new Date(2026, 1, 8, 21, 5);
    for (const separator of MASK_SEPARATORS) {
      const dateFormat = `DD${separator}MM${separator}YYYY`;
      const expectedDateText = `08${separator}02${separator}2026`;
      expect(applyMaskToInput('08022026', dateFormat)).toBe(expectedDateText);
      expect(formatDate(date, dateFormat)).toBe(expectedDateText);
      const parsedDate = parseDateByFormat(expectedDateText, dateFormat);
      expect(parsedDate).not.toBeNull();
      expect(parsedDate?.getFullYear()).toBe(2026);
      expect(parsedDate?.getMonth()).toBe(1);
      expect(parsedDate?.getDate()).toBe(8);
    }
  });
});
