import {
  formatDate,
  formatUsesMeridiem,
  getAllowedInputSeparators,
  getMonthNames,
  getWeekdayNames,
  isValidDate,
  rotateWeekdayLabels,
  toLocalStartOfDay
} from './date-utils.js';
import {
  createAssistiveText,
  createPickerPopover,
  createRevertIndicator,
  createSuspiciousIndicator,
  createTriggerButton
} from './thekdatepicker-dom.js';
import { isSuspiciousDate } from './thekdatepicker-suspicious.js';
import { applyThemeVars } from './thekdatepicker-theme.js';
import {
  applyMaskedInputWithCaret,
  applyMaskedTextInsertion,
  getMaskedFormatLength,
  isAllowedInputKey
} from './thekdatepicker-input.js';
import {
  getDefaultFocusedDay,
  moveFocusedDay as computeFocusedDay,
  moveFocusedMonth as computeFocusedMonth,
  moveFocusToWeekBoundary as computeWeekBoundary
} from './thekdatepicker-navigation.js';
import {
  ensureDayCells,
  ensureTimeInputs,
  hideTimeInputs,
  renderDayGrid,
  renderWeekdays,
  resolveMonthLabel,
  syncTimeInputs
} from './thekdatepicker-render.js';
import {
  clampDate,
  extractInput,
  fullFormat,
  normalizeDateInput,
  resolveAutoThemeTemplate,
  resolveThemeOption,
  resolveOptions
} from './config-utils.js';
import { registerGlobalPicker, unregisterGlobalPicker } from './thekdatepicker-global.js';
import type {
  DateInput,
  ResolvedOptions,
  ThekDatePickerOptions,
  ThekDatePickerThemeOption
} from './types.js';

const CSS_PREFIX = 'thekdp';

export class ThekDatePicker {
  public readonly input: HTMLInputElement;
  public options: ResolvedOptions;

  private inputWrapEl: HTMLDivElement | null = null;
  private triggerButtonEl: HTMLButtonElement | null = null;
  private suspiciousIndicatorEl: HTMLSpanElement | null = null;
  private revertIndicatorEl: HTMLSpanElement | null = null;
  private statusTextEl: HTMLSpanElement | null = null;
  private pickerEl: HTMLDivElement;
  private monthLabelEl: HTMLSpanElement;
  private weekdaysEl: HTMLDivElement;
  private daysEl: HTMLDivElement;
  private dayCellEls: HTMLButtonElement[] = [];
  private hourInputEl: HTMLInputElement | null = null;
  private minuteInputEl: HTMLInputElement | null = null;
  private meridiemInputEl: HTMLSelectElement | null = null;
  private focusedDayTs: number | null = null;
  private openFocusFrame: number | null = null;
  private localizedMonthNames: string[];
  private localizedWeekdayNames: string[];

  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private lastInputRect: DOMRect | null = null;
  private lastPickerRect: DOMRect | null = null;

  private selectedDate: Date | null = null;
  private viewDate: Date = new Date();
  private openState = false;
  private isEmittingChange = false;
  private destroyed = false;
  private invalidInputDetail: string | null = null;
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

  private readonly handleInputBlur = (event: FocusEvent): void => {
    const nextTarget = event.relatedTarget as Node | null;
    const active = document.activeElement as Node | null;
    if (
      (nextTarget &&
        (this.pickerEl.contains(nextTarget) ||
          this.input === nextTarget ||
          this.inputWrapEl?.contains(nextTarget))) ||
      (active &&
        (this.pickerEl.contains(active) ||
          this.input === active ||
          this.inputWrapEl?.contains(active)))
    ) {
      return;
    }
    this.commitInput();
  };

  private readonly handleInput = (): void => {
    this.hideInvalidInputState();
    this.applyMaskedInputWithCaret();
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

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    const separators = new Set(getAllowedInputSeparators(this.options));
    if (isAllowedInputKey(event.key, fullFormat(this.options), [...separators])) return;
    event.preventDefault();
  };

