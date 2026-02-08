import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThekDatePicker, resetGlobalOptions, setGlobalOptions } from '../../src/index';

describe('ThekDatePicker integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="date-input" />';
  });

  afterEach(() => {
    resetGlobalOptions();
  });

  it('sets and gets selected date', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    picker.setDate('08/02/2026');
    const selected = picker.getDate();
    expect(selected).not.toBeNull();
    expect(selected?.getFullYear()).toBe(2026);
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('08/02/2026');
    picker.destroy();
  });

  it('clamps min/max', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      minDate: '2026-01-10',
      maxDate: '2026-01-20',
    });
    picker.setDate('2026-01-01');
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('2026-01-10');
    picker.setDate('2026-01-30');
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('2026-01-20');
    picker.destroy();
  });

  it('clears and emits change', () => {
    const onChange = vi.fn();
    const picker = new ThekDatePicker('#date-input', { onChange });
    picker.setDate('08/02/2026');
    picker.clear();
    expect(onChange).toHaveBeenCalled();
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('');
    picker.destroy();
  });

  it('opens and closes', () => {
    const picker = new ThekDatePicker('#date-input');
    const trigger = document.querySelector('.thekdp-trigger-btn') as HTMLButtonElement;
    trigger.click();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.hidden).toBe(false);
    picker.close();
    expect(popover.hidden).toBe(true);
    picker.destroy();
  });

  it('does not open on input click by default', () => {
    const picker = new ThekDatePicker('#date-input');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.click();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement | null;
    expect(popover).toBeNull();
    picker.destroy();
  });

  it('opens on input click when configured', () => {
    const picker = new ThekDatePicker('#date-input', { openOnInputClick: true });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.click();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.hidden).toBe(false);
    picker.destroy();
  });

  it('can disable calendar button creation', () => {
    const picker = new ThekDatePicker('#date-input', { showCalendarButton: false });
    expect(document.querySelector('.thekdp-trigger-btn')).toBeNull();
    picker.destroy();
  });

  it('sanitizes letters during typing', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    input.value = '1a2b/0c2/20d6';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('12/02/206');
    picker.destroy();
  });

  it('accepts mixed separators against format', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    picker.setDate('08-02.2026');
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('08/02/2026');
    picker.destroy();
  });

  it('applies mask separators while typing digits', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    input.value = '12022026';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('12/02/2026');
    picker.destroy();
  });

  it('removes dangling time separator during backspace flow', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      enableTime: true,
      timeFormat: 'HH:mm',
    });
    input.value = '2026-02-08 08:32';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = '2026-02-08 08:';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('2026-02-08 08');
    picker.destroy();
  });

  it('supports 12-hour AM/PM parsing and display', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'MM/DD/YYYY',
      enableTime: true,
      timeFormat: 'hh:mm A',
    });
    picker.setDate('02-08-2026 9:05 pm');
    expect(input.value).toBe('02/08/2026 09:05 PM');
    expect(picker.getDate()?.getHours()).toBe(21);
    picker.destroy();
  });

  it('prioritizes format when it already contains time tokens', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD HH:mm',
      enableTime: true,
      timeFormat: 'HH:mm',
    });

    picker.setDate('2026-02-08 09:05');
    expect(input.value).toBe('2026-02-08 09:05');

    picker.destroy();
  });

  it('parses format time even when enableTime is false', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD HH:mm',
      enableTime: false,
    });

    picker.setDate('2026-02-08 09:05');
    expect(input.value).toBe('2026-02-08 09:05');

    picker.destroy();
  });

  it('applies per-instance theme variables from options', () => {
    const picker = new ThekDatePicker('#date-input', {
      theme: {
        primary: '#ff6600',
        controlHeight: '2.4rem',
      },
    });

    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;
    expect(wrap.style.getPropertyValue('--thekdp-primary')).toBe('#ff6600');
    expect(wrap.style.getPropertyValue('--thekdp-control-height')).toBe('2.4rem');

    picker.open();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.style.getPropertyValue('--thekdp-primary')).toBe('#ff6600');
    expect(popover.style.getPropertyValue('--thekdp-control-height')).toBe('2.4rem');

    picker.destroy();
  });

  it('updates theme at runtime with setTheme', () => {
    const picker = new ThekDatePicker('#date-input', {
      theme: {
        primary: '#ff6600',
        controlHeight: '2.4rem',
      },
    });

    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;
    expect(wrap.style.getPropertyValue('--thekdp-primary')).toBe('#ff6600');
    expect(wrap.style.getPropertyValue('--thekdp-control-height')).toBe('2.4rem');

    picker.setTheme({ primary: '#00aa55' });
    expect(wrap.style.getPropertyValue('--thekdp-primary')).toBe('#00aa55');
    expect(wrap.style.getPropertyValue('--thekdp-control-height')).toBe('');

    picker.open();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.style.getPropertyValue('--thekdp-primary')).toBe('#00aa55');

    picker.destroy();
  });

  it('supports theme template string in options and setTheme', () => {
    const picker = new ThekDatePicker('#date-input', { theme: 'dark' });
    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;

    expect(wrap.style.getPropertyValue('--thekdp-bg-surface')).toBe('#111827');
    expect(wrap.style.getPropertyValue('--thekdp-text-main')).toBe('#f3f4f6');

    picker.setTheme('light');
    expect(wrap.style.getPropertyValue('--thekdp-bg-surface')).toBe('#ffffff');
    expect(wrap.style.getPropertyValue('--thekdp-text-main')).toBe('#1d2838');

    picker.destroy();
  });

  it('reacts to page theme attribute when theme is auto and reactiveTheme is enabled', async () => {
    document.documentElement.setAttribute('data-showcase-theme', 'light');
    const picker = new ThekDatePicker('#date-input', {
      theme: 'auto',
      reactiveTheme: true,
      themeAttribute: 'data-showcase-theme',
    });
    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;
    expect(wrap.style.getPropertyValue('--thekdp-bg-surface')).toBe('#ffffff');

    document.documentElement.setAttribute('data-showcase-theme', 'dark');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrap.style.getPropertyValue('--thekdp-bg-surface')).toBe('#111827');

    picker.destroy();
  });

  it('applies global options when instance options are omitted', () => {
    setGlobalOptions({
      format: 'YYYY-MM-DD',
      openOnInputClick: true,
      theme: 'dark',
    });

    const picker = new ThekDatePicker('#date-input');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.click();

    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.hidden).toBe(false);

    picker.setDate('2026-02-08');
    expect(input.value).toBe('2026-02-08');

    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;
    expect(wrap.style.getPropertyValue('--thekdp-bg-surface')).toBe('#111827');

    picker.destroy();
  });

  it('lets local options override and merge global theme object', () => {
    setGlobalOptions({
      format: 'YYYY-MM-DD',
      theme: {
        bgSurface: '#101010',
        primary: '#112233',
      },
    });

    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      theme: {
        primary: '#ff0000',
      },
    });

    picker.setDate('08/02/2026');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    expect(input.value).toBe('08/02/2026');

    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;
    expect(wrap.style.getPropertyValue('--thekdp-bg-surface')).toBe('#101010');
    expect(wrap.style.getPropertyValue('--thekdp-primary')).toBe('#ff0000');

    picker.destroy();
  });

  it('can initialize format settings from locale defaults', () => {
    const picker = new ThekDatePicker('#date-input', {
      useLocaleDefaults: true,
      locale: 'en-US',
      enableTime: true,
    });

    expect(picker.options.format).toBe('MM/DD/YYYY');
    expect(picker.options.timeFormat).toBe('hh:mm A');
    expect(picker.options.useLocaleDefaults).toBe(true);
    expect(picker.options.locale).toBe('en-US');

    picker.setDate('02/08/2026 09:05 PM');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    expect(input.value).toBe('02/08/2026 09:05 PM');

    picker.destroy();
  });

  it('does not warn for suspicious years by default', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    picker.setDate('0120-12-14');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    expect(input.classList.contains('thekdp-input-suspicious')).toBe(false);
    picker.destroy();
  });

  it('shows suspicious warning indicator for out-of-span years when enabled', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      suspiciousWarning: true,
      suspiciousYearSpan: 100,
      suspiciousMessage: 'Date looks suspicious',
    });
    picker.setDate('0120-12-14');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const wrap = document.querySelector('.thekdp-input-wrap') as HTMLDivElement;
    const indicator = document.querySelector('.thekdp-suspicious-indicator') as HTMLSpanElement;

    expect(input.classList.contains('thekdp-input-suspicious')).toBe(true);
    expect(wrap.classList.contains('thekdp-input-wrap-suspicious')).toBe(true);
    expect(indicator.hidden).toBe(false);
    expect(input.title).toBe('Date looks suspicious');
    expect(input.getAttribute('aria-invalid')).toBe('');

    picker.destroy();
  });

  it('keeps suspicious indicator hidden for empty value', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      suspiciousWarning: true,
    });
    const indicator = document.querySelector('.thekdp-suspicious-indicator') as HTMLSpanElement;
    expect(indicator.hidden).toBe(true);
    picker.clear();
    expect(indicator.hidden).toBe(true);
    picker.destroy();
  });
});
