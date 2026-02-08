import type { ThekDatePickerTheme } from './types.js';

const THEME_VAR_MAP: Record<keyof ThekDatePickerTheme, string> = {
  primary: '--thekdp-primary',
  primaryStrong: '--thekdp-primary-strong',
  primaryContrast: '--thekdp-primary-contrast',
  bgSurface: '--thekdp-bg-surface',
  bgPanel: '--thekdp-bg-panel',
  border: '--thekdp-border',
  textMain: '--thekdp-text-main',
  textMuted: '--thekdp-text-muted',
  shadow: '--thekdp-shadow',
  radius: '--thekdp-radius',
  fontFamily: '--thekdp-font-family',
  controlHeight: '--thekdp-control-height',
};

export function applyThemeVars(theme: Partial<ThekDatePickerTheme>, targets: HTMLElement[]): void {
  for (const cssVar of Object.values(THEME_VAR_MAP)) {
    for (const target of targets) {
      target.style.removeProperty(cssVar);
    }
  }

  const entries = Object.entries(theme) as Array<[keyof ThekDatePickerTheme, string | undefined]>;
  if (!entries.length) return;

  for (const [key, value] of entries) {
    if (!value) continue;
    const cssVar = THEME_VAR_MAP[key];
    if (!cssVar) continue;
    for (const target of targets) {
      target.style.setProperty(cssVar, value);
    }
  }
}
