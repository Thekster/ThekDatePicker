import { applyMaskToInput, formatUsesMeridiem, getAllowedInputSeparators } from './date-utils.js';
import type { ResolvedOptions } from './types.js';

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

export function isAllowedInputKey(
  key: string,
  format: string,
  allowedSeparators: readonly string[]
): boolean {
  const separators = new Set(allowedSeparators);
  if (/^\d$/.test(key) || separators.has(key)) return true;
  return formatUsesMeridiem(format) && /^[aApPmM]$/.test(key);
}
