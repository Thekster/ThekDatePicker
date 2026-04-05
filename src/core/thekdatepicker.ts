import {
  applyMaskToInput,
  formatSpokenDate,
  formatUsesMeridiem,
  formatDate,
  getAllowedInputSeparators,
  getMonthNames,
  getWeekdayNames,
  isSameDay,
  isValidDate,
  rotateWeekdayLabels,
  toLocalStartOfDay,
} from "./date-utils.js";
import {
  createPickerPopover,
  createRevertIndicator,
  createSuspiciousIndicator,
  createTriggerButton,
} from "./thekdatepicker-dom.js";
import { isSuspiciousDate } from "./thekdatepicker-suspicious.js";
import { applyThemeVars } from "./thekdatepicker-theme.js";
import {
  clampDate,
  extractInput,
  fullFormat,
  normalizeDateInput,
  resolveAutoThemeTemplate,
  resolveThemeOption,
  resolveOptions,
} from "./config-utils.js";
import type {
  DateInput,
  ResolvedOptions,
  ThekDatePickerOptions,
  ThekDatePickerThemeOption,
} from "./types.js";

export class ThekDatePicker {
  public readonly input: HTMLInputElement;
  public options: ResolvedOptions;

  private inputWrapEl: HTMLDivElement | null = null;
  private triggerButtonEl: HTMLButtonElement | null = null;
  private suspiciousIndicatorEl: HTMLSpanElement | null = null;
  private revertIndicatorEl: HTMLSpanElement | null = null;
  private pickerEl: HTMLDivElement;
  private monthLabelEl: HTMLSpanElement;
  private weekdaysEl: HTMLDivElement;
  private daysEl: HTMLDivElement;
  private dayCellEls: HTMLButtonElement[] = [];
  private hourInputEl: HTMLInputElement | null = null;
  private minuteInputEl: HTMLInputElement | null = null;
  private focusedDayTs: number | null = null;
  private viewportFrame: number | null = null;
  private localizedMonthNames: string[];
  private localizedWeekdayNames: string[];
  private readonly scrollListenerOptions = { capture: true, passive: true };

