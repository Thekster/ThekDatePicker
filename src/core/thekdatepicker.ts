import {
  MONTH_NAMES,
  applyMaskToInput,
  formatUsesMeridiem,
  formatDate,
  getAllowedInputSeparators,
  isSameDay,
  isValidDate,
  rotateWeekdays,
  toLocalStartOfDay,
} from './date-utils.js';
import {
  clampDate,
  extractInput,
  fullFormat,
  normalizeDateInput,
  resolveAutoThemeTemplate,
  resolveThemeOption,
  resolveOptions,
} from './config-utils.js';
import type {
  DateInput,
  ResolvedOptions,
  ThekDatePickerOptions,
  ThekDatePickerTheme,
  ThekDatePickerThemeOption,
} from './types.js';

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

export class ThekDatePicker {
  public readonly input: HTMLInputElement;
  public options: ResolvedOptions;

  private inputWrapEl: HTMLDivElement | null = null;
  private triggerButtonEl: HTMLButtonElement | null = null;
  private pickerEl: HTMLDivElement;
  private monthLabelEl: HTMLSpanElement;
  private weekdaysEl: HTMLDivElement;
  private daysEl: HTMLDivElement;
  private hourInputEl: HTMLInputElement | null = null;
  private minuteInputEl: HTMLInputElement | null = null;

  private selectedDate: Date | null = null;
  private viewDate: Date = new Date();
  private openState = false;
  private destroyed = false;
  private themeObserver: MutationObserver | null = null;
  private themeMediaQuery: MediaQueryList | null = null;

  private readonly handleInputClick = (): void => {
    if (this.options.disabled) return;
    if (this.options.openOnInputClick) this.open();
  };

  private readonly handleTriggerClick = (): void => {
    if (this.options.disabled) return;
    this.toggle();
  };

  private readonly handleInputBlur = (): void => {
    this.commitInput();
  };

  private readonly handleInput = (): void => {
    const formatted = this.maskInput(this.input.value);
    if (formatted !== this.input.value) {
      this.input.value = formatted;
    }
  };

  private readonly handleInputKeyDown = (event: KeyboardEvent): void => {
    if (this.options.disabled) return;

    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (event.key === 'Enter') {
      this.commitInput();
      this.close();
      return;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.open();
      return;
    }

    const allowedControl = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];
    if (allowedControl.includes(event.key) || event.ctrlKey || event.metaKey) return;

