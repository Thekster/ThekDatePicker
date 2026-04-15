import { applyMaskToInput, formatUsesMeridiem } from './date-utils.js';

const INPUT_TOKENS = [
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
];
const TOKEN_LENGTHS = new Map<string, number>([
  ['YYYY', 4],
  ['YY', 2],
  ['DD', 2],
  ['D', 2],
  ['MM', 2],
  ['M', 2],
  ['HH', 2],
  ['H', 2],
  ['hh', 2],
  ['h', 2],
  ['mm', 2],
  ['m', 2],
  ['A', 2],
  ['a', 2]
]);

function isMaskChar(char: string, usesMeridiem: boolean): boolean {
  if (/^\d$/.test(char)) return true;
  if (!usesMeridiem) return false;
  return /^[aApPmM]$/.test(char);
}

function countMaskChars(value: string, usesMeridiem: boolean): number {
  let count = 0;
  for (const char of value) {
    if (isMaskChar(char, usesMeridiem)) count += 1;
  }
  return count;
}

function caretIndexForMaskCharCount(
  value: string,
  maskChars: number,
  usesMeridiem: boolean
): number {
  if (maskChars <= 0) return 0;
  let count = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (!isMaskChar(value[i], usesMeridiem)) continue;
    count += 1;
    if (count >= maskChars) return i + 1;
  }
  return value.length;
}

export function applyMaskedInputWithCaret(input: HTMLInputElement, format: string): void {
  const usesMeridiem = formatUsesMeridiem(format);
  const previousValue = input.value;
  const caretStart = input.selectionStart ?? previousValue.length;
  const nextValue = applyMaskToInput(previousValue, format);
  if (nextValue === previousValue) return;

  const maskCharsBeforeCaret = countMaskChars(previousValue.slice(0, caretStart), usesMeridiem);
  input.value = nextValue;

  const nextCaret = caretIndexForMaskCharCount(nextValue, maskCharsBeforeCaret, usesMeridiem);
  input.setSelectionRange(nextCaret, nextCaret);
}

export function applyMaskedTextInsertion(
  input: HTMLInputElement,
  text: string,
  format: string
): void {
  const usesMeridiem = formatUsesMeridiem(format);
  const selectionStart = input.selectionStart ?? input.value.length;
  const selectionEnd = input.selectionEnd ?? selectionStart;
  const previousValue = input.value;
  const nextRawValue =
    previousValue.slice(0, selectionStart) + text + previousValue.slice(selectionEnd);
  const nextValue = applyMaskToInput(nextRawValue, format);
  const maskCharsBeforeCaret = countMaskChars(
    previousValue.slice(0, selectionStart) + text,
    usesMeridiem
  );

  input.value = nextValue;
  const nextCaret = caretIndexForMaskCharCount(nextValue, maskCharsBeforeCaret, usesMeridiem);
  input.setSelectionRange(nextCaret, nextCaret);
}

export function getMaskedFormatLength(format: string): number {
  let length = 0;
  for (let i = 0; i < format.length; i += 1) {
    if (format[i] === '[') {
      const end = format.indexOf(']', i);
      if (end !== -1) {
        length += end - i - 1;
        i = end;
        continue;
      }
    }

    const token = INPUT_TOKENS.find((item) => format.startsWith(item, i));
    if (token) {
      length += TOKEN_LENGTHS.get(token) ?? 0;
      i += token.length - 1;
      continue;
    }

    length += 1;
  }
  return length;
}

export function isAllowedInputKey(
  key: string,
  format: string,
  allowedSeparators: readonly string[]
): boolean {
  const separators = new Set(allowedSeparators);
  if (/^\d$/.test(key) || separators.has(key)) return true;
  return formatUsesMeridiem(format) && /^[aApPmM]$/.test(key);
}
