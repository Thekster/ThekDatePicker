export function createTriggerButton(cssPrefix: string = 'thekdp'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${cssPrefix}-trigger-btn`;
  button.setAttribute('aria-label', 'Toggle calendar');
  button.innerHTML = `
    <svg class="${cssPrefix}-trigger-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
  return button;
}

function warningSvgMarkup(cssPrefix: string = 'thekdp'): string {
  return `
    <svg class="${cssPrefix}-indicator-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.5L21 19.5H3L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
      <line x1="12" y1="9" x2="12" y2="13.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <circle cx="12" cy="16.4" r="1" fill="currentColor"></circle>
    </svg>
  `;
}

export function createSuspiciousIndicator(cssPrefix: string = 'thekdp'): HTMLSpanElement {
  const suspiciousIndicator = document.createElement('span');
  suspiciousIndicator.className = `${cssPrefix}-suspicious-indicator`;
  suspiciousIndicator.setAttribute('aria-hidden', 'true');
  suspiciousIndicator.innerHTML = warningSvgMarkup(cssPrefix);
  suspiciousIndicator.hidden = true;
  return suspiciousIndicator;
}

export function createRevertIndicator(cssPrefix: string = 'thekdp'): HTMLSpanElement {
  const revertIndicator = document.createElement('span');
  revertIndicator.className = `${cssPrefix}-revert-indicator`;
  revertIndicator.setAttribute('aria-hidden', 'true');
  revertIndicator.innerHTML = warningSvgMarkup(cssPrefix);
  revertIndicator.hidden = true;
  return revertIndicator;
}

export function createAssistiveText(cssPrefix: string = 'thekdp', suffix: string): HTMLSpanElement {
  const text = document.createElement('span');
  text.className = `${cssPrefix}-sr-only`;
  text.id = `${cssPrefix}-${suffix}-${Math.random().toString(36).slice(2, 9)}`;
  return text;
}

export function createPickerPopover(cssPrefix: string = 'thekdp'): HTMLDivElement {
  const picker = document.createElement('div');
  picker.className = `${cssPrefix}-popover`;
  picker.hidden = true;
  picker.tabIndex = -1;
  picker.style.touchAction = 'manipulation';

  const header = document.createElement('div');
  header.className = `${cssPrefix}-header`;

  const createNavBtn = (action: string, label: string, text: string) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${cssPrefix}-nav-btn`;
    btn.dataset.action = action;
    btn.setAttribute('aria-label', label);
    btn.textContent = text;
    return btn;
  };

  header.appendChild(createNavBtn('prev-year', 'Previous year', '«'));
  header.appendChild(createNavBtn('prev-month', 'Previous month', '‹'));
  const currentMonth = document.createElement('span');
  currentMonth.className = `${cssPrefix}-current-month`;
  currentMonth.setAttribute('aria-live', 'polite');
  header.appendChild(currentMonth);
  header.appendChild(createNavBtn('next-month', 'Next month', '›'));
  header.appendChild(createNavBtn('next-year', 'Next year', '»'));

  const weekdays = document.createElement('div');
  weekdays.className = `${cssPrefix}-weekdays`;
  weekdays.setAttribute('role', 'row');

  const days = document.createElement('div');
  days.className = `${cssPrefix}-days`;
  days.setAttribute('role', 'grid');
  days.setAttribute('aria-readonly', 'true');

  const footer = document.createElement('div');
  footer.className = `${cssPrefix}-footer`;

  const time = document.createElement('div');
  time.className = `${cssPrefix}-time`;

  const actions = document.createElement('div');
  actions.className = `${cssPrefix}-actions`;

  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = `${cssPrefix}-link-btn`;
  todayBtn.dataset.action = 'today';
  todayBtn.textContent = 'Now';

  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = `${cssPrefix}-ok-btn`;
  okBtn.dataset.action = 'ok';
  okBtn.textContent = 'OK';

  actions.appendChild(todayBtn);
  actions.appendChild(okBtn);
  footer.appendChild(time);
  footer.appendChild(actions);

  picker.appendChild(header);
  picker.appendChild(weekdays);
  picker.appendChild(days);
  picker.appendChild(footer);

  return picker;
}