    const separators = new Set(getAllowedInputSeparators(this.options));
    const usesMeridiem = formatUsesMeridiem(fullFormat(this.options));
    if (/^\d$/.test(event.key) || separators.has(event.key)) {
      queueMicrotask(() => {
        this.input.value = this.maskInput(this.input.value);
      });
      return;
    }
    if (usesMeridiem && /^[aApPmM]$/.test(event.key)) {
      queueMicrotask(() => {
        this.input.value = this.maskInput(this.input.value);
      });
      return;
    }
    event.preventDefault();
  };

  private readonly handlePaste = (event: ClipboardEvent): void => {
    if (this.options.disabled) {
      event.preventDefault();
      return;
    }
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text) return;

    const separators = getAllowedInputSeparators(this.options)
      .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('');
    const usesMeridiem = formatUsesMeridiem(fullFormat(this.options));
    const letterSet = usesMeridiem ? 'aApPmM' : '';
    const allowed = new RegExp(`^[0-9${letterSet}${separators}]*$`);
    if (!allowed.test(text)) event.preventDefault();
  };

  private readonly handleDocumentPointerDown = (event: MouseEvent): void => {
    if (!this.openState) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (this.pickerEl.contains(target) || this.input.contains(target)) return;
    this.close();
    this.commitInput();
  };

  private readonly handleViewportChange = (): void => {
    if (this.openState) this.positionPicker();
  };

  private readonly handleThemeMediaChange = (): void => {
    if (this.options.reactiveTheme && this.options.themeMode === 'auto') {
      this.applyAutoTheme();
    }
  };

  private readonly handlePickerClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    if (!action) return;

    switch (action) {
      case 'prev-year':
        this.viewDate.setFullYear(this.viewDate.getFullYear() - 1);
        this.render();
        return;
      case 'next-year':
        this.viewDate.setFullYear(this.viewDate.getFullYear() + 1);
        this.render();
        return;
      case 'prev-month':
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.render();
        return;
      case 'next-month':
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.render();
        return;
      case 'today': {
        const now = clampDate(new Date(), this.options.minDate, this.options.maxDate);
        this.setDate(now, true);
        if (!this.options.enableTime) this.close();
        return;
      }
      case 'ok':
        this.close();
        return;
      case 'day': {
        const ts = Number(actionEl.dataset.ts);
        if (Number.isNaN(ts)) return;
        const raw = new Date(ts);
        if (!isValidDate(raw)) return;

        const next = new Date(
          raw.getFullYear(),
          raw.getMonth(),
          raw.getDate(),
          this.selectedDate?.getHours() ?? 0,
          this.selectedDate?.getMinutes() ?? 0,
          0,
          0,
        );
        this.setDate(next, true);
        if (this.options.closeOnSelect && !this.options.enableTime) this.close();
        return;
      }
      default:
        return;
    }
  };

  private readonly handleTimeChange = (): void => {
    if (!this.options.enableTime) return;
    const hour = this.hourInputEl ? Number(this.hourInputEl.value) : 0;
    const minute = this.minuteInputEl ? Number(this.minuteInputEl.value) : 0;
    if (Number.isNaN(hour) || Number.isNaN(minute)) return;

    const base = this.selectedDate ? new Date(this.selectedDate) : new Date();
    base.setHours(Math.max(0, Math.min(23, hour)), Math.max(0, Math.min(59, minute)), 0, 0);
    this.setDate(base, true);
  };

  constructor(target: string | HTMLInputElement, options: ThekDatePickerOptions = {}) {
    const input = typeof target === 'string' ? document.querySelector<HTMLInputElement>(target) : target;
    if (!input) {
      throw new Error('ThekDatePicker: target input element not found.');
    }
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('ThekDatePicker: target must be an HTMLInputElement.');
    }

    this.input = input;
    this.input.classList.add('thekdp-input');
    this.options = resolveOptions(options);
    this.mountInputTrigger();

    this.pickerEl = document.createElement('div');
    this.pickerEl.className = 'thekdp-popover';
    this.pickerEl.hidden = true;
    this.pickerEl.tabIndex = -1;
    this.pickerEl.innerHTML = `
      <div class="thekdp-header">
        <button type="button" class="thekdp-nav-btn" data-action="prev-year" aria-label="Previous year">«</button>
        <button type="button" class="thekdp-nav-btn" data-action="prev-month" aria-label="Previous month">‹</button>
        <span class="thekdp-current-month"></span>
        <button type="button" class="thekdp-nav-btn" data-action="next-month" aria-label="Next month">›</button>
        <button type="button" class="thekdp-nav-btn" data-action="next-year" aria-label="Next year">»</button>
      </div>
      <div class="thekdp-weekdays" role="row"></div>
      <div class="thekdp-days" role="grid"></div>
      <div class="thekdp-footer">
        <div class="thekdp-time"></div>
        <div class="thekdp-actions">
          <button type="button" class="thekdp-link-btn" data-action="today">Now</button>
          <button type="button" class="thekdp-ok-btn" data-action="ok">OK</button>
        </div>
      </div>
    `;

    this.monthLabelEl = this.pickerEl.querySelector('.thekdp-current-month') as HTMLSpanElement;
    this.weekdaysEl = this.pickerEl.querySelector('.thekdp-weekdays') as HTMLDivElement;
    this.daysEl = this.pickerEl.querySelector('.thekdp-days') as HTMLDivElement;
    this.applyThemeVars();

    this.pickerEl.addEventListener('click', this.handlePickerClick);

    const defaultDate = options.defaultDate ?? this.input.value;
    const parsedDefault = extractInput(String(defaultDate ?? ''), this.options) ?? normalizeDateInput(options.defaultDate);
    if (parsedDefault) {
      this.selectedDate = clampDate(parsedDefault, this.options.minDate, this.options.maxDate);
      this.viewDate = new Date(this.selectedDate);
    } else {
      this.viewDate = new Date();
    }

    this.input.placeholder = this.options.placeholder;
    this.input.disabled = this.options.disabled;
    if (this.triggerButtonEl) this.triggerButtonEl.disabled = this.options.disabled;
    this.syncInput();
    this.setupReactiveTheme();
    this.bind();
    this.render();
  }

  public open(): void {
    if (this.destroyed || this.openState || this.options.disabled) return;
    if (!this.pickerEl.isConnected) {
      this.options.appendTo.appendChild(this.pickerEl);
    }
    this.openState = true;
    this.positionPicker();
    this.pickerEl.hidden = false;
    this.options.onOpen?.(this);
  }

  public close(): void {
    if (this.destroyed || !this.openState) return;
    this.openState = false;
    this.pickerEl.hidden = true;
    this.options.onClose?.(this);
  }

  public toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  public setDate(value: DateInput, triggerChange = true): void {
    if (this.destroyed) return;
    const parsed =
      value instanceof Date || typeof value === 'number'
        ? normalizeDateInput(value)
        : typeof value === 'string'
          ? extractInput(value, this.options)
          : null;

    if (!parsed) {
      this.clear(triggerChange);
      return;
    }

    this.selectedDate = clampDate(parsed, this.options.minDate, this.options.maxDate);
    this.viewDate = new Date(this.selectedDate);
    this.syncInput();
    this.render();
    if (triggerChange) this.emitChange();
  }

  public getDate(): Date | null {
    return this.selectedDate ? new Date(this.selectedDate) : null;
  }

  public clear(triggerChange = true): void {
    this.selectedDate = null;
    this.input.value = '';
    this.render();
    if (triggerChange) this.emitChange();
  }

  public setMinDate(value: DateInput): void {
    this.options.minDate = normalizeDateInput(value);
    this.revalidateSelection();
    this.render();
  }

  public setMaxDate(value: DateInput): void {
    this.options.maxDate = normalizeDateInput(value);
    this.revalidateSelection();
    this.render();
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.input.disabled = disabled;
    if (this.triggerButtonEl) this.triggerButtonEl.disabled = disabled;
    if (disabled) this.close();
  }

  public setTheme(theme: ThekDatePickerThemeOption): void {
    if (theme === 'auto') {
      this.options.themeMode = 'auto';
      this.applyAutoTheme();
      if (this.options.reactiveTheme) this.setupReactiveTheme();
      return;
    }
    this.teardownReactiveTheme();
    this.options.themeMode = typeof theme === 'string' ? theme : 'custom';
    this.options.theme = resolveThemeOption(theme);
    this.applyThemeVars();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.unbind();
    this.teardownReactiveTheme();
    this.close();
    this.unmountInputTrigger();
    this.pickerEl.removeEventListener('click', this.handlePickerClick);
    if (this.pickerEl.isConnected) this.pickerEl.remove();
  }

  private bind(): void {
    this.input.addEventListener('click', this.handleInputClick);
    this.input.addEventListener('input', this.handleInput);
    this.input.addEventListener('keydown', this.handleInputKeyDown);
    this.input.addEventListener('blur', this.handleInputBlur);
    this.input.addEventListener('paste', this.handlePaste);
    this.triggerButtonEl?.addEventListener('click', this.handleTriggerClick);
    document.addEventListener('mousedown', this.handleDocumentPointerDown);
    window.addEventListener('resize', this.handleViewportChange);
    window.addEventListener('scroll', this.handleViewportChange, true);
  }

  private unbind(): void {
    this.input.removeEventListener('click', this.handleInputClick);
    this.input.removeEventListener('input', this.handleInput);
    this.input.removeEventListener('keydown', this.handleInputKeyDown);
    this.input.removeEventListener('blur', this.handleInputBlur);
    this.input.removeEventListener('paste', this.handlePaste);
    this.triggerButtonEl?.removeEventListener('click', this.handleTriggerClick);
    document.removeEventListener('mousedown', this.handleDocumentPointerDown);
    window.removeEventListener('resize', this.handleViewportChange);
    window.removeEventListener('scroll', this.handleViewportChange, true);
    this.hourInputEl?.removeEventListener('change', this.handleTimeChange);
    this.minuteInputEl?.removeEventListener('change', this.handleTimeChange);
  }

  private emitChange(): void {
    this.options.onChange?.(this.getDate(), this.input.value, this);
  }

  private mountInputTrigger(): void {
    if (!this.options.showCalendarButton) return;
    const parent = this.input.parentElement;
    if (!parent) return;

    const wrap = document.createElement('div');
    wrap.className = 'thekdp-input-wrap';
    parent.insertBefore(wrap, this.input);
    wrap.appendChild(this.input);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thekdp-trigger-btn';
    button.setAttribute('aria-label', 'Toggle calendar');
    button.innerHTML = `
      <svg class="thekdp-trigger-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
        <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"></line>
        <line x1="8" y1="2.5" x2="8" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
        <line x1="16" y1="2.5" x2="16" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
        <circle cx="8" cy="12.5" r="0.95" fill="currentColor"></circle>
        <circle cx="12" cy="12.5" r="0.95" fill="currentColor"></circle>
        <circle cx="16" cy="12.5" r="0.95" fill="currentColor"></circle>
        <circle cx="8" cy="16.5" r="0.95" fill="currentColor"></circle>
        <circle cx="12" cy="16.5" r="0.95" fill="currentColor"></circle>
      </svg>
    `;
    wrap.appendChild(button);

    this.inputWrapEl = wrap;
    this.triggerButtonEl = button;
  }

  private unmountInputTrigger(): void {
    if (!this.inputWrapEl) return;
    const parent = this.inputWrapEl.parentElement;
    if (!parent) return;
    parent.insertBefore(this.input, this.inputWrapEl);
    this.inputWrapEl.remove();
    this.inputWrapEl = null;
    this.triggerButtonEl = null;
  }

  private maskInput(value: string): string {
    return applyMaskToInput(value, fullFormat(this.options));
  }

  private setupReactiveTheme(): void {
    this.teardownReactiveTheme();
    if (!this.options.reactiveTheme || this.options.themeMode !== 'auto') return;

    this.themeObserver = new MutationObserver(() => {
      this.applyAutoTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [this.options.themeAttribute],
    });

    if (window.matchMedia) {
      this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.themeMediaQuery.addEventListener('change', this.handleThemeMediaChange);
    }
    this.applyAutoTheme();
  }

  private teardownReactiveTheme(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    if (this.themeMediaQuery) {
      this.themeMediaQuery.removeEventListener('change', this.handleThemeMediaChange);
    }
    this.themeMediaQuery = null;
  }

  private applyAutoTheme(): void {
    const template = resolveAutoThemeTemplate(this.options.themeAttribute);
    this.options.theme = resolveThemeOption(template);
    this.applyThemeVars();
  }

  private getThemeTargets(): HTMLElement[] {
    const targets: HTMLElement[] = [this.input, this.pickerEl];
    if (this.inputWrapEl) targets.push(this.inputWrapEl);
    if (this.triggerButtonEl) targets.push(this.triggerButtonEl);
    return targets;
  }

  private applyThemeVars(): void {
    const targets = this.getThemeTargets();
    for (const cssVar of Object.values(THEME_VAR_MAP)) {
      for (const target of targets) {
        target.style.removeProperty(cssVar);
      }
    }

    const entries = Object.entries(this.options.theme) as Array<[keyof ThekDatePickerTheme, string | undefined]>;
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

  private positionPicker(): void {
    const inputRect = this.input.getBoundingClientRect();
    const docEl = document.documentElement;
    const top = inputRect.bottom + window.scrollY + 6;
    const left = inputRect.left + window.scrollX;
    const maxLeft = window.scrollX + docEl.clientWidth - 300;

    this.pickerEl.style.position = 'absolute';
    this.pickerEl.style.top = `${top}px`;
    this.pickerEl.style.left = `${Math.max(window.scrollX + 8, Math.min(left, maxLeft))}px`;
    this.pickerEl.style.zIndex = '9999';
  }

  private commitInput(): void {
    if (this.options.disabled) return;
    const raw = this.input.value.trim();
    if (!raw) {
      this.clear(true);
      return;
    }
    const parsed = extractInput(raw, this.options);
    if (!parsed) {
      this.syncInput();
      return;
    }
    this.setDate(parsed, true);
  }

  private syncInput(): void {
    if (!this.selectedDate) {
      this.input.value = '';
      return;
    }
    this.input.value = formatDate(this.selectedDate, fullFormat(this.options));
  }

  private revalidateSelection(): void {
    if (!this.selectedDate) return;
    this.selectedDate = clampDate(this.selectedDate, this.options.minDate, this.options.maxDate);
    this.syncInput();
  }

  private render(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    this.monthLabelEl.textContent = `${MONTH_NAMES[month]} ${year}`;

    this.weekdaysEl.innerHTML = rotateWeekdays(this.options.weekStartsOn)
      .map((day) => `<div class="thekdp-weekday-cell">${day}</div>`)
      .join('');

    const firstOfMonth = new Date(year, month, 1);
    const monthStartDay = (firstOfMonth.getDay() - this.options.weekStartsOn + 7) % 7;
    const gridStart = new Date(year, month, 1 - monthStartDay);

    const today = toLocalStartOfDay(new Date());
    const selected = this.selectedDate ? toLocalStartOfDay(this.selectedDate) : null;

    let html = '';
    for (let i = 0; i < 42; i += 1) {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + i);

      const inCurrentMonth = current.getMonth() === month;
      const isTodayDate = isSameDay(current, today);
      const isSelectedDate = selected ? isSameDay(current, selected) : false;
      const dayTs = current.getTime();

      let disabled = false;
      if (this.options.minDate && toLocalStartOfDay(current) < toLocalStartOfDay(this.options.minDate)) {
        disabled = true;
      }
      if (this.options.maxDate && toLocalStartOfDay(current) > toLocalStartOfDay(this.options.maxDate)) {
        disabled = true;
      }

      const classes = ['thekdp-day-cell'];
      if (!inCurrentMonth) classes.push('thekdp-day-cell-muted');
      if (isTodayDate) classes.push('thekdp-day-cell-today');
      if (isSelectedDate) classes.push('thekdp-day-cell-selected');
      if (disabled) classes.push('thekdp-day-cell-disabled');

      html += `<button type="button" role="gridcell" class="${classes.join(' ')}" data-action="day" data-ts="${dayTs}" ${disabled ? 'disabled' : ''}>${current.getDate()}</button>`;
    }
    this.daysEl.innerHTML = html;

    const timeContainer = this.pickerEl.querySelector('.thekdp-time') as HTMLDivElement;
    const actions = this.pickerEl.querySelector('.thekdp-actions') as HTMLDivElement;
    if (this.options.enableTime) {
      const selectedDate = this.selectedDate ?? new Date();
      timeContainer.innerHTML = `
        <label class="thekdp-time-label">Time</label>
        <input class="thekdp-time-input" type="number" min="0" max="23" value="${selectedDate.getHours()}" />
        <span>:</span>
        <input class="thekdp-time-input" type="number" min="0" max="59" value="${selectedDate.getMinutes()}" />
      `;
      actions.classList.add('thekdp-actions-with-ok');
      this.hourInputEl = timeContainer.querySelectorAll<HTMLInputElement>('input')[0] ?? null;
      this.minuteInputEl = timeContainer.querySelectorAll<HTMLInputElement>('input')[1] ?? null;
      this.hourInputEl?.addEventListener('change', this.handleTimeChange);
      this.minuteInputEl?.addEventListener('change', this.handleTimeChange);
    } else {
      timeContainer.innerHTML = '';
      actions.classList.remove('thekdp-actions-with-ok');
      this.hourInputEl = null;
      this.minuteInputEl = null;
    }
  }
}

export function createDatePicker(target: string | HTMLInputElement, options?: ThekDatePickerOptions): ThekDatePicker {
  return new ThekDatePicker(target, options);
}
