import type { ThekDatePicker } from './thekdatepicker.js';

export type DateInput = Date | string | number | null | undefined;

export interface ThekDatePickerTheme {
  primary: string;
  primaryStrong: string;
  primaryContrast: string;
  bgSurface: string;
  bgPanel: string;
  border: string;
  textMain: string;
  textMuted: string;
  shadow: string;
  radius: string;
  fontFamily: string;
  controlHeight: string;
}

export type ThekDatePickerThemeTemplate = 'light' | 'dark' | 'auto';
export type ThekDatePickerThemeOption = ThekDatePickerThemeTemplate | Partial<ThekDatePickerTheme>;

export interface ThekDatePickerOptions {
  format?: string;
  locale?: string;
  useLocaleDefaults?: boolean;
  enableTime?: boolean;
  timeFormat?: string;
  minDate?: DateInput;
  maxDate?: DateInput;
  defaultDate?: DateInput;
  placeholder?: string;
  disabled?: boolean;
  appendTo?: HTMLElement;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  closeOnSelect?: boolean;
  showCalendarButton?: boolean;
  openOnInputClick?: boolean;
  theme?: ThekDatePickerThemeOption;
  reactiveTheme?: boolean;
  themeAttribute?: string;
  suspiciousWarning?: boolean;
  suspiciousYearSpan?: number;
  suspiciousMinYear?: number;
  suspiciousMaxYear?: number;
  suspiciousMessage?: string;
  onChange?: (date: Date | null, formatted: string, instance: ThekDatePicker) => void;
  onOpen?: (instance: ThekDatePicker) => void;
  onClose?: (instance: ThekDatePicker) => void;
}

export type ThekDatePickerGlobalOptions = Partial<ThekDatePickerOptions>;

export interface ResolvedOptions {
  format: string;
  locale?: string;
  useLocaleDefaults: boolean;
  enableTime: boolean;
  timeFormat: string;
  minDate: Date | null;
  maxDate: Date | null;
  placeholder: string;
  disabled: boolean;
  appendTo: HTMLElement;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  closeOnSelect: boolean;
  showCalendarButton: boolean;
  openOnInputClick: boolean;
  theme: Partial<ThekDatePickerTheme>;
  reactiveTheme: boolean;
  themeAttribute: string;
  themeMode: ThekDatePickerThemeTemplate | 'custom';
  suspiciousWarning: boolean;
  suspiciousYearSpan: number;
  suspiciousMinYear: number | null;
  suspiciousMaxYear: number | null;
  suspiciousMessage: string;
  onChange?: (date: Date | null, formatted: string, instance: ThekDatePicker) => void;
  onOpen?: (instance: ThekDatePicker) => void;
  onClose?: (instance: ThekDatePicker) => void;
}
