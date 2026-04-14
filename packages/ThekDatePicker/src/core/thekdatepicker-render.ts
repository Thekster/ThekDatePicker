import { formatSpokenDate, getMonthNames, isSameDay, toLocalStartOfDay } from './date-utils.js';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function renderWeekdays(
  weekdaysEl: HTMLDivElement,
  weekdayNames: string[],
  weekStartsOn: number,
  rotateWeekdayLabels: (weekdayNames: string[], weekStartsOn: number) => string[],
  cssPrefix: string
): void {
  weekdaysEl.innerHTML = '';
  rotateWeekdayLabels(weekdayNames, weekStartsOn).forEach((day) => {
    const cell = document.createElement('div');
    cell.className = `${cssPrefix}-weekday-cell`;
    cell.setAttribute('role', 'columnheader');
    cell.textContent = day;
    weekdaysEl.appendChild(cell);
  });
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
  usesMeridiem: boolean,
  cssPrefix: string
): {
  hourInputEl: HTMLInputElement | null;
  minuteInputEl: HTMLInputElement | null;
  meridiemInputEl: HTMLSelectElement | null;
} {
  let hourInputEl = timeContainer.querySelector<HTMLInputElement>('[data-time-unit="hour"]');
  let minuteInputEl = timeContainer.querySelector<HTMLInputElement>('[data-time-unit="minute"]');
  let meridiemInputEl = timeContainer.querySelector<HTMLSelectElement>(
    '[data-time-unit="meridiem"]'
  );
  const shouldRebuild = usesMeridiem
    ? !hourInputEl || !minuteInputEl || !meridiemInputEl
    : !hourInputEl || !minuteInputEl || !!meridiemInputEl;

  if (shouldRebuild) {
    timeContainer.innerHTML = '';

    const label = document.createElement('label');
    label.className = `${cssPrefix}-time-label`;
    label.htmlFor = `${cssPrefix}-time-hour`;
    label.textContent = 'Time';

    const hourInput = document.createElement('input');
    hourInput.id = `${cssPrefix}-time-hour`;
    hourInput.setAttribute('aria-label', 'Hour');
    hourInput.className = `${cssPrefix}-time-input`;
    hourInput.type = 'text';
    hourInput.inputMode = 'numeric';
    hourInput.min = usesMeridiem ? '1' : '0';
    hourInput.max = usesMeridiem ? '12' : '23';
    hourInput.maxLength = 2;
    hourInput.dataset.timeUnit = 'hour';

    const colon = document.createElement('span');
    colon.textContent = ':';

    const minuteInput = document.createElement('input');
    minuteInput.setAttribute('aria-label', 'Minute');
    minuteInput.className = `${cssPrefix}-time-input`;
    minuteInput.type = 'text';
    minuteInput.inputMode = 'numeric';
    minuteInput.min = '0';
    minuteInput.max = '59';
    minuteInput.maxLength = 2;
    minuteInput.dataset.timeUnit = 'minute';

    timeContainer.appendChild(label);
    timeContainer.appendChild(hourInput);
    timeContainer.appendChild(colon);
    timeContainer.appendChild(minuteInput);
    if (usesMeridiem) {
      const meridiemSelect = document.createElement('select');
      meridiemSelect.className = `${cssPrefix}-time-meridiem`;
      meridiemSelect.setAttribute('aria-label', 'AM or PM');
      meridiemSelect.dataset.timeUnit = 'meridiem';

      const amOption = document.createElement('option');
      amOption.value = 'AM';
      amOption.textContent = 'AM';
      meridiemSelect.appendChild(amOption);

      const pmOption = document.createElement('option');
      pmOption.value = 'PM';
      pmOption.textContent = 'PM';
      meridiemSelect.appendChild(pmOption);

      timeContainer.appendChild(meridiemSelect);
      meridiemInputEl = meridiemSelect;
    } else {
      meridiemInputEl = null;
    }

    hourInputEl = hourInput;
    minuteInputEl = minuteInput;
  }

  timeContainer.hidden = false;
  actions.classList.add(`${cssPrefix}-actions-with-ok`);
  return {
    hourInputEl: hourInputEl ?? null,
    minuteInputEl: minuteInputEl ?? null,
    meridiemInputEl: meridiemInputEl ?? null
  };
}

export function syncTimeInputs(
  hourInputEl: HTMLInputElement | null,
  minuteInputEl: HTMLInputElement | null,
  meridiemInputEl: HTMLSelectElement | null,
  selectedDate: Date,
  usesMeridiem: boolean
): void {
  const hours24 = selectedDate.getHours();
  const hours12 = ((hours24 + 11) % 12) + 1;
  if (hourInputEl) hourInputEl.value = pad2(usesMeridiem ? hours12 : hours24);
  if (minuteInputEl) minuteInputEl.value = pad2(selectedDate.getMinutes());
  if (meridiemInputEl) meridiemInputEl.value = hours24 >= 12 ? 'PM' : 'AM';
}

export function hideTimeInputs(
  timeContainer: HTMLDivElement,
  actions: HTMLDivElement,
  cssPrefix: string
): void {
  timeContainer.hidden = true;
  actions.classList.remove(`${cssPrefix}-actions-with-ok`);
}
