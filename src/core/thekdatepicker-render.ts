import { formatSpokenDate, getMonthNames, isSameDay, toLocalStartOfDay } from './date-utils.js';

export function renderWeekdays(
  weekdaysEl: HTMLDivElement,
  weekdayNames: string[],
  weekStartsOn: number,
  rotateWeekdayLabels: (weekdayNames: string[], weekStartsOn: number) => string[],
  cssPrefix: string
): void {
  weekdaysEl.innerHTML = rotateWeekdayLabels(weekdayNames, weekStartsOn)
    .map((day) => `<div class="${cssPrefix}-weekday-cell" role="columnheader">${day}</div>`)
    .join('');
}

export function resolveMonthLabel(
  localizedMonthNames: string[],
  month: number,
  year: number,
  locale: string | undefined
): string {
  return `${localizedMonthNames[month] ?? getMonthNames(locale)[month]} ${year}`;
}

export function ensureDayCells(daysEl: HTMLDivElement, cssPrefix: string): HTMLButtonElement[] {
  const hasRows = daysEl.querySelectorAll(`.${cssPrefix}-days-row`).length === 6;
  const existingCells = daysEl.querySelectorAll<HTMLButtonElement>(`.${cssPrefix}-day-cell`);
  if (hasRows && existingCells.length === 42) return [...existingCells];

  const dayCellEls: HTMLButtonElement[] = [];
  daysEl.textContent = '';
  const fragment = document.createDocumentFragment();
  for (let r = 0; r < 6; r += 1) {
    const row = document.createElement('div');
    row.className = `${cssPrefix}-days-row`;
    row.setAttribute('role', 'row');
    for (let c = 0; c < 7; c += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.setAttribute('role', 'gridcell');
      cell.dataset.action = 'day';
      cell.className = `${cssPrefix}-day-cell`;
      row.appendChild(cell);
      dayCellEls.push(cell);
    }
    fragment.appendChild(row);
  }
  daysEl.appendChild(fragment);
  return dayCellEls;
}

export function renderDayGrid(args: {
  dayCellEls: HTMLButtonElement[];
  viewDate: Date;
  selectedDate: Date | null;
  focusedDayTs: number | null;
  locale: string | undefined;
  weekStartsOn: number;
  cssPrefix: string;
  isDateDisabled: (date: Date) => boolean;
}): void {
  const {
    dayCellEls,
    viewDate,
    selectedDate,
    focusedDayTs,
    locale,
    weekStartsOn,
    cssPrefix,
    isDateDisabled
  } = args;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const monthStartDay = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(year, month, 1 - monthStartDay);

  const today = toLocalStartOfDay(new Date());
  const selected = selectedDate ? toLocalStartOfDay(selectedDate) : null;
  const current = new Date(gridStart);

  for (let i = 0; i < 42; i += 1) {
    if (i > 0) current.setDate(current.getDate() + 1);

    const inCurrentMonth = current.getMonth() === month;
    const isTodayDate = isSameDay(current, today);
    const isSelectedDate = selected ? isSameDay(current, selected) : false;
    const dayTs = current.getTime();
    const disabled = isDateDisabled(current);
    const isFocusedDate = focusedDayTs === dayTs;

    const cell = dayCellEls[i];
    cell.className =
      `${cssPrefix}-day-cell` +
      (!inCurrentMonth ? ` ${cssPrefix}-day-cell-muted` : '') +
      (isTodayDate ? ` ${cssPrefix}-day-cell-today` : '') +
      (isSelectedDate ? ` ${cssPrefix}-day-cell-selected` : '') +
      (disabled ? ` ${cssPrefix}-day-cell-disabled` : '');
    cell.dataset.ts = String(dayTs);
    cell.disabled = disabled;
    cell.tabIndex = !disabled && isFocusedDate ? 0 : -1;
    cell.setAttribute('aria-selected', String(isSelectedDate));
    cell.toggleAttribute('aria-current', isTodayDate);
    cell.setAttribute('aria-label', formatSpokenDate(current, locale));
    cell.textContent = String(current.getDate());
  }
}

export function ensureTimeInputs(
  timeContainer: HTMLDivElement,
  actions: HTMLDivElement,
  cssPrefix: string
): { hourInputEl: HTMLInputElement | null; minuteInputEl: HTMLInputElement | null } {
  let hourInputEl = timeContainer.querySelector<HTMLInputElement>('[data-time-unit="hour"]');
  let minuteInputEl = timeContainer.querySelector<HTMLInputElement>('[data-time-unit="minute"]');

  if (!hourInputEl || !minuteInputEl) {
    timeContainer.innerHTML = `
      <label class="${cssPrefix}-time-label" for="${cssPrefix}-time-hour">Time</label>
      <input id="${cssPrefix}-time-hour" aria-label="Hour" class="${cssPrefix}-time-input" type="number" min="0" max="23" data-time-unit="hour" />
      <span>:</span>
      <input aria-label="Minute" class="${cssPrefix}-time-input" type="number" min="0" max="59" data-time-unit="minute" />
    `;
    hourInputEl = timeContainer.querySelector<HTMLInputElement>('[data-time-unit="hour"]');
    minuteInputEl = timeContainer.querySelector<HTMLInputElement>('[data-time-unit="minute"]');
  }

  timeContainer.hidden = false;
  actions.classList.add(`${cssPrefix}-actions-with-ok`);
  return {
    hourInputEl: hourInputEl ?? null,
    minuteInputEl: minuteInputEl ?? null
  };
}

export function syncTimeInputs(
  hourInputEl: HTMLInputElement | null,
  minuteInputEl: HTMLInputElement | null,
  selectedDate: Date
): void {
  if (hourInputEl) hourInputEl.value = String(selectedDate.getHours());
  if (minuteInputEl) minuteInputEl.value = String(selectedDate.getMinutes());
}

export function hideTimeInputs(
  timeContainer: HTMLDivElement,
  actions: HTMLDivElement,
  cssPrefix: string
): void {
  timeContainer.hidden = true;
  actions.classList.remove(`${cssPrefix}-actions-with-ok`);
}
