import {
  formatHasTimeTokens,
  normalizeInputSeparatorsToFormat,
  parseDateByFormat,
  isValidDate,
  parseIsoDateString,
} from "./date-utils.js";
import type {
  DateInput,
  ResolvedOptions,
  ThekDatePickerGlobalOptions,
  ThekDatePickerOptions,
  ThekDatePickerTheme,
  ThekDatePickerThemeOption,
} from "./types.js";

const THEME_TEMPLATES: Record<"light" | "dark", Partial<ThekDatePickerTheme>> = {
  light: {
    bgSurface: "#ffffff",
    bgPanel: "#ebf0f7",
    border: "#d8dee6",
    textMain: "#1d2838",
    textMuted: "#6b7a90",
    primary: "#2f7fe4",
    primaryStrong: "#1f6bcc",
    primaryContrast: "#ffffff",
    shadow: "0 0.875rem 1.875rem rgba(13, 21, 33, 0.18)",
    radius: "0.375rem",
    fontFamily: "inherit",
    controlHeight: "2rem",
  },
  dark: {
    bgSurface: "#111827",
    bgPanel: "#1f2937",
    border: "#374151",
    textMain: "#f3f4f6",
    textMuted: "#9ca3af",
    primary: "#60a5fa",
    primaryStrong: "#3b82f6",
    primaryContrast: "#0f172a",
    shadow: "0 1rem 2.125rem rgba(0, 0, 0, 0.45)",
    radius: "0.375rem",
    fontFamily: "inherit",
    controlHeight: "2rem",
  },
};

let globalOptions: ThekDatePickerGlobalOptions = {};

interface LocaleDefaults {
  format?: string;
  timeFormat?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function normalizeLiteral(value: string): string {
  return value.replace(/\s+/g, " ");
}

function getLocaleDateFormat(locale?: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(2006, 10, 22));

  let format = "";
  for (const part of parts) {
    if (part.type === "day") format += "DD";
    else if (part.type === "month") format += "MM";
    else if (part.type === "year") format += part.value.length === 2 ? "YY" : "YYYY";
    else if (part.type === "literal") format += normalizeLiteral(part.value);
  }
  return format || "DD/MM/YYYY";
}

function getLocaleTimeFormat(locale?: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(2000, 0, 1, 21, 5));
  const hasDayPeriod = parts.some((part) => part.type === "dayPeriod");

  let format = "";
  for (const part of parts) {
    if (part.type === "hour") format += hasDayPeriod ? "hh" : "HH";
    else if (part.type === "minute") format += "mm";
    else if (part.type === "dayPeriod") format += "A";
    else if (part.type === "literal") format += normalizeLiteral(part.value);
  }
  return format || "HH:mm";
}

