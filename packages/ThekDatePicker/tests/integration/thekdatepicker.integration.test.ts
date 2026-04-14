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
      maxDate: '2026-01-20'
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

  it('guards against onChange re-entrancy loops', () => {
    let calls = 0;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      onChange: (_date, _formatted, instance) => {
        calls += 1;
        instance.setDate('2026-02-09');
      }
    });
    expect(() => picker.setDate('2026-02-08')).not.toThrow();
    expect(calls).toBe(1);
    expect(picker.getDate()?.getDate()).toBe(9);
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

  it('does not use role="dialog" or aria-haspopup="dialog" (combobox/grid pattern without focus trapping)', () => {
    const picker = new ThekDatePicker('#date-input');
    picker.open();
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;

    expect(input.getAttribute('aria-haspopup')).not.toBe('dialog');
    expect(popover.getAttribute('role')).not.toBe('dialog');
    expect(popover.hasAttribute('aria-modal')).toBe(false);

    picker.destroy();
  });

  it('rejects completely invalid pasted dates immediately instead of deferring to blur', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const preventDefault = vi.fn();

    const event = new Event('paste') as unknown as ClipboardEvent;
    event.clipboardData = {
      getData: () => '99/99/9999'
    };
    event.preventDefault = preventDefault;

    input.dispatchEvent(event);
    expect(preventDefault).toHaveBeenCalled();

    picker.destroy();
  });

  it('closes when the trigger is clicked again while open', () => {
    const picker = new ThekDatePicker('#date-input');
    const trigger = document.querySelector('.thekdp-trigger-btn') as HTMLButtonElement;

    trigger.click();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.hidden).toBe(false);

    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    trigger.click();
    expect(popover.hidden).toBe(true);

    picker.destroy();
  });

  it('moves focus and selection through the calendar with keyboard navigation', async () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    picker.setDate('2026-02-08');
    picker.open();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    popover.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    );
    let focused = document.activeElement as HTMLButtonElement;
    expect(focused.dataset.ts).toBe(String(new Date(2026, 1, 9).setHours(0, 0, 0, 0)));

    popover.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    );
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('2026-02-09');

    picker.open();
    await new Promise((resolve) => setTimeout(resolve, 0));
    popover.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    focused = document.activeElement as HTMLButtonElement;
    expect(focused.dataset.ts).toBe(String(new Date(2026, 2, 9).setHours(0, 0, 0, 0)));

    picker.destroy();
  });

  it('supports setting date from explicit millisecond timestamp', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    picker.setDateFromTimestamp(Date.UTC(2026, 1, 8));
    const input = document.querySelector('#date-input') as HTMLInputElement;
    expect(input.value).toBe('2026-02-08');
    picker.destroy();
  });

  it('applies configurable popover z-index', () => {
    const picker = new ThekDatePicker('#date-input', { zIndex: 12345 });
    picker.open();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.style.zIndex).toBe('12345');
    picker.destroy();
  });

  it('positions the popover relative to appendTo hosts', () => {
    document.body.innerHTML =
      '<div id="host" style="position: relative; overflow: auto; width: 600px; height: 400px;"><div style="padding: 40px;"><input id="date-input" /></div></div>';

    const host = document.querySelector('#host') as HTMLDivElement;
    const picker = new ThekDatePicker('#date-input', { appendTo: host });
    picker.open();

    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.parentElement).toBe(host);
    expect(popover.style.top).not.toBe('');
    expect(popover.style.left).not.toBe('');

    picker.destroy();
  });

  it('flips the popover above the input when there is not enough space below', () => {
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: 320
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 480
    });

    const picker = new ThekDatePicker('#date-input');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const popover = (picker as unknown as { pickerEl: HTMLDivElement }).pickerEl;

    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 260,
      top: 260,
      left: 40,
      right: 180,
      bottom: 290,
      width: 140,
      height: 30,
      toJSON: () => ({})
    } as DOMRect);
    vi.spyOn(popover, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 220,
      bottom: 180,
      width: 220,
      height: 180,
      toJSON: () => ({})
    } as DOMRect);

    picker.open();

    expect(popover.style.top).toBe('74px');
    picker.destroy();
  });

  it('shifts the popover horizontally to stay within the viewport', () => {
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: 480
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 400
    });

    const picker = new ThekDatePicker('#date-input');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const popover = (picker as unknown as { pickerEl: HTMLDivElement }).pickerEl;

    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      x: 350,
      y: 120,
      top: 120,
      left: 350,
      right: 390,
      bottom: 150,
      width: 40,
      height: 30,
      toJSON: () => ({})
    } as DOMRect);
    vi.spyOn(popover, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 180,
      width: 200,
      height: 180,
      toJSON: () => ({})
    } as DOMRect);

    picker.open();

    expect(popover.style.left).toBe('192px');
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

  it('reuses the same time inputs across rerenders', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      enableTime: true
    });

    picker.open();

    const hourInput = document.querySelector('[data-time-unit="hour"]') as HTMLInputElement;
    const minuteInput = document.querySelector('[data-time-unit="minute"]') as HTMLInputElement;

    picker.setDate(new Date(2026, 1, 8, 14, 35));

    expect(document.querySelector('[data-time-unit="hour"]')).toBe(hourInput);
    expect(document.querySelector('[data-time-unit="minute"]')).toBe(minuteInput);
    expect(hourInput.value).toBe('14');
    expect(minuteInput.value).toBe('35');

    picker.destroy();
  });

  it('pads the 24-hour time inputs to two digits', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      enableTime: true,
      timeFormat: 'HH:mm'
    });

    picker.setDate(new Date(2026, 1, 8, 9, 5));
    picker.open();

    const hourInput = document.querySelector('[data-time-unit="hour"]') as HTMLInputElement;
    const minuteInput = document.querySelector('[data-time-unit="minute"]') as HTMLInputElement;

    expect(hourInput.value).toBe('09');
    expect(minuteInput.value).toBe('05');

    picker.destroy();
  });

  it('uses up and down arrows to step time input values', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      enableTime: true,
      timeFormat: 'HH:mm'
    });

    picker.setDate(new Date(2026, 1, 8, 9, 5));
    picker.open();

    const hourInput = document.querySelector('[data-time-unit="hour"]') as HTMLInputElement;
    hourInput.focus();

    const upEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true
    });
    hourInput.dispatchEvent(upEvent);

    expect(upEvent.defaultPrevented).toBe(true);
    expect(hourInput.value).toBe('10');
    expect(picker.getDate()?.getHours()).toBe(10);

    const downEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true
    });
    hourInput.dispatchEvent(downEvent);

    expect(downEvent.defaultPrevented).toBe(true);
    expect(hourInput.value).toBe('09');
    expect(picker.getDate()?.getHours()).toBe(9);

    picker.destroy();
  });

  it('can disable calendar button creation', () => {
    const picker = new ThekDatePicker('#date-input', { showCalendarButton: false });
    expect(document.querySelector('.thekdp-trigger-btn')).toBeNull();
    picker.destroy();
  });

  it('keeps warning and status infrastructure when the calendar button is disabled', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      showCalendarButton: false,
      suspiciousWarning: true,
      revertWarning: true
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;

    picker.setDate('0120-12-14');
    expect(document.querySelector('.thekdp-input-wrap')).not.toBeNull();
    expect(document.querySelector('.thekdp-suspicious-indicator')).not.toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeTruthy();

    input.value = '--12';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    const revertIndicator = document.querySelector('.thekdp-revert-indicator') as HTMLSpanElement;
    expect(revertIndicator.hidden).toBe(false);

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

  it('preserves caret position when masking inserts separators', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    input.value = '12022026';
    input.setSelectionRange(4, 4);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('12/02/2026');
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
    picker.destroy();
  });

  it('keeps mask stable under rapid typing burst', () => {
    vi.useFakeTimers();
    try {
      const input = document.querySelector('#date-input') as HTMLInputElement;
      const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
      input.value = '';
      input.setSelectionRange(0, 0);

      const chars = '1202202609';
      for (let i = 0; i < chars.length; i += 1) {
        setTimeout(() => {
          input.value += chars[i];
          const atEnd = input.value.length;
          input.setSelectionRange(atEnd, atEnd);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }, i * 5);
      }
      vi.advanceTimersByTime(50);

      expect(input.value).toBe('12/02/2026');
      expect(input.selectionStart).toBe(10);
      expect(input.selectionEnd).toBe(10);
      picker.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not prevent default for non-printable keys', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });

    const event = new KeyboardEvent('keydown', {
      key: 'F5',
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);

    picker.destroy();
  });

  it('does not prevent default for ctrl/meta shortcuts', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });

    const ctrlEvent = new KeyboardEvent('keydown', {
      key: 'p',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(ctrlEvent);
    expect(ctrlEvent.defaultPrevented).toBe(false);

    const metaEvent = new KeyboardEvent('keydown', {
      key: 'p',
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(metaEvent);
    expect(metaEvent.defaultPrevented).toBe(false);

    picker.destroy();
  });

  it('prevents invalid printable keys', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });

    const event = new KeyboardEvent('keydown', {
      key: 'x',
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    picker.destroy();
  });

  it('removes dangling time separator during backspace flow', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      enableTime: true,
      timeFormat: 'HH:mm'
    });
    input.value = '2026-02-08 08:32';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = '2026-02-08 08:';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('2026-02-08 08');
    picker.destroy();
  });

  it('reuses day grid cells between month renders', () => {
    const picker = new ThekDatePicker('#date-input');
    picker.open();
    const firstCellBefore = document.querySelector('.thekdp-days button') as HTMLButtonElement;
    const nextMonthBtn = document.querySelector('[data-action="next-month"]') as HTMLButtonElement;
    nextMonthBtn.click();
    const firstCellAfter = document.querySelector('.thekdp-days button') as HTMLButtonElement;
    expect(firstCellAfter).toBe(firstCellBefore);
    picker.destroy();
  });

  it('supports 12-hour AM/PM parsing and display', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'MM/DD/YYYY',
      enableTime: true,
      timeFormat: 'hh:mm A'
    });
    picker.setDate('02-08-2026 9:05 pm');
    expect(input.value).toBe('02/08/2026 09:05 PM');
    expect(picker.getDate()?.getHours()).toBe(21);
    picker.destroy();
  });

  it('uses meridiem-aware time controls when the effective format is 12-hour', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'MM/DD/YYYY',
      enableTime: true,
      timeFormat: 'hh:mm A'
    });

    picker.setDate('02/08/2026 09:05 PM');
    picker.open();

    const hourInput = document.querySelector('[data-time-unit="hour"]') as HTMLInputElement;
    const minuteInput = document.querySelector('[data-time-unit="minute"]') as HTMLInputElement;
    const meridiemInput = document.querySelector(
      '[data-time-unit="meridiem"]'
    ) as HTMLSelectElement;

    expect(hourInput.value).toBe('09');
    expect(minuteInput.value).toBe('05');
    expect(meridiemInput.value).toBe('PM');

    hourInput.value = '10';
    hourInput.dispatchEvent(new Event('input', { bubbles: true }));
    meridiemInput.value = 'AM';
    meridiemInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(picker.getDate()?.getHours()).toBe(10);
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe(
      '02/08/2026 10:05 AM'
    );

    picker.destroy();
  });

  it('prioritizes format when it already contains time tokens', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD HH:mm',
      enableTime: true,
      timeFormat: 'HH:mm'
    });

    picker.setDate('2026-02-08 09:05');
    expect(input.value).toBe('2026-02-08 09:05');

    picker.destroy();
  });

  it('parses format time even when enableTime is false', () => {
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD HH:mm',
      enableTime: false
    });

    picker.setDate('2026-02-08 09:05');
    expect(input.value).toBe('2026-02-08 09:05');

    picker.destroy();
  });

  it('applies per-instance theme variables from options', () => {
    const picker = new ThekDatePicker('#date-input', {
      theme: {
        primary: '#ff6600',
        controlHeight: '2.4rem'
      }
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
        controlHeight: '2.4rem'
      }
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
      themeAttribute: 'data-showcase-theme'
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
      theme: 'dark'
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

  it('does not retroactively mutate existing instance options when globals change', () => {
    document.body.innerHTML = '<input id="date-input-a" /><input id="date-input-b" />';

    setGlobalOptions({ format: 'YYYY' });
    const p1 = new ThekDatePicker('#date-input-a');

    setGlobalOptions({ format: 'DD' });
    const p2 = new ThekDatePicker('#date-input-b');

    expect(p1.options.format).toBe('YYYY');
    expect(p2.options.format).toBe('DD');

    p1.destroy();
    p2.destroy();
  });

  it('honors global defaultDate for new instances', () => {
    setGlobalOptions({
      format: 'YYYY-MM-DD',
      defaultDate: '2026-02-08'
    });

    const picker = new ThekDatePicker('#date-input');
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('2026-02-08');
    expect(picker.getDate()?.getFullYear()).toBe(2026);

    picker.destroy();
  });

  it('lets local options override and merge global theme object', () => {
    setGlobalOptions({
      format: 'YYYY-MM-DD',
      theme: {
        bgSurface: '#101010',
        primary: '#112233'
      }
    });

    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      theme: {
        primary: '#ff0000'
      }
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
      enableTime: true
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

  it('accepts formatted min and max dates through the public setters', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    picker.setMinDate('10/01/2026');
    picker.setMaxDate('20/01/2026');

    picker.setDate('01/01/2026');
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('10/01/2026');

    picker.setDate('30/01/2026');
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('20/01/2026');

    picker.destroy();
  });

  it('revalidates view state and emits change when setters clamp the current value', () => {
    const onChange = vi.fn();
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      onChange
    });

    picker.setDate('2026-01-15', false);
    picker.setMaxDate('2026-01-10');

    expect(picker.getDate()?.getDate()).toBe(10);
    expect((document.querySelector('#date-input') as HTMLInputElement).value).toBe('2026-01-10');
    expect(onChange).toHaveBeenCalledTimes(1);

    picker.open();
    const selectedCell = document.querySelector('.thekdp-day-cell-selected') as HTMLButtonElement;
    expect(selectedCell.dataset.ts).toBe(String(new Date(2026, 0, 10).setHours(0, 0, 0, 0)));

    picker.destroy();
  });

  it('renders localized month and weekday labels', () => {
    const picker = new ThekDatePicker('#date-input', {
      locale: 'fr-FR',
      useLocaleDefaults: true,
      defaultDate: new Date(2026, 1, 8)
    });

    picker.open();
    const monthLabel = document.querySelector('.thekdp-current-month') as HTMLSpanElement;
    const weekdays = Array.from(document.querySelectorAll('.thekdp-weekday-cell')).map(
      (item) => item.textContent
    );
    const normalizedMonth = monthLabel.textContent
      ?.normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    expect(normalizedMonth).toContain('fevr');
    expect(weekdays.join(' ').toLowerCase()).not.toContain('sun');

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
      suspiciousMessage: 'Date looks suspicious'
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
      suspiciousWarning: true
    });
    const indicator = document.querySelector('.thekdp-suspicious-indicator') as HTMLSpanElement;
    expect(indicator.hidden).toBe(true);
    picker.clear();
    expect(indicator.hidden).toBe(true);
    picker.destroy();
  });

  it('shows revert indicator when invalid input is reverted on blur', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      revertWarning: true,
      revertMessage: 'Invalid value reverted'
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    picker.setDate('08/02/2026');

    input.value = '---12';
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    expect(input.value).toBe('08/02/2026');
    expect(input.classList.contains('thekdp-input-reverted')).toBe(true);
    expect(input.title).toContain('Invalid value reverted');
    expect(input.title).toContain('---12');
    const indicator = document.querySelector('.thekdp-revert-indicator') as HTMLSpanElement;
    expect(indicator.hidden).toBe(false);
    expect(indicator.querySelector('svg')).not.toBeNull();
    expect(indicator.title).toContain('---12');

    picker.destroy();
  });

  it('uses default revert tooltip format with rejected raw value', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      revertWarning: true
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    picker.setDate('08/02/2026');

    input.value = '--12';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(input.title).toBe('Invalid input value : --12');

    picker.destroy();
  });

  it('shows revert indicator when typed value is clamped to maxDate', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      minDate: '2026-01-01',
      maxDate: '2026-12-31',
      revertWarning: true
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.value = '01/01/2027';
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    expect(input.value).toBe('31/12/2026');
    expect(input.title).toBe('Invalid input value : 01/01/2027');
    const indicator = document.querySelector('.thekdp-revert-indicator') as HTMLSpanElement;
    expect(indicator.hidden).toBe(false);

    picker.destroy();
  });

  it('shows revert indicator when typed value is clamped to minDate', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      minDate: '2026-01-01',
      maxDate: '2026-12-31',
      revertWarning: true
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.value = '31/12/2025';
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    expect(input.value).toBe('01/01/2026');
    expect(input.title).toBe('Invalid input value : 31/12/2025');
    const indicator = document.querySelector('.thekdp-revert-indicator') as HTMLSpanElement;
    expect(indicator.hidden).toBe(false);

    picker.destroy();
  });

  it('keeps revert indicator visible until corrected value is committed', async () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      revertWarning: true
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const indicator = document.querySelector('.thekdp-revert-indicator') as HTMLSpanElement;

    picker.setDate('08/02/2026');
    input.value = '---12';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(indicator.hidden).toBe(false);

    input.value = '09';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(indicator.hidden).toBe(false);

    input.value = '09/02/2026';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(indicator.hidden).toBe(true);

    picker.destroy();
  });

  it('clears revert indicator when user commits empty value (null)', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      revertWarning: true
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    const indicator = document.querySelector('.thekdp-revert-indicator') as HTMLSpanElement;

    picker.setDate('08/02/2026');
    input.value = '---12';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(indicator.hidden).toBe(false);

    input.value = '';
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(indicator.hidden).toBe(true);

    picker.destroy();
  });

  it('balances resize and scroll listeners across many create/destroy cycles', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    for (let i = 0; i < 1000; i += 1) {
      document.body.innerHTML = '<input id="date-input" />';
      const picker = new ThekDatePicker('#date-input');
      picker.destroy();
    }

    const addedResize = addSpy.mock.calls.filter(([type]) => type === 'resize').length;
    const removedResize = removeSpy.mock.calls.filter(([type]) => type === 'resize').length;
    const addedScroll = addSpy.mock.calls.filter(([type]) => type === 'scroll').length;
    const removedScroll = removeSpy.mock.calls.filter(([type]) => type === 'scroll').length;

    expect(addedResize).toBe(1000);
    expect(removedResize).toBe(1000);
    expect(addedScroll).toBe(1000);
    expect(removedScroll).toBe(1000);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('registers the shared scroll listener as passive and capture-based', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const picker = new ThekDatePicker('#date-input');

    const scrollCall = addSpy.mock.calls.find(([type]) => type === 'scroll');
    expect(scrollCall).toBeDefined();
    expect(scrollCall?.[2]).toEqual({ capture: true, passive: true });

    addSpy.mockRestore();
    picker.destroy();
  });

  it('uses one shared global listener set for multiple live pickers', () => {
    document.body.innerHTML = '<input id="date-input-a" /><input id="date-input-b" />';
    const addSpy = vi.spyOn(window, 'addEventListener');

    const pickerA = new ThekDatePicker('#date-input-a');
    const pickerB = new ThekDatePicker('#date-input-b');

    const addedResize = addSpy.mock.calls.filter(([type]) => type === 'resize').length;
    const addedScroll = addSpy.mock.calls.filter(([type]) => type === 'scroll').length;

    expect(addedResize).toBe(1);
    expect(addedScroll).toBe(1);

    addSpy.mockRestore();
    pickerA.destroy();
    pickerB.destroy();
  });

  it('does not inject HTML from malicious string values', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'DD/MM/YYYY' });
    picker.setDate('<img src=x onerror=alert(1)>');
    const input = document.querySelector('#date-input') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(document.querySelector('img')).toBeNull();
    picker.destroy();
  });

  it('can out-rank high stacking context with configured z-index', () => {
    document.body.innerHTML =
      '<div id="host" style="position: relative; z-index: 10000;"><input id="date-input" /></div>';
    const host = document.querySelector('#host') as HTMLDivElement;
    const picker = new ThekDatePicker('#date-input', { appendTo: host, zIndex: 10001 });
    picker.open();
    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(popover.parentElement).toBe(host);
    expect(Number(popover.style.zIndex)).toBeGreaterThan(10000);
    picker.destroy();
  });

  it('keeps selected leap day valid when browsing to non-leap year', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    picker.setDate('2024-02-29');
    picker.open();
    const prevYearButton = document.querySelector('[data-action="prev-year"]') as HTMLButtonElement;
    prevYearButton.click();
    expect(picker.getDate()?.getFullYear()).toBe(2024);
    expect(picker.getDate()?.getMonth()).toBe(1);
    expect(picker.getDate()?.getDate()).toBe(29);
    picker.destroy();
  });

  it('clones Date objects passed to setDate', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    const external = new Date(2026, 1, 8);
    picker.setDate(external);
    external.setDate(20);
    expect(picker.getDate()?.getDate()).toBe(8);
    picker.destroy();
  });

  it('commits on Enter and closes picker from keyboard interaction', () => {
    const onChange = vi.fn();
    const picker = new ThekDatePicker('#date-input', {
      format: 'DD/MM/YYYY',
      openOnInputClick: true,
      onChange
    });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.click();
    input.value = '08/02/2026';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    expect(onChange).toHaveBeenCalled();
    expect(popover.hidden).toBe(true);
    expect(picker.getDate()?.getFullYear()).toBe(2026);
    picker.destroy();
  });

  it('returns focus to the input when Escape closes the calendar', async () => {
    const picker = new ThekDatePicker('#date-input', { openOnInputClick: true });
    const input = document.querySelector('#date-input') as HTMLInputElement;
    input.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    popover.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );

    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(input);
    picker.destroy();
  });

  it('restores input attributes and classes on destroy', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      suspiciousWarning: true
    });
    picker.setDate('0120-12-14');

    const input = document.querySelector('#date-input') as HTMLInputElement;
    expect(input.classList.contains('thekdp-input')).toBe(true);
    expect(input.getAttribute('aria-haspopup')).toBe('grid');
    expect(input.hasAttribute('aria-invalid')).toBe(true);

    picker.destroy();

    expect(input.classList.contains('thekdp-input')).toBe(false);
    expect(input.classList.contains('thekdp-input-suspicious')).toBe(false);
    expect(input.getAttribute('aria-haspopup')).toBeNull();
    expect(input.getAttribute('aria-controls')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('labels the dialog from the current month heading', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    picker.open();

    const popover = document.querySelector('.thekdp-popover') as HTMLDivElement;
    const monthLabel = document.querySelector('.thekdp-current-month') as HTMLSpanElement;
    const grid = document.querySelector('.thekdp-days') as HTMLDivElement;

    expect(popover.getAttribute('aria-labelledby')).toBe(monthLabel.id);
    expect(grid.getAttribute('aria-labelledby')).toBe(monthLabel.id);

    picker.destroy();
  });

  it('renders the day grid as six week rows with seven cells each', () => {
    const picker = new ThekDatePicker('#date-input', { format: 'YYYY-MM-DD' });
    picker.open();

    const rows = Array.from(document.querySelectorAll('.thekdp-days-row'));
    expect(rows).toHaveLength(6);
    rows.forEach((row) => {
      expect(row.getAttribute('role')).toBe('row');
      expect(row.querySelectorAll('.thekdp-day-cell')).toHaveLength(7);
    });

    picker.destroy();
  });

  it('exposes warning text through aria-describedby', () => {
    const picker = new ThekDatePicker('#date-input', {
      format: 'YYYY-MM-DD',
      suspiciousWarning: true,
      suspiciousMessage: 'Suspicious date value'
    });

    picker.setDate('0120-12-14');

    const input = document.querySelector('#date-input') as HTMLInputElement;
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const description = describedBy ? document.getElementById(describedBy) : null;
    expect(description?.textContent).toContain('Suspicious date value');

    picker.destroy();
  });
});