  private selectedDate: Date | null = null;
  private viewDate: Date = new Date();
  private openState = false;
  private isEmittingChange = false;
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
    this.applyMaskedInputWithCaret();
  };

  private readonly handleInputKeyDown = (event: KeyboardEvent): void => {
    if (this.options.disabled) return;

    if (event.key === "Escape") {
      this.close();
      return;
    }
    if (event.key === "Enter") {
      this.commitInput();
      this.close();
      return;
    }
    if (event.key === "ArrowDown" && event.altKey) {
      event.preventDefault();
      this.open();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    const separators = new Set(getAllowedInputSeparators(this.options));
    const usesMeridiem = formatUsesMeridiem(fullFormat(this.options));
    if (/^\d$/.test(event.key) || separators.has(event.key)) return;
    if (usesMeridiem && /^[aApPmM]$/.test(event.key)) return;
    event.preventDefault();
  };

  private readonly handlePaste = (event: ClipboardEvent): void => {
    if (this.options.disabled) {
      event.preventDefault();
      return;
    }
    const text = event.clipboardData?.getData("text") ?? "";
    if (!text) return;

    const format = fullFormat(this.options);
    // Let extractInput decide if it's perfectly valid first
    if (extractInput(text, this.options)) return;

    const separators = getAllowedInputSeparators(this.options)
      .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("");
    const usesMeridiem = formatUsesMeridiem(format);
    const letterSet = usesMeridiem ? "aApPmM" : "";
    const allowed = new RegExp(`^[0-9${letterSet}${separators}]*$`);
    if (!allowed.test(text)) event.preventDefault();
  };

  private readonly handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!this.openState) return;
    const target = event.target as Node | null;
    if (!target) return;
    const path = event.composedPath();
    if (path.includes(this.pickerEl) || path.includes(this.input)) return;
    this.close();
    this.commitInput();
  };

  private readonly handleViewportChange = (): void => {
    if (!this.openState || this.viewportFrame != null) return;
    this.viewportFrame = window.requestAnimationFrame(() => {
      this.viewportFrame = null;
      if (this.openState) this.positionPicker();
    });
  };

  private readonly handleThemeMediaChange = (): void => {
    if (this.options.reactiveTheme && this.options.themeMode === "auto") {
      this.applyAutoTheme();
    }
  };

  private readonly handlePickerKeyDown = (event: KeyboardEvent): void => {
    if (!this.openState || this.options.disabled) return;

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        this.close();
        this.input.focus();
        return;
      case "ArrowLeft":
        event.preventDefault();
        this.moveFocusedDay(-1);
        return;
      case "ArrowRight":
        event.preventDefault();
        this.moveFocusedDay(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        this.moveFocusedDay(-7);
        return;
      case "ArrowDown":
        event.preventDefault();
        this.moveFocusedDay(7);
        return;
      case "Home":
        event.preventDefault();
        this.moveFocusToWeekBoundary(false);
        return;
      case "End":
        event.preventDefault();
        this.moveFocusToWeekBoundary(true);
        return;
      case "PageUp":
        event.preventDefault();
        this.moveFocusedMonth(event.shiftKey ? -12 : -1);
        return;
      case "PageDown":
        event.preventDefault();
        this.moveFocusedMonth(event.shiftKey ? 12 : 1);
        return;
      case "Enter":
      case " ":
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
    const actionEl = target.closest<HTMLElement>("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    if (!action) return;

    switch (action) {
      case "prev-year":
        this.moveFocusedMonth(-12);
        return;
      case "next-year":
        this.moveFocusedMonth(12);
        return;
      case "prev-month":
        this.moveFocusedMonth(-1);
        return;
      case "next-month":
        this.moveFocusedMonth(1);
        return;
      case "today": {
        const now = clampDate(new Date(), this.options.minDate, this.options.maxDate);
        this.setDate(now, true);
        if (!this.options.enableTime) this.close();
        return;
      }
      case "ok":
        this.close();
        return;
      case "day": {
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
    const input =
      typeof target === "string" ? document.querySelector<HTMLInputElement>(target) : target;
    if (!input) {
      throw new Error("ThekDatePicker: target input element not found.");
    }
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("ThekDatePicker: target must be an HTMLInputElement.");
    }

    this.input = input;
    this.options = resolveOptions(options);
    this.input.classList.add(`${this.options.cssPrefix}-input`);
    this.localizedMonthNames = getMonthNames(this.options.locale);
    this.localizedWeekdayNames = getWeekdayNames(this.options.locale);
    this.mountInputTrigger();

    this.pickerEl = createPickerPopover(this.options.cssPrefix);

    this.monthLabelEl = this.pickerEl.querySelector(
      `.${this.options.cssPrefix}-current-month`,
    ) as HTMLSpanElement;
    this.weekdaysEl = this.pickerEl.querySelector(
      `.${this.options.cssPrefix}-weekdays`,
    ) as HTMLDivElement;
    this.daysEl = this.pickerEl.querySelector(`.${this.options.cssPrefix}-days`) as HTMLDivElement;
    this.applyThemeVars();

    this.pickerEl.addEventListener("click", this.handlePickerClick);
    this.pickerEl.addEventListener("keydown", this.handlePickerKeyDown);

    const defaultDate = options.defaultDate ?? this.input.value;
    const parsedDefault =
      extractInput(String(defaultDate ?? ""), this.options) ??
      normalizeDateInput(options.defaultDate);
    if (parsedDefault) {
      this.selectedDate = clampDate(parsedDefault, this.options.minDate, this.options.maxDate);
      this.viewDate = new Date(this.selectedDate);
    } else {
      this.viewDate = new Date();
    }

    this.input.placeholder = this.options.placeholder;
    this.input.disabled = this.options.disabled;
    this.input.setAttribute("inputmode", "text");
    this.input.setAttribute("autocomplete", "off");
    this.input.setAttribute("aria-haspopup", "dialog");
    this.input.setAttribute("aria-expanded", "false");
    if (!this.pickerEl.id) {
      this.pickerEl.id = `thekdp-picker-${Math.random().toString(36).slice(2, 9)}`;
    }
    this.input.setAttribute("aria-controls", this.pickerEl.id);

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
    this.input.setAttribute("aria-expanded", "true");
    this.ensureFocusableDay();
    this.positionPicker();
    this.pickerEl.hidden = false;
    window.requestAnimationFrame(() => {
      if (!this.openState) return;
      this.focusCurrentDayCell();
    });
    this.options.onOpen?.(this);
  }

  public close(): void {
    if (this.destroyed || !this.openState) return;
    this.openState = false;
    this.input.setAttribute("aria-expanded", "false");
    if (this.viewportFrame != null) {
      window.cancelAnimationFrame(this.viewportFrame);
      this.viewportFrame = null;
    }
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
        : typeof value === "string"
          ? extractInput(value, this.options)
          : null;

    if (!parsed) {
      this.clear(triggerChange);
      return;
    }

    this.selectedDate = clampDate(parsed, this.options.minDate, this.options.maxDate);
    this.viewDate = new Date(this.selectedDate);
    this.focusedDayTs = toLocalStartOfDay(this.selectedDate).getTime();
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
    this.input.value = "";
    this.viewDate = new Date();
    this.focusedDayTs = toLocalStartOfDay(this.viewDate).getTime();
    this.hideRevertIndicator();
    this.updateSuspiciousState();
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
    if (theme === "auto") {
      this.options.themeMode = "auto";
      this.applyAutoTheme();
      if (this.options.reactiveTheme) this.setupReactiveTheme();
      return;
    }
    this.teardownReactiveTheme();
    this.options.themeMode = typeof theme === "string" ? theme : "custom";
    this.options.theme = resolveThemeOption(theme);
    this.applyThemeVars();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.viewportFrame != null) {
      window.cancelAnimationFrame(this.viewportFrame);
      this.viewportFrame = null;
    }

    this.hideRevertIndicator();
    this.unbind();
    this.teardownReactiveTheme();
    this.close();
    this.unmountInputTrigger();
    this.pickerEl.removeEventListener("click", this.handlePickerClick);
    this.pickerEl.removeEventListener("keydown", this.handlePickerKeyDown);
    if (this.pickerEl.isConnected) this.pickerEl.remove();
  }

  private bind(): void {
    this.input.addEventListener("click", this.handleInputClick);
    this.input.addEventListener("input", this.handleInput);
    this.input.addEventListener("keydown", this.handleInputKeyDown);
    this.input.addEventListener("blur", this.handleInputBlur);
    this.input.addEventListener("paste", this.handlePaste);
    this.triggerButtonEl?.addEventListener("click", this.handleTriggerClick);
    document.addEventListener("pointerdown", this.handleDocumentPointerDown);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, this.scrollListenerOptions);
  }

  private unbind(): void {
    this.input.removeEventListener("click", this.handleInputClick);
    this.input.removeEventListener("input", this.handleInput);
    this.input.removeEventListener("keydown", this.handleInputKeyDown);
    this.input.removeEventListener("blur", this.handleInputBlur);
    this.input.removeEventListener("paste", this.handlePaste);
    this.triggerButtonEl?.removeEventListener("click", this.handleTriggerClick);
    document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, this.scrollListenerOptions);
    this.hourInputEl?.removeEventListener("change", this.handleTimeChange);
    this.minuteInputEl?.removeEventListener("change", this.handleTimeChange);
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
    if (!this.options.showCalendarButton) return;
    const parent = this.input.parentElement;
    if (!parent) return;

    const wrap = document.createElement("div");
    wrap.className = `${this.options.cssPrefix}-input-wrap`;
    parent.insertBefore(wrap, this.input);
    wrap.appendChild(this.input);

    const suspiciousIndicator = createSuspiciousIndicator(this.options.cssPrefix);
    wrap.appendChild(suspiciousIndicator);
    const revertIndicator = createRevertIndicator(this.options.cssPrefix);
    wrap.appendChild(revertIndicator);

    const button = createTriggerButton(this.options.cssPrefix);
    wrap.appendChild(button);

    this.inputWrapEl = wrap;
    this.triggerButtonEl = button;
    this.suspiciousIndicatorEl = suspiciousIndicator;
    this.revertIndicatorEl = revertIndicator;
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
  }

  private maskInput(value: string): string {
    return applyMaskToInput(value, fullFormat(this.options));
  }

  private isMaskChar(char: string, usesMeridiem: boolean): boolean {
    if (/^\d$/.test(char)) return true;
    if (!usesMeridiem) return false;
    return /^[aApPmM]$/.test(char);
  }

  private countMaskChars(value: string, usesMeridiem: boolean): number {
    let count = 0;
    for (const char of value) {
      if (this.isMaskChar(char, usesMeridiem)) count += 1;
    }
    return count;
  }

  private caretIndexForMaskCharCount(
    value: string,
    maskChars: number,
    usesMeridiem: boolean,
  ): number {
    if (maskChars <= 0) return 0;
    let count = 0;
    for (let i = 0; i < value.length; i += 1) {
      if (!this.isMaskChar(value[i], usesMeridiem)) continue;
      count += 1;
      if (count >= maskChars) return i + 1;
    }
    return value.length;
  }

  private applyMaskedInputWithCaret(): void {
    const format = fullFormat(this.options);
    const usesMeridiem = formatUsesMeridiem(format);
    const previousValue = this.input.value;
    const caretStart = this.input.selectionStart ?? previousValue.length;
    const nextValue = applyMaskToInput(previousValue, format);
    if (nextValue === previousValue) return;

    const maskCharsBeforeCaret = this.countMaskChars(
      previousValue.slice(0, caretStart),
      usesMeridiem,
    );
    this.input.value = nextValue;

    const nextCaret = this.caretIndexForMaskCharCount(
      nextValue,
      maskCharsBeforeCaret,
      usesMeridiem,
    );
    this.input.setSelectionRange(nextCaret, nextCaret);
  }

  private setupReactiveTheme(): void {
    this.teardownReactiveTheme();
    if (!this.options.reactiveTheme || this.options.themeMode !== "auto") return;

    this.themeObserver = new MutationObserver(() => {
      this.applyAutoTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [this.options.themeAttribute],
    });

    if (window.matchMedia) {
      this.themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this.themeMediaQuery.addEventListener("change", this.handleThemeMediaChange);
    }
    this.applyAutoTheme();
  }

  private teardownReactiveTheme(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    if (this.themeMediaQuery) {
      this.themeMediaQuery.removeEventListener("change", this.handleThemeMediaChange);
    }
    this.themeMediaQuery = null;
  }

  private showRevertIndicator(rejectedInput: string): void {
    if (!this.options.revertWarning) return;
    const detail = `${this.options.revertMessage} : ${rejectedInput}`;

    this.input.classList.add(`${this.options.cssPrefix}-input-reverted`);
    this.input.title = detail;
    if (this.inputWrapEl)
      this.inputWrapEl.classList.add(`${this.options.cssPrefix}-input-wrap-reverted`);
    if (this.revertIndicatorEl) {
      this.revertIndicatorEl.hidden = false;
      this.revertIndicatorEl.title = detail;
    }
  }

  private hideRevertIndicator(): void {
    this.input.classList.remove(`${this.options.cssPrefix}-input-reverted`);
    if (this.inputWrapEl)
      this.inputWrapEl.classList.remove(`${this.options.cssPrefix}-input-wrap-reverted`);
    if (this.revertIndicatorEl) {
      this.revertIndicatorEl.hidden = true;
      this.revertIndicatorEl.title = "";
    }
    if (!this.input.classList.contains(`${this.options.cssPrefix}-input-suspicious`)) {
      this.input.removeAttribute("title");
    }
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

  private isDateDisabled(date: Date): boolean {
    const value = toLocalStartOfDay(date);
    if (this.options.minDate && value < toLocalStartOfDay(this.options.minDate)) return true;
    if (this.options.maxDate && value > toLocalStartOfDay(this.options.maxDate)) return true;
    return false;
  }

  private getDefaultFocusedDay(): Date {
    const candidate = this.selectedDate ? new Date(this.selectedDate) : new Date();
    const normalized = toLocalStartOfDay(candidate);
    if (this.isDateDisabled(normalized)) {
      if (this.options.minDate) return toLocalStartOfDay(this.options.minDate);
      if (this.options.maxDate) return toLocalStartOfDay(this.options.maxDate);
    }
    return normalized;
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
      (item) => item.dataset.ts === String(targetTs) && !item.disabled,
    );
    cell?.focus();
  }

  private moveFocusedDay(deltaDays: number): void {
    this.ensureFocusableDay();
    const base = new Date(this.focusedDayTs ?? this.getDefaultFocusedDay().getTime());
    base.setDate(base.getDate() + deltaDays);
    if (this.isDateDisabled(base)) return;
    this.focusedDayTs = toLocalStartOfDay(base).getTime();
    this.viewDate = new Date(base);
    this.render();
    this.focusCurrentDayCell();
  }

  private moveFocusToWeekBoundary(toEnd: boolean): void {
    this.ensureFocusableDay();
    const base = new Date(this.focusedDayTs ?? this.getDefaultFocusedDay().getTime());
    const currentDay = base.getDay();
    const startOffset = (currentDay - this.options.weekStartsOn + 7) % 7;
    const endOffset = 6 - startOffset;
    base.setDate(base.getDate() + (toEnd ? endOffset : -startOffset));
    if (this.isDateDisabled(base)) return;
    this.focusedDayTs = toLocalStartOfDay(base).getTime();
    this.viewDate = new Date(base);
    this.render();
    this.focusCurrentDayCell();
  }

  private moveFocusedMonth(deltaMonths: number): void {
    this.ensureFocusableDay();
    const base = new Date(this.focusedDayTs ?? this.getDefaultFocusedDay().getTime());
    const day = base.getDate();
    base.setDate(1);
    base.setMonth(base.getMonth() + deltaMonths);
    base.setDate(Math.min(day, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()));
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
      0,
    );
    this.setDate(next, true);
    if (this.options.closeOnSelect && !this.options.enableTime) {
      this.close();
      this.input.focus();
    }
  }

  private positionPicker(): void {
    const inputRect = this.input.getBoundingClientRect();
    const docEl = document.documentElement;
    const top = inputRect.bottom + window.scrollY + 6;
    const left = inputRect.left + window.scrollX;
    const maxLeft = window.scrollX + docEl.clientWidth - 300;

    this.pickerEl.style.position = "absolute";
    this.pickerEl.style.top = `${top}px`;
    this.pickerEl.style.left = `${Math.max(window.scrollX + 8, Math.min(left, maxLeft))}px`;
    this.pickerEl.style.zIndex = String(this.options.zIndex);
  }

  private ensureDayCells(): void {
    const hasRows = this.daysEl.querySelectorAll(`.${this.options.cssPrefix}-days-row`).length === 6;
    if (hasRows && this.dayCellEls.length === 42) return;

    this.dayCellEls = [];
    this.daysEl.textContent = "";
    const fragment = document.createDocumentFragment();
    for (let r = 0; r < 6; r += 1) {
      const row = document.createElement("div");
      row.className = `${this.options.cssPrefix}-days-row`;
      row.setAttribute("role", "row");
      for (let c = 0; c < 7; c += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.setAttribute("role", "gridcell");
        cell.dataset.action = "day";
        cell.className = `${this.options.cssPrefix}-day-cell`;
        row.appendChild(cell);
        this.dayCellEls.push(cell);
      }
      fragment.appendChild(row);
    }
    this.daysEl.appendChild(fragment);
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
      this.showRevertIndicator(raw);
      return;
    }
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
      this.input.value = "";
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
    this.input.classList.toggle(`${this.options.cssPrefix}-input-suspicious`, suspicious);
    this.input.toggleAttribute("aria-invalid", suspicious);

    if (this.inputWrapEl) {
      this.inputWrapEl.classList.toggle(
        `${this.options.cssPrefix}-input-wrap-suspicious`,
        suspicious,
      );
    }

    if (this.suspiciousIndicatorEl) {
      this.suspiciousIndicatorEl.hidden = !suspicious;
      this.suspiciousIndicatorEl.title = suspicious ? this.options.suspiciousMessage : "";
    }

    if (suspicious) {
      this.input.title = this.options.suspiciousMessage;
    } else {
      this.input.removeAttribute("title");
    }
  }

  private revalidateSelection(): void {
    if (!this.selectedDate) return;
    this.selectedDate = clampDate(this.selectedDate, this.options.minDate, this.options.maxDate);
    this.syncInput();
  }

  private render(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    this.ensureFocusableDay();
    this.monthLabelEl.textContent = `${this.localizedMonthNames[month] ?? getMonthNames(this.options.locale)[month]} ${year}`;
    this.pickerEl.setAttribute(
      "aria-label",
      `${this.localizedMonthNames[month] ?? ""} ${year}`.trim(),
    );

    this.weekdaysEl.innerHTML = rotateWeekdayLabels(
      this.localizedWeekdayNames,
      this.options.weekStartsOn,
    )
      .map(
        (day) =>
          `<div class="${this.options.cssPrefix}-weekday-cell" role="columnheader">${day}</div>`,
      )
      .join("");

    const firstOfMonth = new Date(year, month, 1);
    const monthStartDay = (firstOfMonth.getDay() - this.options.weekStartsOn + 7) % 7;
    const gridStart = new Date(year, month, 1 - monthStartDay);
    this.ensureDayCells();

    const today = toLocalStartOfDay(new Date());
    const selected = this.selectedDate ? toLocalStartOfDay(this.selectedDate) : null;
    const current = new Date(gridStart);
    const cssPrefix = this.options.cssPrefix;
    for (let i = 0; i < 42; i += 1) {
      if (i > 0) current.setDate(current.getDate() + 1);

      const inCurrentMonth = current.getMonth() === month;
      const isTodayDate = isSameDay(current, today);
      const isSelectedDate = selected ? isSameDay(current, selected) : false;
      const dayTs = current.getTime();

      const disabled = this.isDateDisabled(current);
      const isFocusedDate = this.focusedDayTs === dayTs;

      const cell = this.dayCellEls[i];
      cell.className =
        `${cssPrefix}-day-cell` +
        (!inCurrentMonth ? ` ${cssPrefix}-day-cell-muted` : "") +
        (isTodayDate ? ` ${cssPrefix}-day-cell-today` : "") +
        (isSelectedDate ? ` ${cssPrefix}-day-cell-selected` : "") +
        (disabled ? ` ${cssPrefix}-day-cell-disabled` : "");
      cell.dataset.ts = String(dayTs);
      cell.disabled = disabled;
      cell.tabIndex = !disabled && isFocusedDate ? 0 : -1;
      cell.setAttribute("aria-selected", String(isSelectedDate));
      cell.setAttribute("aria-label", formatSpokenDate(current, this.options.locale));
      cell.textContent = String(current.getDate());
    }

    const timeContainer = this.pickerEl.querySelector(
      `.${this.options.cssPrefix}-time`,
    ) as HTMLDivElement;
    const actions = this.pickerEl.querySelector(
      `.${this.options.cssPrefix}-actions`,
    ) as HTMLDivElement;
    if (this.options.enableTime) {
      const selectedDate = this.selectedDate ?? new Date();
      timeContainer.innerHTML = `
        <label class="${this.options.cssPrefix}-time-label">Time</label>
        <input class="${this.options.cssPrefix}-time-input" type="number" min="0" max="23" data-time-unit="hour" value="${selectedDate.getHours()}" />
        <span>:</span>
        <input class="${this.options.cssPrefix}-time-input" type="number" min="0" max="59" data-time-unit="minute" value="${selectedDate.getMinutes()}" />
      `;
      actions.classList.add(`${this.options.cssPrefix}-actions-with-ok`);
      this.hourInputEl =
        timeContainer.querySelector<HTMLInputElement>('[data-time-unit="hour"]') ?? null;
      this.minuteInputEl =
        timeContainer.querySelector<HTMLInputElement>('[data-time-unit="minute"]') ?? null;
      this.hourInputEl?.addEventListener("change", this.handleTimeChange);
      this.minuteInputEl?.addEventListener("change", this.handleTimeChange);
    } else {
      timeContainer.innerHTML = "";
      actions.classList.remove(`${this.options.cssPrefix}-actions-with-ok`);
      this.hourInputEl = null;
      this.minuteInputEl = null;
    }
  }
}

export function createDatePicker(
  target: string | HTMLInputElement,
  options?: ThekDatePickerOptions,
): ThekDatePicker {
  return new ThekDatePicker(target, options);
}