function getLocaleWeekStartsOn(locale?: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined {
  try {
    const effectiveLocale = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    const intlLocale = new Intl.Locale(effectiveLocale);
    const firstDay = (intlLocale as Intl.Locale & { weekInfo?: { firstDay?: number } }).weekInfo
      ?.firstDay;
    if (typeof firstDay !== "number") return undefined;
    if (firstDay === 7) return 0;
    if (firstDay >= 0 && firstDay <= 6) return firstDay as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  } catch {
    // no-op
  }
  return undefined;
}

function getLocaleDefaults(locale?: string): LocaleDefaults {
  return {
    format: getLocaleDateFormat(locale),
    timeFormat: getLocaleTimeFormat(locale),
    weekStartsOn: getLocaleWeekStartsOn(locale),
  };
}

export function resolveThemeOption(
  theme?: ThekDatePickerThemeOption,
): Partial<ThekDatePickerTheme> {
  if (!theme) return {};
  if (theme === "light" || theme === "dark") {
    return { ...THEME_TEMPLATES[theme] };
  }
  if (theme === "auto") {
    return { ...THEME_TEMPLATES[resolveAutoThemeTemplate("data-theme")] };
  }
  return { ...theme };
}

export function resolveAutoThemeTemplate(themeAttribute: string): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute(themeAttribute);
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function mergeThemeOptions(
  baseTheme?: ThekDatePickerThemeOption,
  overrideTheme?: ThekDatePickerThemeOption,
): ThekDatePickerThemeOption | undefined {
  if (overrideTheme == null) return baseTheme;
  if (baseTheme == null) return overrideTheme;
  if (typeof baseTheme === "string" || typeof overrideTheme === "string") return overrideTheme;
  return { ...baseTheme, ...overrideTheme };
}

function mergeOptions(
  base: ThekDatePickerGlobalOptions,
  override: ThekDatePickerGlobalOptions,
): ThekDatePickerGlobalOptions {
  return {
    ...base,
    ...override,
    theme: mergeThemeOptions(base.theme, override.theme),
  };
}

function cloneGlobalOptions(options: ThekDatePickerGlobalOptions): ThekDatePickerGlobalOptions {
  return {
    ...options,
    theme:
      options.theme && typeof options.theme === "object" ? { ...options.theme } : options.theme,
  };
}

export function setGlobalOptions(options: ThekDatePickerGlobalOptions): void {
  globalOptions = mergeOptions(globalOptions, options);
}

export function getGlobalOptions(): ThekDatePickerGlobalOptions {
  return cloneGlobalOptions(globalOptions);
}

export function resetGlobalOptions(): void {
  globalOptions = {};
}

export function normalizeDateInput(value: DateInput | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isValidDate(value) ? new Date(value) : null;
  const isoParsed = parseIsoDateString(value);
  if (isoParsed) return isoParsed;
  return null;
}

export function fullFormat(
  options: Pick<ResolvedOptions, "format" | "timeFormat" | "enableTime">,
): string {
  if (formatHasTimeTokens(options.format)) return options.format;
  return options.enableTime ? `${options.format} ${options.timeFormat}` : options.format;
}

export function clampDate(date: Date, minDate: Date | null, maxDate: Date | null): Date {
  const ts = date.getTime();
  if (minDate && ts < minDate.getTime()) return new Date(minDate);
  if (maxDate && ts > maxDate.getTime()) return new Date(maxDate);
  return date;
}

export function resolveOptions(options: ThekDatePickerOptions): ResolvedOptions {
  const merged = mergeOptions(globalOptions, options);
  const useLocaleDefaults = merged.useLocaleDefaults ?? false;
  const locale = merged.locale;
  const localeDefaults = useLocaleDefaults ? getLocaleDefaults(locale) : {};

  const format = merged.format ?? localeDefaults.format ?? "DD/MM/YYYY";
  const enableTime = merged.enableTime ?? false;
  const timeFormat = merged.timeFormat ?? localeDefaults.timeFormat ?? "HH:mm";
  const placeholder = merged.placeholder ?? fullFormat({ format, timeFormat, enableTime });
  const disabled = merged.disabled ?? false;
  const appendTo = merged.appendTo ?? document.body;
  const weekStartsOn = merged.weekStartsOn ?? localeDefaults.weekStartsOn ?? 0;
  const closeOnSelect = merged.closeOnSelect ?? true;
  const showCalendarButton = merged.showCalendarButton ?? true;
  const openOnInputClick = merged.openOnInputClick ?? false;
  const zIndex = Number.isFinite(merged.zIndex) ? Number(merged.zIndex) : 9999;
  const reactiveTheme = merged.reactiveTheme ?? false;
  const themeAttribute = merged.themeAttribute ?? "data-theme";
  const themeMode = typeof merged.theme === "string" ? merged.theme : "custom";
  const effectiveTheme =
    themeMode === "auto" ? resolveAutoThemeTemplate(themeAttribute) : merged.theme;
  const theme = resolveThemeOption(effectiveTheme);
  const suspiciousWarning = merged.suspiciousWarning ?? false;
  const suspiciousYearSpan = Math.max(0, merged.suspiciousYearSpan ?? 100);
  const suspiciousMinYear = merged.suspiciousMinYear ?? null;
  const suspiciousMaxYear = merged.suspiciousMaxYear ?? null;
  const suspiciousMessage = merged.suspiciousMessage ?? "Suspicious date value";
  const revertWarning = merged.revertWarning ?? true;
  const revertMessage = merged.revertMessage ?? "Invalid input value";
  const cssPrefix = merged.cssPrefix ?? "thekdp";

  return {
    format,
    locale,
    useLocaleDefaults,
    enableTime,
    timeFormat,
    minDate: normalizeDateInput(merged.minDate),
    maxDate: normalizeDateInput(merged.maxDate),
    placeholder,
    disabled,
    appendTo,
    weekStartsOn,
    closeOnSelect,
    showCalendarButton,
    openOnInputClick,
    zIndex,
    theme,
    reactiveTheme,
    themeAttribute,
    themeMode,
    suspiciousWarning,
    suspiciousYearSpan,
    suspiciousMinYear,
    suspiciousMaxYear,
    suspiciousMessage,
    revertWarning,
    revertMessage,
    cssPrefix,
    onChange: merged.onChange,
    onOpen: merged.onOpen,
    onClose: merged.onClose,
  };
}

export function extractInput(input: string, options: ResolvedOptions): Date | null {
  const format = fullFormat(options);
  const primary = parseDateByFormat(input, format);
  if (primary) return primary;
  const normalized = normalizeInputSeparatorsToFormat(input, format);
  const flexible = parseDateByFormat(normalized, format);
  if (flexible) return flexible;

  const relaxedFormat = format
    .replaceAll("DD", "D")
    .replaceAll("MM", "M")
    .replaceAll("HH", "H")
    .replaceAll("hh", "h")
    .replaceAll("mm", "m");
  if (relaxedFormat !== format) {
    const relaxedPrimary = parseDateByFormat(input, relaxedFormat);
    if (relaxedPrimary) return relaxedPrimary;
    const relaxedNormalized = normalizeInputSeparatorsToFormat(input, relaxedFormat);
    const relaxedFlexible = parseDateByFormat(relaxedNormalized, relaxedFormat);
    if (relaxedFlexible) return relaxedFlexible;
  }

  return null;
}