  private readonly handlePaste = (event: ClipboardEvent): void => {
    if (this.options.disabled) {
      event.preventDefault();
      return;
    }
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text) return;
    event.preventDefault();
    const format = fullFormat(this.options);
    const trimmed = text.trim();
    const isCompletePaste = trimmed.length >= getMaskedFormatLength(format);
    if (!extractInput(trimmed, this.options) && isCompletePaste) {
      this.showInvalidInputState(trimmed);
      return;
    }
    this.hideInvalidInputState();
    applyMaskedTextInsertion(this.input, text, format);
  };

  public readonly onGlobalPointerDown = (event: PointerEvent): void => {
    if (!this.openState) return;
    const target = event.target as Node | null;
    if (!target) return;
    const path = event.composedPath();
    if (
      path.includes(this.pickerEl) ||
      path.includes(this.input) ||
      (this.inputWrapEl != null && path.includes(this.inputWrapEl)) ||
      (this.triggerButtonEl != null && path.includes(this.triggerButtonEl))
    ) {
      return;
    }
    this.close();
    this.commitInput();
  };

  private readonly handleObservers = (): void => {
    if (!this.openState) return;
    this.positionPicker();
  };

  private readonly handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    if (!this.openState) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        this.close();
        return;
      }
    }
  };

  private readonly handleThemeMediaChange = (): void => {
    if (this.options.reactiveTheme && this.options.themeMode === 'auto') {
      this.applyAutoTheme();
    }
  };

  private readonly handlePickerKeyDown = (event: KeyboardEvent): void => {
    if (!this.openState || this.options.disabled) return;
    if (this.isTimeInputTarget(event.target)) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        this.input.focus();
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.moveFocusedDay(-1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.moveFocusedDay(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocusedDay(-7);
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocusedDay(7);
        return;
      case 'Home':
        event.preventDefault();
        this.moveFocusToWeekBoundary(false);
        return;
      case 'End':
        event.preventDefault();
        this.moveFocusToWeekBoundary(true);
        return;
      case 'PageUp':
        event.preventDefault();
        this.moveFocusedMonth(event.shiftKey ? -12 : -1);
        return;
      case 'PageDown':
        event.preventDefault();
        this.moveFocusedMonth(event.shiftKey ? 12 : 1);
        return;
      case 'Enter':
      case ' ':
        if (this.focusedDayTs == null) return;
        event.preventDefault();
        this.selectFocusedDay();
        return;
      default:
        return;
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
        this.moveFocusedMonth(-12);
        return;
      case 'next-year':
        this.moveFocusedMonth(12);
        return;
      case 'prev-month':
        this.moveFocusedMonth(-1);
        return;
      case 'next-month':
        this.moveFocusedMonth(1);
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
          0
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
    const rawHour = this.hourInputEl ? Number(this.hourInputEl.value) : 0;
    const minute = this.minuteInputEl ? Number(this.minuteInputEl.value) : 0;
    if (Number.isNaN(rawHour) || Number.isNaN(minute)) return;

    const usesMeridiem = this.timeControlsUseMeridiem();
    let hour = rawHour;
    if (usesMeridiem) {
      if (hour < 1 || hour > 12) return;
      const meridiem = this.meridiemInputEl?.value === 'PM' ? 'PM' : 'AM';
      const h12 = hour % 12;
      hour = meridiem === 'PM' ? h12 + 12 : h12;
    }

    const base = this.selectedDate ? new Date(this.selectedDate) : new Date();
    base.setHours(Math.max(0, Math.min(23, hour)), Math.max(0, Math.min(59, minute)), 0, 0);
    this.setDate(base, true);
  };

  private readonly handleTimeInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const max = target.dataset.timeUnit === 'hour' && this.timeControlsUseMeridiem() ? 12 : 59;
    const min = target.dataset.timeUnit === 'hour' && this.timeControlsUseMeridiem() ? 1 : 0;
    const sanitized = target.value.replaceAll(/\D+/g, '').slice(0, 2);
    if (!sanitized) {
      target.value = '';
      return;
    }
    const numeric = Number(sanitized);
    target.value = String(Math.max(min, Math.min(max, numeric))).padStart(2, '0');
    this.handleTimeChange();
  };

  private readonly handleTimeKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.dataset.timeUnit) return;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const delta = event.key === 'ArrowUp' ? 1 : -1;
      this.stepTimeInput(target, delta);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Tab' ||
      event.key === 'Enter' ||
      event.key === 'Escape' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      return;
    }

    if (/^\d$/.test(event.key)) return;
    event.preventDefault();
  };

  constructor(target: string | HTMLInputElement, options: ThekDatePickerOptions = {}) {
    const input =
      typeof target === 'string' ? document.querySelector<HTMLInputElement>(target) : target;
    if (!input) {
      throw new Error('ThekDatePicker: target input element not found.');
    }
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('ThekDatePicker: target must be an HTMLInputElement.');
    }

    this.input = input;
    this.options = resolveOptions(options);
    this.options.appendTo ??= document.body;
    this.input.classList.add(`${CSS_PREFIX}-input`);
    this.localizedMonthNames = getMonthNames(this.options.locale);
    this.localizedWeekdayNames = getWeekdayNames(this.options.locale);
    this.mountInputTrigger();

    this.pickerEl = createPickerPopover(CSS_PREFIX);

    this.monthLabelEl = this.pickerEl.querySelector(
      `.${CSS_PREFIX}-current-month`
    ) as HTMLSpanElement;
    this.weekdaysEl = this.pickerEl.querySelector(`.${CSS_PREFIX}-weekdays`) as HTMLDivElement;
    this.daysEl = this.pickerEl.querySelector(`.${CSS_PREFIX}-days`) as HTMLDivElement;
    this.applyThemeVars();

    this.pickerEl.addEventListener('click', this.handlePickerClick);
    this.pickerEl.addEventListener('keydown', this.handlePickerKeyDown);

    const defaultDate = this.options.defaultDate ?? this.input.value;
    const parsedDefault =
      extractInput(String(defaultDate ?? ''), this.options) ??
      normalizeDateInput(this.options.defaultDate);
    if (parsedDefault) {
      this.selectedDate = clampDate(parsedDefault, this.options.minDate, this.options.maxDate);
      this.viewDate = new Date(this.selectedDate);
    } else {
      this.viewDate = new Date();
    }

    this.input.placeholder = this.options.placeholder;
    this.input.disabled = this.options.disabled;
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('inputmode', 'text');
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('aria-haspopup', 'grid');
    this.input.setAttribute('aria-expanded', 'false');
    if (!this.pickerEl.id) {
      this.pickerEl.id = `thekdp-picker-${Math.random().toString(36).slice(2, 9)}`;
    }
    this.input.setAttribute('aria-controls', this.pickerEl.id);
    if (!this.monthLabelEl.id) {
      this.monthLabelEl.id = `thekdp-month-${Math.random().toString(36).slice(2, 9)}`;
    }
    this.pickerEl.setAttribute('aria-labelledby', this.monthLabelEl.id);
    this.daysEl.setAttribute('aria-labelledby', this.monthLabelEl.id);

    if (this.triggerButtonEl) this.triggerButtonEl.disabled = this.options.disabled;
    this.syncInput();
    this.setupReactiveTheme();
    this.bind();
    this.render();
  }

  public open(): void {
    if (this.destroyed || this.openState || this.options.disabled) return;
    if (!this.pickerEl.isConnected) {
      this.getAppendTarget().appendChild(this.pickerEl);
    }
    this.openState = true;
    this.input.setAttribute('aria-expanded', 'true');

    this.resizeObserver = new ResizeObserver(this.handleObservers);
    this.resizeObserver.observe(this.input);
    this.resizeObserver.observe(this.pickerEl);

    this.intersectionObserver = new IntersectionObserver(this.handleIntersection, {
      threshold: 0
    });
    this.intersectionObserver.observe(this.input);

    this.ensureFocusableDay();
    this.positionPicker();
    this.pickerEl.hidden = false;
    this.cancelPendingOpenFocus();
    this.openFocusFrame = window.requestAnimationFrame(() => {
      this.openFocusFrame = null;
      if (!this.openState) return;
      this.focusCurrentDayCell();
    });
    this.options.onOpen?.(this);
  }

  public close(): void {
    if (this.destroyed || !this.openState) return;
    this.openState = false;
    this.input.setAttribute('aria-expanded', 'false');

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.lastInputRect = null;
    this.lastPickerRect = null;

    this.cancelPendingOpenFocus();
    this.pickerEl.hidden = true;
    this.options.onClose?.(this);
  }

  public toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  public setDate(value: DateInput | null | undefined, triggerChange = true): void {
    if (this.destroyed) return;
    const parsed =
      value instanceof Date
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
    this.focusedDayTs = toLocalStartOfDay(this.selectedDate).getTime();
    this.hideInvalidInputState();
    this.hideRevertIndicator();
    this.syncInput();
    this.render();
    if (triggerChange) this.emitChange();
  }

  public setDateFromTimestamp(timestampMs: number, triggerChange = true): void {
    if (!Number.isFinite(timestampMs)) {
      this.clear(triggerChange);
      return;
    }
    this.setDate(new Date(timestampMs), triggerChange);
  }

  public getDate(): Date | null {
    return this.selectedDate ? new Date(this.selectedDate) : null;
  }

  public clear(triggerChange = true): void {
    this.selectedDate = null;
    this.input.value = '';
    this.viewDate = new Date();
    this.focusedDayTs = toLocalStartOfDay(this.viewDate).getTime();
    this.hideInvalidInputState();
    this.hideRevertIndicator();
    this.updateSuspiciousState();
    this.render();
    if (triggerChange) this.emitChange();
  }

  public setMinDate(value: DateInput): void {
    this.options.minDate =
      (typeof value === 'string' ? extractInput(value, this.options) : null) ??
      normalizeDateInput(value);
    const changed = this.revalidateSelection();
    this.render();
    if (changed) this.emitChange();
  }

  public setMaxDate(value: DateInput): void {
    this.options.maxDate =
      (typeof value === 'string' ? extractInput(value, this.options) : null) ??
      normalizeDateInput(value);
    const changed = this.revalidateSelection();
    this.render();
    if (changed) this.emitChange();
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

    this.cancelPendingOpenFocus();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;

    this.hideRevertIndicator();
    this.unbind();
    this.teardownReactiveTheme();
    this.close();
    this.unmountInputTrigger();
    this.input.classList.remove(`${CSS_PREFIX}-input`);
    this.input.classList.remove(`${CSS_PREFIX}-input-suspicious`);
    this.input.classList.remove(`${CSS_PREFIX}-input-invalid`);
    this.input.classList.remove(`${CSS_PREFIX}-input-reverted`);
    this.input.removeAttribute('inputmode');
    this.input.removeAttribute('role');
    this.input.removeAttribute('autocomplete');
    this.input.removeAttribute('aria-haspopup');
    this.input.removeAttribute('aria-expanded');
    this.input.removeAttribute('aria-controls');
    this.input.removeAttribute('aria-describedby');
    this.input.removeAttribute('aria-invalid');
    this.input.removeAttribute('title');
    this.pickerEl.removeEventListener('click', this.handlePickerClick);
    this.pickerEl.removeEventListener('keydown', this.handlePickerKeyDown);
    if (this.pickerEl.isConnected) this.pickerEl.remove();
  }

  private bind(): void {
    this.input.addEventListener('click', this.handleInputClick);
    this.input.addEventListener('input', this.handleInput);
    this.input.addEventListener('keydown', this.handleInputKeyDown);
    this.input.addEventListener('blur', this.handleInputBlur);
    this.input.addEventListener('paste', this.handlePaste);
    this.triggerButtonEl?.addEventListener('click', this.handleTriggerClick);
    registerGlobalPicker(this);
  }

  private unbind(): void {
    this.input.removeEventListener('click', this.handleInputClick);
    this.input.removeEventListener('input', this.handleInput);
    this.input.removeEventListener('keydown', this.handleInputKeyDown);
    this.input.removeEventListener('blur', this.handleInputBlur);
    this.input.removeEventListener('paste', this.handlePaste);
    this.triggerButtonEl?.removeEventListener('click', this.handleTriggerClick);
    unregisterGlobalPicker(this);
    this.detachTimeInputListeners(this.hourInputEl);
    this.detachTimeInputListeners(this.minuteInputEl);
    this.detachMeridiemInputListeners(this.meridiemInputEl);
  }

  private emitChange(): void {
    if (this.isEmittingChange) return;
    this.isEmittingChange = true;
    try {
      this.options.onChange?.(this.getDate(), this.input.value, this);
    } finally {
      this.isEmittingChange = false;
    }
  }

  private mountInputTrigger(): void {
    const parent = this.input.parentElement;
    if (!parent) return;

    const wrap = document.createElement('div');
    wrap.className = `${CSS_PREFIX}-input-wrap`;
    parent.insertBefore(wrap, this.input);
    wrap.appendChild(this.input);

    const suspiciousIndicator = createSuspiciousIndicator(CSS_PREFIX);
    wrap.appendChild(suspiciousIndicator);
    const revertIndicator = createRevertIndicator(CSS_PREFIX);
    wrap.appendChild(revertIndicator);
    const statusText = createAssistiveText(CSS_PREFIX, 'status');
    wrap.appendChild(statusText);

    let button: HTMLButtonElement | null = null;
    if (this.options.showCalendarButton) {
      button = createTriggerButton(CSS_PREFIX);
      wrap.appendChild(button);
    }

    this.inputWrapEl = wrap;
    this.triggerButtonEl = button;
    this.suspiciousIndicatorEl = suspiciousIndicator;
    this.revertIndicatorEl = revertIndicator;
    this.statusTextEl = statusText;
  }

  private unmountInputTrigger(): void {
    if (!this.inputWrapEl) return;
    const parent = this.inputWrapEl.parentElement;
    if (!parent) return;
    parent.insertBefore(this.input, this.inputWrapEl);
    this.inputWrapEl.remove();
    this.inputWrapEl = null;
    this.triggerButtonEl = null;
    this.suspiciousIndicatorEl = null;
    this.revertIndicatorEl = null;
    this.statusTextEl = null;
  }

  private applyMaskedInputWithCaret(): void {
    applyMaskedInputWithCaret(this.input, fullFormat(this.options));
  }

  private setupReactiveTheme(): void {
    this.teardownReactiveTheme();
    if (!this.options.reactiveTheme || this.options.themeMode !== 'auto') return;

    this.themeObserver = new MutationObserver(() => {
      this.applyAutoTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [this.options.themeAttribute]
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

  private showRevertIndicator(rejectedInput: string): void {
    if (!this.options.revertWarning) return;
    const detail = `${this.options.revertMessage} : ${rejectedInput}`;

    this.input.classList.add(`${CSS_PREFIX}-input-reverted`);
    this.input.title = detail;
    if (this.inputWrapEl) this.inputWrapEl.classList.add(`${CSS_PREFIX}-input-wrap-reverted`);
    if (this.revertIndicatorEl) {
      this.revertIndicatorEl.hidden = false;
      this.revertIndicatorEl.title = detail;
    }
    this.syncStatusDescription(detail);
  }

  private showInvalidInputState(rejectedInput: string): void {
    this.invalidInputDetail = `Invalid input value : ${rejectedInput}`;
    this.input.classList.add(`${CSS_PREFIX}-input-invalid`);
    if (this.inputWrapEl) this.inputWrapEl.classList.add(`${CSS_PREFIX}-input-wrap-invalid`);
    this.syncValidationState();
    this.syncStatusDescription();
  }

  private hideInvalidInputState(): void {
    this.invalidInputDetail = null;
    this.input.classList.remove(`${CSS_PREFIX}-input-invalid`);
    if (this.inputWrapEl) this.inputWrapEl.classList.remove(`${CSS_PREFIX}-input-wrap-invalid`);
    this.syncValidationState();
    this.syncStatusDescription();
  }

  private hideRevertIndicator(): void {
    this.input.classList.remove(`${CSS_PREFIX}-input-reverted`);
    if (this.inputWrapEl) this.inputWrapEl.classList.remove(`${CSS_PREFIX}-input-wrap-reverted`);
    if (this.revertIndicatorEl) {
      this.revertIndicatorEl.hidden = true;
      this.revertIndicatorEl.title = '';
    }
    this.syncValidationState();
    this.syncStatusDescription();
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
    applyThemeVars(this.options.theme, this.getThemeTargets());
  }

  private setTimeInputs(
    hourInputEl: HTMLInputElement | null,
    minuteInputEl: HTMLInputElement | null,
    meridiemInputEl: HTMLSelectElement | null
  ): void {
    if (this.hourInputEl && this.hourInputEl !== hourInputEl) {
      this.detachTimeInputListeners(this.hourInputEl);
    }
    if (this.minuteInputEl && this.minuteInputEl !== minuteInputEl) {
      this.detachTimeInputListeners(this.minuteInputEl);
    }
    if (this.meridiemInputEl && this.meridiemInputEl !== meridiemInputEl) {
      this.detachMeridiemInputListeners(this.meridiemInputEl);
    }

    if (hourInputEl && this.hourInputEl !== hourInputEl) {
      this.attachTimeInputListeners(hourInputEl);
    }
    if (minuteInputEl && this.minuteInputEl !== minuteInputEl) {
      this.attachTimeInputListeners(minuteInputEl);
    }
    if (meridiemInputEl && this.meridiemInputEl !== meridiemInputEl) {
      this.attachMeridiemInputListeners(meridiemInputEl);
    }

    this.hourInputEl = hourInputEl;
    this.minuteInputEl = minuteInputEl;
    this.meridiemInputEl = meridiemInputEl;
  }

  private attachTimeInputListeners(input: HTMLInputElement | null): void {
    input?.addEventListener('change', this.handleTimeChange);
    input?.addEventListener('input', this.handleTimeInput);
    input?.addEventListener('keydown', this.handleTimeKeyDown);
  }

  private detachTimeInputListeners(input: HTMLInputElement | null): void {
    input?.removeEventListener('change', this.handleTimeChange);
    input?.removeEventListener('input', this.handleTimeInput);
    input?.removeEventListener('keydown', this.handleTimeKeyDown);
  }

  private attachMeridiemInputListeners(input: HTMLSelectElement | null): void {
    input?.addEventListener('change', this.handleTimeChange);
  }

  private detachMeridiemInputListeners(input: HTMLSelectElement | null): void {
    input?.removeEventListener('change', this.handleTimeChange);
  }

  private isTimeInputTarget(
    target: EventTarget | null
  ): target is HTMLInputElement | HTMLSelectElement {
    return (
      (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
      !!target.dataset.timeUnit
    );
  }

  private timeControlsUseMeridiem(): boolean {
    return formatUsesMeridiem(fullFormat(this.options));
  }

  private stepTimeInput(input: HTMLInputElement, delta: number): void {
    const isHour = input.dataset.timeUnit === 'hour';
    const usesMeridiem = this.timeControlsUseMeridiem();
    const min = isHour && usesMeridiem ? 1 : 0;
    const max = isHour ? (usesMeridiem ? 12 : 23) : 59;
    const value = Number(input.value);
    const normalized = Number.isNaN(value) ? min : value;
    const range = max - min + 1;
    const next = ((normalized - min + delta + range) % range) + min;
    input.value = String(next).padStart(2, '0');
    this.handleTimeChange();
  }

  private getAppendTarget(): HTMLElement {
    return this.options.appendTo ?? document.body;
  }

  private isDateDisabled(date: Date): boolean {
    const value = toLocalStartOfDay(date);
    if (this.options.minDate && value < toLocalStartOfDay(this.options.minDate)) return true;
    if (this.options.maxDate && value > toLocalStartOfDay(this.options.maxDate)) return true;
    return false;
  }

  private getDefaultFocusedDay(): Date {
    return getDefaultFocusedDay(
      this.selectedDate,
      this.options.minDate,
      this.options.maxDate,
      (date) => this.isDateDisabled(date)
    );
  }

  private ensureFocusableDay(): void {
    if (this.focusedDayTs == null) {
      this.focusedDayTs = this.getDefaultFocusedDay().getTime();
    }
  }

  private focusCurrentDayCell(): void {
    const targetTs = this.focusedDayTs;
    if (targetTs == null) return;
    const cell = this.dayCellEls.find(
      (item) => item.dataset.ts === String(targetTs) && !item.disabled
    );
    cell?.focus();
  }

  private cancelPendingOpenFocus(): void {
    if (this.openFocusFrame == null) return;
    window.cancelAnimationFrame(this.openFocusFrame);
    this.openFocusFrame = null;
  }

  private moveFocusedDay(deltaDays: number): void {
    this.ensureFocusableDay();
    this.cancelPendingOpenFocus();
    const base = computeFocusedDay(
      this.focusedDayTs ?? this.getDefaultFocusedDay().getTime(),
      deltaDays
    );
    if (this.isDateDisabled(base)) return;
    this.focusedDayTs = toLocalStartOfDay(base).getTime();
    this.viewDate = new Date(base);
    this.render();
    this.focusCurrentDayCell();
  }

  private moveFocusToWeekBoundary(toEnd: boolean): void {
    this.ensureFocusableDay();
    this.cancelPendingOpenFocus();
    const base = computeWeekBoundary(
      this.focusedDayTs ?? this.getDefaultFocusedDay().getTime(),
      this.options.weekStartsOn,
      toEnd
    );
    if (this.isDateDisabled(base)) return;
    this.focusedDayTs = toLocalStartOfDay(base).getTime();
    this.viewDate = new Date(base);
    this.render();
    this.focusCurrentDayCell();
  }

  private moveFocusedMonth(deltaMonths: number): void {
    this.ensureFocusableDay();
    this.cancelPendingOpenFocus();
    const base = computeFocusedMonth(
      this.focusedDayTs ?? this.getDefaultFocusedDay().getTime(),
      deltaMonths
    );
    if (this.isDateDisabled(base)) return;
    this.focusedDayTs = toLocalStartOfDay(base).getTime();
    this.viewDate = new Date(base);
    this.render();
    this.focusCurrentDayCell();
  }

  private selectFocusedDay(): void {
    const focusedTs = this.focusedDayTs;
    if (focusedTs == null) return;
    const raw = new Date(focusedTs);
    if (!isValidDate(raw) || this.isDateDisabled(raw)) return;
    const next = new Date(
      raw.getFullYear(),
      raw.getMonth(),
      raw.getDate(),
      this.selectedDate?.getHours() ?? 0,
      this.selectedDate?.getMinutes() ?? 0,
      0,
      0
    );
    this.setDate(next, true);
    if (this.options.closeOnSelect && !this.options.enableTime) {
      this.close();
      this.input.focus();
    }
  }

  private measurePickerRect(): DOMRect {
    const wasHidden = this.pickerEl.hidden;
    const prevVisibility = this.pickerEl.style.visibility;
    const prevPointerEvents = this.pickerEl.style.pointerEvents;

    if (wasHidden) {
      this.pickerEl.hidden = false;
      this.pickerEl.style.visibility = 'hidden';
      this.pickerEl.style.pointerEvents = 'none';
    }

    const rect = this.pickerEl.getBoundingClientRect();

    if (wasHidden) {
      this.pickerEl.hidden = true;
      this.pickerEl.style.visibility = prevVisibility;
      this.pickerEl.style.pointerEvents = prevPointerEvents;
    }

    this.lastPickerRect = rect;
    return rect;
  }

  private positionPicker(): void {
    const inputRect = this.input.getBoundingClientRect();
    const pickerRect = this.lastPickerRect || this.measurePickerRect();

    if (
      this.lastInputRect &&
      inputRect.top === this.lastInputRect.top &&
      inputRect.left === this.lastInputRect.left &&
      inputRect.width === this.lastInputRect.width &&
      inputRect.height === this.lastInputRect.height &&
      pickerRect.width === this.lastPickerRect?.width &&
      pickerRect.height === this.lastPickerRect?.height
    ) {
      return;
    }

    this.lastInputRect = inputRect;

    const appendTo = this.getAppendTarget();
    const isBodyMount = appendTo === document.body;
    const containerRect = isBodyMount ? null : appendTo.getBoundingClientRect();
    const scrollLeft = isBodyMount ? window.scrollX : appendTo.scrollLeft;
    const scrollTop = isBodyMount ? window.scrollY : appendTo.scrollTop;
    const viewportPadding = 8;
    const offset = 6;
    const containerWidth = isBodyMount
      ? document.documentElement.clientWidth
      : appendTo.clientWidth;
    const containerHeight = isBodyMount
      ? document.documentElement.clientHeight
      : appendTo.clientHeight;
    const pickerWidth = Math.max(pickerRect.width, this.pickerEl.offsetWidth, 0);
    const pickerHeight = Math.max(pickerRect.height, this.pickerEl.offsetHeight, 0);

    const localTop = inputRect.top - (containerRect?.top ?? 0) + scrollTop;
    const localBottom = inputRect.bottom - (containerRect?.top ?? 0) + scrollTop;
    const localLeft = inputRect.left - (containerRect?.left ?? 0) + scrollLeft;

    const availableAbove = isBodyMount ? inputRect.top : inputRect.top - (containerRect?.top ?? 0);
    const availableBelow = isBodyMount
      ? document.documentElement.clientHeight - inputRect.bottom
      : (containerRect?.bottom ?? 0) - inputRect.bottom;

    const preferredTop = localBottom + offset;
    const flippedTop = localTop - pickerHeight - offset;
    const minTop = scrollTop + viewportPadding;
    const maxTop =
      scrollTop + Math.max(viewportPadding, containerHeight - pickerHeight - viewportPadding);
    const shouldFlip =
      pickerHeight > 0 && availableBelow < pickerHeight + offset && availableAbove > availableBelow;
    const top = Math.min(maxTop, Math.max(minTop, shouldFlip ? flippedTop : preferredTop));

    const minLeft = scrollLeft + viewportPadding;
    const maxLeft =
      scrollLeft + Math.max(viewportPadding, containerWidth - pickerWidth - viewportPadding);
    const left = Math.min(maxLeft, Math.max(minLeft, localLeft));

    this.pickerEl.style.position = 'absolute';
    this.pickerEl.style.top = `${top}px`;
    this.pickerEl.style.left = `${left}px`;
    this.pickerEl.style.zIndex = String(this.options.zIndex);
  }

  private ensureDayCells(): void {
    this.dayCellEls = ensureDayCells(this.daysEl, CSS_PREFIX);
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
      this.showInvalidInputState(raw);
      return;
    }
    this.hideInvalidInputState();
    this.hideRevertIndicator();
    const clamped = clampDate(parsed, this.options.minDate, this.options.maxDate);
    const wasClamped = clamped.getTime() !== parsed.getTime();
    if (wasClamped) {
      this.selectedDate = clamped;
      this.viewDate = new Date(clamped);
      this.focusedDayTs = toLocalStartOfDay(clamped).getTime();
      this.input.value = formatDate(clamped, fullFormat(this.options));
      this.updateSuspiciousState();
      this.render();
      this.showRevertIndicator(raw);
      this.emitChange();
    } else {
      this.setDate(clamped, true);
    }
  }

  private syncInput(): void {
    if (!this.selectedDate) {
      this.input.value = '';
      this.updateSuspiciousState();
      return;
    }
    this.input.value = formatDate(this.selectedDate, fullFormat(this.options));
    this.updateSuspiciousState();
  }

  private updateSuspiciousState(): void {
    const suspicious = this.selectedDate
      ? isSuspiciousDate(this.selectedDate, this.options)
      : false;
    this.input.classList.toggle(`${CSS_PREFIX}-input-suspicious`, suspicious);

    if (this.inputWrapEl) {
      this.inputWrapEl.classList.toggle(`${CSS_PREFIX}-input-wrap-suspicious`, suspicious);
    }

    if (this.suspiciousIndicatorEl) {
      this.suspiciousIndicatorEl.hidden = !suspicious;
      this.suspiciousIndicatorEl.title = suspicious ? this.options.suspiciousMessage : '';
    }
    this.syncValidationState();
    this.syncStatusDescription();
  }

  private syncValidationState(): void {
    const suspicious = this.selectedDate
      ? isSuspiciousDate(this.selectedDate, this.options)
      : false;
    const title = this.invalidInputDetail ?? (suspicious ? this.options.suspiciousMessage : '');
    if (title) this.input.title = title;
    else this.input.removeAttribute('title');
    this.input.toggleAttribute('aria-invalid', suspicious || this.invalidInputDetail != null);
  }

  private syncStatusDescription(overrideMessage?: string): void {
    const messages = new Set<string>();
    if (overrideMessage) messages.add(overrideMessage);
    else if (
      this.revertIndicatorEl &&
      !this.revertIndicatorEl.hidden &&
      this.revertIndicatorEl.title
    ) {
      messages.add(this.revertIndicatorEl.title);
    }

    if (this.invalidInputDetail) {
      messages.add(this.invalidInputDetail);
    }

    if (
      this.suspiciousIndicatorEl &&
      !this.suspiciousIndicatorEl.hidden &&
      this.options.suspiciousMessage
    ) {
      messages.add(this.options.suspiciousMessage);
    }

    if (!this.statusTextEl) return;

    const text = [...messages].join(' ');
    this.statusTextEl.textContent = text;
    if (text) this.input.setAttribute('aria-describedby', this.statusTextEl.id);
    else this.input.removeAttribute('aria-describedby');
  }

  private revalidateSelection(): boolean {
    if (!this.selectedDate) return false;
    const clamped = clampDate(this.selectedDate, this.options.minDate, this.options.maxDate);
    const changed = clamped.getTime() !== this.selectedDate.getTime();
    this.selectedDate = clamped;
    this.viewDate = new Date(clamped);
    this.focusedDayTs = toLocalStartOfDay(clamped).getTime();
    this.syncInput();
    return changed;
  }

  private render(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    this.ensureFocusableDay();
    this.monthLabelEl.textContent = resolveMonthLabel(
      this.localizedMonthNames,
      month,
      year,
      this.options.locale
    );
    this.pickerEl.setAttribute(
      'aria-label',
      `${this.localizedMonthNames[month] ?? ''} ${year}`.trim()
    );

    renderWeekdays(
      this.weekdaysEl,
      this.localizedWeekdayNames,
      this.options.weekStartsOn,
      rotateWeekdayLabels,
      CSS_PREFIX
    );
    this.ensureDayCells();
    renderDayGrid({
      dayCellEls: this.dayCellEls,
      viewDate: this.viewDate,
      selectedDate: this.selectedDate,
      focusedDayTs: this.focusedDayTs,
      locale: this.options.locale,
      weekStartsOn: this.options.weekStartsOn,
      cssPrefix: CSS_PREFIX,
      isDateDisabled: (date) => this.isDateDisabled(date)
    });

    const timeContainer = this.pickerEl.querySelector(`.${CSS_PREFIX}-time`) as HTMLDivElement;
    const actions = this.pickerEl.querySelector(`.${CSS_PREFIX}-actions`) as HTMLDivElement;
    if (this.options.enableTime) {
      const selectedDate = this.selectedDate ?? new Date();
      const inputs = ensureTimeInputs(
        timeContainer,
        actions,
        this.timeControlsUseMeridiem(),
        CSS_PREFIX
      );
      this.setTimeInputs(inputs.hourInputEl, inputs.minuteInputEl, inputs.meridiemInputEl);
      syncTimeInputs(
        this.hourInputEl,
        this.minuteInputEl,
        this.meridiemInputEl,
        selectedDate,
        this.timeControlsUseMeridiem()
      );
    } else {
      hideTimeInputs(timeContainer, actions, CSS_PREFIX);
    }
  }
}

export function createDatePicker(
  target: string | HTMLInputElement,
  options?: ThekDatePickerOptions
): ThekDatePicker {
  return new ThekDatePicker(target, options);
}
